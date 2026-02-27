# Hub DSAR Runbook

Last updated: 2026-02-27
Owner: Operations (primary), Engineering (execution support)
Scope: Hub user personal data requests (Pitch Hub + Client Hub)

## 1. Intake

Accepted intake channels:

1. `admin@goagentflow.com`
2. Customer account manager escalation to operations

Required intake details:

1. Requester full name
2. Requester business email
3. Organisation and hub context (if known)
4. Request type: access, correction, deletion, restriction, objection

## 2. Identity Verification

Before processing:

1. Confirm requester controls the business email address tied to hub access.
2. If requested via third party, require written authority from customer organisation.
3. Log verification outcome in DSAR case record.

## 3. SLA Targets

1. Acknowledge receipt: within 2 business days
2. Complete request: within 30 calendar days (or local legal requirement)
3. If extension needed, notify requester before deadline with reason

## 4. Data Discovery Scope

For the verified email and relevant hub IDs, include:

1. `portal_contact` membership/contact records
2. `hub_member` access/activity records
3. `hub_event` portal login/activity events
4. `hub_message` records authored by that email (where applicable)
5. `portal_verification`, `portal_device`, `access_recovery_token` artifacts (where applicable)

## 5. Response Actions

1. Access request:
- Provide structured export summary (JSON/CSV where feasible).

2. Correction request:
- Update mutable profile fields where supported.
- If immutable audit fields are contested, append correction note in case log.

3. Deletion request:
- Validate if data must be retained for legal/security obligations.
- If deletable, remove hub access records and associated optional operational artifacts.

4. Restriction/objection:
- Evaluate legal basis and enforce processing restrictions where required.

## 6. Case Logging Requirements

Each DSAR case must record:

1. Case ID
2. Intake date/time
3. Request type
4. Identity verification method
5. Systems queried
6. Data provided/changed/deleted
7. Completion date and responder

Do not store raw credentials, verification codes, or token secrets in case notes.

## 7. Escalation

Escalate to legal counsel when:

1. Request scope conflicts with contractual/legal retention obligations
2. Jurisdictional requirements are unclear
3. A complaint or regulator notice is involved
