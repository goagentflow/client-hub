# AgentFlow Client Hub v0.1 (Phase 6 — Messages MVP Feed)

Read these files for full project context:
- .cursorrules — Project context, scope, brand guidelines, code patterns
- GOLDEN_RULES.md — Coding standards
- AGENTS.md — Development canon: Simple, Clean, DRY, Secure
- docs/Vision_and_Assumptions.md — Product vision and middleware assumptions (historical/vision)
- docs/PHASE_2_CLIENT_HUBS.md — Phase 2 Client Hubs specification (historical goal-state)
- docs/API_SPECIFICATION.md — Historical aspirational API contract draft
- docs/CURRENT_STATE.md — Canonical live vs aspirational status

For middleware development:
- docs/PRODUCTION_ROADMAP.md — **Current architecture and implementation plan** (v5.5, includes messages feed)
- docs/PHASE_1_DOCUMENT_UPLOAD_SUPABASE_PLAN.md — Phase 1 MVP file upload/download plan (Supabase Storage fast path) — **IMPLEMENTED**
- docs/PHASE_1_5_EMAIL_VERIFICATION_PLAN.md — Email verification design (implemented, deployed, smoke-tested)
- docs/middleware/MSAL_AUTH_IMPLEMENTATION_PLAN.md — Auth design (approved by senior dev)
- ~~docs/middleware/ARCHITECTURE_V3_FINAL.md~~ — Moved to `docs/archive/`
- ~~docs/middleware/ARCHITECTURE_DECISIONS.md~~ — Moved to `docs/archive/`
- ~~docs/middleware/PRD_MVP_SUMMARY.md~~ — Moved to `docs/archive/`

Follow .cursorrules for all development on this project.
Follow AGENTS.md canon: **Simple, Clean, DRY, Secure**.

## Current Scope

**Frontend:** Phase 2 complete (Pitch Hubs + Client Hubs wireframes).

**MVP Deployment:** LIVE on Google Cloud Run + Supabase PostgreSQL + Azure AD auth. See "MVP Deployment" section in `docs/PRODUCTION_ROADMAP.md`. Production target remains full Azure (Phase 0a).

**Phase 1.5 (Portal Email Verification):** DEPLOYED and smoke-tested. See `docs/PHASE_1_5_EMAIL_VERIFICATION_PLAN.md`.

**Phase 2a (Portal Invite Endpoints):** DEPLOYED — browser test pending. Staff can invite clients by email, clients receive invite email with portal link, land on EmailGate to verify.

**Phase 2b (Status Updates):** DEPLOYED. Staff create fortnightly status updates via dialog UI, clients view them on the portal. Append-only data model enforced at DB level with triggers. Two input methods: staff UI + direct SQL via Claude Code.

**Phase 1 (Document Upload/Download):** DEPLOYED and smoke-tested. Document upload via Supabase Storage (private bucket, signed URLs, 50MB limit). Staff + portal download. Delete cleans up storage. See `docs/PHASE_1_DOCUMENT_UPLOAD_SUPABASE_PLAN.md`.

**Middleware:** Phase 0b + Phase 1 + Phase 1.5 + Phase 2a + Phase 2b complete:
- Prisma 6 ORM (replaced Supabase JS client)
- `AUTH_MODE` + `DATA_BACKEND` config (replaced `DEMO_MODE`)
- TenantRepository + AdminRepository pattern for tenant isolation
- All routes migrated to injected Prisma repository
- Cloud Run Dockerfiles (middleware + frontend) — multi-stage, non-root, reviewed
- Portal email verification (Phase 1.5) — public + staff endpoints, Resend email, device tokens
- Portal invite endpoints (Phase 2a) — POST/GET/DELETE invites with email, domain validation, cascade revoke
- Status updates (Phase 2b) — append-only fortnightly updates, staff POST + GET, portal GET with field redaction, raw SQL migration with triggers
- Document upload/download (Phase 1) — Supabase Storage private bucket, multer upload, signed URL download, storage cleanup on delete
- Messages (Phase 6 MVP) — flat feed, staff GET/POST + portal GET/POST, Resend notifications, verified-email requirement for portal posting
- Endpoint accounting note: roadmap contract inventory is 115 endpoints (56 real, 59 placeholders); 11 additional non-contract real endpoints tracked separately

**Hub Types:**
- Pitch Hubs: Prospecting/new business (proposal, videos, questionnaire)
- Client Hubs: Active client relationships (projects, health, expansion)

**Key Features Implemented:**
- Hub conversion (pitch → client)
- Projects with milestones
- Document upload/download (Supabase Storage, signed URLs)
- Fortnightly status updates (append-only, staff + portal views)
- Portal access management (password/email/open modes)
- Portal contacts + invite workflows
- Leadership portfolio summary views (portfolio + clients)

**Not yet implemented end-to-end (placeholder backend and/or "Coming Soon" portal UI):**
- Relationship health and expansion intelligence
- Client intelligence (instant answers, decision queue, performance, history, risk alerts)
- Meetings integrations
- Threaded message features (thread detail/notes/update endpoints)
- Most questionnaire operations

**Architecture:**
- React Query for data fetching with polling patterns
- Async job pattern for AI endpoints (POST creates job → GET polls)
- 24-hour stale data threshold with refresh capability
- RBAC with RequireAdmin guard for leadership views

## Key Files

**Middleware config & data:**
- `middleware/src/config/env.ts` — AUTH_MODE, DATA_BACKEND, RESEND_API_KEY, SUPABASE_URL/KEY, production guards
- `middleware/prisma/schema.prisma` — Database schema (Hub, HubEvent, HubInvite, HubStatusUpdate, HubMessage, PortalContact, PortalVerification, PortalDevice)
- `middleware/src/db/` — Prisma client, TenantRepository, AdminRepository, hub mapper, portal-verification-queries

**Middleware auth:**
- `middleware/src/middleware/auth.ts` — Azure AD JWT + portal JWT (with email/name claims) + demo headers
- `middleware/src/middleware/hub-access.ts` — Hub access verification
- `middleware/src/middleware/inject-repository.ts` — Repository injection based on DATA_BACKEND

**Middleware routes:**
- `middleware/src/routes/portal-verification.route.ts` — Public endpoints (access-method, request-code, verify-code, verify-device)
- `middleware/src/routes/portal-contacts.route.ts` — Staff endpoints (contacts CRUD, access method management)
- `middleware/src/routes/members.route.ts` — Staff invite endpoints (POST/GET/DELETE) + 5 remaining 501 stubs
- `middleware/src/routes/messages.route.ts` — Staff message feed (GET/POST live) + thread endpoints still 501
- `middleware/src/routes/portal.route.ts` — Portal message feed (GET/POST live) + other portal placeholders
- `middleware/src/routes/status-updates.route.ts` — Staff-only POST + GET for fortnightly status updates
- `middleware/src/services/message-queries.ts` — Shared message feed query helper/mappers
- `middleware/src/services/status-update-queries.ts` — Shared query helper + portal field mapper
- `middleware/src/services/email.service.ts` — Resend transactional email (verification codes, invites, message notifications)
- `middleware/src/services/storage.service.ts` — Supabase Storage wrapper (upload, signed URL download, delete)
- `middleware/src/middleware/upload.ts` — Multer upload config (50MB, MIME + extension allowlist)
- `middleware/prisma/sql/001_hub_status_update.sql` — Raw SQL migration (table, composite FK, CHECK constraints, append-only triggers)
- `middleware/prisma/sql/002_hub_message.sql` — Raw SQL migration (message feed table + composite FK + body constraints)

**Docker (Cloud Run deployment):**
- `middleware/Dockerfile` — Multi-stage middleware build (Node 20, pnpm, Prisma, tsup, non-root)
- `Dockerfile` (root) — Multi-stage frontend build (Vite + nginx-unprivileged, PORT envsubst)
- `nginx.conf.template` — SPA routing with `${PORT}` for Cloud Run
- `cloudbuild-middleware.yaml` — Cloud Build pipeline for middleware (includes RESEND_API_KEY + Supabase secrets)

**Frontend:**
- `src/services/api.ts` — API client (has setTokenGetter pattern)
- `src/services/auth.service.ts` — MSAL login, token acquisition
- `src/services/message.service.ts` — Legacy thread compatibility + live feed service calls
- `src/hooks/use-messages.ts` — Feed hooks (`useFeedMessages`, `usePortalFeedMessages`, send mutations)
- `src/components/messages/MessageFeed.tsx` — Shared feed UI (loading/error/empty/send states)
- `src/components/EmailGate.tsx` — Client email verification UI
- `src/components/client-portal/PortalContactsCard.tsx` — Staff contact management UI
- `src/pages/PortalDetail.tsx` — Portal landing page (routes to correct gate based on access method)
- `src/types/member.ts` — HubInvite type (no token field, has message field)

## Mandatory Review Process

After completing each implementation phase:

1. Generate a summary of what you've done, which files you've created or changed, and what you've changed in those files
2. IMMEDIATELY invoke the senior-reviewer subagent to review your work
3. DO NOT proceed to the next phase until the senior-reviewer returns "APPROVED"
4. If the review returns "NEEDS REVISION", address all issues raised, then invoke senior-reviewer again
5. Repeat until approved

## Review Process Behaviour

When you invoke senior-reviewer:
1. SHOW ME the full review output - do not summarise or paraphrase it
2. WAIT for my instruction before taking any action
3. Do not automatically start fixing issues - I need to review the feedback first
This review loop is non-negotiable. Every phase must pass review before the next begins.

## Supabase RLS — Security Hardening (applied 2026-02-25)

All Client Hub tables now have Row Level Security (RLS) enabled. This was applied from the `agentflow-insight-pulse` repo via migration `041_client_hub_rls.sql`. The full plan is at `~/Desktop/agentflow-insight-pulse/docs/supabase-security-hardening-plan.md`.

### Impact on this repo

- **Prisma middleware is unaffected** — it connects directly to Postgres, bypassing RLS entirely.
- **Frontend reads via anon key** work for `hub`, `hub_video`, `hub_document` (they have explicit anon SELECT policies).
- **All other tables are blocked for anon** — `hub_invite`, `hub_status_update`, `portal_contact`, `portal_verification`, `portal_device`, `tenant`, `hub_event`, `hub_project`, `hub_milestone` only allow `service_role` access via PostgREST.

### If you add a new table

1. Always enable RLS: `ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;`
2. Add a service_role policy: `CREATE POLICY "service_all_new_table" ON public.new_table FOR ALL TO service_role USING (true) WITH CHECK (true);`
3. If the frontend needs to read it via anon key, add an anon SELECT policy too.
4. Add the migration to `~/Desktop/agentflow-insight-pulse/supabase/migrations/` (that repo owns all Supabase migrations).

### If something breaks

- **Middleware returns data but frontend doesn't** → The table is missing an anon SELECT policy.
- **`verify_hub_password` RPC fails** → Function was recreated with `SET search_path = public`. Canonical version is in `agentflow-insight-pulse/supabase/migrations/041_client_hub_rls.sql`.
- **`prevent_status_update_mutation` behaves differently** → Function was recreated with `SET search_path = public`. Body and trigger behaviour are unchanged.

### Tables and RLS status

| Table | Anon SELECT | Service Role ALL | Access Path |
|-------|------------|-----------------|-------------|
| `hub` | Yes | Yes | Frontend + Middleware |
| `hub_video` | Yes | Yes | Frontend + Middleware |
| `hub_document` | Yes | Yes | Frontend + Middleware |
| `hub_event` | No | Yes | Middleware only |
| `hub_project` | No | Yes | Middleware only |
| `hub_milestone` | No | Yes | Middleware only |
| `hub_invite` | No | Yes | Middleware only |
| `hub_status_update` | No | Yes | Middleware only |
| `portal_contact` | No | Yes | Middleware only |
| `portal_verification` | No | Yes | Middleware only |
| `portal_device` | No | Yes | Middleware only |
| `tenant` | No | Yes | Middleware only |
