# AgentFlow Client Hub - UAT Plan (Live Features Release Gate)

**Last updated:** 26 February 2026  
**Owner:** UAT Lead (Business) + Product Owner + Engineering Lead  
**Goal:** Confirm that currently live functionality is safe, understandable, and ready for real client use.

---

## 1. Purpose

This plan is the release gate for **what is live now**, not aspirational roadmap items.

It is designed to answer 3 questions before launch:

1. Can staff run the full workflow end-to-end (create hub -> configure -> invite -> message -> share docs -> manage access)?
2. Can clients reliably and clearly use the portal (overview, docs, messages, welcome content)?
3. Are key failure and edge cases handled safely (permissions, revocation, domain controls, invalid input, notification flow)?

---

## 2. Scope

## 2.1 In Scope (Live and Testable Now)

- Staff hub lifecycle: create hub (pitch/client), edit basic details, publish/unpublish portal, delete hub.
- Portal configuration: welcome headline/message, portal access method (email/password/open), portal contacts add/remove.
- Client access management: invite client, re-invite, revoke pending invite, remove active client access.
- Message feed (staff + portal): post/list messages, audience visibility card, portal teammate access request.
- Document workflow: staff upload/manage/delete documents, portal download + preview (signed URLs).
- Status updates: staff create/list updates, portal read latest and history.
- Client overview UX: welcome text, status update card, recent docs card, message summary card.
- Email notifications: staff message -> client contact notifications; client message -> staff notifications.

## 2.2 Out of Scope (Do Not Block Launch)

- Meetings, Decisions, Performance, Instant Answers, History pages (shown as Coming Soon).
- Message threading endpoints (legacy 501 thread routes).
- Document engagement analytics endpoint (`/documents/:docId/engagement` is 501).
- Portal proposal comments (501).
- Portal invite endpoint (`/hubs/:hubId/portal/invite`) used by older People/Share flows.
- Questionnaire and portal meetings placeholder routes.

If any out-of-scope placeholder behavior fails, log it as `Known Non-Launch Scope`, not a launch blocker.

---

## 3. Entry Criteria (Before UAT Starts)

All must be true:

1. Latest frontend and middleware are deployed to production/staging candidate.
2. Database migrations are applied.
3. Supabase storage bucket is configured and reachable for document upload/download.
4. Resend email key is configured in runtime environment.
5. UAT test accounts are prepared (see Section 4).
6. At least one test hub exists for each hub type (`pitch`, `client`).

---

## 4. UAT Test Accounts and Data Pack

## 4.1 Required Accounts

- `STAFF_OWNER`: staff account with full access, creates hubs.
- `STAFF_SECONDARY`: second staff account to verify staff visibility and staff notifications.
- `CLIENT_PRIMARY`: authorized portal contact at the target client domain.
- `CLIENT_SECONDARY`: second authorized client contact at same domain.
- `CLIENT_OUTSIDER`: email at a different domain (for domain restriction tests).

## 4.2 Test Data Fixtures

- Small PDF (<1 MB)
- Large PDF (~49 MB)
- Oversize file (>50 MB)
- PNG/JPEG image
- DOCX and PPTX files
- Disallowed extension test file (for example `.exe` or mismatched extension/MIME)
- Reusable message bodies: normal sentence, whitespace-only message, 10,001-character message, HTML/script-like text payload.

## 4.3 Naming Convention

For repeatable runs, create hubs using:

- `UAT-ClientHub-YYYYMMDD-A`
- `UAT-PitchHub-YYYYMMDD-A`

This keeps logs and screenshots auditable.

---

## 5. Severity and Release Exit Criteria

## 5.1 Severity Rules

- `P0 Critical`: security, data loss, broken core workflow, wrong audience visibility, access revocation failure.
- `P1 High`: major workflow broken but workaround exists.
- `P2 Medium`: degraded UX, incorrect copy, non-blocking behavior issue.
- `P3 Low`: cosmetic issues.

## 5.2 Exit Criteria to Approve Launch

1. 100% of `P0` test cases pass.
2. 100% of `P1` test cases pass or have signed workaround accepted by Product Owner.
3. No unresolved security/permission defects.
4. Email notifications verified both directions (staff->client and client->staff).
5. Revocation tests verified (removed/revoked users lose access immediately).
6. UAT sign-off document completed (Section 17).

---

## 6. Suite A - Hub Creation and Lifecycle

| ID | Priority | Test | Steps | Expected Result |
|---|---|---|---|---|
| HUB-001 | P0 | Create client hub | Staff -> Hub List -> Create New Hub -> select Client Hub -> fill company/contact name/contact email -> submit | Hub is created, appears in list, opens successfully |
| HUB-002 | P0 | Required field validation | Repeat HUB-001 with one required field empty | UI prevents submit or API returns clear validation error |
| HUB-003 | P1 | Domain seed correctness | Create hub using corporate contact email (not Gmail) | Invite domain guidance uses that corporate domain |
| HUB-004 | P1 | Hub list search/filter | Use search and status filters | Matching hubs appear correctly, no cross-hub confusion |
| HUB-005 | P0 | Publish portal | In hub -> Client Portal -> Publish | Portal marked live and accessible to invited clients |
| HUB-006 | P0 | Unpublish portal lockout | Unpublish while client has active session | Client portal immediately becomes unavailable/blocked |
| HUB-007 | P0 | Delete hub | In Client Portal section -> Delete Hub -> confirm | Hub removed from list and cannot be accessed via old staff/portal links |
| HUB-008 | P1 | Portal preview (staff) | In Client Portal -> Preview as Client | Staff can preview portal safely without changing publish state |

---

## 7. Suite B - Welcome Content and Portal Presentation

| ID | Priority | Test | Steps | Expected Result |
|---|---|---|---|---|
| WEL-001 | P0 | Welcome headline/message authoring | Staff updates welcome headline and message in Client Portal section | Client portal overview shows updated copy |
| WEL-002 | P1 | Welcome fallback | Remove welcome text and reload portal | Overview remains readable (no broken layout/placeholder artifacts) |
| WEL-003 | P1 | Greeting personalization | Client logs in with known contact name | Greeting uses client name (not generic "there") |
| WEL-004 | P2 | One-time welcome modal behavior | First portal visit then refresh | Welcome modal appears first time, then dismissed per local state |

---

## 8. Suite C - Client Access Management (Invite, Revoke, Remove)

| ID | Priority | Test | Steps | Expected Result |
|---|---|---|---|---|
| ACC-001 | P0 | Invite allowed-domain client | Staff -> Invite Client -> same-domain email + name + access level | Invite created, pending invite visible, email sent |
| ACC-002 | P0 | Block domain mismatch invite | Invite email from different domain | Validation error shown (`Email domain must match ...`) |
| ACC-003 | P0 | First-time invite requires name | Invite brand-new email without name | Request blocked with clear error |
| ACC-004 | P1 | Re-invite existing contact | Re-invite same email after revoke/expiry | Invite resets to pending without duplicate records |
| ACC-005 | P0 | Revoke pending invite | Revoke from Client Access card | Invite disappears from pending list, access artifacts revoked |
| ACC-006 | P0 | Remove active client | Remove active client member | Client access removed immediately, member is revoked |
| ACC-007 | P0 | Removed client cannot re-enter | Removed client tries portal access using old device/session | Access denied; must be re-authorized |
| ACC-008 | P1 | Add portal contact directly | Use Portal Access card to add contact | Contact appears in authorized list; can verify via email flow |
| ACC-009 | P1 | Remove portal contact directly | Remove contact from Portal Access card | Contact removed; related sessions/verifications revoked |
| ACC-010 | P1 | Duplicate portal contact handling | Add same contact twice | Second add returns conflict-safe message; no duplicate row |

---

## 9. Suite D - Portal Access Methods and Authentication

| ID | Priority | Test | Steps | Expected Result |
|---|---|---|---|---|
| AUTH-001 | P0 | Email-gated happy path | Access method = Email -> client enters email -> receives code -> verifies | Portal token issued, portal opens |
| AUTH-002 | P0 | Wrong verification code | Enter wrong code | Login rejected safely, no access granted |
| AUTH-003 | P1 | Expired code | Wait >10 minutes before verifying | Code rejected as invalid/expired |
| AUTH-004 | P1 | Device token reuse | Verify once, close browser, return with remember token | Device verification grants access without new code |
| AUTH-005 | P0 | Switch away from email revokes artifacts | Change method Email -> Open or Password | Existing email verification/device artifacts are invalidated |
| AUTH-006 | P1 | Open access behavior | Set method = Open; open portal link in new session | Portal access available without gate |
| AUTH-007 | P1 | Password mode behavior | Set method = Password and test with configured password hash (if available) | Correct password grants access, incorrect denied |
| AUTH-008 | P1 | Password mode without configured hash | If no password hash exists, run test and document behavior | Behavior documented; if insecure/unexpected, raise P1 bug |
| AUTH-009 | P0 | Unpublished hub access | Attempt portal access when hub is unpublished | Access denied/unavailable |

Note: AUTH-007 depends on having a hub record with a valid password hash configured.

---

## 10. Suite E - Messaging (Staff + Client)

| ID | Priority | Test | Steps | Expected Result |
|---|---|---|---|---|
| MSG-001 | P0 | Staff send message | Staff sends message from `/hub/:hubId/messages` | Message appears in staff feed and client feed |
| MSG-002 | P0 | Client send message | Client sends message from `/portal/:hubId/messages` | Message appears in both feeds |
| MSG-003 | P0 | Staff notification email on client message | Client sends message | Staff recipients receive notification email |
| MSG-004 | P0 | Client notification email on staff message | Staff sends message | Client contacts receive notification email |
| MSG-005 | P1 | Whitespace-only message blocked | Try sending only spaces | Send button disabled or API rejects with validation |
| MSG-006 | P1 | Over-length message blocked | Try >10,000 chars | API rejects with clear validation |
| MSG-007 | P1 | HTML/script payload safety | Send `<script>` style content | Content rendered as plain text; no script execution |
| MSG-008 | P0 | Audience visibility card correctness | Open messages as staff and client | Card shows client contacts + Agent Flow staff readers |
| MSG-009 | P1 | Name quality in audience list | Ensure contacts with stored names show names first | Name shown, with email context; no duplicate noisy labels |
| MSG-010 | P1 | Access request from portal | Client submits teammate access request in message audience card | Success response shown; staff notification email sent |
| MSG-011 | P1 | Access request domain restriction | Request teammate at different domain | Validation error returned |
| MSG-012 | P1 | Access request duplicate handling | Request teammate already approved | Returns "already has access" style response |
| MSG-013 | P1 | Rate limit staff posting | Send >20 staff messages in 1 minute | API returns `RATE_LIMITED` gracefully |
| MSG-014 | P1 | Rate limit portal posting | Send >12 portal messages in 1 minute | API returns `RATE_LIMITED` gracefully |
| MSG-015 | P0 | Hub mismatch security | Use token from Hub A against Hub B messages endpoint | Access denied |

---

## 11. Suite F - Documents (Upload, Preview, Download, Governance)

| ID | Priority | Test | Steps | Expected Result |
|---|---|---|---|---|
| DOC-001 | P0 | Upload client-visible document with summary | Staff uploads PDF in Client tab with summary | Upload succeeds; visible in portal docs list |
| DOC-002 | P0 | Client-visible summary enforcement | Upload client-visible doc without summary | Upload blocked with clear validation |
| DOC-003 | P1 | Internal summary optional | Upload internal doc without summary | Upload succeeds |
| DOC-004 | P1 | MIME allowlist enforcement | Upload disallowed type | Upload rejected with validation |
| DOC-005 | P1 | Extension/MIME mismatch enforcement | Use mismatched extension and MIME | Upload rejected with validation |
| DOC-006 | P1 | File size limit | Upload file >50MB | Upload rejected safely |
| DOC-007 | P1 | Staff download endpoint | Staff downloads document | Signed URL is returned and file opens |
| DOC-008 | P0 | Portal download visibility enforcement | Client tries to download internal-only doc | Access denied/not found |
| DOC-009 | P0 | Portal download allowed doc | Client downloads client-visible doc | File downloads successfully |
| DOC-010 | P1 | Preview PDF | Open preview dialog for PDF | PDF renders inline |
| DOC-011 | P1 | Preview image | Open preview dialog for image | Image renders inline |
| DOC-012 | P1 | Preview office file | Open preview dialog for DOCX/PPTX | Office viewer renders (or fallback panel shown safely) |
| DOC-013 | P1 | Preview expiry handling | Keep preview open until expiry window | UI prompts refresh and successfully reloads |
| DOC-014 | P1 | Delete document cleanup | Staff deletes doc | Doc removed from list; cannot be downloaded anymore |
| DOC-015 | P1 | Bulk set visibility validation | Bulk move to client where one doc lacks summary | Request rejected with missing-summary count |
| DOC-016 | P1 | Bulk delete | Bulk delete selected docs | All selected docs removed from lists |
| DOC-017 | P1 | Portal cards include context | Portal docs cards show category + summary snippet | Clients can scan docs quickly |
| DOC-018 | P2 | Portal cannot upload docs | Client checks documents section | No client upload control presented |

---

## 12. Suite G - Status Updates and Overview Cards

| ID | Priority | Test | Steps | Expected Result |
|---|---|---|---|---|
| STU-001 | P0 | Staff creates status update | Staff submits period/completed/in progress/next/needed/onTrack | Saved and listed newest first |
| STU-002 | P1 | Required field validation | Omit required status update fields | Validation errors shown |
| STU-003 | P1 | Field length validation | Exceed period or text field limits | Validation errors shown |
| STU-004 | P0 | Portal sees latest status update | Client opens overview | Latest status shown with correct content |
| STU-005 | P1 | History visibility | Expand prior updates/history | Previous entries visible and scrollable |
| STU-006 | P0 | Append-only behavior | Attempt to find edit/delete controls | No edit/delete path exposed in UI |
| STU-007 | P1 | Overview document summary card | Portal overview shows recent docs card | Latest docs visible, link to all docs works |
| STU-008 | P1 | Overview messages summary card | Portal overview shows counts + unread + latest snippet | Counts are plausible and link opens messages |

---

## 13. Suite H - Access Revocation and Data Integrity

| ID | Priority | Test | Steps | Expected Result |
|---|---|---|---|---|
| REV-001 | P0 | Revoke pending invite revokes future access | Revoke pending invite then attempt login as that email | No access granted |
| REV-002 | P0 | Remove active client revokes current access | Remove active client while logged in elsewhere | Existing session loses access on next action/refresh |
| REV-003 | P0 | Unpublish revokes all portal access | Unpublish and test with previously authorized client | All portal clients blocked |
| REV-004 | P0 | Hub delete hard-removes data access | Delete hub then try old URLs/API actions | 404/unavailable for both staff and portal |
| REV-005 | P1 | CRM sync spot check (if DB access available) | Perform invite/remove/unpublish/delete and inspect CRM activity logs | Corresponding activity entries exist; failures are logged non-blocking |

---

## 14. Email Notification Verification Checklist

For each item, capture inbox evidence (screenshot with timestamp):

1. Staff -> client message email delivered to each authorized client contact.
2. Client -> staff message email delivered to active staff recipients.
3. Portal teammate access request email delivered to staff recipients.
4. Invite email delivered after staff invite.

Also check:

- Subject line is understandable.
- CTA link opens the correct hub route.
- No obvious HTML/template corruption.

---

## 15. Regression Guardrail Checks (Fast Daily Smoke)

Run this short pack each day during UAT window:

1. Create hub, publish, invite 1 client.
2. Client logs in and sends message.
3. Staff replies.
4. Staff uploads one client doc with summary.
5. Client previews and downloads it.
6. Staff removes client access.
7. Client confirms access revoked.

If any step fails, halt same-day sign-off until triaged.

---

## 16. Evidence and Reporting Template

For each failed case, log:

- Test ID
- Environment URL
- Hub ID
- Staff/client email used
- Timestamp (UTC)
- Screenshot/video link
- Browser/device
- Actual vs expected result
- Severity (P0-P3)

---

## 17. Final Sign-off Template

**Release Candidate:** `________________________`  
**Date:** `________________________`

- P0 pass rate: `____ / ____`
- P1 pass rate: `____ / ____`
- Open defects by severity: `P0 __ | P1 __ | P2 __ | P3 __`
- Email notifications verified both directions: `Yes / No`
- Access revocation verified: `Yes / No`

**UAT Lead Decision:** `Go / No-Go`  
**Notes:** `____________________________________________________________`

**Product Owner Sign-off:** `________________________`  
**Engineering Lead Sign-off:** `________________________`

---

## 18. Quick Notes for UAT Team

- Focus on the left-nav items that are live now: Overview, Messages, Documents (and Client Portal on staff side).
- Coming Soon pages are intentionally non-launch scope.
- If a test touches placeholder functionality by mistake, mark as `Out of Scope` and continue.
- Capture evidence for every P0/P1 case even when passing.
