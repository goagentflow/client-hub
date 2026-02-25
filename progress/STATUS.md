# AgentFlow Client Hub — Project Status

**Last Updated:** 25 February 2026

> **Note:** This file is an implementation log.  
> For canonical "what is live vs aspirational" status, read `docs/CURRENT_STATE.md` first.

---

## What is AgentFlow Client Hub?

AgentFlow Client Hub is a client relationship portal built on Microsoft 365. It enables professional services firms to manage pitches (new business) and client relationships (active accounts) through a single web application. AgentFlow is building this as its own tool first — eating our own dog food — before selling it to other firms.

---

## Architecture

```
Frontend (React/Vite/TypeScript)
  ├── Azure AD login via MSAL.js (code-complete)
  ├── Portal access via JWT tokens (password, email verification, or open mode)
  └── All data fetched through middleware API

Middleware (Express/TypeScript) — contract inventory 115 endpoints (53 real, 62 stubbed)
  ├── Additional live non-contract endpoints: 11 (portal contacts/access-method + public email verification + document download)
  ├── Auth: Azure AD JWT (RS256 via jose) + portal JWT (HS256) + demo headers
  ├── Config: AUTH_MODE (azure_ad | demo) + DATA_BACKEND (azure_pg)
  ├── Database: Prisma 6 ORM (PostgreSQL via DATABASE_URL)
  ├── File storage: Supabase Storage (private bucket, signed URLs)
  ├── Tenant isolation: TenantRepository + AdminRepository pattern
  └── 171 tests passing across 12 test files

MVP Deployment (Live — first client)
  ├── Google Cloud Run (frontend, alongside goagentflow.com)
  ├── Google Cloud Run (middleware API, separate service)
  ├── Supabase PostgreSQL (existing instance, Prisma ORM)
  ├── Azure AD authentication (staff login via Microsoft)
  ├── Supabase Storage (document upload/download, private bucket, signed URLs)
  └── OneDrive links for legacy document sharing

Production Target (Future — Phase 0a)
  ├── Azure App Service (middleware)
  ├── Azure Static Web Apps (frontend)
  ├── Azure Database for PostgreSQL (Flexible Server)
  ├── Azure Blob Storage (file uploads)
  └── Azure Monitor + Log Analytics
```

---

## Phase 0b Implementation Log

Phase 0b is the codebase refactor preparing for deployment. MVP is deploying on Google Cloud Run + Supabase PostgreSQL for the first client. Phase 0a (full Azure infrastructure) is deferred until scaling beyond MVP.

### Sub-phase 1: Prisma Migration (APPROVED)

Replaced Supabase JS client with Prisma 6 ORM.

**Files created:**
- `middleware/prisma/schema.prisma` — Database schema (Hub, HubEvent, HubNote models)
- `middleware/src/db/prisma.ts` — Prisma client singleton
- `middleware/src/db/tenant-repository.ts` — Tenant-scoped query wrapper
- `middleware/src/db/admin-repository.ts` — Admin queries with bypassTenant logging
- `middleware/src/db/hub.mapper.ts` — Prisma-to-DTO mapping
- `middleware/src/db/index.ts` — Barrel export

**Files changed:**
- `middleware/package.json` — Added prisma, @prisma/client dependencies
- `middleware/pnpm-lock.yaml` — Lock file updated

**Review:** Senior dev approved after 1 round.

### Sub-phase 2: Configuration Model (APPROVED)

Replaced `DEMO_MODE` boolean with orthogonal `AUTH_MODE` + `DATA_BACKEND` controls.

**Files changed:**
- `middleware/src/config/env.ts` — New config schema with production guards
- `middleware/.env.example` — Updated example env vars

**Review:** Senior dev approved after 1 round.

### Sub-phase 3: Inject Repository Middleware (APPROVED)

Created middleware to inject the correct data repository based on `DATA_BACKEND` config.

**Files created:**
- `middleware/src/middleware/inject-repository.ts` — Repository injection middleware
- `middleware/src/__tests__/repository.test.ts` — Repository integration tests

**Files changed:**
- `middleware/src/middleware/index.ts` — Added inject-repository export
- `middleware/src/adapters/supabase.adapter.ts` — Updated for new config model
- `middleware/src/middleware/auth.ts` — Updated guards for AUTH_MODE
- `middleware/src/middleware/hub-access.ts` — Updated for new config
- `middleware/src/app.ts` — Wired inject-repository middleware
- `middleware/src/server.ts` — Updated startup logging
- `middleware/src/__tests__/test-setup.ts` — Updated test helpers

**Review:** Senior dev approved after 1 round.

### Sub-phase 4: Route Migration (COMPLETE)

Migrated all route handlers from Supabase adapter to injected Prisma repository (`req.repo` / `req.adminRepo`). Removed `DATA_BACKEND=mock` option — all routes now require PostgreSQL via Prisma.

**Files created:**
- `middleware/src/db/video.mapper.ts` — Prisma HubVideo → VideoDTO
- `middleware/src/db/document.mapper.ts` — Prisma HubDocument → DocumentDTO/ProposalDTO
- `middleware/src/db/project.mapper.ts` — Prisma HubProject/HubMilestone → ProjectDTO/MilestoneDTO
- `middleware/src/db/event.mapper.ts` — Prisma HubEvent → EventDTO/LeadershipEventDTO
- `middleware/src/db/public-queries.ts` — Direct Prisma queries for unauthenticated routes
- `middleware/src/db/hub-select.ts` — Shared HUB_SELECT constant (excludes passwordHash)

**Files changed:**
- `middleware/src/routes/events.route.ts` — Migrated to req.repo
- `middleware/src/routes/proposals.route.ts` — Migrated to req.repo
- `middleware/src/routes/leadership.route.ts` — Migrated to req.adminRepo
- `middleware/src/routes/projects.route.ts` — Migrated to req.repo
- `middleware/src/routes/conversion.route.ts` — Migrated to req.repo
- `middleware/src/routes/documents.route.ts` — Migrated to req.repo
- `middleware/src/routes/videos.route.ts` — Migrated to req.repo
- `middleware/src/routes/portal.route.ts` — Migrated to req.repo
- `middleware/src/routes/public.route.ts` — Migrated to public-queries.ts
- `middleware/src/db/tenant-repository.ts` — Added deleteMany/updateMany
- `middleware/src/db/admin-repository.ts` — Added deleteMany/updateMany
- `middleware/src/db/prisma.ts` — Removed DATA_BACKEND guard
- `middleware/src/middleware/inject-repository.ts` — Removed DATA_BACKEND guard, always injects repo
- `middleware/src/config/env.ts` — Removed mock from DATA_BACKEND, DATABASE_URL required

**Review:** 2 rounds of external senior dev review. All findings addressed.

### Phase 2b: Status Updates (COMPLETE)

Append-only fortnightly status updates for client hubs. Staff create updates via dialog UI, clients view them on the portal. Two input methods: staff UI and direct SQL via Claude Code.

**Files created:**
- `middleware/prisma/sql/001_hub_status_update.sql` — Raw SQL migration (table, composite FK, CHECK constraints, append-only triggers)
- `middleware/src/routes/status-updates.route.ts` — Staff-only POST + GET with input validation
- `middleware/src/services/status-update-queries.ts` — Shared query helper + portal field mapper
- `middleware/src/__tests__/status-updates.test.ts` — 15 contract tests
- `src/components/status-updates/CreateStatusUpdateDialog.tsx` — Staff creation form
- `src/components/client-hub-overview/StatusUpdateCard.tsx` — Portal card with load-more pagination
- `src/components/ClientHubOverviewPage.tsx` — Extracted for file-length compliance
- `src/components/overview/QuickStatCard.tsx` — Reusable stat card
- `src/hooks/use-status-updates.ts` — React Query hooks (staff + portal + mutation)
- `src/services/status-update.service.ts` — API service (staff + portal + mock)

**Files changed:**
- `middleware/prisma/schema.prisma` — Added HubStatusUpdate model
- `middleware/src/db/tenant-repository.ts` — Added hubStatusUpdate to TenantRepository
- `middleware/src/routes/index.ts` — Mounted statusUpdatesRouter
- `middleware/src/routes/portal.route.ts` — Added portal GET /status-updates
- `middleware/src/__tests__/test-setup.ts` — Added hubStatusUpdate mock
- `middleware/src/__tests__/contract.test.ts` — Removed moved tests
- `middleware/package.json` — Added db:migrate:sql and db:migrate:all scripts
- `src/types/hub.ts` — Added StatusUpdate, OnTrackStatus, CreateStatusUpdateRequest types
- `src/types/index.ts`, `src/hooks/index.ts`, `src/services/index.ts` — Barrel exports
- `src/components/client-hub-overview/ClientHubOverview.tsx` — Added StatusUpdateCard
- `src/components/client-hub-overview/index.ts` — Export StatusUpdateCard
- `src/components/ClientHubOverviewSection.tsx` — Added "Add Status Update" button
- `src/components/OverviewSection.tsx` — Extracted ClientHubOverviewPage

**Review:** 3 rounds internal (senior-reviewer agent) + 2 rounds external review. All findings addressed.

### Phase 1: Document Upload/Download via Supabase Storage (COMPLETE)

Document upload and download using Supabase Storage as an interim fast-path (to be replaced by Azure Blob Storage or SharePoint/Graph API in Phase 5+).

**Files created:**
- `middleware/src/services/storage.service.ts` — Supabase Storage wrapper (upload, signed URL, delete)
- `middleware/src/middleware/upload.ts` — Multer memory storage config (50MB limit, MIME + extension allowlist)
- `middleware/src/__tests__/document-upload.test.ts` — 13 upload/download/portal/delete tests
- `docs/PHASE_1_DOCUMENT_UPLOAD_SUPABASE_PLAN.md` — Implementation plan
- `src/components/ui/ComingSoonPlaceholder.tsx` — Reusable placeholder for stub sections

**Files changed:**
- `middleware/src/config/env.ts` — Added optional SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
- `middleware/src/routes/documents.route.ts` — Replaced POST 501 stub with real upload, added download route, added storage cleanup on delete
- `middleware/src/routes/portal.route.ts` — Added portal download route, portal-aware proposal mapping
- `middleware/src/db/document.mapper.ts` — Download URLs point to middleware endpoints (not raw storage), safeDownloadUrl helper
- `middleware/src/middleware/error-handler.ts` — Multer error handling
- `middleware/src/__tests__/test-setup.ts` — vi.hoisted() refactor for ESM/CJS mock identity fix
- `middleware/src/__tests__/status-updates.test.ts` — ESM import fix for mockAdminRepo
- `middleware/src/__tests__/contract.test.ts` — Removed POST documents from 501 expectations
- `middleware/package.json` — Added multer + @types/multer
- `cloudbuild-middleware.yaml` — Added SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY secrets, bumped memory to 1Gi
- `src/services/document.service.ts` — Added downloadDocument() + getPortalDocuments()
- `src/components/ClientDocumentsSection.tsx` — Wired portal download button
- `src/components/documents/DocumentDetailPanel.tsx` — Wired staff download button
- `src/components/ClientHubLayout.tsx` — UI cleanup
- `src/components/client-hub-overview/ClientHubOverview.tsx` — Removed brochureware, added ComingSoonPlaceholder
- `src/pages/PortalDetail.tsx` — Portal routing cleanup

**Infrastructure:**
- Created `hub-documents` private bucket in Supabase (50MB file size limit)
- Created GCP secrets: `CLIENTHUB_SUPABASE_URL`, `CLIENTHUB_SUPABASE_SERVICE_ROLE_KEY`
- Granted `secretmanager.secretAccessor` to Compute Engine default SA
- Fixed Azure AD app registration (added self-referencing API scope + admin consent)

**Smoke test:** Upload PDF via staff UI, download via signed URL, delete — all passed on production.

**Review:** 2 rounds senior-reviewer agent. Approved.

---

## Complete Roadmap

| Phase | Name | Status | Summary |
|-------|------|--------|---------|
| MVP | Cloud Run + Supabase | **LIVE** | First client deployment on Google Cloud Run + Supabase PostgreSQL. Near-zero cost. Forward-compatible with full Azure plan. |
| 0a | Azure Infrastructure | **Deferred** | Resource group created (UK South). MVP deployed on Cloud Run + Supabase in the interim. Full Azure services created when scaling beyond MVP. |
| 0b | Codebase Refactor | **Complete** | Prisma migration, AUTH_MODE/DATA_BACKEND config, TenantRepository, route migration. All 4 sub-phases approved. |
| 1 | File Storage (Documents) | **Complete** | Document upload/download via Supabase Storage (private bucket, signed URLs, 50MB limit). Proposal + video upload deferred. 2 stubs remaining. |
| 1.5 | Portal Email Verification | **Complete** | Public + staff endpoints, Resend email, device tokens, EmailGate UI. |
| 2a | Portal Invite Endpoints | **Complete** | POST/GET/DELETE invites with email, domain validation, cascade revoke. |
| 2b | Status Updates | **Complete** | Append-only fortnightly updates. Staff POST/GET + portal GET. Raw SQL migration with triggers. |
| 2 | Members & Access | Not started | Magic link auth for client contacts, invite system, dual-run with password portal. 8 stubs remaining. |
| 3 | Questionnaires | Not started | Staff-created forms, client submission, response aggregation. 7 stubs. |
| 4 | Engagement Analytics | Not started | Document/video view tracking, leadership at-risk/expansion views. 6 stubs. |
| 5 | OBO Token Flow | Not started | On-Behalf-Of exchange enabling Graph API calls (email, calendar). 0 stubs (infrastructure). |
| 6 | Messages | Not started | Hub-scoped email threads via Graph Mail with explicit linkage. 7 stubs. Depends on Phase 5. |
| 7 | Meetings | Not started | Calendar + Teams integration via Graph with explicit linkage. 10 stubs. Depends on Phase 5. |
| 8 | Client Intelligence (AI) | Not started | Instant answers, meeting prep, performance narratives, decisions, risk alerts. 21 stubs. |
| 9 | Relationship Intelligence | Not started | Health dashboard, expansion radar — frontend integration of Phase 8 endpoints. 0 stubs. |
| 10 | Polish + E2E | Not started | Zero 501 stubs, Playwright E2E tests, conversion rollback. 2 stubs. |

**Total stubs remaining:** 62 of 115 endpoints (54%).

**Timeline:** ~15-16 weeks sequential, ~11-12 weeks with parallelisation. Phases 1-5 can run in parallel after Phase 0a (Azure infrastructure).

---

## Key Decisions & Rationale

| Decision | Choice | Why |
|----------|--------|-----|
| Hosting model | Azure-hosted (AgentFlow's own subscription) | Ships faster than per-customer deployment. DPA compliance under single Microsoft agreement. Migration to customer-hosted possible later via adapter pattern. |
| Database | Prisma 6 on Azure PostgreSQL | Prisma 7 has breaking driver adapter changes. Prisma 6 is stable and well-supported. |
| Config model | `AUTH_MODE` + `DATA_BACKEND` | `AUTH_MODE` controls authentication (azure_ad or demo). `DATA_BACKEND=azure_pg` — all routes use Prisma on PostgreSQL. |
| JWT validation | `jose` library for both portal (HS256) and Azure AD (RS256) | Single dependency, no `@azure/msal-node` needed for validation. |
| Staff detection | `roles` claim in Azure AD JWT | Mandatory deployment prerequisite — not optional. `requireStaffAccess` middleware enforces at router level. |
| MVP on Cloud Run + Supabase | Deploy to existing infrastructure for first client | Real client starting now. Near-zero cost using services already paid for. Prisma works with any PostgreSQL — migration to Azure PG is a config change. |
| Phase 0a deferred | Full Azure infrastructure provisioned when scaling | Saves ~£30-50/month. MVP serves first client in the interim. |
| Tenant isolation | TenantRepository (app layer) + DB constraints (defence in depth) | All hub-linked queries go through tenant-scoped wrapper. `tenant_id NOT NULL` + FK constraints in schema. |
| Client auth (future) | Magic link with session JWT in httpOnly cookie | Simple UX for external clients — no Microsoft account required. |
| Graph API scoping | Explicit linkage tables (not email/domain heuristics) | Prevents accidental data leakage between hubs sharing contacts. |
| Status updates | Append-only (DB triggers block UPDATE/DELETE) | Preserves full audit trail. Raw SQL migration for constraints outside Prisma schema. Two input methods: staff UI + direct SQL. |

---

## Developer Setup

### Prerequisites
- Node.js 20+ (install with [nvm](https://github.com/nvm-sh/nvm))
- pnpm (`npm install -g pnpm`)

### Frontend
```sh
git clone <REPO_URL>
cd client-hub
npm install
npm run dev          # Starts on http://localhost:5173
```

### Middleware
```sh
cd middleware
pnpm install
cp .env.example .env    # Defaults: AUTH_MODE=demo, DATA_BACKEND=azure_pg
# Edit .env — set DATABASE_URL to your PostgreSQL connection string
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
pnpm run dev             # Starts on http://localhost:3001
```

### Running Tests
```sh
cd middleware
pnpm test               # 171 tests across 12 files
```

---

## Next Actions

1. **Implement remaining placeholder endpoint families** — Proposal/video uploads, then Phase 3+ business-critical flows
2. **Add `npm run verify-endpoints` script + CI enforcement** — Keep inventory counts aligned with code
3. **Keep docs in lockstep** — Update `docs/CURRENT_STATE.md` + `docs/PRODUCTION_ROADMAP.md` whenever endpoint status changes
4. **Phase 0a infrastructure (when scaling)** — Execute Azure cutover when moving beyond MVP constraints

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview and setup |
| `docs/CURRENT_STATE.md` | Canonical live vs aspirational state |
| `AGENTS.md` | Architecture canon and coding standards |
| `GOLDEN_RULES.md` | Coding standards |
| `docs/PRODUCTION_ROADMAP.md` | Detailed phase plan with endpoint inventory |
| `docs/API_SPECIFICATION.md` | Historical aspirational API contract draft |
| `docs/middleware/MSAL_AUTH_IMPLEMENTATION_PLAN.md` | Historical auth transition plan (pre-`AUTH_MODE`) |
| `docs/PHASE_2_CLIENT_HUBS.md` | Historical Phase 2 goal-state specification |
| `docs/Vision_and_Assumptions.md` | Product vision and long-horizon assumptions |
