# AgentFlow Pitch Hub v0.1 (Phase 0b)

Read these files for full project context:
- .cursorrules — Project context, scope, brand guidelines, code patterns
- GOLDEN_RULES.md — Coding standards
- AGENTS.md — Development canon: Simple, Clean, DRY, Secure
- docs/Vision_and_Assumptions.md — Product vision and middleware assumptions
- docs/PHASE_2_CLIENT_HUBS.md — Phase 2 Client Hubs specification
- docs/API_SPECIFICATION.md — Complete API contract (113 endpoints)

For middleware development:
- docs/PRODUCTION_ROADMAP.md — **Current architecture and implementation plan** (v4, Azure-hosted)
- docs/middleware/MSAL_AUTH_IMPLEMENTATION_PLAN.md — Auth design (approved by senior dev)
- ~~docs/middleware/ARCHITECTURE_V3_FINAL.md~~ — Moved to `docs/archive/`
- ~~docs/middleware/ARCHITECTURE_DECISIONS.md~~ — Moved to `docs/archive/`
- ~~docs/middleware/PRD_MVP_SUMMARY.md~~ — Moved to `docs/archive/`

Follow .cursorrules for all development on this project.
Follow AGENTS.md canon: **Simple, Clean, DRY, Secure**.

## Current Scope

**Frontend:** Phase 2 complete (Pitch Hubs + Client Hubs wireframes).

**Middleware:** Phase 0b in progress — codebase refactor:
- Prisma 6 ORM replacing Supabase JS client
- `AUTH_MODE` + `DATA_BACKEND` replacing `DEMO_MODE`
- TenantRepository + AdminRepository pattern for tenant isolation
- Route migration to use injected Prisma repository (in progress)

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
- `middleware/src/config/env.ts` — AUTH_MODE, DATA_BACKEND, production guards
- `middleware/prisma/schema.prisma` — Database schema (Hub, HubEvent, HubNote)
- `middleware/src/db/` — Prisma client, TenantRepository, AdminRepository, hub mapper

**Middleware auth:**
- `middleware/src/middleware/auth.ts` — Azure AD JWT + portal JWT + demo headers
- `middleware/src/middleware/hub-access.ts` — Hub access verification
- `middleware/src/middleware/inject-repository.ts` — Repository injection based on DATA_BACKEND

**Frontend:**
- `src/services/api.ts` — API client (has setTokenGetter pattern)
- `src/services/auth.service.ts` — MSAL login, token acquisition

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
