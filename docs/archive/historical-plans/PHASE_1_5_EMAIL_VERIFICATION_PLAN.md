# Phase 1.5: Portal Email Verification — Implementation Plan

> **HISTORICAL IMPLEMENTATION PLAN (completed).**
> Email verification access mode is live in production.
> Use `docs/CURRENT_STATE.md` for current behavior and `docs/PRODUCTION_ROADMAP.md` for remaining roadmap work.

**Date:** 23 Feb 2026 (v4 — IMPLEMENTED AND DEPLOYED)
**Author:** Hamish Nicklin / Claude Code
**Status:** COMPLETE — deployed to production 23 Feb 2026
**Estimated effort:** 3-4 days (actual: ~1 day)
**Review history:** v1 reviewed 23 Feb (9 findings), v2 reviewed 23 Feb (4 findings), v3 submitted 23 Feb, v4 implementation complete + 3 rounds external senior dev review + deployed

---

## Problem

Currently, clients access their hub via a portal link (`/portal/:hubId`). The link is protected only by an optional password. This is acceptable for pitch hubs (non-sensitive prospecting material), but client hubs contain project data, health dashboards, and financial information.

**Current risks:**
- Anyone with the link can access the hub (security through obscurity)
- No audit trail of who accessed the hub — portal auth sets `email: ''` (`auth.ts:89`), so event logs record "Portal User" with no identity
- Passwords are shared credentials with no per-person accountability
- Clients dislike remembering passwords

## Solution: Email-Verified Portal Access

Replace password-only portal access with email-verified access. Staff add allowed email addresses ("portal contacts") to each hub. Clients verify their email with a one-time code, then get a long-lived device token so they only verify once per device.

### Client Experience

1. Client clicks portal link (e.g. `goagentflow.com/clienthub/portal/abc-123`)
2. Sees "Enter your email to access this hub"
3. Enters their email → receives a 6-digit code by email (10-minute expiry)
4. Enters the code → portal opens
5. **Next visits (same device/browser):** portal opens immediately — no code needed (90-day device token)
6. New device or expired token → re-verify with a new code

### Staff Experience

1. Staff opens hub → Client Portal section
2. Adds portal contacts (email addresses of authorised people)
3. Sets access method to "Email verification"
4. Hub is now email-gated — only listed contacts can access

---

## Architecture Decisions

### Portal JWT now carries identity [Finding #1 fix]
Email-verified portal JWTs include the verified email and contact name in their claims. The auth middleware populates `req.user.email` and `req.user.name` from these claims, enabling per-person audit trails in `hub_event` records.

**JWT claims for email-verified tokens:**
```json
{
  "type": "portal",
  "sub": "hub-uuid",
  "email": "sarah@whitmorelaw.co.uk",
  "name": "Sarah Mitchell",
  "iss": "agentflow",
  "aud": "agentflow-portal"
}
```

**Auth middleware change** (`middleware/src/middleware/auth.ts:86-94`):
```typescript
// Before (current):
req.user = {
  userId: `portal-${payload.sub}`,
  email: '',
  name: 'Portal User',
  ...
};

// After:
req.user = {
  userId: `portal-${payload.sub}`,
  email: (payload.email as string) || '',
  name: (payload.name as string) || 'Portal User',
  ...
};
```

This is backwards-compatible: existing password-flow JWTs have no `email`/`name` claims, so they fall back to `''`/`'Portal User'` as before. Only email-verified JWTs carry identity.

### Open-mode token issuance [Finding #2 fix]
The `open` access method retains the existing `verify-password` endpoint as its token minting path. The frontend calls `POST /public/hubs/:hubId/verify-password` with an empty body, which auto-issues a portal JWT for no-password hubs. This is the existing behaviour — no change needed.

**Explicit contract:**
- `access-method` returns `{ method: 'open' }` → frontend calls `verify-password` with `{}` → gets portal JWT
- `access-method` returns `{ method: 'password' }` → frontend shows PasswordGate → calls `verify-password` with hash
- `access-method` returns `{ method: 'email' }` → frontend shows EmailGate → calls `request-code` / `verify-code`

**Tests required:**
- Open hub end-to-end: `GET access-method` → `POST verify-password` → use returned token to `POST /hubs/:hubId/events` → verify 201
- Negative: portal token on `GET /hubs/:hubId/events` → 403 (portal users cannot list events, only create them)

### No new npm packages
Email sent via Resend REST API using native `fetch()`. Cryptographic operations via Node.js built-in `crypto` module. Zero new dependencies.

### localStorage for device tokens (not cookies)
The frontend (`goagentflow.com/clienthub`) and middleware (`clienthub-api-xxx.a.run.app`) are on different domains. HttpOnly cookies cannot be set cross-domain. Device tokens are stored in the client's `localStorage` and sent explicitly in API calls.

### Dual-run with existing password flow
A new `accessMethod` field on the Hub model (`password` | `email` | `open`) determines which gate the client sees. Existing password-protected hubs default to `password` and continue working unchanged. No breaking changes.

### Resend for transactional email
Resend is the simplest transactional email API — a single REST endpoint, no SDK needed. Free tier supports 100 emails/day (more than enough for MVP).

**Production safety [Finding #4 fix]:** If `accessMethod === 'email'` is set on any hub and `RESEND_API_KEY` is not configured, the `request-code` endpoint returns `500` with `{ code: 'EMAIL_NOT_CONFIGURED' }`. In dev/demo mode (`AUTH_MODE=demo`), codes are logged to console as a fallback. The production guard in `env.ts` is: if `NODE_ENV=production` and `RESEND_API_KEY` is missing, log a startup warning (not a hard fail, since not all hubs use email mode).

### Email canonicalisation [Finding #8 fix]
All email addresses are normalised to `lowercase + trim` before storage and comparison. The `PortalContact` unique constraint and all lookups use normalised emails. The `request-code` and `verify-code` endpoints normalise input before querying.

---

## Database Schema Changes

Three new Prisma models and one new field on Hub:

### Hub model — new field
```
accessMethod  String  @default("password") @map("access_method")
// Values: "password" | "email" | "open"
```

### PortalContact — allowlist of authorised emails per hub
```
model PortalContact {
  id        String   @id @default(uuid())
  hubId     String   @map("hub_id")
  tenantId  String   @map("tenant_id")
  email     String                          // Always stored lowercase+trimmed
  name      String?
  addedBy   String   @map("added_by")      // Staff user ID who added
  createdAt DateTime @default(now()) @map("created_at")

  hub Hub @relation(fields: [hubId], references: [id])

  @@unique([hubId, email])                  // One entry per email per hub
  @@map("portal_contact")
}
```

### PortalVerification — short-lived 6-digit codes [Finding #3 fix]
```
model PortalVerification {
  id        String   @id @default(uuid())
  hubId     String   @map("hub_id")
  email     String                          // Always stored lowercase+trimmed
  codeHash  String   @map("code_hash")      // SHA-256 hash, not plaintext
  attempts  Int      @default(0)            // Failed verify attempts (max 5)
  expiresAt DateTime @map("expires_at")     // 10 minutes from creation
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@unique([hubId, email])                  // DB-enforced: one active code per hub+email
  @@map("portal_verification")
}
```

**One-active-code invariant (Finding #3, v3 update):** The `@@unique([hubId, email])` constraint means only one verification row can exist per hub+email. The `request-code` endpoint uses a **true Prisma upsert** on the composite unique key:

```typescript
await prisma.portalVerification.upsert({
  where: { hubId_email: { hubId, email } },
  create: { hubId, email, codeHash, expiresAt, attempts: 0 },
  update: { codeHash, expiresAt, used: false, attempts: 0 },
});
```

This is atomic at the DB level — no race conditions from parallel requests, no `P2002` unique constraint errors, no noisy 500s. A new code request always replaces the existing one in a single operation. The `attempts` field provides per-code lockout: after 5 failed verifies, the code is rejected regardless of correctness (client must request a new code).

### PortalDevice — remember-me device tokens
```
model PortalDevice {
  id              String   @id @default(uuid())
  hubId           String   @map("hub_id")
  email           String                           // Always stored lowercase+trimmed
  deviceTokenHash String   @map("device_token_hash") // SHA-256 hash
  expiresAt       DateTime @map("expires_at")        // 90 days from creation
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([hubId, email])
  @@map("portal_device")
}
```

### Contact deletion cascade [Finding #7 fix]
`PortalDevice` does not have a FK to `PortalContact` because device records are keyed by `hubId + email` (not contact ID). When a staff member deletes a portal contact, the `DELETE /portal-contacts/:id` handler performs a **transactional delete**:

```typescript
await prisma.$transaction([
  prisma.portalContact.delete({ where: { id } }),
  prisma.portalDevice.deleteMany({ where: { hubId, email: contact.email } }),
  prisma.portalVerification.deleteMany({ where: { hubId, email: contact.email } }),
]);
```

This is explicit and testable. No FK cascade magic — the application enforces the invariant in a single transaction.

---

## API Endpoints

### Public endpoints (no auth, rate-limited)

These are called by the client's browser when accessing a portal link. Mounted under `/api/v1/public`.

| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|------------|
| GET | `/public/hubs/:hubId/access-method` | Returns `{ method: 'email' \| 'password' \| 'open' }` | 30/min per IP |
| POST | `/public/hubs/:hubId/request-code` | Sends 6-digit code to email | 3/min per IP+hubId, 1/min per hubId+email |
| POST | `/public/hubs/:hubId/verify-code` | Validates code → returns portal JWT + device token | 5/min per IP+hubId |
| POST | `/public/hubs/:hubId/verify-device` | Validates device token → returns portal JWT | 5/min per IP+hubId |

### Staff endpoints (auth required)

These are called by staff users managing hub portal contacts. Mounted under `/api/v1/hubs/:hubId`.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/hubs/:hubId/portal-contacts` | List allowed contacts |
| POST | `/hubs/:hubId/portal-contacts` | Add a contact (email + name) |
| DELETE | `/hubs/:hubId/portal-contacts/:id` | Remove contact + revoke all device tokens + delete pending codes |
| PATCH | `/hubs/:hubId/access-method` | Set hub access method |

---

## Security Design

### Email enumeration prevention [Finding #5 fix, v3 update]
`request-code` always returns `{ sent: true }` regardless of whether the email is a valid contact. To prevent timing-based enumeration:

**Fire-and-forget email sending:** The endpoint never awaits the Resend API call in the response path. The flow is:
1. Look up contact (DB query — happens for all emails)
2. Generate code, compute hash (happens for all emails — constant-time work)
3. If contact exists: store verification row in DB, then **fire-and-forget** the Resend API call (no `await`)
4. If contact does not exist: no DB write, no email send
5. Return `{ sent: true }` immediately

The Resend call is dispatched with `.catch(err => logger.error(...))` — failures are logged but never block or leak into response timing. The DB write (step 3) is the only difference between the two paths, but it's a single fast INSERT that adds negligible timing variance compared to network jitter. If further hardening is needed later, a constant-time sleep can be added, but fire-and-forget is the primary defence.

### Code brute-force protection [Finding #3 + #6 fix]
- Codes are 6 digits (1 million combinations)
- **Per-code attempt limit:** 5 failed attempts per verification record. After 5 failures, the code is permanently rejected — client must request a new code. Tracked via `attempts` field on `PortalVerification`.
- **Per-IP rate limit:** 5 verify attempts per minute per IP+hubId
- **Per-email cooldown:** 1 code request per minute per hubId+email (prevents spam)
- Codes expire after 10 minutes
- **One active code per hub+email** — enforced by `@@unique([hubId, email])` DB constraint + atomic upsert
- Code stored as SHA-256 hash, verified with timing-safe comparison

### Rate limiting strategy [Finding #6 fix]

| Layer | Scope | Limit | Purpose |
|-------|-------|-------|---------|
| IP + hubId | request-code | 3/min | Prevent single-IP spam |
| hubId + email | request-code | 1/min | Prevent email flooding |
| IP + hubId | verify-code | 5/min | Prevent brute force |
| Per-code | verify-code | 5 attempts total | Lockout after failures |
| IP + hubId | verify-device | 5/min | Prevent device token brute force |

**Cloud Run scaling note:** `express-rate-limit` is in-memory (per-instance). On Cloud Run with multiple instances, rate limits are per-instance, not global. For MVP scale (single instance, <50 users), this is acceptable. For production scale, migrate to Redis-backed rate limiting (Phase 2 or later). The per-code attempt counter is DB-backed and therefore global across instances.

### Device token security
- Device tokens are 32 random bytes (hex-encoded) — not guessable
- Stored in database as SHA-256 hash (not plaintext)
- Hub-scoped: a stolen token only grants access to one hub
- Staff can revoke by removing the portal contact (transactional cascade — Finding #7)
- 90-day expiry, then client re-verifies

### Existing protections still apply
- Hub must be published (`isPublished = true`) for portal access to work
- Portal JWT expires after 24 hours (same as password flow)
- Hub access middleware checks portal token is bound to the correct hub
- Unpublishing a hub immediately revokes all portal access

---

## Frontend Changes

### New component: EmailGate
Email verification flow replacing the password gate for email-protected hubs:
- Step 1: Email input form
- Step 2: 6-digit code input with "Resend code" button (60-second cooldown)
- On success: stores portal JWT in `sessionStorage`, device token in `localStorage`

### Modified: PortalDetail page
The portal landing page checks `GET /access-method` instead of `GET /password-status`:
- If `email`: check `localStorage` for device token → try verify-device → if invalid, show EmailGate
- If `password`: show existing PasswordGate (unchanged)
- If `open`: call existing `verify-password` with empty body → get token → auto-unlock [Finding #2 fix]

### New component: PortalContactsCard (staff UI)
Added to the Client Portal management section:
- List of current portal contacts (email, name, date added)
- Add contact form (email + optional name)
- Remove contact button with confirmation
- Access method toggle (password / email / open)

---

## Implementation Order

```
Step 0: Update documentation (roadmap, this plan)
    │
Step 1: Database schema (Prisma migration) — everything depends on this
    │
Step 2: Env config + email service
    │
Step 3: Auth middleware update (portal JWT identity claims)
    │
Step 4: Public verification endpoints (request-code, verify-code, verify-device)
    │
Step 5: Staff endpoints (portal contact CRUD + transactional cascade delete)
    │
Step 6: Frontend — EmailGate component + PortalDetail update
    │
Step 7: Frontend — Staff contact management UI
    │
Step 8: Tests + senior review
    │
Step 9: Deploy (add RESEND_API_KEY to GCP Secret Manager, redeploy both services)
```

---

## Files Summary [Finding #9 fix — complete inventory]

### New files (9)
| File | Purpose | Est. lines |
|------|---------|------------|
| `middleware/src/services/email.service.ts` | Resend email wrapper | ~50 |
| `middleware/src/routes/portal-verification.route.ts` | Public verification endpoints | ~200 |
| `middleware/src/db/portal-verification-queries.ts` | DB queries for verification | ~100 |
| `middleware/src/routes/portal-contacts.route.ts` | Staff contact management endpoints | ~130 |
| `middleware/src/__tests__/portal-verification.test.ts` | Verification endpoint tests | ~250 |
| `middleware/src/__tests__/portal-contacts.test.ts` | Contact CRUD + cascade tests | ~120 |
| `src/components/EmailGate.tsx` | Client email verification UI | ~150 |
| `src/components/client-portal/PortalContactsCard.tsx` | Staff contact management UI | ~150 |
| `src/hooks/use-portal-contacts.ts` | React Query hooks | ~60 |

### Modified files (9)
| File | Change |
|------|--------|
| `middleware/prisma/schema.prisma` | Add 3 models + Hub.accessMethod field + Hub.portalContacts relation |
| `middleware/src/config/env.ts` | Add RESEND_API_KEY, RESEND_FROM_EMAIL |
| `middleware/src/middleware/auth.ts` | Extract `email`/`name` from portal JWT claims into `req.user` |
| `middleware/src/app.ts` | Mount new public routes |
| `middleware/src/routes/index.ts` | Mount new staff routes |
| `middleware/src/__tests__/test-setup.ts` | Add mock models for new tables, update portal token helper |
| `middleware/src/db/hub.mapper.ts` | Add `accessMethod` to hub select/map (for staff hub detail) |
| `src/pages/PortalDetail.tsx` | Replace password-status with access-method gate |
| `src/components/ClientPortalSection.tsx` | Add PortalContactsCard |

---

## Security Acceptance Tests [Finding #1, #2, #3 — required tests]

### Audit attribution (Finding #1)
- Email-verified portal user creates event → `hub_event.userEmail` contains verified email
- Email-verified portal user creates event → `hub_event.userName` contains contact name
- Password-flow portal user creates event → `hub_event.userEmail` is `''` (backwards-compatible)

### Open-mode API authorisation (Finding #2, v3 update)
- Open hub: `GET access-method` returns `{ method: 'open' }`
- Open hub: `POST verify-password` with `{}` returns valid portal JWT
- Open hub: use portal JWT to `POST /hubs/:hubId/events` → 201 (create event works)
- Open hub: use portal JWT to `GET /hubs/:hubId/events` → 403 (portal users cannot list events)
- Open hub: API call without token → 401

### Code integrity and concurrency (Finding #3, v3 update)
- Two parallel `request-code` calls for same hub+email → only one verification row exists (Prisma upsert, no P2002 errors)
- `verify-code` with correct code → 200, token returned
- `verify-code` with wrong code → 200, `{ valid: false }`, `attempts` incremented
- 5 wrong codes → code permanently locked, correct code also rejected
- After lockout, `request-code` → new code works (old row replaced via upsert)
- Expired code → `{ valid: false }` even with correct code

### Contact deletion cascade (Finding #7)
- Add contact → add device → delete contact → verify-device returns `{ valid: false }`
- Add contact → create verification → delete contact → verify-code returns `{ valid: false }`

### Enumeration resistance (Finding #5)
- `request-code` for known email → `{ sent: true }`
- `request-code` for unknown email → `{ sent: true }` (same response, same timing)

---

## Verification Criteria

1. Staff can add portal contacts and set access method to "email" on a hub
2. Client visits portal link → sees email input (not password)
3. Client enters authorised email → receives 6-digit code by email
4. Client enters code → portal opens with full access
5. **Audit trail works:** hub events show the client's verified email and name
6. Client closes browser, revisits same link → portal opens immediately (device token)
7. Unauthorised email → gets `sent: true` but no code arrives (no enumeration)
8. Wrong code → rejected; after 5 wrong attempts, code is permanently locked
9. Parallel code requests → only one active code (DB-enforced)
10. Staff removes contact → device token and pending codes revoked (transactional)
11. Open hubs → auto-unlock via existing verify-password, API calls work with token
12. All existing password-protected hubs continue working unchanged
13. Production without RESEND_API_KEY → request-code returns 500 (not silent failure)
14. Senior review passes

---

## Dependencies

- **Resend account** — free tier (100 emails/day). API key needed as GCP secret.
- **Domain verification** — `goagentflow.com` must be verified in Resend for emails to come from `noreply@goagentflow.com` (otherwise emails may go to spam)
- **No dependency on Phase 0a (Azure)** or Phase 5 (OBO). Can be built immediately.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Resend free tier limit (100/day) | Sufficient for MVP. Upgrade to paid ($20/mo, 50k emails) when scaling. |
| Emails going to spam | Verify `goagentflow.com` domain in Resend. Use proper SPF/DKIM records. |
| Device token stolen | Hub-scoped (one hub only), staff can revoke via contact delete, 90-day expiry. |
| Client enters wrong email | Uniform response: "We've sent a code if this email has access." No enumeration. |
| Existing hubs break | Impossible — `accessMethod` defaults to `password`, existing flow unchanged. |
| Rate limits per-instance on Cloud Run | Per-code attempt counter is DB-backed (global). IP limits are per-instance — acceptable at MVP scale. Migrate to Redis for multi-instance. |
| Parallel code requests | DB unique constraint + atomic upsert prevents duplicate codes. |
| Missing RESEND_API_KEY in production | `request-code` returns 500 — not silent. Startup warning logged. |

---

## Senior Dev Review Findings — Resolution Summary

### v1 → v2 (9 findings)

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | HIGH | No per-person audit trail | Portal JWT now carries `email` + `name` claims; auth middleware populates `req.user` from them |
| 2 | HIGH | Open access flow underspecified | Explicitly uses existing `verify-password` endpoint; test added for end-to-end |
| 3 | HIGH | One-active-code not enforceable | `@@unique([hubId, email])` DB constraint + Prisma upsert + per-code attempt counter |
| 4 | MEDIUM | Production misconfig unsafe | `request-code` returns 500 if RESEND_API_KEY missing in production; console fallback only in demo mode |
| 5 | MEDIUM | Enumeration mitigation incomplete | Fire-and-forget email sending — Resend call never awaited in response path |
| 6 | MEDIUM | Rate limiting too weak | Added per-email cooldown + per-code attempt lockout (DB-backed, global across instances) |
| 7 | MEDIUM | Cascade revoke not modelled | Explicit transactional delete (contact + devices + verifications) in single `$transaction` |
| 8 | LOW | Email canonicalisation missing | All emails normalised to lowercase+trim before storage and comparison |
| 9 | LOW | File impact list incomplete | Full 18-file inventory with auth.ts, hub.mapper.ts, and separate test files |

### v2 → v3 (4 findings)

| # | Severity | Finding | Resolution |
|---|----------|---------|------------|
| 1 | MEDIUM | Enumeration timing not guaranteed (500ms can be exceeded by Resend) | Changed to fire-and-forget: email dispatched with `.catch()`, never awaited in response path |
| 2 | MEDIUM | Open-mode test uses GET/200 instead of POST/201 | Fixed to POST/201; added negative test: GET /events → 403 for portal users |
| 3 | MEDIUM | "Transactional upsert" is delete+insert (race-prone) | Changed to true Prisma `upsert` on composite unique key — atomic, no P2002 errors |
| 4 | LOW | File path typo: `hub-mapper.ts` | Corrected to `hub.mapper.ts` |

### Implementation Review (3 rounds external senior dev)

| Round | Findings | Resolution |
|-------|----------|------------|
| 1 | 3 HIGH + 3 MEDIUM: missing GET access-method staff endpoint, access method not enforced on verification endpoints, open mode breaks with existing password hash, tenant isolation bypassed, Prisma errors become 500s, test gaps | All 6 fixed: added GET endpoint, enforced `accessMethod === 'email'` on all verify endpoints, PATCH clears passwordHash on open + revokes artifacts on method switch, added `verifyTenant()` helper, mapped P2002→409 and P2025→404 |
| 2 | 2 LOW (non-blocking): verify-code mints token without contact check, non-existent hub returns 403 instead of 404 | Both fixed: added contact existence check before JWT minting, split verifyTenant into 404 (missing) vs 403 (wrong tenant) |
| 3 | APPROVED — 1 low observation (parallel deletes vs transaction in PATCH access-method, acceptable for MVP) | No action required |

---

## Deployment Status (23 Feb 2026)

**Status: LIVE IN PRODUCTION**

| Component | Service | Revision | Status |
|-----------|---------|----------|--------|
| Middleware | `clienthub-api` (Cloud Run) | `clienthub-api-00003-jgk` | Live |
| Frontend | `agentflow-site` (Cloud Run) | `agentflow-site-00241-p6c` | Live |
| Database | Supabase PostgreSQL | 3 new tables + Hub.accessMethod | Migrated |
| Email | Resend API | `CLIENTHUB_RESEND_API_KEY` in GCP Secret Manager | Configured |

**GCP details:**
- Project: `agentflow-456021`
- Region: `us-central1`
- Middleware image: `us-central1-docker.pkg.dev/agentflow-456021/agentflow-repo/clienthub-api:phase1.5`
- Secrets: `CLIENTHUB_DATABASE_URL`, `CLIENTHUB_PORTAL_TOKEN_SECRET`, `CLIENTHUB_RESEND_API_KEY`
- Resend API key: stored in GCP Secret Manager (sourced from existing AgentFlow Resend account)

**Commit:** `67a0fc6` — 23 files changed, pushed to `origin/main`

**Test suite:** 120 tests across 7 files (portal-verification.test.ts: 19 tests, portal-contacts.test.ts: 14 tests)

### Smoke Test Checklist (PENDING)

Browser smoke test not yet performed. Steps to verify:

1. **Staff: set up email access on a hub**
   - Log in at `https://www.goagentflow.com/clienthub/` with Microsoft (Azure AD)
   - Open an existing hub (or create one)
   - Navigate to Client Portal section
   - Add a portal contact (use a real email address you can receive at)
   - Set access method to "Email verification"
   - Verify the UI shows the contact in the list

2. **Client: email verification flow**
   - Open the hub's portal link: `https://www.goagentflow.com/clienthub/portal/<hubId>`
   - Should see "Enter your email" (not password field)
   - Enter the authorised email → should see "Code sent" message
   - Check email inbox for 6-digit code from `noreply@goagentflow.com`
   - Enter the code → portal should open with full access

3. **Client: device remember-me**
   - Close browser tab
   - Reopen the same portal link
   - Portal should open immediately (device token in localStorage, 90-day expiry)

4. **Negative tests**
   - Enter an unauthorised email → should say "sent" but no code arrives
   - Enter wrong code 5 times → should be locked out
   - Remove the contact in staff view → client's device token should stop working

5. **Backwards compatibility**
   - Any existing password-protected hub → should still show password gate
   - Any open hub → should auto-unlock as before

**Note on Resend domain:** Emails come from the Resend account's configured sender. If `goagentflow.com` is not verified in Resend, emails may go to spam or use Resend's default domain. Check the Resend dashboard to confirm domain verification status.
