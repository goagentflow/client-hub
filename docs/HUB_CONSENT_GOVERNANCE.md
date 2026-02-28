# Hub Consent and Analytics Governance

Last updated: 2026-02-28
Owner: Marketing + Engineering
Scope: Hub-adjacent web pages and journeys on `goagentflow.com`

## 1. Policy

1. Essential technologies may run without consent when required for security/service operation.
2. Non-essential analytics must not initialize before valid consent where required.
3. If consent state is unknown, default to no non-essential analytics.

## 2. Current Implementation Notes

1. Consent manager: Termly (`website-uuid: dc7c6ad3-3c44-4541-b5e2-146d10618f63`) is loaded on:
- marketing pages
- `/access`, `/access/client`, `/my-access`
- `/clienthub/*` SPA
- `/assess/*` SPA
2. GA4 is now enabled across key journeys with consent controls in place:
- Marketing + access journeys use `G-LHY2J56X46`
- Assess (Co-Pilot Quiz) uses `G-CJ8RCLCKQJ` (override supported via `VITE_GA4_MEASUREMENT_ID`)
3. Pitch pages keep explicit per-page consent controls and GA load only after acceptance.
4. SPA route pageviews are tracked in `client-hub` and `agentflow-insight-pulse` via route listeners that no-op when `gtag` is unavailable.

## 3. Change Management Rule

Before any analytics tag/script change:

1. Confirm category (`essential` vs `non-essential`).
2. Confirm consent gating behavior in code.
3. Update related legal text when behavior changes.
4. Add test evidence (network capture or browser console checks) to release notes.
5. Attach consent-log evidence from Termly dashboard for the release window.

## 4. Validation Checklist

1. Open page in fresh private browser profile.
2. Verify no GA/analytics requests fire before consent interaction.
3. Accept consent and confirm analytics starts only after consent.
4. Reject consent and confirm analytics remains disabled.
5. Export/record Termly consent log evidence for the same test run.
6. Follow `docs/GA4_CONSENT_PROOF_PLAYBOOK.md` and attach artefacts to release notes.

## 5. Ownership and Review Cadence

1. Monthly: review top hub-entry pages for consent compliance.
2. Quarterly: review policy and legal notice alignment with legal counsel.
