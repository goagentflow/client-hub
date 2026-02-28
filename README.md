# AgentFlow Client Hub

Client-facing and staff-facing hub application for managing ongoing client work.

## What This Repo Contains

- `src/`: React frontend (staff and portal experiences)
- `middleware/`: Express API (auth, access control, hub workflows, documents, messages)
- `docs/`: operational docs (live state, roadmap, UAT)
- `tests/`: Playwright frontend smoke/e2e coverage
- `middleware/src/__tests__/`: API contract and behavior tests

## Current Snapshot (28 Feb 2026)

- Production frontend: `https://www.goagentflow.com/clienthub/`
- Production middleware: `https://clienthub-api-axiw2ydgeq-uc.a.run.app`
- Backend tests: `232` passing across `18` files
- Frontend build: passing (`npm run build`)
- Core live features: hub lifecycle, portal access controls, invite/member revoke flows, staff+client messaging, document upload/preview/download, status updates, and consent-managed GA4 tracking.
- UAT status: GA4 + consent UAT completed with production `GO` across marketing/access/assess/clienthub surfaces.

For exact live-vs-placeholder behavior, use [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md).

## New Developer Start Here

1. [docs/README.md](./docs/README.md)
2. [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md)
3. [docs/PRODUCTION_ROADMAP.md](./docs/PRODUCTION_ROADMAP.md)
4. [docs/UAT_PLAN_LIVE_CLIENT_HUB_RELEASE.md](./docs/UAT_PLAN_LIVE_CLIENT_HUB_RELEASE.md)
5. [docs/GA4_CONSENT_UAT_RESULTS_2026-02-28.md](./docs/GA4_CONSENT_UAT_RESULTS_2026-02-28.md)
6. [progress/STATUS.md](./progress/STATUS.md)
7. [AGENTS.md](./AGENTS.md)

Historical planning docs are kept for context in `docs/archive/` (index: `docs/archive/README.md`), but are not source of truth.

## Local Setup

## Prerequisites

- Node.js 20+
- `pnpm`

## Frontend

```sh
git clone <REPO_URL>
cd client-hub
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Middleware

```sh
cd middleware
pnpm install
cp .env.example .env
npx prisma generate
pnpm run dev
```

Middleware runs at `http://localhost:3001`.

Important local env values are documented in `middleware/.env.example`.

## Useful Commands

```sh
# backend tests
cd middleware
pnpm test

# frontend build
cd ..
npm run build

# frontend tests (Playwright)
npm run test:e2e
```

## Live vs Placeholder (High-Level)

Live now:
- Overview, Documents, Messages, Client Portal controls, Status Updates

Still placeholder/partial:
- Meetings
- Questionnaires
- Proposal comments
- Document engagement analytics endpoint
- Intelligence endpoints (decisions, performance, history, relationship health)
- Legacy threaded message endpoints

## Documentation Rules

When behavior changes, update these in the same PR:

1. [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md)
2. [docs/PRODUCTION_ROADMAP.md](./docs/PRODUCTION_ROADMAP.md)
3. [progress/STATUS.md](./progress/STATUS.md)
4. Any impacted onboarding/setup doc (`README.md`, `middleware/.env.example`)
