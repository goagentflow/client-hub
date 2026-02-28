# MSAL JWT Authentication — Implementation Plan

> **HISTORICAL PLANNING DOCUMENT.**
> This file describes an earlier transition plan using `DEMO_MODE` and SharePoint-adapter assumptions.
> Current implementation uses `AUTH_MODE` + Prisma/PostgreSQL. For present-day behavior, use `docs/CURRENT_STATE.md` and `docs/PRODUCTION_ROADMAP.md`.

**Status:** Proposed (v4 — addresses 12 findings from three rounds of senior dev review)
**Prerequisite:** P1 plan complete (all 13 priorities shipped, reviewed, approved)
**Removes:** DEMO_MODE deployment gate in `middleware/src/config/env.ts`
**Scope:** Auth-foundation only (JWT validation + MSAL.js). NOT production-deployable — see Deployment Milestones below.

### Deployment Milestones

| Milestone | What ships | OBO secret needed? | Production-deployable? |
|-----------|-----------|-------------------|----------------------|
| **This plan (auth foundation)** | JWT validation, MSAL.js login, `/auth/me`, lazy Supabase adapter | No | No — data layer still uses Supabase; SharePoint adapter not built |
| **Phase B: SharePoint adapter** | Route handlers use SharePoint instead of Supabase for data | No | Partially — auth + data work, but no Graph-powered features |
| **Phase 4: OBO + Graph endpoints** | Messages, meetings, files via Graph API | **Yes** — `AZURE_CLIENT_SECRET` required | Yes — full production |

This plan is **auth-foundation deployable**: staff can log in with Azure AD, middleware validates real JWTs, portal auth still works. But data still comes from Supabase until the SharePoint adapter is built (Phase B, separate plan).

---

## Current State

| Layer | Today (DEMO_MODE=true) | Target (DEMO_MODE=false) |
|-------|------------------------|--------------------------|
| **Frontend auth** | `X-Dev-User-Email` header with hardcoded demo users | MSAL.js acquires Azure AD token, sends as `Authorization: Bearer <token>` |
| **Middleware auth** | Reads email header, looks up role in DEMO_USERS map | Validates JWT signature, extracts claims (userId, email, tenantId, role) |
| **Graph API calls** | Not used (Supabase adapter) | OBO token exchange for user-scoped Graph calls; app-only token for metadata |
| **Portal auth** | Signed hub-bound JWT (already implemented) | No change — portal flow stays as-is |
| **Deployment** | `DEMO_MODE=false` hard-fails at startup | Normal production startup path |

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  FRONTEND (React SPA)                                       │
│                                                             │
│  MSAL.js initialised with:                                  │
│    clientId: VITE_AZURE_CLIENT_ID                           │
│    authority: https://login.microsoftonline.com/{tenantId}  │
│    scope: api://{backendClientId}/access_as_user             │
│                                                             │
│  On login → acquireTokenSilent() or acquireTokenPopup()     │
│  Token stored in MSAL cache (sessionStorage)                │
│  Every API call → Authorization: Bearer <backend-token>     │
└────────────────────────────────────────────────────────────┘
                              │
              Authorization: Bearer <azure-ad-jwt>
                              ▼
┌────────────────────────────────────────────────────────────┐
│  MIDDLEWARE (Express)                                       │
│                                                             │
│  1. Check for Bearer token                                  │
│  2. Try portal JWT first (existing — unchanged)             │
│  3. If not portal → validate Azure AD JWT:                  │
│     a. Fetch JWKS from Azure AD (cached)                    │
│     b. Verify signature (RS256)                             │
│     c. Validate iss, aud, exp, nbf claims                   │
│     d. Extract: oid → userId, email, name, tid → tenantId   │
│     e. Derive isStaff from roles claim or tenant config      │
│  4. Populate req.user (UserContext)                          │
│                                                             │
│  For Graph API calls (Phase B — future):                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  OBO Exchange: backend-token → graph-token            │  │
│  │  Scope: https://graph.microsoft.com/.default          │  │
│  │  Used for: Files, Mail.Send, Calendar                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Azure AD App Registration (Manual — Azure Portal)

Not code, but required before any implementation can be tested.

**Backend App Registration:**
- Name: `AgentFlow Middleware`
- Supported account types: Single tenant (customer's Azure AD)
- Expose an API: Application ID URI `api://{clientId}`
- Add delegated scope: `access_as_user` (display name: "Access AgentFlow as user", admin consent description: "Allows the AgentFlow frontend to call the middleware API on behalf of the signed-in user")
- App roles (**mandatory** — required for staff access):
  - `Staff` — full hub management (must be assigned to all AgentFlow staff users before go-live)
  - `Client` — view-only portal access (optional — portal users authenticate via hub-bound JWT, not Azure AD)

**Frontend App Registration:**
- Name: `AgentFlow Frontend`
- Supported account types: Single tenant
- Redirect URI: `http://localhost:5173` (dev), production URL
- API permissions: Add delegated permission `api://{backendClientId}/access_as_user` from the backend app registration
- Authentication: SPA platform, implicit grant disabled, auth code flow with PKCE

**Output:** `AZURE_TENANT_ID`, `AZURE_CLIENT_ID` (backend), `VITE_AZURE_CLIENT_ID` (frontend)

---

### Phase 2: Middleware JWT Validation

**Goal:** Replace `handleJwtAuth()` 501 stub with real Azure AD token validation.

**Dependencies:** `jose` (already installed for portal tokens)

**No new dependencies required** — `jose` handles both HS256 (portal) and RS256 (Azure AD) via `createRemoteJWKSet`.

#### 2a. Add env vars

**File:** `middleware/src/config/env.ts`

Add to schema:
```typescript
// Azure AD JWT validation
AZURE_JWKS_URI: z.string().url().optional(),
// Optional: custom role claim for staff detection
STAFF_ROLE_NAME: z.string().default('Staff'),
```

`AZURE_JWKS_URI` defaults to `https://login.microsoftonline.com/{AZURE_TENANT_ID}/discovery/v2.0/keys` if not provided.

#### 2b. Implement handleJwtAuth

**File:** `middleware/src/middleware/auth.ts`

Replace the 501 stub with:

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Lazy-initialised JWKS client (caches keys automatically)
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwks) {
    const uri = env.AZURE_JWKS_URI
      || `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/discovery/v2.0/keys`;
    jwks = createRemoteJWKSet(new URL(uri));
  }
  return jwks;
}

async function handleJwtAuth(token: string, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Azure AD v2.0 tokens set `aud` to the Application ID URI (api://...)
    // when a delegated scope like `access_as_user` is requested.
    // If the app registration only has the GUID as identifier, `aud` will be the GUID.
    // Accept both to handle either configuration.
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/v2.0`,
      audience: [env.AZURE_CLIENT_ID, `api://${env.AZURE_CLIENT_ID}`],
    });

    // Extract standard Azure AD claims
    const userId = payload.oid as string;      // Object ID (unique user identifier)
    const email = (payload.preferred_username || payload.email || '') as string;
    const name = (payload.name || email) as string;
    const tenantId = payload.tid as string;     // Tenant ID

    if (!userId || !tenantId) {
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Invalid token claims' });
      return;
    }

    // Derive staff status from app roles claim
    const roles = (payload.roles || []) as string[];
    const isStaff = roles.includes(env.STAFF_ROLE_NAME);

    req.user = { userId, email, name, tenantId, isStaff };
    next();
  } catch {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Invalid or expired token' });
  }
}
```

**Key design decisions:**

1. **JWT `aud` claim contract (finding #7):** Azure AD v2.0 tokens set the `aud` claim to the Application ID URI (`api://{clientId}`) when a delegated scope is requested, but may use the raw GUID if only the GUID is configured as the identifier. We accept both formats (`env.AZURE_CLIENT_ID` and `api://${env.AZURE_CLIENT_ID}`) to handle either app registration configuration. This is a deliberate choice — not ambiguity.

2. **`jose` not `@azure/msal-node`:** We already use `jose` for portal tokens. `createRemoteJWKSet` handles JWKS fetching, key rotation, and caching automatically. No need for the full MSAL Node SDK just for token validation.

3. **RS256 via JWKS:** Azure AD signs tokens with RS256. `jose` fetches public keys from the JWKS endpoint and caches them. Key rotation is handled transparently.

4. **Staff detection via `roles` claim:** Azure AD app roles are the standard way to assign roles. The backend app registration defines a `Staff` role; Azure AD admins assign it to users. The claim appears as `"roles": ["Staff"]` in the token. Configurable via `STAFF_ROLE_NAME` env var.

6. **App roles are a hard rollout prerequisite, not optional (finding #8):** If the `Staff` role is not configured in the customer's Azure AD, **all users default to `isStaff: false`** — every staff endpoint returns 403 and the app is non-functional for staff. App role assignment must be part of the deployment checklist as a mandatory step, not an optional operational setup. The deployment guide must include: (a) create `Staff` app role in backend app registration, (b) assign it to all AgentFlow staff users in Azure AD, (c) verify via `GET /auth/me` that `role: "staff"` is returned before going live. Add a startup health check: on first authenticated request, if `isStaff: false` is returned for a user expected to be staff, log a `WARN` pointing to the app role configuration docs.

#### 2c. Implement `GET /auth/me` endpoint (finding #4)

**Problem:** `loginWithMsal()` calls `fetchCurrentUser()` to get the user profile + hub access after acquiring a token. There is no middleware endpoint to serve this — it's a missing deliverable.

**File:** `middleware/src/routes/auth.route.ts` (NEW)

```typescript
import { Router, type Request, type Response } from 'express';
import { supabase } from '../adapters/supabase.adapter.js';
import { sendItem } from '../utils/response.js';

export const authRouter = Router();

/**
 * GET /auth/me — returns current user profile + hub access list
 * Reads from req.user (populated by auth middleware)
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  const user = req.user!;

  // For portal users, return minimal profile (no hub access list)
  if (user.portalHubId) {
    sendItem(res, {
      user: {
        id: user.userId,
        email: user.email,
        displayName: user.name,
        role: 'client',
        tenantId: user.tenantId,
      },
      hubAccess: [],
    });
    return;
  }

  // For staff/client users, look up hub memberships
  // (placeholder — hub_member table query, to be implemented with real data layer)
  sendItem(res, {
    user: {
      id: user.userId,
      email: user.email,
      displayName: user.name,
      role: user.isStaff ? 'staff' : 'client',
      tenantId: user.tenantId,
    },
    hubAccess: [], // TODO: query hub_member table for user's hub access
  });
});
```

**Mount in `middleware/src/routes/index.ts`:**
```typescript
import { authRouter } from './auth.route.js';
// Inside apiRouter setup:
apiRouter.use('/auth', authRouter);
```

This endpoint is auth-protected (sits behind `authMiddleware`), so `req.user` is always populated. The `hubAccess` array is a stub for now — it will be populated when hub membership is implemented. The frontend `User` type and `HubAccessSummary` type already match this response shape (see `src/types/auth.ts`).

**Frontend `fetchCurrentUser` implementation** (in `auth.service.ts`):
```typescript
async function fetchCurrentUser(): Promise<User | null> {
  try {
    const result = await api.get<{ data: { user: User; hubAccess: HubAccessSummary[] } }>('/auth/me');
    return result.data.user;
  } catch {
    return null;
  }
}
```

#### 2d. Update auth flow ordering

**File:** `middleware/src/middleware/auth.ts`

The existing `authMiddleware` already checks Bearer tokens first. The change is in what happens after portal token validation fails:

```
Bearer token present?
  ├─ Yes → Try portal JWT (HS256, type=portal) → if valid, portal user context
  │        └─ Not portal → Try Azure AD JWT (RS256, JWKS) → if valid, staff/client context
  │                         └─ Invalid → 401
  └─ No → DEMO_MODE? → Try X-Dev-User-Email header (dev only)
          └─ No header → 401
```

The demo header path remains available when `DEMO_MODE=true` for local development.

#### 2d. Remove deployment gate

**File:** `middleware/src/config/env.ts`

Remove the `DEMO_MODE=false` hard-fail block (lines 67-70):
```typescript
// DELETE THIS:
if (!data.DEMO_MODE) {
  throw new Error('JWT authentication is not yet implemented. Set DEMO_MODE=true for development.');
}
```

Add Supabase/SharePoint validation branching:
```typescript
if (data.DEMO_MODE) {
  // Supabase required for demo mode
  if (!data.SUPABASE_URL || !data.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when DEMO_MODE=true');
  }
} else {
  // SharePoint required for production mode
  if (!data.SHAREPOINT_SITE_URL) {
    throw new Error('SHAREPOINT_SITE_URL is required when DEMO_MODE=false');
  }
  // Note: AZURE_CLIENT_SECRET is NOT required here.
  // It is only needed for OBO token exchange (Phase 4, deferred).
  // Auth-only rollout validates JWTs using public JWKS keys — no secret needed.
}
```

#### 2e. Conditional adapter construction (finding #2)

**Problem:** `middleware/src/adapters/supabase.adapter.ts` unconditionally calls `createClient(env.SUPABASE_URL!, ...)` at module load. When `DEMO_MODE=false`, these env vars are undefined → runtime crash.

**Fix:** Make the Supabase client lazy and guarded:

**File:** `middleware/src/adapters/supabase.adapter.ts`

Replace the top-level `createClient` call:
```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Lazy singleton — only constructed when DEMO_MODE=true
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!env.DEMO_MODE) {
      throw new Error('Supabase adapter is not available when DEMO_MODE=false. Use SharePoint adapter.');
    }
    _supabase = createClient(
      env.SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _supabase;
}

// Backwards-compatible named export (used by all route handlers)
// In DEMO_MODE=true this is safe; in DEMO_MODE=false route handlers
// must use SharePoint adapter instead (see Phase B adapter pattern below).
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as Record<string | symbol, unknown>)[prop];
  },
});
```

**Why a Proxy:** All existing route handlers import `supabase` directly. The Proxy defers the `createClient` call until the first actual database operation, not at import time. This means `DEMO_MODE=false` can start up without Supabase env vars, and will only fail if a route handler actually tries to use Supabase (which shouldn't happen once SharePoint adapter is wired in Phase B).

**Phase B adapter pattern (future, not this plan):** When SharePoint endpoints are implemented, introduce an `AdapterFactory` that returns Supabase or SharePoint adapter based on `DEMO_MODE`. Route handlers call `getAdapter().from('hub')` instead of `supabase.from('hub')`. This is out of scope for the auth plan but is the logical next step.

**Important:** All existing tests mock `supabase.from` — the Proxy is transparent to mocks because `vi.mocked(supabase.from)` resolves through the Proxy to the lazy client, which in test setup is already mocked before any route handler runs.

---

### Phase 3: Frontend MSAL.js Integration

**Goal:** Replace demo login with real Azure AD authentication.

**New dependency:** `@azure/msal-browser`

#### 3a. Install and configure

```bash
cd /path/to/project && pnpm add @azure/msal-browser
```

**New file:** `src/config/msal.ts`
```typescript
import { PublicClientApplication, Configuration } from '@azure/msal-browser';

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Delegated scope for backend API calls (defined in backend app registration)
export const API_SCOPES = [`api://${import.meta.env.VITE_AZURE_BACKEND_CLIENT_ID}/access_as_user`];
```

**New env vars** (`.env` / `.env.local`):
```
VITE_AZURE_CLIENT_ID=<frontend-app-registration-id>
VITE_AZURE_TENANT_ID=<azure-tenant-id>
VITE_AZURE_BACKEND_CLIENT_ID=<backend-app-registration-id>
```

#### 3b. Update auth.service.ts

Replace demo `loginWithCredentials` with MSAL login:

```typescript
import { msalInstance, API_SCOPES } from '../config/msal';

export async function loginWithMsal(): Promise<User | null> {
  const response = await msalInstance.loginPopup({ scopes: API_SCOPES });
  const account = response.account;
  if (!account) return null;

  // Store account for silent token acquisition
  msalInstance.setActiveAccount(account);

  // Fetch user profile from middleware
  const user = await fetchCurrentUser();
  if (user) storeDemoSession(user); // reuse existing session persistence
  return user;
}

export async function getAccessToken(): Promise<string | null> {
  const account = msalInstance.getActiveAccount();
  if (!account) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: API_SCOPES,
      account,
    });
    return response.accessToken;
  } catch {
    // Silent acquisition failed — token expired, need interactive login
    return null;
  }
}
```

#### 3c. Wire `setTokenGetter` in app initialisation — NO changes to `api.ts` itself

**Problem:** `src/services/api.ts` uses a `getAccessToken` variable that defaults to `null`. The existing code at line 27 exposes `setTokenGetter()` — this must be called during app startup to wire MSAL token acquisition into the API layer. Without this, `getAccessToken` stays null and no Bearer token is ever attached to requests.

**File:** `src/App.tsx` (or equivalent app initialisation point)

During app startup, after MSAL initialisation:
```typescript
import { setTokenGetter } from './services/api';
import { getAccessToken } from './services/auth.service';

// Wire MSAL token acquisition into the API client
if (!isMockApiEnabled()) {
  setTokenGetter(getAccessToken);
}
```

This ensures:
- In demo mode: `getAccessToken` stays null, API falls through to `X-Dev-User-Email` header (existing behaviour)
- In production: every `apiFetch` call acquires an Azure AD token via MSAL before making the request
- The existing token injection logic in `api.ts` (lines 104-116) already handles both paths correctly — it checks `getAccessToken` first, falls back to dev header

**No changes needed to `api.ts` itself.** The existing token injection logic (lines 101-119) already implements the correct staff-first precedence:

1. If `getAccessToken` returns a token (MSAL via `setTokenGetter`) → attach as `Authorization: Bearer`
2. Else if `X-Dev-User-Email` exists in localStorage → attach as dev header
3. **Only if neither staff auth is present** → check for portal token on allowlisted endpoints

This prevents the portal-token collision bug fixed in P1. The MSAL integration slots into step 1 via `setTokenGetter` — no other changes to `api.ts`.

#### 3d. Auth state management

The existing `AuthContext` and `useAuth` hook in the frontend need updating to:
1. Initialise MSAL on app load (`msalInstance.initialize()`)
2. Check for existing session (`msalInstance.getActiveAccount()`)
3. Provide `loginWithMsal()` instead of `loginWithCredentials()`
4. Handle token expiry (silent renewal or redirect to login)
5. Call `setTokenGetter(getAccessToken)` during initialisation (see 3c above)

The exact implementation depends on how the frontend auth context is structured — this should be reviewed against the existing `AuthContext` provider.

---

### Phase 4: OBO Token Exchange (Future — Phase B Stub Replacement)

**Not required for initial auth deployment.** Only needed when implementing Graph API calls (messages, meetings, files).

**New dependency:** `@azure/msal-node` (server-side only, for confidential client)

```typescript
import { ConfidentialClientApplication } from '@azure/msal-node';

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: env.AZURE_CLIENT_ID,
    clientSecret: env.AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}`,
  },
});

export async function getOboToken(userToken: string): Promise<string> {
  const result = await cca.acquireTokenOnBehalfOf({
    oboAssertion: userToken,
    scopes: ['https://graph.microsoft.com/.default'],
  });
  if (!result?.accessToken) throw new Error('OBO token exchange failed');
  return result.accessToken;
}
```

This exchanges the user's backend token for a Graph API token with the user's permissions. The middleware never exposes the Graph token to the frontend.

**Deferred until:** Graph API endpoint implementation (messages, meetings, files).

---

## Testing Strategy

### Unit Tests (middleware)

Add to `middleware/src/__tests__/`:

| Test | Assertion |
|------|-----------|
| Valid Azure AD JWT → 200 with correct UserContext | Mock JWKS endpoint, create test JWT with RS256, verify `req.user` populated |
| Expired JWT → 401 | Create JWT with past `exp`, verify rejection |
| Wrong audience → 401 | Create JWT with different `aud`, verify rejection |
| Wrong issuer → 401 | Create JWT with different `iss`, verify rejection |
| Missing `oid` claim → 401 | Create JWT without object ID, verify rejection |
| Staff role in token → `isStaff: true` | Include `roles: ["Staff"]` in payload, verify |
| No roles → `isStaff: false` | Omit roles claim, verify default |
| Portal JWT still works alongside Azure AD | Existing portal tests must keep passing |
| Demo header still works in DEMO_MODE | Existing demo tests must keep passing |
| DEMO_MODE=false + valid JWT → authenticated | Remove deployment gate, verify JWT path works |

**JWKS mocking approach (finding #9 — scoped, not global):** The JWT auth tests live in a **separate test file** (`jwt-auth.test.ts`) that does NOT share mock setup with portal auth tests. This prevents a global `jose` mock from interfering with portal JWT validation (which uses HS256 + local secret, not JWKS).

**Isolation strategy:** Instead of mocking `jose` globally, inject the JWKS resolver via the auth module. The `getJwks()` function in `auth.ts` is extracted as a module-level variable that tests can override:

**In `middleware/src/middleware/auth.ts`:**
```typescript
// Overridable for testing via setJwksResolver() — ESM exports are read-only
let _jwksResolver: /* ... */ | null = null;

export function setJwksResolver(resolver: /* ... */): void {
  _jwksResolver = resolver;
}

function getJwks() {
  if (!_jwksResolver) {
    const uri = env.AZURE_JWKS_URI
      || `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/discovery/v2.0/keys`;
    _jwksResolver = createRemoteJWKSet(new URL(uri));
  }
  return _jwksResolver;
}
```

**In `middleware/src/__tests__/jwt-auth.test.ts`:**
```typescript
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';

const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
jwk.kid = 'test-key-id';
jwk.alg = 'RS256';
jwk.use = 'sig';

beforeAll(async () => {
  // Inject test JWKS resolver via setter (not direct assignment — ESM read-only)
  const { setJwksResolver } = await import('../middleware/auth.js');
  setJwksResolver(createLocalJWKSet({ keys: [jwk] }));
});

const token = await new SignJWT({ oid: 'user-1', tid: 'tenant-1', roles: ['Staff'] })
  .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
  .setIssuer(`https://login.microsoftonline.com/tenant-1/v2.0`)
  .setAudience('test-client-id')
  .setExpirationTime('1h')
  .sign(privateKey);
```

**Why this is safe:** Portal auth tests (`portal-auth.test.ts`) use `jose.jwtVerify` with a local HS256 secret — they never touch `createRemoteJWKSet`. By injecting the JWKS resolver instead of mocking the module, both test files can run in the same vitest process without interference.

### Integration Tests

| Test | Assertion |
|------|-----------|
| Frontend login flow → token acquired → API call succeeds | End-to-end with test Azure AD tenant |
| Token expiry → silent renewal → seamless | Verify `acquireTokenSilent` handles refresh |
| Portal + Azure AD coexistence | Portal users get portal context; staff get Azure AD context |
| DEMO_MODE=true still works for local dev | No regression on existing dev workflow |

### Manual Verification

1. Login via Azure AD popup → see staff dashboard
2. Token expires after 1 hour → silent renewal happens automatically
3. Portal user visits hub → password gate → portal JWT → view-only access
4. Staff on portal page → uses Azure AD auth (not portal token)
5. Wrong tenant token → 401
6. No `Staff` role assigned → `isStaff: false` → portal-level access only

---

## Env Vars Summary (All Environments)

### Middleware (`middleware/.env`)

| Variable | Dev | Production |
|----------|-----|------------|
| `DEMO_MODE` | `true` | `false` |
| `AZURE_TENANT_ID` | Test tenant UUID | Customer tenant UUID |
| `AZURE_CLIENT_ID` | Backend app reg ID | Backend app reg ID |
| `AZURE_CLIENT_SECRET` | — (not needed for demo) | — (not needed for auth-only rollout; required later for OBO in Phase 4) |
| `AZURE_JWKS_URI` | — (auto-derived) | — (auto-derived from tenant ID) |
| `STAFF_ROLE_NAME` | `Staff` | `Staff` (or customer-specific) |
| `PORTAL_TOKEN_SECRET` | Dev default | 32+ char random secret |
| `SUPABASE_URL` | Supabase project URL | — (not used) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | — (not used) |
| `SHAREPOINT_SITE_URL` | — (not used) | Customer SharePoint URL |

### Frontend (`.env` / `.env.local`)

| Variable | Dev | Production |
|----------|-----|------------|
| `VITE_AZURE_CLIENT_ID` | Frontend app reg ID | Frontend app reg ID |
| `VITE_AZURE_TENANT_ID` | Test tenant UUID | Customer tenant UUID |
| `VITE_AZURE_BACKEND_CLIENT_ID` | Backend app reg ID | Backend app reg ID |
| `VITE_API_BASE_URL` | `http://localhost:3001` | Production middleware URL (matches existing `api.ts:17`) |

---

## File Change Summary

| Action | File | Description |
|--------|------|-------------|
| **CHANGE** | `middleware/src/middleware/auth.ts` | Replace `handleJwtAuth` 501 stub with RS256 JWT validation via `jose` JWKS |
| **CHANGE** | `middleware/src/config/env.ts` | Remove DEMO_MODE=false hard-fail; add `AZURE_JWKS_URI`, `STAFF_ROLE_NAME`; add SharePoint/secret validation for production |
| **CHANGE** | `middleware/src/adapters/supabase.adapter.ts` | Lazy/guarded Supabase client construction via Proxy (prevents crash when DEMO_MODE=false) |
| **CREATE** | `middleware/src/routes/auth.route.ts` | `GET /auth/me` endpoint — returns user profile + hub access |
| **CHANGE** | `middleware/src/routes/index.ts` | Mount `authRouter` at `/auth` |
| **CREATE** | `src/config/msal.ts` | MSAL.js configuration (PublicClientApplication, delegated scope `access_as_user`) |
| **CHANGE** | `src/services/auth.service.ts` | Add `loginWithMsal()`, `getAccessToken()`, `fetchCurrentUser()`; keep demo login for DEMO_MODE |
| **CHANGE** | `src/App.tsx` (or init point) | Wire `setTokenGetter(getAccessToken)` during app startup |
| **CHANGE** | `package.json` | Add `@azure/msal-browser` dependency |
| **CREATE** | `middleware/src/__tests__/jwt-auth.test.ts` | Azure AD JWT validation tests with mocked JWKS |

**No changes to:** portal auth flow, hub-access middleware, public routes, staff guards, existing `api.ts` token precedence logic, existing tests.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| JWKS endpoint unreachable | Low | `jose` caches keys; retry logic; fallback to cached keys |
| Token claim structure varies by tenant | Medium | Validate only standard claims (`oid`, `tid`, `email`/`preferred_username`); configurable role claim |
| Staff role not configured in customer tenant | Medium | Default to `isStaff: false`; document app role setup in deployment guide |
| MSAL popup blocked by browser | Low | Offer `loginRedirect` as fallback; document popup requirements |
| Demo mode regression | Low | Existing tests cover demo flow; DEMO_MODE=true path untouched |
| Supabase Proxy breaks test mocks | Low | Proxy is transparent to `vi.mocked()` — test setup mocks before any route handler runs. Verify in CI. |
| `hubAccess` array empty until membership table built | Medium | Frontend already handles empty array gracefully; staff get full access via `isStaff` regardless |

---

## Sequence: What Ships When

1. **This plan** → Senior dev review → approve/amend
2. **Azure AD app registrations** → Manual setup (Hamish + senior dev)
3. **Phase 2: Middleware JWT validation** → Code change, tests, review
4. **Phase 3: Frontend MSAL.js** → Code change, tests, review
5. **Phase 4: OBO** → Deferred until Graph API endpoints are built

Phases 2 and 3 can be developed in parallel once app registrations exist. Phase 2 can be tested independently using manually-acquired tokens (via `curl` with a test JWT).
