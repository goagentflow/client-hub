# AgentFlow Client Hub - Current State (Live vs Aspirational)

**Last verified:** 25 February 2026
**Verification basis:** route-level code audit (`middleware/src/routes`), test run (`207/207`), frontend build, production smoke test (upload + download).

---

## Purpose

This is the operational source of truth for:

1. What is deployed and working today
2. What exists only as placeholder/stub behavior
3. Which docs are current vs historical

If this file conflicts with older planning docs, trust this file and `docs/PRODUCTION_ROADMAP.md`.

---

## Live Today (Deployed)

### Runtime + Hosting

- Frontend live at `https://www.goagentflow.com/clienthub/`
- Middleware live at `https://clienthub-api-axiw2ydgeq-uc.a.run.app`
- Frontend + middleware both run on Google Cloud Run
- Database is Supabase PostgreSQL, accessed via Prisma
- Staff auth is Azure AD (`AUTH_MODE=azure_ad` in production)

### Portal Access Modes

- `password`: password-gated portal JWT
- `email`: email verification code + device token + portal JWT
- `open`: immediate JWT issuance via public verify-password path

### Implemented Backend Capabilities

| Capability | Route Area |
|---|---|
| Auth identity | `/api/v1/auth/me` |
| Hub management | `/api/v1/hubs` (+ detail/update/overview/notes/activity/publish/unpublish/delete/portal-preview) |
| Projects + milestones | `/api/v1/hubs/:hubId/projects` |
| Portal configuration | `/api/v1/hubs/:hubId/portal-config` |
| Portal contacts + access method | `/api/v1/hubs/:hubId/portal-contacts`, `/api/v1/hubs/:hubId/access-method` |
| Public portal verification | `/api/v1/public/hubs/:hubId/access-method|request-code|verify-code|verify-device` |
| Portal invites (staff flow) | `/api/v1/hubs/:hubId/invites` (POST/GET/DELETE) |
| Hub members + access revoke | `/api/v1/hubs/:hubId/members` (GET/PATCH/DELETE), `/api/v1/hubs/:hubId/portal/members` (GET) |
| Status updates (append-only) | `/api/v1/hubs/:hubId/status-updates` (staff POST/GET), `/api/v1/hubs/:hubId/portal/status-updates` (portal GET) |
| Message feed (flat, non-threaded) | `/api/v1/hubs/:hubId/messages` (staff GET/POST), `/api/v1/hubs/:hubId/portal/messages` (portal GET/POST) |
| Message audience visibility | `/api/v1/hubs/:hubId/messages/audience` (staff GET), `/api/v1/hubs/:hubId/portal/messages/audience` (portal GET), `/api/v1/hubs/:hubId/portal/messages/request-access` (portal POST) |
| Document upload (Supabase Storage) | `POST /api/v1/hubs/:hubId/documents` (multipart upload, 50MB limit, MIME + extension allowlist) |
| Document download (signed URLs) | `GET /api/v1/hubs/:hubId/documents/:docId/download` (staff), `GET /api/v1/hubs/:hubId/portal/documents/:docId/download` (portal) |
| Document preview (signed URLs, no download increment) | `GET /api/v1/hubs/:hubId/documents/:docId/preview` (staff), `GET /api/v1/hubs/:hubId/portal/documents/:docId/preview` (portal) |
| Portal content retrieval | `/api/v1/hubs/:hubId/portal/videos|documents|proposal` |
| Events | `/api/v1/hubs/:hubId/events`, `/api/v1/leadership/events` |
| Leadership roll-up (partial) | `/api/v1/leadership/portfolio`, `/api/v1/leadership/clients` |

---

## Aspirational / Placeholder (Not Implemented Yet)

The following route families still return placeholders (mostly HTTP 501), or minimal empty-list placeholders:

| Area | Current Status |
|---|---|
| File uploads (proposals + videos) | Proposal and video upload endpoints are still placeholders |
| Document engagement analytics | `GET /hubs/:hubId/documents/:docId/engagement` is 501 |
| Messages | Feed endpoints and audience endpoints are live (`GET/POST /hubs/:hubId/messages`, `GET /hubs/:hubId/messages/audience`, `GET/POST /hubs/:hubId/portal/messages`, `GET /hubs/:hubId/portal/messages/audience`, `POST /hubs/:hubId/portal/messages/request-access`); legacy thread endpoints remain 501 |
| Meetings | All hub meeting endpoints are 501 |
| Relationship intelligence | Hub relationship-health / expansion endpoints are 501 |
| Client intelligence | Instant answers, decision queue, performance, history, risk alerts are 501 |
| Portal proposal comments | 501 |
| Portal meetings/questionnaires | 501 |
| Invite acceptance (`/public/invites/:token/accept`) | 501 |
| Conversion rollback | 501 |
| Members activity + share-link | Placeholder (501 behavior) |
| Questionnaire detail/create/update/delete/responses | Placeholder (501/empty list behavior) |

---

## Endpoint Inventory Convention

For planning/roadmap continuity, we track a **contract surface** of:

- **115 contract endpoints**
- **56 real**
- **59 placeholders**

Important nuance:

- The 115-endpoint contract inventory intentionally excludes 9 Phase 1.5 endpoints added after the original baseline:
  - Staff: `GET/POST/DELETE /hubs/:hubId/portal-contacts`, `GET/PATCH /hubs/:hubId/access-method`
  - Public: `GET /public/hubs/:hubId/access-method`, `POST /public/hubs/:hubId/request-code`, `POST /public/hubs/:hubId/verify-code`, `POST /public/hubs/:hubId/verify-device`
- Code also contains one legacy placeholder endpoint:
  `POST /hubs/:hubId/portal/invite` in `middleware/src/routes/portal.route.ts`
- Actual mounted API surface today (excluding `/health`) is **131 endpoints** (**76 real**, **55 placeholders**)

---

## Frontend Reality

- Source code defaults `VITE_USE_MOCK_API` to enabled unless explicitly set to `"false"`
- Production Cloud Run builds set mock API off and call real middleware endpoints
- Client portal currently shows explicit "Coming Soon" placeholders for several not-yet-implemented areas (meetings, instant answers, decisions, performance, history)
- Remaining non-placeholder screens in aspirational areas still rely on mock data or placeholder backend endpoints when mock mode is disabled

---

## Which Docs To Use

Use these first:

1. `docs/CURRENT_STATE.md` (this file)
2. `docs/PRODUCTION_ROADMAP.md` (sequencing + phase detail)
3. `README.md` (setup + entry points)

Treat these as historical/planning references unless explicitly updated:

- `docs/API_SPECIFICATION.md`
- `docs/PHASE_2_CLIENT_HUBS.md`
- `docs/UAT_PITCH_HUB_STAFF_CLIENT_FLOW.md`
- `docs/middleware/MSAL_AUTH_IMPLEMENTATION_PLAN.md`

---

## Doc Update Rule

Whenever an endpoint moves between placeholder and real:

1. Update this file
2. Update `docs/PRODUCTION_ROADMAP.md` inventory and phase notes
3. Update any onboarding doc (`README.md`, `progress/STATUS.md`) that states counts or "latest phase" claims
