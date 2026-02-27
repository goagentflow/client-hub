# Hub Consent and Analytics Governance

Last updated: 2026-02-27
Owner: Marketing + Engineering
Scope: Hub-adjacent web pages and journeys on `goagentflow.com`

## 1. Policy

1. Essential technologies may run without consent when required for security/service operation.
2. Non-essential analytics must not initialize before valid consent where required.
3. If consent state is unknown, default to no non-essential analytics.

## 2. Current Implementation Notes

1. Pitch pages use explicit consent controls before loading GA.
2. VectorFlow page no longer initializes GA pre-consent.
3. Hub login/recovery pages are legal-notice first and do not depend on non-essential analytics.

## 3. Change Management Rule

Before any analytics tag/script change:

1. Confirm category (`essential` vs `non-essential`).
2. Confirm consent gating behavior in code.
3. Update related legal text when behavior changes.
4. Add test evidence (network capture or browser console checks) to release notes.

## 4. Validation Checklist

1. Open page in fresh private browser profile.
2. Verify no GA/analytics requests fire before consent interaction.
3. Accept consent and confirm analytics starts only after consent.
4. Reject consent and confirm analytics remains disabled.

## 5. Ownership and Review Cadence

1. Monthly: review top hub-entry pages for consent compliance.
2. Quarterly: review policy and legal notice alignment with legal counsel.
