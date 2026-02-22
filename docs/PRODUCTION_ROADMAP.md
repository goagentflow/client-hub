# AgentFlow Pitch Hub — Production Roadmap v4.6

**Date:** 22 Feb 2026
**Author:** Hamish Nicklin / Claude Code
**Status:** v4.6 — Dockerfiles added for Cloud Run deployment
**Audience:** Senior developer reviewing for feasibility and sequencing

---

## Architecture Decision: Azure-Hosted (supersedes prior docs)

**Decision:** Host all infrastructure in AgentFlow's own Azure subscription.

**This supersedes:**
- `docs/archive/ARCHITECTURE_V3_FINAL.md` (customer-hosted Azure + SharePoint lists)
- `docs/archive/ARCHITECTURE_DECISIONS.md` (self-hosted in customer Azure)

**Rationale for change:**
- Original architecture assumed enterprise SaaS with per-customer Azure deployments — premature for current stage
- AgentFlow needs to ship a working product for real clients now, not build a multi-tenant deployment platform
- Azure-hosted (target state) gives DPA compliance under a single Microsoft agreement
- Migration to customer-hosted Azure or SharePoint-backed storage remains possible later (adapter pattern preserved)

**Data residency and compliance (MVP vs target state):**

| Concern | MVP (Cloud Run + Supabase) | Target (Azure, Phase 0a) |
|---------|---------------------------|--------------------------|
| Database hosting | Supabase (AWS US region) | Azure Database for PostgreSQL (EU region) |
| File storage | OneDrive links (Microsoft-hosted) | Azure Blob Storage (EU region) |
| Auth | Azure AD (Microsoft-hosted) | Azure AD (Microsoft-hosted) |
| Middleware hosting | Google Cloud Run | Azure App Service (EU region) |
| DPA coverage | Supabase DPA + Google Cloud DPA | Microsoft DPA (single agreement) |
| GDPR position | Hub metadata in Supabase; no PII beyond hub names and contact emails. Right to deletion enforced. Acceptable for MVP scale. | All data in EU Azure region under Microsoft DPA. Full GDPR posture. |

**MVP compliance note:** The MVP stores hub metadata (hub names, project names, activity logs) in Supabase PostgreSQL. No sensitive client documents are stored — documents are shared as OneDrive links, which remain in Microsoft's infrastructure. For the MVP's single-client scope, this is acceptable. The migration to Azure PostgreSQL (EU region, Microsoft DPA) happens before scaling to additional clients.

**Production stack:**

| Component | Azure Service | Notes |
|-----------|--------------|-------|
| Middleware (Node.js) | Azure App Service (Linux, B1 tier) | Auto-restart, deployment slots for zero-downtime |
| Frontend (React) | Azure Static Web Apps | Free tier, global CDN, custom domain + HTTPS |
| Database | Azure Database for PostgreSQL (Flexible Server) | Burstable B1ms tier, EU region, automated backups |
| File storage | Azure Blob Storage | Private container, no public access |
| Auth | Azure AD (existing) | Already implemented |
| Logs | Azure Monitor + Log Analytics | Native integration, no third-party needed |
| DNS | Azure DNS or existing provider | Custom domains for hub + API |

**Cost estimate at launch scale (<50 users):** ~£30-50/month (App Service B1 + PostgreSQL B1ms + Blob storage).

**What changes in the codebase:**
- Supabase JS client → PostgreSQL client (`pg` or Prisma) for database queries
- Supabase Storage → Azure Blob Storage SDK (`@azure/storage-blob`) for file operations
- Supabase adapter becomes a PostgreSQL adapter (same interface, different implementation)
- No frontend changes required (API contract unchanged)

---

## MVP Deployment (Pre-Phase 0a)

**Status:** Deploying now (February 2026). Dockerfiles created and reviewed.

**Business driver:** A real pharma comms client is starting a project now. Rather than waiting for the full Azure infrastructure (Phase 0a, ~£30-50/month), we're deploying an MVP using infrastructure AgentFlow already pays for — near-zero additional cost.

**MVP architecture:**

| Component | Service | Notes |
|-----------|---------|-------|
| Frontend (React) | Google Cloud Run | Added to existing goagentflow.com deployment (alongside marketing site, /assess/, /discovery/) |
| Middleware (Node.js) | Google Cloud Run | Separate service, free tier at low usage |
| Database | Supabase PostgreSQL | Existing paid instance — Prisma connects directly to Supabase's PostgreSQL |
| Documents | OneDrive links | No file uploads for MVP — staff share OneDrive links within hubs |
| Auth (staff) | Azure AD | `AUTH_MODE=azure_ad` with `NODE_ENV=production` — same MSAL auth as the full plan |
| Auth (portal) | Portal JWT | Password-protected portal access works as-is |

**Containerisation (complete):**

Both services have multi-stage Dockerfiles optimised for Cloud Run:

| File | Purpose |
|------|---------|
| `middleware/Dockerfile` | Node 20 + pnpm + Prisma generate + tsup build → non-root runtime (uid 1001) |
| `middleware/.dockerignore` | Excludes node_modules, dist, .env, tests |
| `Dockerfile` (root) | Vite build with `VITE_*` build args → `nginxinc/nginx-unprivileged` runtime |
| `.dockerignore` (root) | Excludes node_modules, dist, middleware/, .env |
| `nginx.conf.template` (root) | SPA routing, gzip, `${PORT}` substitution via envsubst at startup |

Build commands:
```bash
# Middleware
docker build -t pitchhub-middleware ./middleware

# Frontend (pass VITE_* args at build time)
docker build -t pitchhub-frontend \
  --build-arg VITE_API_BASE_URL=https://api.goagentflow.com \
  --build-arg VITE_AZURE_CLIENT_ID=<client-id> \
  --build-arg VITE_AZURE_TENANT_ID=<tenant-id> \
  --build-arg VITE_AZURE_BACKEND_CLIENT_ID=<backend-client-id> \
  .
```

Key design decisions:
- **Mock API disabled by default** — `ARG VITE_USE_MOCK_API=false` ensures production builds use real middleware
- **Cloud Run PORT compliance** — nginx uses `${PORT}` template (default 8080); middleware reads `process.env.PORT` (default 3001)
- **Non-root containers** — middleware runs as `appuser:1001`, frontend uses `nginx-unprivileged` (uid 101)
- **Prisma client preserved** — generated `.prisma/client/` explicitly saved before `pnpm prune --prod` to prevent engine binary loss
- **Layer caching** — lockfile + package.json copied before source for efficient rebuilds

**Auth:** Staff authenticate via Azure AD (Microsoft login), using the MSAL auth code already built and approved. This is the same auth that the full Azure deployment uses — no throwaway work. The Azure AD app registration must be configured before MVP goes live (see "What Hamish Needs to Do" below).

**Cost:** ~£0-10/month new spend (Cloud Run free tier at low usage).

**What this unlocks:**
- Hub management (create, edit, overview, notes, activity)
- Projects with milestones
- Document links (OneDrive URLs, not file uploads)
- Video sharing (external links)
- Portal access for clients (password-protected)
- All 46 currently-implemented endpoints

**What MVP does NOT include:**
- File uploads (no Azure Blob Storage — Phase 1)
- Email integration (no Graph API — Phase 6)
- Meetings integration (no Graph API — Phase 7)
- AI features (no AI provider — Phase 8)

**How MVP connects to the long-term plan:**

This is a stepping stone, not a detour. Everything built for MVP is forward-compatible:

1. **Database:** Prisma ORM works with any PostgreSQL. Migration from Supabase PG to Azure PG is a config change (`DATABASE_URL` in environment variables). No code changes needed.
2. **Middleware:** Same Express/TypeScript codebase deploys to Cloud Run now and Azure App Service later. No code changes needed.
3. **Frontend:** Same React build. Swap the hosting platform, not the code.
4. **Schema:** Same Prisma schema, same TenantRepository pattern. Works identically on both databases.

**Migration path (Supabase → Azure PostgreSQL):**

When ready to move beyond MVP, Phase 0a creates Azure services and we migrate the database:

1. **Snapshot:** Export Supabase database using `pg_dump` (full schema + data)
2. **Provision:** Create Azure Database for PostgreSQL (Flexible Server, B1ms, EU region)
3. **Import:** Restore the dump to Azure PG using `pg_restore`
4. **Verify:** Run `prisma db pull` against Azure PG to confirm schema matches. Run full test suite against new database.
5. **Switch:** Update `DATABASE_URL` in Cloud Run (or Azure App Service) environment to point at Azure PG
6. **Validate:** Smoke test all endpoints. Verify hub data is accessible.
7. **Rollback criteria:** If any endpoint fails or data is missing, revert `DATABASE_URL` to Supabase. Supabase remains read-only during cutover as a safety net.
8. **Downtime:** Brief (<5 minutes) during the `DATABASE_URL` switch. Schedule during low-usage window.
9. **Cleanup:** Once Azure PG is confirmed stable (24-48 hours), decommission the Supabase schema (keep the Supabase instance for other AgentFlow uses).

The `DATA_BACKEND` config stays as `azure_pg` throughout — it means "real PostgreSQL via Prisma", not a specific host.

### MVP Readiness Gate

The MVP cannot go live until ALL of these pass:

| Check | Criteria | Owner | Status |
|-------|----------|-------|--------|
| Route migration | All route handlers use injected Prisma repository | Dev | **DONE** (v4.5) |
| Dockerfiles | Multi-stage Docker builds for middleware + frontend, Cloud Run PORT compliance, non-root, reviewed | Dev | **DONE** (v4.6) |
| Health endpoint | `GET /health` returns 200 when DB reachable, 503 when DB unreachable. `/health/ready` checks DB. `/health/live` confirms process is running. | Dev | **DONE** (v4.6) |
| HTTPS enforced | Cloud Run service accessible only via HTTPS | Infra | |
| Azure AD login | Staff can sign in via Microsoft and access hub management | Dev | |
| Portal access | Client can access portal via password-protected link | Dev | |
| Database connected | Prisma schema pushed to Supabase PG, hub CRUD works end-to-end | Dev | |
| Secrets management | `DATABASE_URL`, `PORTAL_TOKEN_SECRET`, Azure AD config in Cloud Run environment variables (not in code) | Dev | |
| TRUST_PROXY | `TRUST_PROXY=true` set in Cloud Run env vars — required for correct `req.ip` behind Google's load balancer (rate limiting, logging) | Infra | |
| Security headers | Helmet defaults: CSP, HSTS, X-Frame-Options, X-Content-Type-Options | Dev | |
| CORS locked | `CORS_ORIGIN` set to exact production domain (no wildcards) | Dev | |
| Rate limiting | Rate-limit on auth and public endpoints (already configured) | Dev | |
| All tests pass | `pnpm test` passes (84+ tests across 5+ files) | Dev | |
| Clean build | Fresh `pnpm build` with no stale dist artefacts | Dev | |

**Not required for MVP** (required for full Azure deployment in Phase 0a):
- Deployment slots / staging environment
- Azure Monitor + Log Analytics
- Backup/restore testing (Supabase has automated backups)
- Rollback runbook (Cloud Run revisions provide instant rollback)

---

## Objective

Ship the AgentFlow Pitch Hub as a production application for use with real clients. This means:

1. Deploy to a public URL with HTTPS (MVP: Google Cloud Run; Production: Azure App Service)
2. Connect to PostgreSQL (MVP: Supabase; Production: Azure Database for PostgreSQL)
3. Implement all 67 remaining 501-stubbed endpoints
4. Integrate Microsoft Graph API for email and calendar features
5. Add AI-powered client intelligence features

---

## Assumptions

| Assumption | Value | Impact |
|-----------|-------|--------|
| Tenancy at launch | Single-tenant, tenant guards enforced | One Azure AD tenant, one database. `tenant_id` column + TenantRepository guard on all hub-linked tables from Phase 0b. Hard launch requirement. |
| Compliance (MVP) | GDPR-aware, minimal PII | Hub metadata in Supabase (US region). No sensitive documents stored (OneDrive links only). Right to deletion enforced. Acceptable for single-client MVP. See compliance table above. |
| Compliance (target) | GDPR/DPA-compliant | All data in Azure EU region. Microsoft DPA covers infrastructure. Right to deletion enforced. No unnecessary PII sent to AI. |
| Scale | Small (<50 users, <100 hubs) | Single App Service instance. No distributed cache needed at launch. |
| Multi-tenant expansion | Designed for, not tested at launch | Schema supports multiple tenants. Multi-tenant onboarding (provisioning, billing, tenant admin UI) is post-launch scope. |

---

## Endpoint Inventory (Source of Truth)

Audited by reading every handler registration in `middleware/src/routes/*.ts` — counting `router.get/post/patch/delete/put` calls and classifying each as real (has logic) or 501 stub (returns 501/send501).

**Integrity rule:** This table MUST be re-verified before each phase ships. A CI check (`npm run verify-endpoints`) counts `send501`/`res.status(501)` in route files and fails if this table drifts from the codebase. The CI check is a Phase 0b deliverable (required before Phase 1 execution, not required for MVP go-live).

| Route File | Real | 501 Stub | Total | Notes |
|-----------|------|----------|-------|-------|
| auth.route.ts | 1 | 0 | 1 | GET /me |
| hubs.route.ts | 9 | 0 | 9 | Full CRUD + overview/notes/activity/publish/portal-preview |
| documents.route.ts | 5 | 2 | 7 | Upload + engagement stubbed |
| proposals.route.ts | 3 | 2 | 5 | Upload + engagement stubbed |
| videos.route.ts | 6 | 2 | 8 | Upload + engagement stubbed |
| projects.route.ts | 8 | 0 | 8 | Fully implemented (incl. milestones) |
| portal.route.ts | 3 | 7 | 10 | GET videos/documents/proposal real; comment, messages, meetings, members, invite, questionnaires stubbed |
| portal-config.route.ts | 2 | 0 | 2 | Fully implemented |
| events.route.ts | 3 | 0 | 3 | Fully implemented (incl. leadership event) |
| public.route.ts | 3 | 1 | 4 | Invite accept stubbed |
| messages.route.ts | 0 | 5 | 5 | All 501 (Graph Mail) |
| meetings.route.ts | 0 | 9 | 9 | All 501 (Graph Calendar + Teams) |
| members.route.ts | 0 | 8 | 8 | All 501 (4 member + 3 invite + 1 share-link). Invite-accept lives in public.route.ts. |
| questionnaires.route.ts | 0 | 6 | 6 | All 501 |
| client-intelligence.route.ts | 0 | 18 | 18 | All 501 (answers 3, prep 4, performance 3, decisions 5, history 1, alerts 2) |
| intelligence.route.ts | 0 | 3 | 3 | All 501 (relationship health + expansion) |
| leadership.route.ts | 2 | 3 | 5 | Portfolio/clients real; at-risk/expansion/refresh stubbed |
| conversion.route.ts | 1 | 1 | 2 | POST convert real; POST rollback stubbed |
| **TOTAL** | **46** | **67** | **113** | **41% real, 59% stubbed** |

**Corrections from v3:** projects (8 not 9), documents (5/2/7 not 5/3/8), videos (6/2/8 not 6/3/9), portal (3/7/10 not 3/5/8), meetings (0/9/9 not 0/10/10), members (0/8/8 not 0/11/11 — dead `acceptInviteRouter` deleted, live version in public.route.ts), questionnaires (0/6/6 not 0/7/7). Net: 67 stubs to implement (was 72 in v3).

**Stub-to-phase assignment** (every stub accounted for):

| Phase | Route file stubs owned | Count |
|-------|----------------------|-------|
| Phase 1 (Files) | documents:upload, proposals:upload, videos:upload | 3 |
| Phase 2 (Members) | members:all 8, portal:members+invite, public:invite-accept | 11 |
| Phase 3 (Questionnaires) | questionnaires:all 6, portal:questionnaires | 7 |
| Phase 4 (Engagement) | documents:engagement, proposals:engagement, videos:engagement, leadership:at-risk+expansion+refresh | 6 |
| Phase 6 (Messages) | messages:all 5, portal:messages(GET+POST) | 7 |
| Phase 7 (Meetings) | meetings:all 9, portal:meetings | 10 |
| Phase 8 (AI) | client-intelligence:all 18, intelligence:all 3 | 21 |
| Phase 9 (Intelligence) | (uses intelligence.route.ts endpoints — counted in Phase 8) | 0 |
| Phase 10 (Polish) | conversion:rollback, portal:proposal/comment | 2 |
| **TOTAL** | | **67** |

---

## Configuration Model

Two orthogonal controls replace the original `DEMO_MODE` boolean:

| Variable | Values | Purpose |
|----------|--------|---------|
| `AUTH_MODE` | `azure_ad` / `demo` | Controls whether real JWT validation or X-Dev-User-Email headers are used |
| `DATA_BACKEND` | `azure_pg` | All data access via Prisma ORM against PostgreSQL |

`DATABASE_URL` is always required. For local dev, point it at a local PostgreSQL instance or Supabase hosted PG. Tests mock at the repository layer and do not require a running database.

**Production guardrail:**

| NODE_ENV | AUTH_MODE | Allowed? |
|----------|-----------|----------|
| production | azure_ad | **Yes** (production config) |
| production | demo | **BLOCKED** — demo auth not allowed in production |
| development | demo | Yes (default dev config) |
| development | azure_ad | Yes (real auth testing) |

**Phase 0b status:** Configuration model implemented. All routes use Prisma via TenantRepository. The previous `DATA_BACKEND=mock` mode (backed by Supabase JS adapter) was removed when route migration completed — the Supabase adapter is retained only for reference but is no longer called by any route handler.

---

## Tenant Isolation Architecture

**Chosen model: Service-role with centralised tenant guards + DB constraints.**

The middleware uses a service-role connection to PostgreSQL (full access). Tenant isolation is enforced at the application layer via a centralised repository pattern, reinforced by database-level constraints.

**Application layer:**
- A centralised `TenantRepository` wrapper adds `WHERE tenant_id = :tenantId` to every query — no direct database calls outside this wrapper
- `tenant_id` is extracted from `req.user.tenantId` (set by auth middleware) — never from client input
- Admin/leadership queries that aggregate across tenants use a separate `AdminRepository` with explicit `bypassTenant: true` flag, logged on every call

**Database layer (defence in depth):**
- `tenant_id NOT NULL` constraint on all hub-linked tables
- `FOREIGN KEY` on `tenant_id` referencing a `tenant` table (prevents orphaned tenant IDs)
- Unique constraints include `tenant_id` where applicable (e.g. `UNIQUE(tenant_id, hub_slug)`)
- Database-level function: `verify_tenant_access(tenant_id, expected_tenant_id)` — callable from triggers or as a query-time assertion for critical operations

**Security invariant:** No table access without tenant guard abstraction. Any database query that touches hub-linked data MUST go through `TenantRepository`. Direct database calls outside the repository layer are a CI lint failure.

**Mandatory security tests (per phase):**
- Negative test: User A cannot read User B's hub data (cross-tenant denial at repository layer)
- Negative test: Portal token for Hub X cannot access Hub Y data
- Negative test: Client user cannot access staff-only endpoints
- Negative test: Direct database query without tenant guard is rejected (lint/grep check)
- These tests run in CI — phase cannot ship without passing

**Launch posture:** App-layer isolation is the enforced boundary. DB constraints provide defence in depth. Full RLS or row-level DB policies deferred to multi-tenant expansion phase.

---

## Production Readiness Gate

Phase 0a (full Azure deployment) cannot ship until ALL of these pass:

### Hard Pass/Fail Checks

| Check | Criteria | Owner |
|-------|----------|-------|
| HTTPS enforced | All endpoints accessible only via HTTPS (App Service enforces) | Infra |
| Secrets management | All secrets in Azure App Service Application Settings, not in code or .env files | Dev |
| Error monitoring | Pino logs shipped to Azure Monitor / Log Analytics | Dev |
| Health endpoint | `GET /health` returns 200 when DB reachable, 503 when DB unreachable | Dev |
| Backup/restore | Azure PostgreSQL daily backups enabled; manual restore tested once | Hamish |
| Rollback runbook | Document: how to swap deployment slots to revert in <5 minutes | Dev |
| Security headers | Helmet defaults: CSP, HSTS, X-Frame-Options, X-Content-Type-Options | Dev |
| Rate limiting | Express rate-limit on auth and public endpoints (already configured) | Dev |
| CORS locked | `CORS_ORIGIN` set to exact production domain (no wildcards) | Dev |
| Dependency audit | `npm audit` with zero critical/high vulnerabilities | CI |
| Secret rotation | `PORTAL_TOKEN_SECRET` is production-grade (32+ chars, no dev- prefix) | Dev |
| Endpoint inventory CI | `npm run verify-endpoints` passes — roadmap matches codebase | CI |
| Staging environment | Staging App Service + staging DB snapshot deployed and accessible | Dev |

### Schema Migration Gate (per phase, not just Phase 0)

| Check | Criteria | Owner |
|-------|----------|-------|
| Migration dry-run | Every schema migration tested against staging DB snapshot before production | Dev |
| Roll-forward script | Migration script runs idempotently (safe to re-run) | Dev |
| Rollback script | Reverse migration tested and documented for each schema change | Dev |
| No destructive migration | `DROP TABLE`, `DROP COLUMN`, or data-deleting migrations require a backup checkpoint before execution. Backup verified restorable. | Dev |

### Alerting (Minimum Viable)

| Alert | Condition | Channel |
|-------|-----------|---------|
| API down | Health check fails for >2 minutes | Email to Hamish |
| Error spike | >10 5xx errors in 5 minutes | Email to Hamish |
| Auth failures | >20 401s in 5 minutes (brute force indicator) | Email to Hamish |

### On-Call

At launch scale (<50 users), Hamish is the escalation point. No 24/7 on-call required. App Service auto-restarts on crash. Deployment slots enable instant rollback.

---

## Release Strategy

| Control | Policy |
|---------|--------|
| Feature flags | Each phase ships behind a feature flag (env var). Enable per-phase after smoke test on staging. |
| Rollback window | 24 hours after each phase enable. If issues found, swap deployment slot to roll back immediately. |
| Canary | Not needed at launch scale. Single instance serves all traffic. |
| Compatibility | Backward-compatible for one release window. Schema/API changes follow: (1) additive change ships first, (2) frontend migrates to new API, (3) old API removed in next release behind feature flag. Coordinated deploys allowed when unavoidable but must be documented in the phase plan. |
| CI gating | **Minimum CI gate (Phases 0-9):** Unit tests + integration tests + endpoint inventory check + lint. **Full CI gate (Phase 10+):** All of the above + Playwright E2E against real API. Playwright E2E is built in Phase 10 and becomes mandatory for all subsequent deploys. |

---

## Phased Roadmap

### Phase 0: Deploy to Azure (0a: infrastructure, 0b: codebase refactor)

**Objective:** Get the existing working app on a public URL with HTTPS, passing all production readiness checks.

**What's built:**

Phase 0a — Infrastructure (DEFERRED — MVP deployed on Google Cloud Run + Supabase in the interim):
- **Status:** Resource group `rg-agentflow-hub` created in UK South. All other Azure resources deferred. MVP is live on Google Cloud Run + Supabase PostgreSQL (see "MVP Deployment" section above). Full Azure deployment happens when scaling beyond MVP.
- Azure App Service (middleware) with deployment slots (staging + production)
- Azure Static Web Apps (frontend) with custom domain
- Azure Database for PostgreSQL (Flexible Server, Burstable B1ms) with schema migration
- Azure Blob Storage (private container for future file uploads)
- Azure Monitor + Log Analytics for logging and alerting
- Custom domains (e.g. `hub.goagentflow.com` + `api.goagentflow.com`)
- Azure AD redirect URIs updated for production domain
- Staging environment: staging App Service slot + staging DB snapshot

Phase 0b — Codebase refactor (COMPLETE):
- Replace Supabase JS client with PostgreSQL client (`pg` or Prisma) ✓
- Replace `DEMO_MODE` with `AUTH_MODE` + `DATA_BACKEND` config model ✓
- Rewrite `env.ts` validation to match new truth table ✓
- Rewrite `supabase.adapter.ts` production guard (→ `pg.adapter.ts`) ✓
- Implement `TenantRepository` wrapper with tenant guard abstraction ✓
- Implement `AdminRepository` with `bypassTenant` logging ✓
- All routes migrated to injected Prisma repository ✓
- Cloud Run Dockerfiles for middleware + frontend (multi-stage, non-root, reviewed) ✓
- Health endpoint with DB connectivity check (200/503) ✓
- Build `npm run verify-endpoints` CI check (deferred — not required for MVP go-live, required before Phase 1)
- Rollback runbook (deferred — Cloud Run revisions provide instant rollback for MVP)

**Success criteria:**
- All production readiness gate checks pass (table above)
- App accessible at public URL with HTTPS
- Azure AD login works end-to-end (existing flow, no changes)
- Portal access works (password-protected)
- CI deploys automatically on merge to main
- Staging environment accessible with seeded test data
- Rollback tested: deployment slot swap reverts in <2 minutes
- Endpoint inventory CI check passes

**Dependencies:** Azure subscription access, Azure AD app registration complete, DNS access

**Complexity:** High (~7-8 days — increased from v3 to account for Supabase→PostgreSQL migration, staging setup, and TenantRepository)

---

### Phase 1: File Storage — Document & Proposal Upload

**Objective:** Staff can upload real documents and proposals to hubs.

**What's built:**
- Azure Blob Storage container (`hub-files`) with folder structure: `{tenant_id}/{hub_id}/{type}/`
- `POST /hubs/:hubId/documents` — multipart upload to Blob Storage
- `POST /hubs/:hubId/proposal` — same pattern for proposals
- `POST /hubs/:hubId/videos` — video file upload
- Backend download proxy endpoint (auth-checked, streams from Blob Storage)
- File deletion cleans up both DB row and stored blob
- 50MB file size limit enforced at middleware level

**Content security controls:**
- MIME type allowlist: PDF, DOCX, XLSX, PPTX, PNG, JPG, MP4 (no executables, no HTML, no SVG)
- File extension must match MIME type (reject mismatches)
- Filename sanitisation (strip path traversal, special characters)
- Storage path includes `tenant_id` prefix (isolation)
- AV scanning: uploaded files go to a `quarantine/` prefix first. A post-upload Azure Function (or ClamAV sidecar) scans the file. Only files that pass scanning are moved to `approved/` prefix. Files that fail are deleted and the upload is marked as rejected.
- Fail-closed: files in `quarantine/` are never served to users. Download proxy only streams from `approved/`.

**File download approach:**
- Backend download proxy: `GET /api/v1/hubs/:hubId/documents/:docId/download`
- Middleware verifies auth + hub access on every download request, then streams from Blob Storage
- No direct storage URLs exposed to the client
- Every download is auth-checked — no link-leakage risk

**Success criteria:**
- Staff uploads documents/proposals through the UI
- Files download via authenticated proxy endpoint (not direct storage URLs)
- Deleting removes both DB record and stored blob
- Rejected: .exe, .html, .svg, .js, MIME/extension mismatch
- Files in quarantine are not downloadable
- AV-rejected files return clear error message
- Unauthenticated download attempts return 401
- Cross-hub file access denied (negative test)

**Stub endpoints resolved:** documents:upload (1), proposals:upload (1), videos:upload (1) = **3 stubs**

**Dependencies:** Phase 0a, Azure Blob Storage configured

**Complexity:** Medium-high (~5-6 days, increased for AV scanning pipeline)

---

### Phase 2: Members & Access Management

**Objective:** Staff can invite client contacts to view their hub. Runs alongside (not replacing) password portal access during migration.

**Client authentication — magic link:**
- Staff invites a client by email address → system generates a time-limited magic link token
- Client clicks the link → middleware validates token, issues a short-lived session JWT (type: `member`, 7-day expiry)
- Session JWT is stored in a cookie with full security attributes:
  - `HttpOnly` — not accessible to JavaScript (XSS protection)
  - `Secure` — only sent over HTTPS
  - `SameSite=Lax` — CSRF protection for GET requests; state-changing routes (POST/PATCH/DELETE) additionally require a CSRF token in the `X-CSRF-Token` header (double-submit cookie pattern)
  - `Path=/api/v1` — scoped to API routes only
- Session fixation prevention: on magic link redemption, any existing session cookie is invalidated before issuing a new one
- Token lifecycle:
  - Magic link token: single-use, expires after 15 minutes
  - Session JWT: 7 days, refresh on activity, revocable by staff
  - Replay prevention: each magic link token has a unique `jti` claim, marked as used on first redemption
  - Revocation: staff can revoke a member's access, which invalidates all active sessions (revocation list checked on each request)
- Audit: every magic link generation, redemption, and session creation is logged in `hub_event`

**Invite delivery:**
- Invite emails sent via Microsoft Graph Mail (OBO) if Phase 5 is complete, OR via transactional email provider (Resend/Postmark) as fallback
- Fallback: if no email provider configured, invite URL is displayed in-app for staff to copy and send manually
- This means Phase 2 has a soft dependency on Phase 5 (OBO) OR requires a transactional email API key

**Portal migration plan:**
- **Dual-run period:** Both password access and member-based magic link access work simultaneously
- **Feature flag:** `MEMBER_ACCESS_ENABLED=true` enables the new member system
- **No breaking change:** Password portal continues to work throughout migration
- **Migration path:** Once member system is proven, password access can be deprecated (separate decision, not in this phase)
- **Rollback:** Disable feature flag. Password access is unaffected.

**What's built:**
- New tables: `hub_member`, `hub_invite`, `hub_session` (all with `tenant_id`)
- 8 endpoints in members.route.ts: list, activity, update, delete members; list, create, revoke invites; share link
- Plus 2 portal stubs: portal:members, portal:invite
- Plus 1 public stub: public:invite-accept (the live invite-accept handler)
- Domain restriction (invites only to `client_domain` or `goagentflow.com`)
- Hub access middleware updated to check member session (alongside existing password check)

**Success criteria:**
- Staff invites client contacts by email
- Client receives magic link and gains hub access after clicking
- Magic links are single-use and expire after 15 minutes
- Sessions expire after 7 days of inactivity
- Staff can revoke access (immediate effect)
- Invites are domain-restricted (server-side enforcement)
- Password portal still works (dual-run)
- Cross-hub member access denied (negative test)
- Replayed magic link tokens rejected (negative test)

**Stub endpoints resolved:** members:all 8, portal:members+invite (2), public:invite-accept (1) = **11 stubs**

**Dependencies:** Phase 0a. Soft dependency on Phase 5 (OBO) or transactional email API key.

**Complexity:** Medium-high (~6-7 days, increased for magic link auth implementation)

---

### Phase 3: Questionnaires

**Objective:** Staff can create questionnaires; clients can fill them in and submit responses.

**What's built:**
- New tables: `hub_questionnaire`, `hub_questionnaire_response` (JSONB for flexibility, with `tenant_id`)
- 6 endpoints in questionnaires.route.ts: list, get, create, update, delete, get responses
- 1 endpoint in portal.route.ts: portal questionnaire view/submit
- Portal-facing questionnaire view and submit

**Success criteria:**
- Staff creates/edits questionnaires
- Clients fill in and submit via portal
- Staff views aggregated responses
- Cross-hub questionnaire access denied (negative test)

**Stub endpoints resolved:** questionnaires:all 6, portal:questionnaires (1) = **7 stubs**

**Dependencies:** Phase 0

**Complexity:** Medium (~4-5 days)

---

### Phase 4: Engagement Analytics

**Objective:** Staff can see who viewed what and when. Leadership dashboard shows portfolio-wide insights.

**What's built:**
- Document engagement endpoint (aggregates from `hub_event`)
- Proposal engagement endpoint
- Video engagement endpoint
- Hub-level engagement summary (total views, unique visitors)
- Leadership: at-risk clients (no activity in 14+ days)
- Leadership: expansion candidates (high engagement volume)
- Leadership: refresh (recalculate metrics)

**Measurable acceptance criteria:**
- Engagement query latency: p95 < 500ms for hubs with <10,000 events
- Data freshness: engagement data reflects events within 60 seconds of logging
- At-risk detection: flags 100% of hubs with zero events in 14+ days (no false negatives)
- False positive ceiling for expansion: <30% of flagged hubs should be irrelevant (validated by Hamish manual review of first 20 flags)

**Stub endpoints resolved:** documents:engagement (1), proposals:engagement (1), videos:engagement (1), leadership:at-risk+expansion+refresh (3) = **6 stubs**

**Dependencies:** Phase 0a. Enhanced by Phase 2 (member identity enriches engagement data, but portal-level identity works without it — not a hard blocker)

**Complexity:** Low-medium (~3-4 days)

---

### Phase 5: OBO Token Flow (Graph API Foundation)

**Objective:** Enable the middleware to call Microsoft Graph API on behalf of the signed-in user. This is infrastructure — it unlocks Messages and Meetings.

**What's built:**
- OBO token exchange using `@azure/msal-node` (already in package.json)
- Graph client factory using `@microsoft/microsoft-graph-client` (already in package.json)
- `AZURE_CLIENT_SECRET` added to env config (required when `AUTH_MODE=azure_ad`)

**Token caching strategy:**
- At launch scale (single instance, <50 users): in-memory cache keyed by user OID + requested scopes
- Tokens cached until 5 minutes before expiry
- Tokens are NOT persisted — server restart clears cache and tokens are re-acquired on demand (acceptable at launch scale)
- Cache miss: acquire new token via OBO exchange with retry + exponential backoff (max 3 retries)
- CAE (Continuous Access Evaluation) handling: if Graph returns 401 with `claims` challenge, clear cached token and re-acquire with the claims parameter
- **Multi-instance note:** If/when scaling to multiple instances, replace in-memory cache with Redis. The cache interface is abstracted to make this a config change, not a code rewrite.

**Success criteria:**
- OBO exchange works: user token in, Graph token out
- Graph client can call `GET /me` successfully
- Token caching prevents redundant exchanges (verified by log inspection)
- CAE claims challenge triggers re-acquisition (unit test)
- Error handling: consent not granted returns clear error message to frontend

**Dependencies:** Phase 0a, Azure AD app needs Graph API permissions + admin consent + client secret

**Complexity:** Medium (~3-4 days)

---

### Phase 6: Messages (Graph Mail)

**Objective:** Staff can view and send hub-related emails through the app.

**Hub scoping — explicit linkage, not heuristics:**
- New table: `hub_message_thread` (`id`, `hub_id`, `graph_conversation_id`, `linked_by`, `linked_at`, `tenant_id`)
- Messages are scoped to a hub via explicit linked thread IDs, NOT by email/domain matching
- Staff explicitly links a conversation to a hub (or the system auto-links when sending from within a hub context)
- Listing messages: `SELECT graph_conversation_id FROM hub_message_thread WHERE hub_id = :hubId AND tenant_id = :tenantId`
- This eliminates the risk of data leakage between hubs that share contacts or domains

**What's built:**
- 5 endpoints in messages.route.ts: list threads, get thread, send message, notes, status update
- 2 endpoints in portal.route.ts: portal messages GET + POST
- Explicit hub-to-thread linkage table
- Internal notes stored in database (never sent to clients)
- Emails sent FROM the user's own mailbox via OBO

**Success criteria:**
- Staff views only explicitly linked email threads for a hub
- Staff sends emails from the app (appears in their Sent folder, auto-linked to hub)
- Internal notes attached to threads
- Cross-hub thread access denied (negative test: thread linked to Hub A not visible in Hub B)

**Stub endpoints resolved:** messages:all 5, portal:messages GET+POST (2) = **7 stubs**

**Dependencies:** Phase 5 (OBO), Azure AD `Mail.Read` + `Mail.Send` permissions

**Complexity:** Medium-high (~5-6 days)

---

### Phase 7: Meetings (Graph Calendar + Teams)

**Objective:** Staff can schedule, manage, and track meetings related to a hub.

**Hub scoping — explicit linkage, not heuristics:**
- New table: `hub_meeting` (`id`, `hub_id`, `graph_event_id`, `agenda`, `notes`, `linked_by`, `linked_at`, `tenant_id`)
- Meetings are scoped to a hub via explicit linked event IDs
- When staff creates a meeting from within a hub, it's auto-linked
- Staff can also manually link existing calendar events to a hub

**What's built:**
- 9 endpoints in meetings.route.ts: list, get, create, update, cancel (delete), agenda, notes, recording, transcript
- 1 endpoint in portal.route.ts: portal meetings GET
- Meeting creation generates Teams meeting link via Graph
- Agenda and notes stored in database (augments Graph Calendar data)
- Explicit hub-to-meeting linkage

**Success criteria:**
- Staff schedules meetings with Teams links
- Meetings appear on their Outlook calendar
- Agendas, notes, recordings, and transcripts accessible
- Cross-hub meeting access denied (negative test)

**Stub endpoints resolved:** meetings:all 9, portal:meetings (1) = **10 stubs**

**Dependencies:** Phase 5 (OBO), Azure AD `Calendars.ReadWrite` + `OnlineMeetings.ReadWrite` permissions

**Complexity:** High (~6-7 days)

---

### Phase 8: Client Intelligence (AI)

**Objective:** AI-powered features that differentiate AgentFlow — instant answers, meeting prep, performance narratives, decision tracking, risk alerts.

**Architecture:**
- AI provider called server-side only (API key in middleware env, never on frontend)
- Async job pattern: POST creates job → GET polls for result
- New tables: `hub_ai_job`, `hub_decision`, `hub_decision_history`, `hub_risk_alert` (all with `tenant_id`)
- DB indexes: `hub_ai_job(hub_id, created_at)`, `hub_decision(hub_id, status)` for query performance

**AI governance and safety controls:**

| Control | Implementation |
|---------|---------------|
| PII redaction | Strip email addresses, phone numbers, and names from AI context before sending. Use hub/project IDs instead of names where possible. |
| Prompt injection defence | System prompt is hardcoded server-side. User input is passed as a separate `user` message, never interpolated into the system prompt. Input length capped at 2,000 chars. |
| Model pinning | Pin to a specific model version (e.g. `claude-sonnet-4-6-20250514`). No auto-upgrades. Version changes require explicit config update + regression test. |
| Moderation | AI responses are checked for refusal/error patterns before storing. Failed generations stored with `status: 'failed'` and a safe error message. |
| Fallback on failure | If AI call fails after 3 retries, return `status: 'failed'` with message "Unable to generate — please try again later". Never expose raw API errors to frontend. |
| Rate limiting | Max 30 AI requests per user per hour, per feature type (prevents abuse while allowing normal workflow). |
| Audit trail | Every AI job logged in `hub_ai_job` with input hash, model version, token count, latency. |
| Incident debugging | Redacted prompt/response snippets (PII-stripped, first 500 chars) stored in `hub_ai_job` with 14-day auto-expiry. Encrypted at rest (Azure column encryption or Key Vault). Access to snippet columns requires admin role and is itself audit-logged. |
| Full debug mode | `AI_DEBUG_MODE` stores full raw prompts/responses. Requires: (1) explicit approval logged in audit trail with approver identity, (2) time-bound activation via signed token (max 24 hours, auto-expires), (3) enable/disable events written to immutable audit log. Cannot be enabled via env var alone. |
| GDPR | Right to deletion: deleting a hub cascades to all AI jobs (including snippets). No AI provider data retention (use API, not fine-tuning). 14-day snippet expiry enforced by scheduled Azure Function. |

**Batch 8a — Instant Answers + Performance:**
- 6 endpoints: submit question, get answer, recent answers, generate narrative, get narrative, latest
- AI context: hub data, projects, events, engagement history

**Batch 8b — Meeting Prep + Follow-up:**
- 4 endpoints: generate prep, get prep, generate follow-up, get follow-up
- AI context: meeting agenda/notes, recent hub activity, previous meetings

**Batch 8c — Decisions + History + Risk Alerts:**
- 8 endpoints: decision CRUD (state machine), institutional memory, risk alerts
- Decision queue is primarily CRUD; risk alerts use AI for signal detection

**Also resolves:** intelligence.route.ts (3 stubs for relationship health + expansion) — these are the data endpoints that feed Phase 9's UI. Implemented here as part of the AI batch.

**Measurable acceptance criteria:**
- AI response latency: p95 < 15 seconds (async job, not blocking)
- Instant answer relevance: >70% rated "useful" by Hamish in first 20 test queries
- Risk alert false positive ceiling: <40% of alerts are irrelevant (validated by manual review)
- Performance narrative accuracy: covers all active projects and recent engagement (spot-checked against real hub data)
- Error budget: <5% of AI jobs fail after retries

**Stub endpoints resolved:** client-intelligence:all 18, intelligence:all 3 = **21 stubs**

**Dependencies:** Phase 4 (engagement data), Phase 7 (meetings), AI provider API key

**Complexity:** High (~8-10 days across 3 batches)

---

### Phase 9: Relationship Intelligence + Leadership Completion

**Objective:** Health dashboard, expansion radar, and complete leadership portfolio UI.

**What's built:**
- Frontend components for relationship health score (0-100) per client hub — uses intelligence.route.ts endpoints built in Phase 8
- Expansion radar UI (upsell/cross-sell signal display)
- Leadership at-risk and expansion views (aggregated across hubs)
- No new backend stubs — this phase is frontend + integration of Phase 8 endpoints

**Measurable acceptance criteria:**
- Health score latency: p95 < 1 second per hub
- Health score correlation: score of 0-30 should correspond to hubs with declining engagement (validated against event data)
- Expansion radar precision: >50% of flagged opportunities are actionable (Hamish validates first 10)

**Stub endpoints resolved:** 0 (all backend stubs resolved in Phase 8)

**Dependencies:** Phase 4 (engagement), Phase 8 (AI)

**Complexity:** Medium (~4-5 days)

---

### Phase 10: Conversion Rollback + End-to-End Polish

**Objective:** Zero 501 stubs remaining. Full Playwright E2E test coverage against real API.

**What's built:**
- Hub conversion rollback endpoint
- Portal proposal comment endpoint
- Playwright E2E tests against real API (becomes mandatory CI gate for all future deploys)
- Error handling audit
- Query performance review + indexing

**Success criteria:**
- Zero 501 stubs remaining (verified by `npm run verify-endpoints`)
- All Playwright tests pass against real API
- Consistent error responses across all endpoints
- Tenant isolation negative tests pass for every hub-scoped endpoint

**Stub endpoints resolved:** conversion:rollback (1), portal:proposal/comment (1) = **2 stubs**

**Dependencies:** All above

**Complexity:** Low-medium (~3-4 days)

---

## Summary Timeline

| Phase | Name | Est. Duration | Blocked By | Track |
|-------|------|--------------|------------|-------|
| MVP | Cloud Run + Supabase deployment | 1-2 days | Phase 0b | MVP |
| 0b | Codebase Refactor (PG migration, config, TenantRepo, Dockerfiles) | 4-5 days | Nothing (COMPLETE) | MVP |
| 0a | Azure Infrastructure + Staging | 3-4 days | Nothing (deferred) | Azure cutover |
| 1 | File Storage (Upload + AV Scanning) | 5-6 days | Phase 0a | Azure cutover |
| 2 | Members & Access (Magic Link + Dual-Run) | 6-7 days | Phase 0a | Azure cutover |
| 3 | Questionnaires | 4-5 days | Phase 0a | Azure cutover |
| 4 | Engagement Analytics | 3-4 days | Phase 0a | Azure cutover |
| 5 | OBO Token Flow | 3-4 days | Phase 0a | Azure cutover |
| 6 | Messages (Explicit Linkage) | 5-6 days | Phase 5 | Azure cutover |
| 7 | Meetings (Explicit Linkage) | 6-7 days | Phase 5 | Azure cutover |
| 8 | Client Intelligence (AI + Governance) | 8-10 days | Phase 4, 7 | Azure cutover |
| 9 | Relationship Intelligence (Frontend) | 4-5 days | Phase 8 | Azure cutover |
| 10 | Polish + Zero 501s + E2E | 3-4 days | All above | Azure cutover |

**Total: ~15-16 weeks sequential, ~11-12 weeks with parallelisation**

**Two tracks:** MVP track (0b → MVP deployment) is independent of the Azure cutover track (0a → Phase 1+). Phase 0b is complete. MVP deployment is the current focus — Azure AD app registration, Cloud Run service creation, and environment variable configuration are the remaining blockers (see "What Hamish Needs to Do"). Phases 1+ require Phase 0a (Azure infrastructure). Phases 1, 2, 3, 4, 5 can run in parallel after Phase 0a. Phases 6 + 7 can partially overlap after Phase 5.

**Conditional dependencies in timeline:**
- Phase 2 has a soft dependency on Phase 5 (OBO for invite emails) OR a transactional email API key. If neither is available, invites are manual copy-paste only.
- Phase 4 is enhanced by Phase 2 (member identity enriches engagement data) but works without it (portal-level identity is sufficient).

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting (target) | AgentFlow's own Azure subscription | DPA compliance under single Microsoft agreement. All data in EU Azure region. MVP uses Cloud Run + Supabase (see MVP section). |
| Database (target) | Azure Database for PostgreSQL | Managed PostgreSQL, automated backups, EU region. MVP uses Supabase PostgreSQL (same Prisma schema). |
| File storage | Azure Blob Storage | Same Azure subscription, private container, AV scanning via Azure Function |
| AI provider | Server-side only (Claude/OpenAI) | API key stays in middleware; async job pattern handles latency |
| Graph API auth | OBO (On-Behalf-Of) | Emails sent from user's mailbox; proper audit trail |
| Config model | `AUTH_MODE` + `DATA_BACKEND` (orthogonal) | Prevents insecure auth/data combinations |
| Hub scoping (Graph) | Explicit linkage tables | Eliminates email/domain heuristic data leakage risk |
| Tenant isolation | Service-role + TenantRepository + DB constraints | App-layer guards + DB NOT NULL/FK defence in depth |
| Client auth | Magic link (email-based sessions) | Simple UX for external clients, no Microsoft account required |
| AI safety | PII redaction, prompt isolation, model pinning, signed debug toggle | GDPR-aware, no data leakage to provider |

---

## What Hamish Needs to Do (Non-Developer Tasks)

### For MVP (before go-live)
1. **Azure AD app registration** — Ensure the existing app registration has the correct redirect URIs for the Cloud Run domain (e.g. `https://hub.goagentflow.com`)
2. **Azure AD environment variables** — Provide `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and the JWKS endpoint for the Cloud Run middleware deployment
3. **Cloud Run service setup** — Create the middleware Cloud Run service (or delegate to developer)
4. **Supabase connection string** — Provide `DATABASE_URL` for the existing Supabase PostgreSQL instance
5. **DNS** — Point chosen subdomain at the Cloud Run middleware service
6. **Cloud Run environment variables** — Set all required env vars on the middleware service (see MVP Readiness Gate table). **Critical:** `TRUST_PROXY=true` must be set — Cloud Run sits behind Google's load balancer, and without it `req.ip` resolves to the load balancer IP, making rate limiting throttle all users as one.

### For full Azure deployment (Phase 0a, when scaling)
7. **Azure subscription** — Ensure an Azure subscription is available with sufficient quota
8. **Azure AD permissions** — Grant admin consent for Graph API scopes when Phase 5 begins
9. **Azure AD client secret** — Generate one for the backend app registration (Phase 5)
10. **DNS** — Point chosen domain at Azure services
11. **AI provider** — Choose Claude API or OpenAI and create an API key (Phase 8)
12. **Transactional email** — Choose Resend or Postmark and create API key, OR rely on OBO email (Phase 2)

---

## Resolved Questions

| Question | Decision |
|----------|----------|
| Hosting platform | AgentFlow's own Azure (App Service + Static Web Apps + PostgreSQL + Blob Storage) |
| Architecture docs | v4 supersedes ARCHITECTURE_V3_FINAL.md and ARCHITECTURE_DECISIONS.md |
| Config model | `AUTH_MODE` + `DATA_BACKEND` (orthogonal controls) |
| Graph scoping | Explicit linkage tables, not email/domain heuristics |
| AI provider | Defer choice to Phase 8. Interface is provider-agnostic. |
| File storage limits | 50MB per file. Per-hub quota deferred to post-launch. |
| Client authentication | Magic link (email-based), session JWT in httpOnly cookie |
| Tenant isolation at launch | App-layer (TenantRepository) + DB constraints. Full RLS deferred. |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1 | 21 Feb 2026 | Initial draft |
| v2 | 21 Feb 2026 | Addressed 12 senior dev findings: production readiness gate, tenant isolation, explicit Graph scoping, orthogonal config, endpoint inventory, invite delivery, OBO cache, content security, AI governance, measurable acceptance criteria, portal migration, release strategy |
| v3 | 21 Feb 2026 | Addressed 7 findings: corrected endpoint inventory (47/72/119), TenantRepository pattern, tenancy contradiction resolved, backend download proxy, relaxed compatibility rule, schema migration gate, AI incident debugging |
| v4 | 21 Feb 2026 | Addressed 8 findings: (1) resolved architecture conflict — Azure-hosted, supersedes ARCHITECTURE_V3_FINAL + ARCHITECTURE_DECISIONS; (2) re-audited endpoint inventory — 46 real / 68 stub / 114 total, added stub-to-phase assignment ensuring all 68 accounted for; (3) added DB-level tenant constraints (NOT NULL, FK, verify function) alongside app-layer guards; (4) specified magic link auth for client members (token lifecycle, replay prevention, revocation, audit); (5) added AV scanning + quarantine for file uploads; (6) split CI gating into minimum (unit+integration) and full (+ Playwright E2E from Phase 10); (7) added staging environment as explicit Phase 0 deliverable; (8) tightened AI debug mode — requires signed approval token, immutable audit log, cannot enable via env var alone |
| v4.1 | 22 Feb 2026 | Addressed 4 findings from v4 review: (1) BLOCKER resolved — updated AGENTS.md canon to match Azure-hosted architecture, superseded old docs with deprecation banners, updated CLAUDE.md references; (2) added full cookie security (Secure, SameSite=Lax, CSRF double-submit, session fixation prevention) to magic link auth; (3) deleted dead `acceptInviteRouter` from members.route.ts, corrected inventory to 46/67/113; (4) stale route file comments noted for Phase 0b cleanup |
| v4.2 | 22 Feb 2026 | Added "MVP Deployment (Pre-Phase 0a)" section — Google Cloud Run + Supabase PostgreSQL for first client. Updated Phase 0a status. Long-term Azure plan unchanged. |
| v4.3 | 22 Feb 2026 | Senior dev review round 1: (1) MVP uses Azure AD auth (not demo mode); (2) compliance narrative split MVP vs target-state; (3) Supabase→Azure migration runbook; (4) MVP readiness gate (11 checks); (5) phase dependency table fixed (MVP track vs Azure cutover); (6) verify-endpoints timing clarified; (7) test counts updated; (8) clean build requirement. |
| v4.4 | 22 Feb 2026 | Senior dev review round 2: (1) route migration completion added as go-live blocker in MVP readiness gate — unmigrated routes crash in production PG mode; (2) normalised "Phase 0" → "Phase 0a" in timeline table and STATUS.md; (3) key decisions table marked hosting/database rows as "(target)" with MVP cross-reference. |
| v4.5 | 22 Feb 2026 | Phase 0b sub-phase 4 (route migration) complete: all 9 route files migrated from Supabase adapter to Prisma TenantRepository. `DATA_BACKEND=mock` removed — `azure_pg` is now the only backend, `DATABASE_URL` always required. New Prisma-native mappers in `db/`. Public routes use direct Prisma queries. 3 rounds of external senior dev review, all findings addressed. |
| v4.6 | 22 Feb 2026 | Cloud Run Dockerfiles + production readiness: (1) middleware multi-stage Dockerfile (Node 20 + pnpm + Prisma generate + tsup → non-root runtime); (2) frontend multi-stage Dockerfile (Vite build with VITE_* build args → nginx-unprivileged with PORT envsubst); (3) VITE_USE_MOCK_API=false default ensures production builds use real middleware; (4) Prisma generated client preserved across pnpm prune --prod; (5) nginx.conf.template with ${PORT} for Cloud Run compliance; (6) health endpoint rewritten with DB connectivity check (200/503); (7) health endpoint tests added (5 tests — 89 total across 6 files); (8) TRUST_PROXY added to MVP readiness gate and operator checklist; (9) readiness gate table reformatted with Status column. 3 rounds of senior dev review, all findings addressed. |
