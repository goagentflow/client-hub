# AgentFlow Client Hub - Working Context (Current)

Last updated: 28 February 2026

This file is a quick operational context for coding assistants.  
For source-of-truth behavior, always defer to `docs/CURRENT_STATE.md`.

## 1. Read Order (Authoritative)

1. `docs/README.md`
2. `docs/CURRENT_STATE.md`
3. `docs/PRODUCTION_ROADMAP.md`
4. `docs/UAT_PLAN_LIVE_CLIENT_HUB_RELEASE.md`
5. `docs/GA4_CONSENT_UAT_RESULTS_2026-02-28.md`
6. `progress/STATUS.md`
7. `AGENTS.md`
8. `GOLDEN_RULES.md`

Historical plans/specs are in `docs/archive/` and are reference-only.

## 2. Runtime Snapshot

- Frontend: `https://www.goagentflow.com/clienthub/`
- Middleware API: `https://clienthub-api-axiw2ydgeq-uc.a.run.app`
- Hosting: Google Cloud Run
- Database: Supabase PostgreSQL (Prisma)
- File storage: Supabase Storage private bucket + signed URLs
- Staff auth: Azure AD JWT
- Portal auth: hub-scoped JWT and access methods (`email`, `password`, `open`)
- Public recovery endpoints: `/api/v1/public/access/*`
- Consent/analytics: Termly + GA4 with production UAT `GO`

## 3. What Is Live

- Hub lifecycle and publish/unpublish controls
- Portal access controls and portal contacts management
- Invite/revoke/remove access management flows
- Staff + portal flat message feed
- Document upload/preview/download/delete
- Status updates (staff create, portal read)
- Staff launcher (`/clienthub/launcher`)
- Access recovery flow (`/access`, `/access/client`, `/my-access`)
- Hub legal pages and legal footer links in hub emails

## 4. Known Non-Live / Placeholder Areas

- Meetings endpoints
- Questionnaire endpoints
- Proposal comment endpoint
- Document engagement analytics endpoint
- Legacy threaded message endpoints
- Relationship/client intelligence endpoints
- Legacy portal invite endpoint (`POST /hubs/:hubId/portal/invite`) remains `501`

## 5. Engineering Rules

- Follow `.cursorrules`, `AGENTS.md`, and `GOLDEN_RULES.md` on every change.
- Keep API endpoints hub-scoped (`/api/v1/hubs/{hubId}/...`) for tenant isolation.
- Use `TenantRepository`; do not bypass with direct cross-tenant data access.
- Validate server-side input for all public and hub routes.
- Never log secrets, raw tokens, verification codes, or sensitive PII.
- Treat archived docs as context only, not implementation truth.

## 6. Required Doc Updates on Behavior Changes

Update these in the same PR:

1. `docs/CURRENT_STATE.md`
2. `docs/PRODUCTION_ROADMAP.md`
3. `progress/STATUS.md`
4. `docs/README.md` (if ownership/order changes)
5. Any impacted onboarding/setup docs (`README.md`, `middleware/.env.example`, UAT docs)

## 7. High-Value Paths

Core backend:
- `middleware/src/app.ts`
- `middleware/src/middleware/auth.ts`
- `middleware/src/middleware/hub-access.ts`
- `middleware/src/db/`
- `middleware/src/routes/`
- `middleware/src/services/`
- `middleware/prisma/schema.prisma`

Core frontend:
- `src/services/api.ts`
- `src/services/auth.service.ts`
- `src/pages/`
- `src/components/`
- `src/hooks/`

Infra/deploy:
- `Dockerfile`
- `middleware/Dockerfile`
- `nginx.conf.template`
- `cloudbuild-middleware.yaml`

## 8. Test Commands

Frontend build:
```sh
npm run build
```

Backend tests:
```sh
cd middleware
pnpm test
```

Frontend E2E:
```sh
npm run test:e2e
```
