# Documentation Guide (Start Here)

**Last updated:** 28 February 2026

This index keeps docs clean by separating live operational truth from archived planning history.

---

## 1. Source of Truth Order

Read in this order for implementation decisions:

1. `docs/CURRENT_STATE.md`
2. `docs/PRODUCTION_ROADMAP.md`
3. `docs/UAT_PLAN_LIVE_CLIENT_HUB_RELEASE.md`
4. `docs/GA4_CONSENT_UAT_RESULTS_2026-02-28.md`
5. `README.md`
6. `progress/STATUS.md`

If documents conflict, `docs/CURRENT_STATE.md` wins.

---

## 2. Active Operational Docs

Current implementation and roadmap:

- `docs/CURRENT_STATE.md`
- `docs/PRODUCTION_ROADMAP.md`
- `docs/UAT_PLAN_LIVE_CLIENT_HUB_RELEASE.md`
- `docs/GA4_CONSENT_UAT_PLAN.md`
- `docs/GA4_CONSENT_UAT_RESULTS_2026-02-28.md`
- `docs/GA4_CONSENT_PROOF_PLAYBOOK.md`

Legal and governance runbooks:

- `docs/HUB_CONSENT_GOVERNANCE.md`
- `docs/HUB_DSAR_RUNBOOK.md`
- `docs/HUB_INCIDENT_RESPONSE_RUNBOOK.md`
- `docs/HUB_RETENTION_SCHEDULE.md`
- `docs/HUB_LEGAL_RELEASE_CHECKLIST.md`

Engineering standards/process:

- `docs/AGENT_DEVELOPMENT_GUIDELINES.md`
- `docs/GIT_WORKFLOW.md`

---

## 3. Archived Reference Docs

Historical specs, completed plans, and superseded rollout docs now live under `docs/archive/`.

- Archive index: `docs/archive/README.md`
- Historical plans/specs: `docs/archive/historical-plans/`
- Feature rollout history: `docs/archive/feature-rollouts/`
- Legal implementation plans (superseded): `docs/archive/legal-plans/`
- Middleware auth planning history: `docs/archive/middleware/`

Archived docs are reference-only and must not be used as live behavior source-of-truth.

---

## 4. Update Rule (Every Behavior Change)

1. Update `docs/CURRENT_STATE.md`
2. Update `docs/PRODUCTION_ROADMAP.md`
3. Update `progress/STATUS.md`
4. Update impacted onboarding/setup docs (`README.md`, `middleware/.env.example`, relevant UAT docs)

---

## 5. Documentation Hygiene Rule

Completed plans do not stay in `docs/` root. Move them to `docs/archive/` once delivered or superseded.
