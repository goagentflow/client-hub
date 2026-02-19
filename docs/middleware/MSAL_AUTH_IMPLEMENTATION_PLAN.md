# MSAL JWT Authentication — Implementation Plan

**Status:** Proposed (awaiting senior dev review)
**Prerequisite:** P1 plan complete (all 13 priorities shipped, reviewed, approved)
**Removes:** DEMO_MODE deployment gate in `middleware/src/config/env.ts`
**Scope:** Azure AD JWT validation in middleware + MSAL.js in frontend

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
│    scope: api://{backendClientId}/.default                  │
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
- Expose an API: `api://{clientId}` with scope `.default`
- App roles (optional, for role-based access):
  - `Staff` — full hub management
  - `Client` — view-only portal access

**Frontend App Registration:**
- Name: `AgentFlow Frontend`
- Supported account types: Single tenant
- Redirect URI: `http://localhost:5173` (dev), production URL
- API permissions: Add scope from backend app registration
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
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/v2.0`,
      audience: env.AZURE_CLIENT_ID,
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

1. **`jose` not `@azure/msal-node`:** We already use `jose` for portal tokens. `createRemoteJWKSet` handles JWKS fetching, key rotation, and caching automatically. No need for the full MSAL Node SDK just for token validation.

2. **RS256 via JWKS:** Azure AD signs tokens with RS256. `jose` fetches public keys from the JWKS endpoint and caches them. Key rotation is handled transparently.

3. **Staff detection via `roles` claim:** Azure AD app roles are the standard way to assign roles. The backend app registration defines a `Staff` role; Azure AD admins assign it to users. The claim appears as `"roles": ["Staff"]` in the token. Configurable via `STAFF_ROLE_NAME` env var.

4. **Fallback for no-roles tenants:** If the customer hasn't configured app roles, `isStaff` defaults to `false`. An alternative approach (tenant-level config or domain matching) can be added later if needed.

#### 2c. Update auth flow ordering

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
  if (!data.AZURE_CLIENT_SECRET) {
    throw new Error('AZURE_CLIENT_SECRET is required when DEMO_MODE=false (needed for OBO flow)');
  }
}
```

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

// Scope for backend API calls
export const API_SCOPES = [`api://${import.meta.env.VITE_AZURE_BACKEND_CLIENT_ID}/.default`];
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

#### 3c. Update api.ts token attachment

**File:** `src/services/api.ts`

In `apiFetch`, replace the `X-Dev-User-Email` header logic with MSAL token acquisition:

```typescript
// Staff auth: MSAL token (production) or dev header (demo)
if (isMockApiEnabled()) {
  // Demo mode: use dev header
  const email = localStorage.getItem("userEmail");
  if (email) headers["X-Dev-User-Email"] = email;
} else {
  // Production: acquire Azure AD token
  const token = await getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
}
```

Portal token logic (already implemented in P1) stays unchanged — it takes precedence for portal endpoints.

#### 3d. Auth state management

The existing `AuthContext` and `useAuth` hook in the frontend need updating to:
1. Initialise MSAL on app load (`msalInstance.initialize()`)
2. Check for existing session (`msalInstance.getActiveAccount()`)
3. Provide `loginWithMsal()` instead of `loginWithCredentials()`
4. Handle token expiry (silent renewal or redirect to login)

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

**JWKS mocking approach:** Use `jose` to generate an RS256 key pair in tests. Mock the JWKS endpoint to return the test public key. Sign test tokens with the private key. This avoids hitting Azure AD in tests.

```typescript
import { generateKeyPair, exportJWK, SignJWT } from 'jose';

const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
jwk.kid = 'test-key-id';
jwk.alg = 'RS256';
jwk.use = 'sig';

// Mock JWKS endpoint in test setup
vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createRemoteJWKSet: () => actual.createLocalJWKSet({ keys: [jwk] }),
  };
});

// Create test token
const token = await new SignJWT({ oid: 'user-1', tid: 'tenant-1', roles: ['Staff'] })
  .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
  .setIssuer(`https://login.microsoftonline.com/tenant-1/v2.0`)
  .setAudience('test-client-id')
  .setExpirationTime('1h')
  .sign(privateKey);
```

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
| `AZURE_CLIENT_SECRET` | — (not needed for demo) | App registration secret |
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
| `VITE_API_URL` | `http://localhost:3001` | Production middleware URL |

---

## File Change Summary

| Action | File | Description |
|--------|------|-------------|
| **CHANGE** | `middleware/src/middleware/auth.ts` | Replace `handleJwtAuth` 501 stub with RS256 JWT validation via `jose` JWKS |
| **CHANGE** | `middleware/src/config/env.ts` | Remove DEMO_MODE=false hard-fail; add `AZURE_JWKS_URI`, `STAFF_ROLE_NAME`; add SharePoint/secret validation for production |
| **CREATE** | `src/config/msal.ts` | MSAL.js configuration (PublicClientApplication, scopes) |
| **CHANGE** | `src/services/auth.service.ts` | Add `loginWithMsal()`, `getAccessToken()`; keep demo login for DEMO_MODE |
| **CHANGE** | `src/services/api.ts` | Token attachment: MSAL token in production, dev header in demo |
| **CHANGE** | `package.json` | Add `@azure/msal-browser` dependency |
| **CREATE** | `middleware/src/__tests__/jwt-auth.test.ts` | Azure AD JWT validation tests with mocked JWKS |

**No changes to:** portal auth, hub-access middleware, public routes, staff guards, existing tests.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| JWKS endpoint unreachable | Low | `jose` caches keys; retry logic; fallback to cached keys |
| Token claim structure varies by tenant | Medium | Validate only standard claims (`oid`, `tid`, `email`/`preferred_username`); configurable role claim |
| Staff role not configured in customer tenant | Medium | Default to `isStaff: false`; document app role setup in deployment guide |
| MSAL popup blocked by browser | Low | Offer `loginRedirect` as fallback; document popup requirements |
| Demo mode regression | Low | Existing tests cover demo flow; DEMO_MODE=true path untouched |

---

## Sequence: What Ships When

1. **This plan** → Senior dev review → approve/amend
2. **Azure AD app registrations** → Manual setup (Hamish + senior dev)
3. **Phase 2: Middleware JWT validation** → Code change, tests, review
4. **Phase 3: Frontend MSAL.js** → Code change, tests, review
5. **Phase 4: OBO** → Deferred until Graph API endpoints are built

Phases 2 and 3 can be developed in parallel once app registrations exist. Phase 2 can be tested independently using manually-acquired tokens (via `curl` with a test JWT).
