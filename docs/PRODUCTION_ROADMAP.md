# AgentFlow Client Hub - Production Roadmap (v6)

**Last updated:** 28 February 2026  
**Audience:** Product, engineering, and new developers onboarding to active delivery  
**Companion docs:** `docs/README.md`, `docs/CURRENT_STATE.md`, `docs/UAT_PLAN_LIVE_CLIENT_HUB_RELEASE.md`

---

## 1. Roadmap Purpose

This roadmap tracks delivery from the current live baseline to a broader production-ready feature set.

It is intentionally focused on:

1. What has already shipped
2. What is next and why
3. What "production ready" means for each new feature phase

---

## 2. Baseline (Already Shipped)

These capabilities are live in production today:

- Hub lifecycle (create/update/publish/unpublish/delete)
- Portal access modes (`email`, `password`, `open`)
- Portal contacts and access-method controls
- Client invite, revoke, and member removal flows
- Status updates (staff create, portal read)
- Documents upload/download/preview via Supabase Storage signed URLs
- Message feed (staff + portal), message audience visibility, teammate access request
- Public access recovery API (`POST /api/v1/public/access/request-link`, `GET /api/v1/public/access/items`)
- Staff launcher route (`/clienthub/launcher`) with product routing links and Azure SSO deep links for Assess/Discovery staff entry
- Hub legal baseline (`/hub-privacy.html`, `/hub-terms.html`, `/hub-cookie-notice.html`, `/hub-subprocessors.html`)
- Access-recovery retention cleanup for used/expired token artifacts
- Consent-managed GA4 tracking with Termly controls across marketing/access/clienthub/assess
- GA4 + consent UAT execution completed with production `GO` decision

Quality baseline currently validated:

- Backend tests: `232/232` passing
- Frontend production build: passing

---

## 3. Delivery Phases

## Phase A - Stabilization and Hardening (Immediate)

### Goal

Close high-risk behavior gaps in already-live areas before wider client rollout.

### Scope

1. Replace or remove legacy portal invite path usage (`POST /hubs/:hubId/portal/invite` is 501).
2. Harden password access mode with explicit password lifecycle management.
3. Add stronger operational visibility for notification failures (Resend failures are currently mostly log-only).
4. Tighten client-share UX so all visible actions map to working backend routes.

### Production-ready exit criteria

1. No visible UI path points to a 501 endpoint.
2. Password mode cannot be enabled in an unsafe/unconfigured state.
3. Notification failure path has clear observability (logs + alerting/monitoring hook).
4. UAT P0/P1 cases for invites, revocation, and messaging notifications all pass.

---

## Phase B - Collaboration Completeness

### Goal

Complete core collaboration feature set still in placeholder state.

### Scope

1. Proposal upload endpoint implementation.
2. Video file upload endpoint implementation.
3. Meetings endpoint family implementation.
4. Questionnaire endpoint family implementation.
5. Document engagement analytics endpoint implementation.

### Production-ready exit criteria

1. No placeholder behavior for proposal/video upload paths.
2. Meetings and questionnaire flows are end-to-end testable in both staff and portal UX.
3. Engagement analytics data is accurate and non-breaking for existing document flows.
4. Contract/integration tests updated and passing for each endpoint family.

---

## Phase C - Intelligence Feature Activation

### Goal

Move intelligence sections from placeholders to working flows.

### Scope

1. Relationship intelligence endpoints.
2. Client intelligence endpoints (instant answers, decisions, performance, history, risk alerts).
3. Leadership intelligence rollups for at-risk and expansion views.

### Production-ready exit criteria

1. No intelligence route returns placeholder responses in the target release slice.
2. Evidence and explanation metadata is consistently returned and rendered.
3. Latency and failure behavior are acceptable for client-facing surfaces.
4. UAT scenarios for intelligence sections are added and passed.

---

## Phase D - Infrastructure Migration Track (Parallel Workstream)

### Goal

Prepare migration from MVP runtime stack to target Azure-hosted production stack when scaling requires it.

### Scope

1. Azure PostgreSQL migration planning and dry-run.
2. Azure hosting target hardening (App Service / Static Web Apps equivalent cutover plan).
3. File-storage target strategy review (Supabase Storage to Azure Blob if required by compliance/scale).

### Production-ready exit criteria

1. Dry-run migration completed with rollback procedure documented.
2. Data integrity and auth behavior validated in a non-production environment.
3. Cutover runbook and ownership approved.

---

## 4. Active Risks and Gaps

1. **Legacy invite endpoint mismatch**
Backend route `POST /hubs/:hubId/portal/invite` is still 501, and some older client sharing flows still rely on this path.

2. **Password mode hardening**
Access method switching exists, but password lifecycle controls are incomplete.

3. **Placeholder surface still substantial**
Meetings/questionnaires/intelligence remain largely non-live.

4. **Operational observability depth**
Some asynchronous failure paths are currently best-effort logging only.

---

## 5. Recommended Sequencing (Next 6-8 Weeks)

1. Phase A (stabilization/hardening)
2. Phase B (collaboration completeness)
3. Phase C (intelligence activation)
4. Phase D infrastructure cutover planning in parallel after Phase A starts

Rationale:

- Stabilization first reduces risk in already-live workflows.
- Collaboration completeness closes visible user-facing product gaps.
- Intelligence should follow once core collaboration surfaces are fully reliable.

---

## 6. Definition of Done (Cross-Phase)

Every phase is done only when all are true:

1. Backend tests pass and include new endpoint coverage.
2. Frontend build passes.
3. UAT scenarios for the released scope pass with evidence.
4. `docs/CURRENT_STATE.md` is updated.
5. `progress/STATUS.md` is updated.
6. No new UI path points to placeholder/501 endpoints unless explicitly labeled as Coming Soon.

---

## 7. Historical Docs Policy

These files are retained for historical planning context and should not be treated as live implementation truth:

- `docs/archive/historical-plans/API_SPECIFICATION.md`
- `docs/archive/historical-plans/PHASE_1_5_EMAIL_VERIFICATION_PLAN.md`
- `docs/archive/historical-plans/PHASE_1_DOCUMENT_UPLOAD_SUPABASE_PLAN.md`
- `docs/archive/historical-plans/PHASE_2_CLIENT_HUBS.md`
- `docs/archive/historical-plans/UAT_PITCH_HUB_STAFF_CLIENT_FLOW.md`
