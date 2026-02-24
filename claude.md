# AgentFlow Client Hub v0.1 (Phase 2a)

Read these files for full project context:
- .cursorrules — Project context, scope, brand guidelines, code patterns
- GOLDEN_RULES.md — Coding standards
- AGENTS.md — Development canon: Simple, Clean, DRY, Secure
- docs/Vision_and_Assumptions.md — Product vision and middleware assumptions
- docs/PHASE_2_CLIENT_HUBS.md — Phase 2 Client Hubs specification
- docs/API_SPECIFICATION.md — Complete API contract (113 endpoints)

For middleware development:
- docs/PRODUCTION_ROADMAP.md — **Current architecture and implementation plan** (v5.1, Phase 2a invite endpoints deployed)
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

**Middleware:** Phase 0b + Phase 1.5 + Phase 2a (invite endpoints) complete:
- Prisma 6 ORM (replaced Supabase JS client)
- `AUTH_MODE` + `DATA_BACKEND` config (replaced `DEMO_MODE`)
- TenantRepository + AdminRepository pattern for tenant isolation
- All routes migrated to injected Prisma repository
- Cloud Run Dockerfiles (middleware + frontend) — multi-stage, non-root, reviewed
- Portal email verification (Phase 1.5) — public + staff endpoints, Resend email, device tokens
- Portal invite endpoints (Phase 2a) — POST/GET/DELETE invites with email, domain validation, cascade revoke

**Hub Types:**
- Pitch Hubs: Prospecting/new business (proposal, videos, questionnaire)
- Client Hubs: Active client relationships (projects, health, expansion)

**Key Features Implemented:**
- Hub conversion (pitch → client)
- Projects with milestones
- Relationship Health Dashboard (AI-powered)
- Expansion Radar (upsell/cross-sell detection)
- Client Intelligence (Instant Answers, Meeting Prep, Performance Narratives)
- Decision Queue (state machine for client decisions)
- History & Alerts (institutional memory)
- Leadership Portfolio (admin-only aggregate views)

**Architecture:**
- React Query for data fetching with polling patterns
- Async job pattern for AI endpoints (POST creates job → GET polls)
- 24-hour stale data threshold with refresh capability
- RBAC with RequireAdmin guard for leadership views

## Key Files

**Middleware config & data:**
- `middleware/src/config/env.ts` — AUTH_MODE, DATA_BACKEND, RESEND_API_KEY, production guards
- `middleware/prisma/schema.prisma` — Database schema (Hub, HubEvent, HubNote, HubInvite, PortalContact, PortalVerification, PortalDevice)
- `middleware/src/db/` — Prisma client, TenantRepository, AdminRepository, hub mapper, portal-verification-queries

**Middleware auth:**
- `middleware/src/middleware/auth.ts` — Azure AD JWT + portal JWT (with email/name claims) + demo headers
- `middleware/src/middleware/hub-access.ts` — Hub access verification
- `middleware/src/middleware/inject-repository.ts` — Repository injection based on DATA_BACKEND

**Middleware routes:**
- `middleware/src/routes/portal-verification.route.ts` — Public endpoints (access-method, request-code, verify-code, verify-device)
- `middleware/src/routes/portal-contacts.route.ts` — Staff endpoints (contacts CRUD, access method management)
- `middleware/src/routes/members.route.ts` — Staff invite endpoints (POST/GET/DELETE) + 5 remaining 501 stubs
- `middleware/src/services/email.service.ts` — Resend transactional email (verification codes + portal invites)

**Docker (Cloud Run deployment):**
- `middleware/Dockerfile` — Multi-stage middleware build (Node 20, pnpm, Prisma, tsup, non-root)
- `Dockerfile` (root) — Multi-stage frontend build (Vite + nginx-unprivileged, PORT envsubst)
- `nginx.conf.template` — SPA routing with `${PORT}` for Cloud Run
- `cloudbuild-middleware.yaml` — Cloud Build pipeline for middleware (includes RESEND_API_KEY secret)

**Frontend:**
- `src/services/api.ts` — API client (has setTokenGetter pattern)
- `src/services/auth.service.ts` — MSAL login, token acquisition
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
