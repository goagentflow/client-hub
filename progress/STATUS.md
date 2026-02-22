# AgentFlow Pitch Hub — Project Status

**Last Updated:** 22 February 2026

---

## What is AgentFlow Pitch Hub?

AgentFlow Pitch Hub is a client relationship portal built on Microsoft 365. It enables professional services firms to manage pitches (new business) and client relationships (active accounts) through a single web application. AgentFlow is building this as its own tool first — eating our own dog food — before selling it to other firms.

---

## Architecture

```
Frontend (React/Vite/TypeScript)
  ├── Azure AD login via MSAL.js (code-complete)
  ├── Portal access via password-protected JWT tokens
  └── All data fetched through middleware API

Middleware (Express/TypeScript) — 113 endpoints (46 real, 67 stubbed)
  ├── Auth: Azure AD JWT (RS256 via jose) + portal JWT (HS256) + demo headers
  ├── Config: AUTH_MODE (azure_ad | demo) + DATA_BACKEND (azure_pg | mock)
  ├── Database: Prisma 6 ORM (PostgreSQL in production, mock in dev)
  ├── Tenant isolation: TenantRepository + AdminRepository pattern
  └── 66 tests passing across 4 test files

Production Target (Azure-hosted)
  ├── Azure App Service (middleware)
  ├── Azure Static Web Apps (frontend)
  ├── Azure Database for PostgreSQL (Flexible Server)
  ├── Azure Blob Storage (file uploads)
  └── Azure Monitor + Log Analytics
```

---

## Phase 0b Implementation Log

Phase 0b is the codebase refactor preparing for Azure deployment. Phase 0a (infrastructure provisioning) is deferred to save costs until first client deployment.

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

### Sub-phase 4: Route Migration (IN PROGRESS)

Migrating route handlers to use injected Prisma repository instead of Supabase adapter.

**Files being changed:**
- `middleware/src/routes/hubs.route.ts` — Hub CRUD using repository
- `middleware/src/routes/portal-config.route.ts` — Portal config using repository

**Status:** Work paused for documentation cleanup.

---

## Complete Roadmap

| Phase | Name | Status | Summary |
|-------|------|--------|---------|
| 0a | Azure Infrastructure | **Deferred** | Resource group created (UK South). All services deferred to save ~£30-50/month until first client deployment. |
| 0b | Codebase Refactor | **In Progress** | Prisma migration, AUTH_MODE/DATA_BACKEND config, TenantRepository, route migration. Sub-phases 1-3 approved, sub-phase 4 in progress. |
| 1 | File Storage | Not started | Document, proposal, and video upload to Azure Blob Storage with AV scanning. 3 stubs. |
| 2 | Members & Access | Not started | Magic link auth for client contacts, invite system, dual-run with password portal. 11 stubs. |
| 3 | Questionnaires | Not started | Staff-created forms, client submission, response aggregation. 7 stubs. |
| 4 | Engagement Analytics | Not started | Document/video view tracking, leadership at-risk/expansion views. 6 stubs. |
| 5 | OBO Token Flow | Not started | On-Behalf-Of exchange enabling Graph API calls (email, calendar). 0 stubs (infrastructure). |
| 6 | Messages | Not started | Hub-scoped email threads via Graph Mail with explicit linkage. 7 stubs. Depends on Phase 5. |
| 7 | Meetings | Not started | Calendar + Teams integration via Graph with explicit linkage. 10 stubs. Depends on Phase 5. |
| 8 | Client Intelligence (AI) | Not started | Instant answers, meeting prep, performance narratives, decisions, risk alerts. 21 stubs. |
| 9 | Relationship Intelligence | Not started | Health dashboard, expansion radar — frontend integration of Phase 8 endpoints. 0 stubs. |
| 10 | Polish + E2E | Not started | Zero 501 stubs, Playwright E2E tests, conversion rollback. 2 stubs. |

**Total stubs remaining:** 67 of 113 endpoints (59%).

**Timeline:** ~15-16 weeks sequential, ~11-12 weeks with parallelisation. Phases 1-5 can run in parallel after Phase 0.

---

## Key Decisions & Rationale

| Decision | Choice | Why |
|----------|--------|-----|
| Hosting model | Azure-hosted (AgentFlow's own subscription) | Ships faster than per-customer deployment. DPA compliance under single Microsoft agreement. Migration to customer-hosted possible later via adapter pattern. |
| Database | Prisma 6 on Azure PostgreSQL | Prisma 7 has breaking driver adapter changes. Prisma 6 is stable and well-supported. |
| Config model | `AUTH_MODE` + `DATA_BACKEND` (orthogonal) | Replaces `DEMO_MODE` boolean which conflated auth and data concerns. Production guards block unsafe combinations. |
| JWT validation | `jose` library for both portal (HS256) and Azure AD (RS256) | Single dependency, no `@azure/msal-node` needed for validation. |
| Staff detection | `roles` claim in Azure AD JWT | Mandatory deployment prerequisite — not optional. `requireStaffAccess` middleware enforces at router level. |
| Phase 0a deferred | Infrastructure provisioned only when needed | Saves ~£30-50/month. App works fully in mock mode for development and demos. |
| Tenant isolation | TenantRepository (app layer) + DB constraints (defence in depth) | All hub-linked queries go through tenant-scoped wrapper. `tenant_id NOT NULL` + FK constraints in schema. |
| Client auth (future) | Magic link with session JWT in httpOnly cookie | Simple UX for external clients — no Microsoft account required. |
| Graph API scoping | Explicit linkage tables (not email/domain heuristics) | Prevents accidental data leakage between hubs sharing contacts. |

---

## Developer Setup

### Prerequisites
- Node.js 18+ (install with [nvm](https://github.com/nvm-sh/nvm))
- pnpm (`npm install -g pnpm`)

### Frontend
```sh
git clone <REPO_URL>
cd agentflow-pitch-hub-wireframe
npm install
npm run dev          # Starts on http://localhost:5173
```

### Middleware (mock mode — no database needed)
```sh
cd middleware
pnpm install
cp .env.example .env    # Defaults: AUTH_MODE=demo, DATA_BACKEND=mock
pnpm run dev             # Starts on http://localhost:3001
```

### Running Tests
```sh
cd middleware
pnpm test               # 66 tests across 4 files
```

### With Real Database (optional)
Set `DATA_BACKEND=azure_pg` and provide `DATABASE_URL` in `.env`, then:
```sh
cd middleware
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
pnpm run dev
```

---

## Next Actions

1. **Complete Phase 0b sub-phase 4** — Finish migrating route handlers (hubs, portal-config) to use Prisma repository
2. **Build `npm run verify-endpoints` CI check** — Automated stub count verification
3. **Phase 0a infrastructure** — Create Azure services when ready for first client deployment
4. **Azure AD app registrations** — Required before MSAL auth can be tested end-to-end (see `docs/middleware/MSAL_AUTH_IMPLEMENTATION_PLAN.md`, Phase 1)

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview and setup |
| `AGENTS.md` | Architecture canon and coding standards |
| `GOLDEN_RULES.md` | Coding standards |
| `docs/PRODUCTION_ROADMAP.md` | Detailed phase plan with endpoint inventory |
| `docs/API_SPECIFICATION.md` | Complete 113-endpoint API contract |
| `docs/middleware/MSAL_AUTH_IMPLEMENTATION_PLAN.md` | Auth design (approved by senior dev) |
| `docs/PHASE_2_CLIENT_HUBS.md` | Phase 2 specification |
| `docs/Vision_and_Assumptions.md` | Product vision |
