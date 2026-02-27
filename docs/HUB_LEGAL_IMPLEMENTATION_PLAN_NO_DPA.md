# Hub Legal Compliance Implementation Plan (Excluding Vendor DPAs)

Last updated: 2026-02-27  
Scope: Pitch Hub + Client Hub flows across `goagentflow.com`, `AFv2-temp`, and `client-hub` middleware/frontend

## 1. What This Plan Covers

This plan assumes vendor DPAs are already in place and focuses on everything else needed to reduce legal/compliance risk in production.

Included:
- Legal document completeness and publication
- Subprocessor/transfers transparency page
- Retention policy + technical enforcement
- DSAR and incident response operational readiness
- Consent governance and analytics behavior
- Security evidence and auditability controls

Excluded:
- Negotiating or drafting new vendor DPAs

## 2. Current State Summary

- P0 legal pages/entry notices are implemented in code.
- Pitch password verification hardening is implemented in code (no-UX-change path), pending deployment/config alignment.
- Remaining gaps are primarily legal completeness, operational process, and evidence/audit maturity.

## 3. Target Risk Outcome

- Current (pre-full rollout): ~6.5-7/10 legal/compliance risk
- Target after this plan: ~3.5-4.5/10

## 4. Implementation Streams

## Stream A: Legal Content Completeness

### A1. Finalize Hub Privacy Notice
Tasks:
- Replace placeholder-level language with legal-approved final copy.
- Include explicit sections:
  - data categories
  - lawful bases
  - recipients/processors
  - international transfers
  - retention windows
  - rights and contact route
  - effective date/version

Acceptance:
- Counsel-approved version published and linked from all hub entry points/emails.

### A2. Finalize Hub Terms
Tasks:
- Add enforceable terms around authorized business use, credentials, acceptable use, and service conditions.
- Add governing law/jurisdiction to align with your commercial terms approach.

Acceptance:
- Counsel-approved terms live and linked from hub entry points and emails.

### A3. Finalize Hub Cookie Notice
Tasks:
- Clarify essential vs non-essential technologies.
- Match behavior to actual implementation (no contradictions).

Acceptance:
- Public notice matches live cookie/analytics behavior.

## Stream B: Subprocessor and Transfer Transparency

### B1. Publish Subprocessor + Transfer Register
Tasks:
- Add public page listing each processor:
  - name
  - purpose
  - data category scope
  - data location/transfer context
  - safeguards (high-level reference)

Acceptance:
- Page live and linked from Hub Privacy Notice.
- Internal owner assigned for updates.

## Stream C: Retention Policy + Enforcement

### C1. Retention Schedule Definition
Tasks:
- Define retention by artifact:
  - access recovery tokens
  - verification codes/devices
  - portal login/activity events
  - message/audit records
  - hub files metadata
- Assign legal rationale per category.

Acceptance:
- Retention table approved by legal + engineering.

### C2. Technical Enforcement
Tasks:
- Add scheduled cleanup jobs for token/session artifacts.
- Add explicit archive/delete behavior for stale operational records.
- Log cleanup actions with counts and timestamps.

Acceptance:
- Cleanup jobs run successfully and are observable in logs/monitoring.

## Stream D: DSAR and Incident Operations

### D1. DSAR Runbook
Tasks:
- Define intake method, verification, SLA, owners, and response template.
- Define export/delete process across hub user records by email/hub.

Acceptance:
- Internal DSAR runbook approved and test-executed on a sample request.

### D2. Incident/Breach Runbook
Tasks:
- Define severity levels, escalation chain, legal decision points, and evidence capture.
- Define timeline checklist for notification decisioning.

Acceptance:
- Incident runbook approved and dry-run completed.

## Stream E: Consent Governance

### E1. Consent-Safe Analytics End-to-End
Tasks:
- Ensure non-essential analytics never initialize pre-consent on all relevant pages.
- Ensure event calls are safely guarded when analytics is not loaded.

Acceptance:
- Browser checks confirm no pre-consent analytics initialization.

### E2. Consent Record Governance
Tasks:
- Document consent mechanism/version and ownership.
- Define change-management rule for analytics tag changes.

Acceptance:
- Written governance note included in docs and release checklist.

## Stream F: Security Evidence and Auditability

### F1. Admin/Access Audit Evidence
Tasks:
- Ensure key security actions are logged with correlation IDs.
- Define monthly review checklist for access/security logs.

Acceptance:
- First monthly review template created and stored.

### F2. Legal-Change Traceability
Tasks:
- Introduce legal document version tracking (effective date + change note).
- Add release gate: any relevant behavior change requires legal docs review.

Acceptance:
- Release checklist updated and enforced.

## 5. Delivery Sequence (Recommended)

## Week 1 (Must-have)
1. Stream A (final legal text publish)
2. Stream B (subprocessor page)
3. Stream E1 (consent-safe analytics verification)

## Week 2 (Must-have for operational readiness)
1. Stream C1 + C2 (retention definition + enforcement)
2. Stream D1 + D2 (DSAR + incident runbooks)
3. Stream F2 (legal-release governance)

## Week 3 (Maturity closeout)
1. Stream F1 (audit review process)
2. Residual hardening and evidence packaging

## 6. UX Impact (What Users Will Notice)

## No meaningful UX changes (backend/ops only)
- Retention jobs and cleanup enforcement
- DSAR/incident runbooks
- Audit review process
- Legal version governance

## Minor UX changes (low friction)
- New footer/legal links across hub pages/emails
- New public subprocessor page link from privacy notice
- Cookie behavior consistency (analytics disabled until consent where required)

## Potentially visible but still low-friction
- If users previously relied on implicit tracking, consent handling may slightly change behavior of analytics-dependent personalization (if any).
- Pitch password screen looks the same, but now verifies server-side.

## 7. Acceptance Checklist (Production Readiness)

- [ ] Hub Privacy Notice final and legal-approved
- [ ] Hub Terms final and legal-approved
- [ ] Hub Cookie Notice final and behavior-aligned
- [ ] Subprocessor + transfer page live
- [ ] Retention schedule approved
- [ ] Cleanup jobs deployed and verified
- [ ] DSAR runbook signed off and test-executed
- [ ] Incident runbook signed off and dry-run completed
- [ ] Consent behavior validated (no pre-consent non-essential analytics)
- [ ] Legal-change release gate added to deployment checklist

## 8. Notes

- This plan intentionally minimizes client/staff UX disruption.
- It prioritizes legal defensibility, operational readiness, and evidence quality without a front-end redesign.
