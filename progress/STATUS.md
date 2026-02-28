# AgentFlow Client Hub - Status Log

**Last updated:** 28 February 2026

> This file is a delivery log and quick snapshot.  
> For authoritative live behavior, use `docs/CURRENT_STATE.md`.

---

## 1. Snapshot

- Environment: production live on Cloud Run (frontend + middleware)
- Database: Supabase PostgreSQL (Prisma)
- File storage: Supabase Storage signed URLs
- Backend quality baseline: `232` tests passing (`middleware/src/__tests__`, 18 files)
- Frontend quality baseline: production build passing

---

## 2. What Is Live

- Hub lifecycle: create, update, publish/unpublish, delete
- Portal controls: welcome copy, access method, portal contacts
- Access management: invites, revoke pending, remove active clients
- Messaging: staff + portal feed, audience card, access request flow
- Documents: upload, preview, download, delete, bulk actions
- Status updates: staff creation and portal visibility
- Public access recovery endpoints: `POST /api/v1/public/access/request-link`, `GET /api/v1/public/access/items`
- Staff launcher route: `/clienthub/launcher`
- Consent-managed GA4 rollout across marketing/access/clienthub/assess entry points (including SPA route pageview tracking)
- GA4 + consent UAT execution completed with production `GO` sign-off (pre-consent, post-consent, withdrawal, SPA tracking)

---

## 3. Recent Milestones (Delivered)

1. Portal email verification flow (`email` access mode) with device token support.
2. Portal contact management and access-method switching.
3. Member/invite revoke and cleanup behavior.
4. Document upload/download/preview using Supabase Storage.
5. Message feed MVP implementation (staff + portal) and email notifications.
6. Message audience visibility UX and teammate access-request flow.
7. Client-hub overview improvements (status + docs + message summary cards).
8. UAT launch-plan document added for live feature validation.
9. Unified access recovery flow: one-time tokenized `/my-access` link issuance and item resolution.
10. Staff launcher implementation with post-login routing.
11. Hub legal baseline: legal pages, entry-point legal notices, and legal footer links in hub emails.
12. Access recovery retention enforcement: periodic cleanup of used/expired recovery token records.
13. GA4 + consent UAT completed across marketing/access/assess/clienthub with final `GO` outcome.
14. Repository documentation hygiene pass: archived superseded plans/specs and updated source-of-truth indexing.

---

## 4. Open Gaps (Known)

1. Legacy portal invite endpoint (`POST /hubs/:hubId/portal/invite`) is still 501.
2. Password mode needs stronger lifecycle hardening.
3. Meetings/questionnaires/intelligence endpoints are still largely placeholder.
4. Document engagement analytics endpoint is still 501.

---

## 5. Working Rule for New Changes

Every behavior change must update:

1. `docs/CURRENT_STATE.md`
2. `docs/PRODUCTION_ROADMAP.md`
3. `progress/STATUS.md`
4. `docs/README.md` if document ownership/order changes
5. Any impacted setup/onboarding docs (`README.md`, `.env.example`, UAT docs)
