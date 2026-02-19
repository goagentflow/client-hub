# P1 Plan: Fix 13 Senior Dev Review Issues (v13 — Go-Ready)

## Context

Middleware API layer (104 endpoints) was built and passes all tests. Senior dev review found 13 issues. Twelve plan revisions refined. v13 fixes portal-token precedence in demo/dev auth flow:
1. **High:** Portal token gate now checks for both `Authorization` AND `X-Dev-User-Email` — prevents portal token attaching when staff is authenticated via dev headers (the current default auth path)

**Key decisions confirmed:**
- Clients ONLY use `/portal/*` routes — staff endpoints require `isStaff`
- `/invites/:token/accept` is public (no auth), mounted before auth middleware
- Leadership events are global — `hub_event.hub_id` becomes nullable with **separate LeadershipEvent DTO** (ActivityEvent stays hub-scoped, `mapEventRow` keeps `hubId` required)
- Portal auth uses **signed hub-bound JWTs** with iss/aud/exp validation + manual `type`/`sub` assertion (no `requiredClaims`)
- Portal token injection uses **positive endpoint allowlist** matching actual route mounts — attaches to `/public/*`, `/hubs/:hubId/portal/*` (videos, documents, proposal, messages, meetings, members, questionnaires), `/hubs/:hubId/events` (POST only — portal tracking), and `/hubs/:hubId/` client-intelligence endpoints (`instant-answer/*`, `decision-queue/*`, `performance/*`, `history`, `risk-alerts/*`, `meetings/:id/prep/*`, `meetings/:id/follow-up/*`). All other endpoints use staff credentials. Eliminates stale-role bugs and accidental token leakage.
- Staff detection in frontend uses `user.role === "staff"` (per `src/types/auth.ts` User type — no `isStaff` field)
- Invite accept: frontend updated to call `/public/invites/${token}/accept`
- Portal event tracking: `POST /hubs/:hubId/events` allows portal tokens with event-type whitelist using actual `EventType` enum values (`hub.viewed`, `video.watched`, etc.)
- Hub list filters: middleware supports both `filter=hubType:pitch` (frontend current) AND `hubType=pitch` (new style) for compatibility
- Session unlock flag (`hub_access_*`) cleared on 401. **Portal 401 redirect only triggers when the request actually used a portal token.** Staff auth failures on portal pages use existing `onUnauthorized` flow (no masking of staff session expiry).
- Public password endpoints get rate limiting + generic uniform responses (no PII, no enumeration)
- Public endpoints enforce `is_published=true` — unpublished hubs invisible to anonymous callers
- **Unpublish = immediate lockout:** `hub-access.ts` checks `is_published=true` for portal-token users, not just at token issuance. Previously-issued tokens become useless the moment a hub is unpublished.
- No-password hubs get a portal token via the same verify-password endpoint (empty hash)
- `trust proxy` gated by env config (only enabled when `TRUST_PROXY=true`)
- **Staff preview:** Draft/unpublished hubs accessible via staff-authenticated endpoint `GET /api/v1/hubs/:hubId/portal-preview` — portal page branches based on user type

---

## Priority 1: Unblock Frontend Build

**Problem:** `isFeatureLive` removed from `api.ts` but still imported by 3 files.

**Fix (per blocker #5): use `isMockApiEnabled()`, not hardcoded `true`:**

| File | Change |
|------|--------|
| `src/services/auth.service.ts:10` | Remove `isFeatureLive` from import. Line 147: replace `if (!isFeatureLive("hubs")) return null;` with `if (isMockApiEnabled()) return null;` — skip password login in mock mode |
| `src/pages/PortalDetail.tsx:21` | Remove `isFeatureLive` import, add `isMockApiEnabled` import. Line 35: `const isLiveHub = !isMockApiEnabled();`. Line 43: `if (hubLoading || (isLoading && !isLiveHub))` stays as-is. Dead demo code block (lines 106-157) stays reachable for mock mode. |
| `src/routes/guards.tsx:15` | Remove `isFeatureLive` import, add `isMockApiEnabled` import. Lines 133-135: replace `if (isFeatureLive("hubs"))` with `if (!isMockApiEnabled())` |

---

## Priority 2+3: Staff-Only Access Guards

### Create `middleware/src/middleware/require-staff.ts`

```typescript
export function requireStaffAccess(req, res, next): void {
  if (!req.user?.isStaff) {
    res.status(403).json({
      code: 'FORBIDDEN',
      message: 'This endpoint requires staff access',
      correlationId: req.correlationId,
    });
    return;
  }
  next();
}
```

Export from `middleware/src/middleware/index.ts`.

### Router-level guards (ALL endpoints staff-only)

Portal has separate routes, so these routers are entirely staff-facing:

| Router file | Add after hubAccessMiddleware |
|-------------|-------------------------------|
| `videos.route.ts:15` | `videosRouter.use(requireStaffAccess)` |
| `documents.route.ts:15` | `documentsRouter.use(requireStaffAccess)` |
| `proposals.route.ts:14` | `proposalsRouter.use(requireStaffAccess)` |
| `projects.route.ts:16` | `projectsRouter.use(requireStaffAccess)` |
| `events.route.ts:16` | **NOT router-level** — see below for split guard approach |

### Endpoint-level guards (mixed routers)

| File | Endpoint | Guard |
|------|----------|-------|
| `hubs.route.ts:17` | `GET /hubs` (list) | `requireStaffAccess` — clients never need hub list |
| `hubs.route.ts:51` | `GET /hubs/:hubId` (detail) | `requireStaffAccess` — **staff model, not portal-safe** (see Priority 4 for portal alternative) |
| `hubs.route.ts:68` | `POST /hubs` (create) | `requireStaffAccess` |
| `hubs.route.ts:105` | `PATCH /hubs/:hubId` | `requireStaffAccess` |
| `hubs.route.ts:130` | `GET /hubs/:hubId/overview` | `requireStaffAccess` |
| `hubs.route.ts:168` | `PATCH /hubs/:hubId/notes` | `requireStaffAccess` |
| `hubs.route.ts:186` | `GET /hubs/:hubId/activity` | `requireStaffAccess` |
| `hubs.route.ts:235` | `POST /hubs/:hubId/publish` | `requireStaffAccess` |
| `portal-config.route.ts:36` | `PATCH /portal-config` | `requireStaffAccess` |

**GET /hubs/:hubId is now staff-only** per blocker #3. Portal gets hub metadata from a new public endpoint (see Priority 4).

---

## Priority 4: Portal Auth with Signed Tokens + Public Endpoints

### Architecture

**Portal token flow:**
1. Client visits `/portal/:hubId` -> frontend calls `GET /api/v1/public/hubs/:hubId/portal-meta` for basic hub info. **Only returns data for published hubs** (`is_published=true`). Unpublished hubs get generic 404.
2. If hub has password -> PasswordGate shown -> user enters password
3. `POST /api/v1/public/hubs/:hubId/verify-password` -> if valid, returns `{ valid: true, token: '<signed-jwt>' }`. **Also works for no-password hubs:** PasswordGateWrapper calls verify with empty hash — if hub has no password, the response is `{ valid: true, token }`, issuing a token immediately.
4. Frontend stores token in `sessionStorage` as `portal_token_${hubId}`
5. `apiFetch` sends token as `Authorization: Bearer <token>` on subsequent calls
6. Auth middleware validates portal JWT (signature + iss + aud + exp + type claim), creates portal user context
7. Hub access middleware validates portal token's `hubId` matches route `:hubId`

**Token payload:** `{ sub: hubId, type: 'portal', iss: 'agentflow', aud: 'agentflow-portal', iat, exp }` — 24-hour TTL, hub-bound. No PII.

### Install dependencies

```bash
cd middleware && npx pnpm add jose express-rate-limit
```

### Add env vars to `middleware/src/config/env.ts`

```
PORTAL_TOKEN_SECRET: z.string().min(32).default('dev-portal-secret-change-in-production-min-32-chars')
```

Add validation: if `NODE_ENV === 'production'`, `PORTAL_TOKEN_SECRET` must not contain 'dev-'.

### Configure proxy trust in `middleware/src/app.ts` (conditional — finding #4)

```typescript
if (env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}
```

Add `TRUST_PROXY: z.coerce.boolean().default(false)` to `middleware/src/config/env.ts`. Only enable in deployed environments where a reverse proxy sets `X-Forwarded-For`. Prevents spoofed headers in dev/local.

### Create `middleware/src/routes/public.route.ts`

| Method | Path | Logic | Rate Limit |
|--------|------|-------|------------|
| `GET` | `/hubs/:hubId/portal-meta` | Query hub where `is_published=true`. Returns `{ id, companyName, hubType, isPublished }` only. Returns generic 404 for non-existent OR unpublished hubs (prevents enumeration). | 30/min/IP |
| `GET` | `/hubs/:hubId/password-status` | Query hub where `is_published=true`. Returns `{ hasPassword: boolean }`. Returns `{ hasPassword: false }` for non-existent/unpublished hubs. | 30/min/IP |
| `POST` | `/hubs/:hubId/verify-password` | **Uniform non-enumerating (finding #5):** Query hub. If hub doesn't exist, is unpublished, OR password is wrong -> return `{ valid: false }` with identical timing (add small constant delay). If valid -> return `{ valid: true, token }`. **No PII, no reason codes, no differentiation between failure cases.** Issues token for no-password hubs too (empty hash). | 5/min/IP/hubId |
| `POST` | `/invites/:token/accept` | 501 stub (moved from auth-protected tree) | — |

**Rate limiting:** Use `express-rate-limit` with `keyGenerator` that includes IP + hubId for verify-password.

**Token generation in verify-password:**
```typescript
import { SignJWT } from 'jose';

const ISSUER = 'agentflow';
const AUDIENCE = 'agentflow-portal';
const secret = new TextEncoder().encode(env.PORTAL_TOKEN_SECRET);

const token = await new SignJWT({ type: 'portal' })
  .setProtectedHeader({ alg: 'HS256' })
  .setSubject(hubId)
  .setIssuer(ISSUER)
  .setAudience(AUDIENCE)
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(secret);
```

### Update `middleware/src/middleware/auth.ts`

Add portal token validation path **before** the demo user check. (Fix #2: drop `requiredClaims` — use only `issuer`/`audience` in jwtVerify options, then manually assert `sub` and `type`):

```typescript
import { jwtVerify } from 'jose';

const ISSUER = 'agentflow';
const AUDIENCE = 'agentflow-portal';
const secret = new TextEncoder().encode(env.PORTAL_TOKEN_SECRET);

// Check for Bearer token
const authHeader = req.headers.authorization;
if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,        // enforces iss claim present + matches
      audience: AUDIENCE,     // enforces aud claim present + matches
    });
    // Manual assertion: sub must be a string (hub UUID) and type must be 'portal'
    if (payload.type === 'portal' && typeof payload.sub === 'string') {
      req.user = {
        userId: `portal-${payload.sub}`,
        email: '',
        name: 'Portal User',
        tenantId: `portal-${payload.sub}`,
        isStaff: false,
        portalHubId: payload.sub,
      };
      next();
      return;
    }
    // Not a portal token (wrong type/missing sub) — fall through
    // Future: MSAL JWT validation for DEMO_MODE=false
  } catch {
    // Invalid/expired/bad-signature token — fall through to demo header check
  }
}

// Existing: X-Dev-User-Email demo header check...
```

Add `portalHubId?: string` to `UserContext` in `middleware/src/types/api.ts`.

### Update `middleware/src/middleware/hub-access.ts`

Add portal token path for client access. **Enforces `is_published=true` at access time** — unpublishing a hub immediately locks out all portal token holders, even if their JWT hasn't expired. **DB errors handled explicitly** (v10-#2) — query failures return 500, not 403:

```typescript
// Portal token user — can only access their bound hub, and only if still published
if (user.portalHubId) {
  if (user.portalHubId !== hubId) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Portal access denied', correlationId: req.correlationId });
    return;
  }
  // Check hub is still published (immediate lockout on unpublish)
  const { data: hub, error: hubError } = await supabase.from('hub').select('is_published')
    .eq('id', hubId).single();
  if (hubError) {
    // DB/query failure — don't mask as "hub unavailable", surface as 500
    logger.error({ err: hubError, hubId }, 'Failed to check hub published status');
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unable to verify hub access', correlationId: req.correlationId });
    return;
  }
  if (!hub?.is_published) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'This hub is no longer available', correlationId: req.correlationId });
    return;
  }
  req.hubAccess = {
    hubId, canView: true, canEdit: false,
    canInvite: false, canViewInternal: false, accessLevel: 'view_only',
  };
  next();
  return;
}
```
**Trade-off:** This adds one lightweight Supabase query per portal request. Acceptable because: (a) it's a single-column select by primary key (fast), (b) portal traffic is lower than staff traffic, (c) the security guarantee (immediate lockout) is worth it. If performance becomes a concern later, cache the published status with short TTL.

### Staff preview for draft hubs (finding #1)

**Problem:** Public portal-meta requires `is_published=true`, so staff "Preview as Client" for draft hubs 404s.

**Solution:** Add a staff-authenticated endpoint that returns portal-meta without the `is_published` check:

| File | Endpoint | Logic |
|------|----------|-------|
| `middleware/src/routes/hubs.route.ts` | `GET /hubs/:hubId/portal-preview` | `requireStaffAccess` guard. Returns same shape as public portal-meta (`{ id, companyName, hubType, isPublished }`) but **no** `is_published=true` filter. Staff can preview any hub. |

**Frontend (`src/pages/PortalDetail.tsx`):** (v6-#1: use `role` field from `User` type, not `isStaff`)
- Use existing auth context to check staff status: `user?.role === "staff"` (per `src/types/auth.ts:20` — User has `role: UserRole` where `UserRole = "staff" | "client"`)
- If staff -> call `GET /api/v1/hubs/${hubId}/portal-preview` (staff-authenticated)
- If not staff -> call `GET /api/v1/public/hubs/${hubId}/portal-meta` (public, published-only)
- Implementation: `usePortalMeta(hubId)` hook reads `user?.role` from auth context to pick the right endpoint. No header sniffing, no `isStaff` field.

### Mount in `middleware/src/app.ts`

```typescript
if (env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}
// ...
app.use('/health', healthRouter);
app.use('/api/v1/public', publicRouter);    // <- No auth, rate-limited
app.use('/api/v1', authMiddleware, apiRouter);
```

### Update `middleware/src/routes/index.ts`

Remove `acceptInviteRouter` import and mount (line 14, 53).

### Update `src/services/member.service.ts` (finding v5-#1)

Line 209: Change `/invites/${token}/accept` -> `/public/invites/${token}/accept` so the frontend hits the public route (no auth required for invite acceptance).

### Frontend updates

**`src/services/api.ts`:** (v10-#1: strict ordering + hubId match + positive allowlist)
- In `apiFetch`, token resolution follows a **strict order** with final-source tracking. Staff/MSAL token is resolved first; portal token only attaches if no staff token was set. `usedPortalToken` is set based on the final `Authorization` value actually sent:
```typescript
// --- Token injection (strict order) ---
let usedPortalToken = false;
let portalHubIdForCleanup: string | null = null;

// Step 1: Resolve staff token (MSAL or dev header)
if (getAccessToken) {
  const token = await getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    const email = localStorage.getItem('userEmail');
    if (email) headers['X-Dev-User-Email'] = email;
  }
} else {
  const email = localStorage.getItem('userEmail');
  if (email) headers['X-Dev-User-Email'] = email;
}

// Step 2: Portal token — only if NO staff auth was set above (Bearer OR dev header).
// In demo mode, getAccessToken is null and staff uses X-Dev-User-Email instead of
// Authorization. Without this check, a stale portal token in sessionStorage would
// attach even when a staff user is on a portal page (e.g. preview), causing the
// backend to treat them as a portal user instead of staff.
const hasStaffAuth = !!headers["Authorization"] || !!headers["X-Dev-User-Email"];
if (!hasStaffAuth) {
  // Positive allowlist: only these endpoint patterns receive portal tokens.
  // Derived from actual route mounts in middleware/src/routes/index.ts,
  // frontend service calls in src/services/*.service.ts,
  // and PortalDetail.tsx route config (lines 85-99).
  const PORTAL_ENDPOINT_PATTERNS = [
    /^\/public\//,                           // public endpoints (portal-meta, verify-password)
    /^\/hubs\/[^/]+\/portal(?:\/|$)/,              // portal sub-routes: /portal/videos, /portal/documents,
                                                  // /portal/proposal, /portal/messages, /portal/meetings,
                                                  // /portal/members, /portal/questionnaires
    /^\/hubs\/[^/]+\/instant-answer(?:\/|$)/,     // client intelligence: instant answers
    /^\/hubs\/[^/]+\/decision-queue(?:\/|$)/,     // client intelligence: decision queue
    /^\/hubs\/[^/]+\/performance(?:\/|$)/,        // client intelligence: performance narratives
    /^\/hubs\/[^/]+\/history$/,                   // client intelligence: institutional memory (exact, no sub-paths)
    /^\/hubs\/[^/]+\/risk-alerts(?:\/|$)/,        // client intelligence: risk alerts
    /^\/hubs\/[^/]+\/meetings\/[^/]+\/prep(?:\/|$)/,      // client intelligence: meeting prep
    /^\/hubs\/[^/]+\/meetings\/[^/]+\/follow-up(?:\/|$)/, // client intelligence: meeting follow-up
  ];

  // Events: portal can only POST (engagement tracking), GET is staff-only.
  // Handled separately with method check.
  const PORTAL_EVENTS_PATTERN = /^\/hubs\/[^/]+\/events$/;

  const portalMatch = window.location.pathname.match(/^\/portal\/([^/]+)/);
  if (portalMatch) {
    const portalHubId = portalMatch[1];
    const portalToken = sessionStorage.getItem(`portal_token_${portalHubId}`);
    if (portalToken) {
      // Check standard portal endpoints OR POST-only events endpoint
      const method = (options.method || 'GET').toUpperCase();
      const isPortalEndpoint = PORTAL_ENDPOINT_PATTERNS.some(p => p.test(endpoint))
        || (method === 'POST' && PORTAL_EVENTS_PATTERN.test(endpoint));
      // Also verify endpoint hubId matches page hubId (no cross-hub token sends)
      const endpointHubMatch = endpoint.match(/^\/hubs\/([^/]+)\//);
      const endpointHubId = endpointHubMatch?.[1];
      const hubIdMatches = !endpointHubId || endpointHubId === portalHubId;

      if (isPortalEndpoint && hubIdMatches) {
        headers["Authorization"] = `Bearer ${portalToken}`;
        usedPortalToken = true;
        portalHubIdForCleanup = portalHubId;
      }
    }
  }
}
```
**Strict ordering:** Staff token is always resolved first. Portal token only attaches if no staff auth is present — checked via `hasStaffAuth` which covers both `Authorization` (Bearer/MSAL) and `X-Dev-User-Email` (demo mode). This means `usedPortalToken` is always accurate — it's impossible for a staff token to coexist with a portal token. The flag reflects the final auth method actually sent.

**HubId match:** For `/hubs/:hubId/*` endpoints, the endpoint's hubId is parsed and compared to the page's portalHubId. If they don't match (e.g. a stray cross-hub call), the portal token is not attached. `/public/*` endpoints don't contain a hubId so the check is skipped (correct — public endpoints are hub-agnostic or take hubId in the path body).

**Events method gate (v11-#2):** `/hubs/:hubId/events` is handled separately from the main allowlist. Portal token only attaches for `POST` requests (engagement tracking). `GET /events` (staff-only list) never receives a portal token, consistent with the split-guard design in the middleware (Priority 6). The path is anchored with `$` to prevent matching `/events/something-else`.

**Client-intelligence endpoints (v11-#1):** All client-intelligence routes rendered in `PortalDetail.tsx` (lines 94-97) are included: instant-answer, decision-queue, performance, history, risk-alerts, meeting prep/follow-up. These are mounted via `clientIntelligenceRouter` (index.ts:50) with `hubAccessMiddleware` but no staff guard, so they're portal-accessible.

**Why positive allowlist:** Negative filtering is fragile — any new endpoint not in the exclusion list would accidentally get a portal token. Positive allowlisting means new endpoints default to staff-only. If a portal user hits an unlisted endpoint, no token attaches, correctly returning 401/403.

**`src/components/PasswordGate.tsx`:**
- Replace `verifyHubPassword()` import with `api.post` call to `/public/hubs/${hubId}/verify-password`
- On success: store `result.token` in `sessionStorage` as `portal_token_${hubId}` AND set `hub_access_${hubId}=true`

**`src/pages/PortalDetail.tsx`:**
- Replace `useHub(hubId)` with a new `usePortalMeta(hubId)` hook that calls `GET /api/v1/public/hubs/${hubId}/portal-meta`
- This returns `{ id, companyName, hubType, isPublished }` — enough for the portal page
- `PasswordGateWrapper`: instead of calling `hubHasPassword()` then separately unlocking, call `api.post('/public/hubs/${hubId}/verify-password', { passwordHash: '' })`. If response is `{ valid: true, token }`, the hub has no password — store the token and auto-unlock. If `{ valid: false }`, hub has a password — show PasswordGate component.

**`src/services/auth.service.ts`:**
- `loginWithHubPassword`: replace `verifyHubPassword()` with `api.post('/public/hubs/${hubId}/verify-password', { passwordHash })`. Store portal token in sessionStorage. Build a minimal client User from hubId alone (email/name empty — only used for display in demo mode).

**`src/services/api.ts` — 401 handler (v10: branch on actual token usage + short-circuit):**
- Uses `usedPortalToken` and `portalHubIdForCleanup` set during token injection above:
```typescript
// 401 handler (usedPortalToken/portalHubIdForCleanup set in token injection block above):
if (response.status === 401) {
  if (usedPortalToken && portalHubIdForCleanup) {
    // This request actually sent a portal token and it was rejected.
    // Clear stale session, redirect back to portal page (password gate re-triggers).
    sessionStorage.removeItem(`portal_token_${portalHubIdForCleanup}`);
    sessionStorage.removeItem(`hub_access_${portalHubIdForCleanup}`);
    window.location.href = `/portal/${portalHubIdForCleanup}`;
    // Short-circuit: throw immediately to prevent further error handling / noisy
    // ApiRequestError processing before navigation completes.
    throw new ApiRequestError(
      { code: 'UNAUTHENTICATED', message: 'Portal session expired' },
      401
    );
  }
  // Staff auth failure (or portal page using staff creds for portal-preview).
  // Use existing flow: clears query cache + navigates to /login.
  if (onUnauthorized) onUnauthorized();
}
```
**Why token-usage based, not path-based:** v7 checked `window.location.pathname` to decide the 401 branch. But staff users on `/portal/:hubId` pages (using staff creds for `portal-preview`) would be incorrectly redirected to the password gate instead of `/login`. By tracking whether the specific request actually attached a portal token, staff session expiry on portal pages correctly triggers the staff login flow, while portal token expiry correctly triggers the password gate. No masking, no loops.

**Why short-circuit with throw:** (v9-#3) After setting `window.location.href`, the function would otherwise continue into the error-parsing block below, potentially throwing a second `ApiRequestError` or triggering noisy console errors before navigation completes. The explicit throw with a clean error message ensures React Query's error boundary catches it cleanly and no duplicate error handling fires.

**`src/services/supabase-data.ts`:**
- Delete `verifyHubPassword()` (lines 199-210), `hubHasPassword()` (lines 216-222), `PasswordVerifyResult` interface (lines 76-82)

---

## Priority 5: Fix Publish Response Contract

| File | Change |
|------|--------|
| `middleware/src/routes/hubs.route.ts:246` | Change `sendItem(res, mapHubRow(data))` -> `sendItem(res, mapPortalConfig(data))`. Add `mapPortalConfig` to import |

---

## Priority 6: Leadership Events Schema

**Keep `ActivityEvent` hub-scoped** to avoid breaking hub analytics assumptions. Use a **separate `LeadershipEvent` DTO** for global events.

### Schema changes

| File | Change |
|------|--------|
| `sql/middleware-migration.sql:17` | `hub_id UUID NOT NULL` -> `hub_id UUID` (nullable). Add `ALTER TABLE hub_event ALTER COLUMN hub_id DROP NOT NULL;` |

### Backend mapper changes (`middleware/src/adapters/event.mapper.ts`) (finding #2)

- `EventRow.hub_id`: change to `string | null`
- **`mapEventRow` stays strict** — `EventDTO.hubId` remains `string` (required). Add a runtime guard: if `row.hub_id` is null, throw `new Error('mapEventRow requires hub_id')`. This ensures hub-scoped event queries (which filter by `hub_id`) never silently produce null. Only leadership endpoints use the separate mapper below.
- Add new `LeadershipEventDTO` interface and `mapLeadershipEventRow` mapper (hub-free):

```typescript
export interface LeadershipEventDTO {
  id: string;
  eventType: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export function mapLeadershipEventRow(row: EventRow): LeadershipEventDTO {
  return {
    id: row.id,
    eventType: row.event_type,
    userId: row.user_id || '',
    userName: row.user_name || '',
    userEmail: row.user_email || '',
    timestamp: row.created_at,
    metadata: row.metadata || {},
  };
}
```

### Frontend type changes (`src/types/activity.ts`)

- **Do NOT change `ActivityEvent.hubId`** — it stays required (`EntityId`). Hub-scoped analytics keep their assumptions.
- The existing `LeadershipLogEventRequest` type (line 62) and `LeadershipAccessedMetadata` (line 150) are already correctly hub-free.
- Add a new `LeadershipEvent` display type if needed for leadership event consumption:

```typescript
export interface LeadershipEvent {
  id: EntityId;
  eventType: EventType;
  userId: EntityId;
  userName: string;
  userEmail: string;
  timestamp: ISODateString;
  metadata: LeadershipAccessedMetadata;
}
```

### Backend route changes (`middleware/src/routes/events.route.ts`) (v5-#2: portal tracking)

**Split guard approach:** Portal clients need to POST engagement events (page views, video watches). Staff need GET/list access.

- `GET /hubs/:hubId/events` — add `requireStaffAccess` (staff-only list)
- `POST /hubs/:hubId/events` — **no staff guard** — portal tokens can write, BUT with strict event-type whitelist. **Single source of truth:** define as exported const in the route file (v7-#3):
  ```typescript
  // Canonical allowlist — tests import this directly to prevent drift
  export const PORTAL_ALLOWED_EVENTS = [
    'hub.viewed', 'proposal.viewed', 'proposal.slide_time',
    'video.watched', 'video.completed',
    'document.viewed', 'document.downloaded',
    'questionnaire.started', 'questionnaire.completed',
  ] as const;

  // In handler:
  if (user.portalHubId && !PORTAL_ALLOWED_EVENTS.includes(req.body.eventType)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Event type not allowed for portal users' });
  }
  ```
  Contract tests import `PORTAL_ALLOWED_EVENTS` directly (see New Tests section).
- Leadership events POST (line 82): `requireStaffAccess` guard + uses `mapLeadershipEventRow` for the response instead of `mapEventRow`.

---

## Priority 7: Milestone Cross-Hub Vulnerability

Add helper at top of `middleware/src/routes/projects.route.ts`:

```typescript
async function verifyProjectOwnership(projectId: string, hubId: string): Promise<void> {
  const { data } = await supabase.from('hub_project').select('id')
    .eq('id', projectId).eq('hub_id', hubId).single();
  if (!data) throw Errors.notFound('Project', projectId);
}
```

Call at start of each milestone handler (lines 167, 199, 226).

---

## Priority 9: DEMO_MODE=false Hard-Fail

| File | Change |
|------|--------|
| `middleware/src/config/env.ts:62-66` | Replace SharePoint validation with: `throw new Error('JWT authentication is not yet implemented. Set DEMO_MODE=true for development.')` |

---

## Priority 10: FormData Content-Type Fix (addresses correction #6)

| File | Change |
|------|--------|
| `src/services/api.ts:77` | Replace `"Content-Type": "application/json"` with `...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" })` |

---

## Priority 11: Hub List Search/Filter/Sort (v5-#3: backwards-compatible)

In `middleware/src/routes/hubs.route.ts` GET /hubs handler, replace two-query approach with single filtered query. **Support both current frontend format (`filter=hubType:pitch`) and new discrete params (`hubType=pitch`):**

```typescript
let query = supabase.from('hub').select(HUB_SELECT, { count: 'exact' });

if (req.query.search) {
  const sanitised = String(req.query.search).replace(/[^a-zA-Z0-9 '\-]/g, '').trim();
  if (sanitised.length > 0) query = query.ilike('company_name', `%${sanitised}%`);
}

// Parse filter param (current frontend sends "hubType:pitch" or "hubType:client")
let hubTypeFilter: string | undefined;
let statusFilter: string | undefined;
if (req.query.filter) {
  const filterStr = String(req.query.filter);
  const [key, val] = filterStr.split(':');
  if (key === 'hubType') hubTypeFilter = val;
  if (key === 'status') statusFilter = val;
}

// Discrete params override filter string (new style)
const VALID_HUB_TYPES = ['pitch', 'client'];
const hubType = String(req.query.hubType || hubTypeFilter || '');
if (VALID_HUB_TYPES.includes(hubType)) {
  query = query.eq('hub_type', hubType);
}

const VALID_STATUSES = ['draft', 'active', 'won', 'lost'];
const status = String(req.query.status || statusFilter || '');
if (VALID_STATUSES.includes(status)) {
  query = query.eq('status', status);
}

// Whitelist sort fields
const VALID_SORTS = ['updated_at', 'created_at', 'company_name', 'status'];
const sortField = VALID_SORTS.includes(String(req.query.sortBy || ''))
  ? String(req.query.sortBy) : 'updated_at';
query = query.order(sortField, { ascending: req.query.sortOrder === 'asc' });

const { data, count, error } = await query.range(offset, offset + pageSize - 1);
```

This ensures existing frontend (`filter=hubType:pitch`) keeps working while also supporting discrete query params for future migration.

---

## Priority 12: handleShareClick UI Bug

| File | Change |
|------|--------|
| `src/components/ClientVideosSection.tsx:218` | `onClick={() => selectedVideo && handleShareClick(selectedVideo.id, {} as React.MouseEvent)}` -> `onClick={(e) => selectedVideo && handleShareClick(selectedVideo.id, e)}` |

---

## Priority 13: CI Safety (No Code Fix)

Once Priority 1 unblocks the build, recommend adding `vite build` to CI gate. Documentation note only.

---

## Complete File List

| Action | File |
|--------|------|
| **CREATE** | `middleware/src/middleware/require-staff.ts` — staff access guard |
| **CREATE** | `middleware/src/routes/public.route.ts` — public portal-meta, password, invite endpoints |
| **CHANGE** | `middleware/package.json` — add `jose`, `express-rate-limit` |
| **CHANGE** | `middleware/src/config/env.ts` — add PORTAL_TOKEN_SECRET, TRUST_PROXY, hard-fail DEMO_MODE=false |
| **CHANGE** | `middleware/src/types/api.ts` — add `portalHubId?` to UserContext |
| **CHANGE** | `middleware/src/middleware/auth.ts` — add portal JWT validation path |
| **CHANGE** | `middleware/src/middleware/hub-access.ts` — add portal token hubId check |
| **CHANGE** | `middleware/src/middleware/index.ts` — export requireStaffAccess |
| **CHANGE** | `middleware/src/app.ts` — mount public router before auth |
| **CHANGE** | `middleware/src/routes/index.ts` — remove acceptInviteRouter |
| **CHANGE** | `middleware/src/routes/hubs.route.ts` — staff guards on ALL endpoints, publish fix, search/filter/sort, staff portal-preview endpoint |
| **CHANGE** | `middleware/src/routes/videos.route.ts` — router-level staff guard |
| **CHANGE** | `middleware/src/routes/documents.route.ts` — router-level staff guard |
| **CHANGE** | `middleware/src/routes/proposals.route.ts` — router-level staff guard |
| **CHANGE** | `middleware/src/routes/projects.route.ts` — staff guard + milestone hub validation |
| **CHANGE** | `middleware/src/routes/portal-config.route.ts` — staff guard on PATCH |
| **CHANGE** | `middleware/src/routes/events.route.ts` — split guard (GET staff-only, POST allows portal with event-type whitelist), use LeadershipEventDTO |
| **CHANGE** | `middleware/src/adapters/event.mapper.ts` — nullable hub_id |
| **CHANGE** | `sql/middleware-migration.sql` — nullable hub_event.hub_id |
| **CHANGE** | `src/services/api.ts` — remove isFeatureLive, fix FormData, add scoped portal token injection, add 401 session cleanup |
| **CHANGE** | `src/services/member.service.ts` — update invite accept URL to `/public/invites/${token}/accept` |
| **CHANGE** | `src/services/auth.service.ts` — remove isFeatureLive, migrate password verify to API |
| **CHANGE** | `src/pages/PortalDetail.tsx` — use isMockApiEnabled, use portal-meta endpoint, migrate password check |
| **CHANGE** | `src/routes/guards.tsx` — use isMockApiEnabled instead of isFeatureLive |
| **CHANGE** | `src/components/PasswordGate.tsx` — use middleware API, store portal token |
| **CHANGE** | `src/components/ClientVideosSection.tsx` — fix event handler |
| **CHANGE** | `src/services/supabase-data.ts` — remove password functions |
| **CHANGE** | `src/types/activity.ts` — add `LeadershipEvent` display DTO (ActivityEvent.hubId stays required) |
| **CHANGE** | `middleware/src/__tests__/contract.test.ts` — staff guard + public route + portal token tests |

---

## New Tests Required (finding #6)

Add to `middleware/src/__tests__/contract.test.ts`:

| Test | Assertion |
|------|-----------|
| `public portal-meta rejects unpublished hub` | `GET /api/v1/public/hubs/:unpublishedId/portal-meta` -> 404 |
| `public verify-password rejects unpublished hub` | `POST /api/v1/public/hubs/:unpublishedId/verify-password` -> `{ valid: false }` (not 404 — uniform response) |
| `no-password hub auto-issues token` | `POST /api/v1/public/hubs/:noPasswordHubId/verify-password` with empty hash -> `{ valid: true, token: '...' }` |
| `staff portal-preview works for draft hub` | `GET /api/v1/hubs/:draftHubId/portal-preview` with staff header -> 200 with hub metadata |
| `portal token hub mismatch returns 403` | Request with portal token for hub A, access hub B -> 403 |
| `portal token cannot access staff endpoints` | Request with portal token -> `GET /api/v1/hubs` (staff-only list) -> 403 |
| `portal POST event with allowed type succeeds` | `POST /hubs/:hubId/events` with portal token + `eventType: 'hub.viewed'` -> 201 |
| `portal POST event with disallowed type rejected` | `POST /hubs/:hubId/events` with portal token + `eventType: 'hub.converted'` -> 403 |
| `PORTAL_ALLOWED_EVENTS contains only valid EventType values` | Import `PORTAL_ALLOWED_EVENTS` from route, assert each value is a known event type string (prevents typos/drift) |
| `portal token rejected after hub unpublished` | Issue portal token for published hub, then set `is_published=false`, then request with token -> 403 "no longer available" |
| `staff preview with stale portal token uses staff auth` | Staff user on `/portal/:hubId` with stale `portal_token_*` in sessionStorage -> request uses `X-Dev-User-Email` staff auth, NOT portal token. Verify staff identity on backend (e.g. `GET /hubs/:hubId/portal-preview` returns 200 with staff access, not 403 portal-restricted). |

These require test fixtures: one published hub (with password), one published hub (no password), one unpublished/draft hub.

---

## Verification

After each priority group:
1. `cd middleware && npx tsc --noEmit` — zero TypeScript errors
2. `npx vitest run` — all tests pass (including new tests above)
3. `cd .. && npx vite build` — frontend build succeeds (after Priority 1)
4. Manual: login as staff -> verify hub CRUD works
5. Manual: visit `/portal/:hubId` -> verify password gate -> verify portal token flow
6. Manual: with portal token, verify staff endpoints return 403
7a. Manual: with expired portal token on a portal-safe endpoint, verify redirect back to `/portal/:hubId` (password gate), NOT to `/login`
7b. Manual: as staff on portal page, trigger staff session expiry -> verify redirect to `/login`, NOT to password gate
7c. Manual: unpublish a hub while portal user has active session -> verify next portal request returns 403
7d. Manual: verify portal token does NOT attach to staff-only endpoints (hub list, portal-preview, etc.) even when on portal page
7e. Manual: as staff on portal page with stale `portal_token_*` in sessionStorage -> verify staff dev-header auth is used, not portal token
7. Manual: verify rate limiting on public endpoints (5 rapid requests)
8. Manual: staff preview of draft hub via portal page works

---

## Known Intentional Deployment Blockers

The following are **by design**, not implementation bugs:

1. **DEMO_MODE hard-fail (env.ts):** `DEMO_MODE=false` throws at startup because JWT/MSAL auth is not yet implemented. `DEMO_MODE=true` is blocked in production. This creates a deliberate deployment gate — the middleware runs only in dev/test until real auth is shipped.

2. **`handleJwtAuth` returns 501:** The production auth path (`DEMO_MODE=false`) is stubbed. When JWT auth is implemented, this function will validate MSAL tokens and extract user context.

3. **501 stub endpoints:** ~60 endpoints return 501 (messages, meetings, members, questionnaires, intelligence, etc.). These are Phase 2+ features defined in the API specification but not yet implemented. Each has the correct route structure, middleware chain, and staff guards in place.

These blockers will be resolved by implementing MSAL JWT authentication (removes #1 and #2) and building out the stub endpoints per the implementation roadmap (removes #3).
