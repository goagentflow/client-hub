# AgentFlow Client Hub - Current State (Live vs Placeholder)

**Last verified:** 28 February 2026  
**Verification basis:** route audit (`middleware/src/routes`), backend tests (`232/232`), frontend production build, GA4+consent UAT `GO` execution.

---

## 1. Purpose

This is the canonical operational document for new developers.

Onboarding index: `docs/README.md`

Use this file to answer:

1. What is truly live now?
2. What is still placeholder behavior?
3. What are the known constraints and gaps?

If any other document conflicts with this file, treat this file as source of truth.

---

## 2. Runtime and Hosting (Live)

- Frontend: `https://www.goagentflow.com/clienthub/`
- Middleware API: `https://clienthub-api-axiw2ydgeq-uc.a.run.app`
- Hosting: Google Cloud Run (frontend and middleware)
- Database: Supabase PostgreSQL via Prisma
- Staff auth: Azure AD JWT
- Portal auth: Hub-scoped portal JWT (`email`, `password`, or `open` access methods)
- Public access recovery: email lookup + one-time opaque recovery token (`/api/v1/public/access/*`)
- Document file storage: Supabase Storage private bucket, signed URLs
- Hub legal docs: published static pages (`/hub-privacy.html`, `/hub-terms.html`, `/hub-cookie-notice.html`, `/hub-subprocessors.html`)
- Consent/analytics baseline: Termly-managed consent + GA4 on marketing/access/clienthub/assess journeys with SPA route tracking for clienthub and assess (production UAT `GO` verified on 28 Feb 2026)

---

## 3. Live Functionality

## 3.1 Staff Flows (Live)

- Hub lifecycle: list/create/update hubs, publish/unpublish portal, delete hub (with child-record cleanup).
- Portal controls: edit welcome headline/message, set access method (`email`, `password`, `open`), manage portal contacts.
- Access management: invite/re-invite clients, revoke pending invites, remove active client members.
- Messages: post/list feed messages and view message audience (who can read).
- Documents: upload files (50MB limit, MIME + extension allowlist), preview/download via signed URLs, delete and bulk actions.
- Status updates: create and list fortnightly updates.
- Staff launcher: authenticated `/clienthub/launcher` route with links to Discovery, Co-Pilot Quiz, and Client Hub admin.

## 3.2 Portal Client Flows (Live)

- Access gates: email verification (code + device token), password gate, and open-link mode.
- Overview: welcome copy, latest status update + history, recent documents card, message summary card.
- Documents: list client-visible documents, preview and download client-visible documents.
- Messages: post/list feed messages, view message audience, submit teammate access request to staff.
- Access recovery: request a new link by email and resolve shared hubs with one-time tokenized `/my-access` links.

---

## 4. API Surface Snapshot

From route-level audit on 26 Feb 2026:

- Route handler definitions in route modules (`router.get/post/put/patch/delete`): **144**
- New public access-recovery handlers:
  - `POST /api/v1/public/access/request-link`
  - `GET /api/v1/public/access/items?token=...`

Note: manual live-vs-placeholder rollup counts were removed because they drifted. Use route files and contract tests as the source for current placeholder inventory.

---

## 5. Placeholder / Not Implemented Yet

These areas are not fully wired for production usage:

- Meetings endpoints (`/hubs/:hubId/meetings/*`, portal meetings)
- Questionnaire CRUD and responses
- Proposal comments endpoint (`POST /hubs/:hubId/portal/proposal/comment`)
- Document engagement analytics endpoint (`GET /hubs/:hubId/documents/:docId/engagement`)
- Legacy threaded message endpoints (`/hubs/:hubId/messages/:threadId*`)
- Relationship and client intelligence endpoints (instant answers, decisions, performance, history, risk alerts)
- Conversion rollback endpoint
- Share-link endpoint (`POST /hubs/:hubId/share-link`)
- Public invite acceptance endpoint (`POST /public/invites/:token/accept`)

---

## 6. Key Current Rules and Constraints

- Message feed is flat and chronological (not threaded).
- Message body max length is 10,000 chars (server and UI enforced).
- Document uploads: max file size 50MB, allowed MIME/extension pairs only, and client-visible docs require non-empty summary/description.
- Signed document URLs expire (15-minute default).
- Access recovery tokens are one-time and periodically pruned (14-day cleanup retention for used/expired records).
- Status updates are append-only (no edit/delete API path).
- Invite domain is constrained by hub `clientDomain` (with internal bypass domain support).

---

## 7. Known Gaps to Be Aware Of

1. Legacy portal invite endpoint remains 501:
- `POST /hubs/:hubId/portal/invite`
- Some older portal UI sharing flows still point to this legacy route and are not launch-ready.

2. Password mode requires explicit password hash management:
- Access method can be switched to `password`, but password management UX is limited.
- If a hub has no password hash set, password verification can effectively behave like open access.
- Treat this as an active hardening item before broad rollout of password mode.

3. Frontend build currently passes with non-blocking warnings:
- Large JS chunk warning
- Dynamic/static import chunking warnings

---

## 8. Documentation Priority Order

For onboarding and implementation decisions, read in this order:

1. `docs/README.md`
2. `docs/CURRENT_STATE.md` (this file)
3. `docs/PRODUCTION_ROADMAP.md`
4. `docs/UAT_PLAN_LIVE_CLIENT_HUB_RELEASE.md`
5. `docs/GA4_CONSENT_UAT_RESULTS_2026-02-28.md`
6. `README.md`
7. `progress/STATUS.md`

Treat these as historical reference only unless explicitly updated:

- `docs/archive/historical-plans/API_SPECIFICATION.md`
- `docs/archive/historical-plans/PHASE_2_CLIENT_HUBS.md`
- `docs/archive/historical-plans/UAT_PITCH_HUB_STAFF_CLIENT_FLOW.md`

---

## 9. Update Rule

Whenever functionality changes:

1. Update this file
2. Update `docs/PRODUCTION_ROADMAP.md`
3. Update `progress/STATUS.md`
4. Update onboarding/setup docs if needed (`README.md`, `middleware/.env.example`)
