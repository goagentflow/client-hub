# Hub Incident Response Runbook

Last updated: 2026-02-27
Owner: Engineering (incident commander), Operations (communications), Legal (notification decision)
Scope: Security incidents affecting Pitch Hub or Client Hub data

## 1. Severity Model

S1 Critical:
- Confirmed unauthorised data access/cross-tenant exposure
- Active compromise of auth controls or production secrets

S2 High:
- Significant auth bypass vulnerability with realistic exploit path
- Data exposure risk without confirmed exfiltration

S3 Medium:
- Security misconfiguration with limited blast radius
- Compliance-impacting logging/retention control failure

S4 Low:
- Hardening gaps without immediate exploitability

## 2. First 60 Minutes Checklist

1. Open incident channel and assign incident commander.
2. Capture timestamp, reporter, affected systems, and initial severity.
3. Contain:
- disable vulnerable endpoint/feature flag if possible
- revoke or rotate affected secrets/tokens if suspected compromise
4. Preserve evidence:
- request logs and deployment history
- do not overwrite forensic artifacts

## 3. Investigation Checklist

1. Determine impacted data categories and affected tenants/hubs.
2. Confirm whether personal data was accessed or exfiltrated.
3. Document attack vector, timeline, and remediation actions.
4. Record confidence level and remaining unknowns.

## 4. Notification Decisioning

Legal decision owner: Legal + leadership.

Inputs:

1. Incident severity and confidence
2. Data categories impacted
3. Jurisdictional obligations and timelines
4. Customer contractual obligations

Outputs:

1. Notify/not notify determination
2. Regulator notification requirement and deadline
3. Customer communication plan and owner

## 5. Containment and Recovery

1. Deploy fix with peer review and targeted tests.
2. Confirm exploit path is closed.
3. Validate no regressions through smoke checks.
4. Monitor for recurrence signals for at least 24 hours.

## 6. Post-Incident (Within 5 Business Days)

1. Publish postmortem:
- root cause
- impact
- timeline
- corrective actions

2. Create tracked follow-up tasks with owners/dates.
3. Update relevant docs/runbooks/checklists.
