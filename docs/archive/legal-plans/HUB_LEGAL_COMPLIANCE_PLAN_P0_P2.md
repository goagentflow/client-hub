# Hub Legal Compliance Plan (P0-P2)

Last updated: 2026-02-27  
Scope: AgentFlow hub users only (Pitch Hub + Client Hub flows)

## 1. Objective

Close immediate legal/compliance gaps for hub users without a rebuild, then harden security and operational compliance in controlled phases.

Primary outcomes:
- Hub users see clear legal notices where data is collected.
- Public legal docs exist for hub processing (privacy, terms, cookies).
- Cookie/analytics behavior is aligned with consent requirements.
- Pitch access and operational governance are upgraded next.

## 2. In Scope

- Front door pages: `/access`, `/access/client`, `/my-access`
- Client hub gates: email gate + password gate
- Hub-related outbound emails
- Marketing/pitch cookie + analytics behavior relevant to hub journeys
- Hub-focused legal docs

Out of scope for this plan:
- Full legal drafting sign-off (external counsel still required)
- Deep contract negotiation workflows
- Full auth convergence architecture changes

## 3. Delivery Phases

## P0 (Immediate - start now)

Goal: Ship baseline transparency + consent controls before broader client rollout.

### P0.1 Publish hub legal pages on main site
- Add 3 static pages in AFv2-temp:
  - `hub-privacy.html`
  - `hub-terms.html`
  - `hub-cookie-notice.html`
- Include:
  - processing summary (hub access, invites, messages, engagement events)
  - lawful-basis framing (B2B contract/legitimate interests where applicable)
  - rights/contact channel
  - subprocessor references and transfer note (high-level)

Acceptance:
- Pages are accessible from production host.
- Pages linked from all relevant entry points and emails.

### P0.2 Add just-in-time legal notice at hub entry points
- Update:
  - AFv2 `/access/index.html`
  - AFv2 `/access/client/index.html`
  - AFv2 `/my-access/index.html`
  - Client Hub `EmailGate.tsx`
  - Client Hub `PasswordGate.tsx`
- Add concise user-facing notice:
  - business-authorized use statement
  - links to hub terms + privacy (+ cookie where appropriate)

Acceptance:
- Every place collecting email/password/code displays legal links.
- Copy remains plain-language and non-blocking.

### P0.3 Add legal links to hub emails
- Update middleware email templates (`email.service.ts`) footer.
- Include Privacy + Terms links (hub-specific pages).

Acceptance:
- Invite, code, recovery, and message emails include legal links.

### P0.4 Stop non-essential analytics before consent
- Remove/disable immediate GA execution on AFv2 marketing pages.
- Keep analytics loading only after valid consent mechanism.

Acceptance:
- No GA initialization occurs before user consent on affected pages.

### P0.5 Validation
- Local build/tests in client-hub where feasible.
- Smoke-test pages and links.
- Manual checks:
  - legal links visible and correct
  - email templates render with legal footer
  - no broken routes

## P1 (This week)

Goal: Close highest technical/security gaps for confidential hub material.

### P1.1 Replace pitch client-side password check with server-side verification
- Retire static in-page hash validation for protected pitch pages.
- Use short-lived server-issued access token/session model.

Acceptance:
- No security decision based purely on client-side hash logic.

### P1.2 Publish hub subprocessor & transfer register
- Public list with service, purpose, region/transfer mechanism.
- Include Supabase, Resend, GCP, Azure/Microsoft and others in hub path.

Acceptance:
- Public page linked from hub privacy notice.

### P1.3 Define and publish retention schedule
- Token and audit/event retention windows documented.
- Deletion/expiry behavior aligned in implementation docs.

Acceptance:
- Retention table available and referenced by support/ops.

## P2 (Next 1-2 weeks)

Goal: Operationalize compliance for enterprise readiness.

### P2.1 DPA/commercial legal pack
- Final customer DPA template and processor terms bundle.

### P2.2 DSAR and incident runbooks
- Data request handling flow (identity verification, SLA, ownership).
- Breach process with notification timelines and escalation chain.

### P2.3 Versioned legal-change governance
- Track legal doc version + effective date.
- Add release checklist item for legal-impacting changes.

## 4. Risks and Mitigations

- Risk: Legal text changed by marketing/legal after implementation  
Mitigation: keep pages structured with clear section anchors and straightforward HTML edits.

- Risk: Analytics visibility drops when pre-consent loading is disabled  
Mitigation: explicitly document consent-safe analytics approach and review with marketing.

- Risk: Mixed product states (pitch vs client hub auth)  
Mitigation: complete P1.1 before expanding sensitive pitch usage.

## 5. Release Order

1. P0.1 legal pages
2. P0.2 entry-point notices
3. P0.3 email legal footer
4. P0.4 analytics consent hardening
5. P0.5 smoke validation

## 6. Ownership

- Engineering: implementation and deployment
- Marketing: copy refinement and tone
- Legal counsel: legal approval/sign-off (required before final production legal freeze)

