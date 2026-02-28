# GA4 + Consent UAT Plan (Production)

Last updated: 2026-02-28  
Owner: Engineering + Marketing + Legal Ops

## 1. Objective

Validate that:

1. GA4 is present across AgentFlow digital journeys.
2. Non-essential analytics are consent-controlled.
3. UX and core product functionality are not degraded.
4. Legal-document links and consent controls are visible and usable.

## 2. Scope

Included journeys:

1. Marketing pages:
- `https://www.goagentflow.com/`
- `https://www.goagentflow.com/founders.html`
- `https://www.goagentflow.com/our-approach.html`
- `https://www.goagentflow.com/our-story.html`
- `https://www.goagentflow.com/discovery-call.html`
2. Access pages:
- `https://www.goagentflow.com/access/`
- `https://www.goagentflow.com/access/client/`
- `https://www.goagentflow.com/my-access/`
3. Client Hub SPA:
- `https://www.goagentflow.com/clienthub/`
4. Assess SPA:
- `https://www.goagentflow.com/assess/`
5. Pitch pages:
- Known live links in `/p/*`

Measurement IDs:

1. Marketing/access/client-hub: `G-LHY2J56X46`
2. Assess: `G-CJ8RCLCKQJ`

## 3. Test Environment

1. Browser: Chrome stable (latest).
2. Use a fresh Incognito session per test block.
3. Open DevTools:
- Network tab
- Preserve log: ON
4. Optional: GA4 DebugView enabled.

## 4. Core Consent Tests (Per Surface)

Run the following sequence for each scoped surface:

1. Load page with no prior consent state.
2. Before any consent interaction, confirm:
- No `google-analytics.com/g/collect` request
- No unexpected tracking requests beyond consent manager bootstrap
3. Accept analytics consent via consent UI.
4. Confirm analytics requests appear:
- `googletagmanager.com/gtag/js`
- `google-analytics.com/g/collect`
5. Navigate (or route change in SPA).
6. Confirm additional pageview/event requests fire post-consent.
7. Open consent preferences and decline/withdraw analytics consent.
8. Refresh and navigate again.
9. Confirm no new analytics collection requests occur after withdrawal.

Pass criteria:

1. No analytics collection pre-consent.
2. Analytics collection begins only post-consent.
3. Analytics collection stops after consent withdrawal.

## 5. SPA Route Tracking Tests

## 5.1 Client Hub (`/clienthub/*`)

1. Accept consent.
2. Navigate routes:
- `/clienthub/login`
- `/clienthub/launcher`
- `/clienthub/hubs`
- `/clienthub/hub/{id}`
3. Confirm route-level pageview requests are sent.
4. Confirm no console errors.

## 5.2 Assess (`/assess/*`)

1. Accept consent.
2. Navigate routes:
- `/assess/`
- `/assess/assessment`
- `/assess/report/{run_id}` (or sample route)
3. Confirm route-level pageview requests are sent.
4. Confirm no console errors.

Pass criteria:

1. Route navigation emits analytics only when consent is granted.
2. No duplicated or broken navigation behavior observed.

## 6. UX/Functional Non-Regression Tests

## 6.1 Access UX

1. `/access`: both staff/client CTAs visible and clickable.
2. `/access/client`: can submit valid email request without UI break.
3. `/my-access`: valid token flow still loads cards; expired flow still shows recovery path.

## 6.2 Staff + Client Core Flow

1. Staff sign-in from homepage access flow still works.
2. Staff can create or open a hub.
3. Client can access via client flow and open assigned hub.

## 6.3 Pitch Flow

1. Pitch password gate still functions.
2. Consent banner appears and remains usable.
3. Proposal content still decrypts and renders after valid password.

Pass criteria:

1. No broken CTAs/forms/auth redirects.
2. No regressions in pitch/client/staff core journeys.

## 7. Legal Surface Validation

From each access page and at least one SPA journey, verify links resolve (HTTP 200 + correct content):

1. `/hub-terms.html`
2. `/hub-privacy.html`
3. `/hub-cookie-notice.html`
4. Consent preferences control is visible and opens UI when available.

Pass criteria:

1. Legal links are visible and functional at point-of-use.
2. Consent settings are accessible to end users.

## 8. Evidence Package (Required for Release Sign-off)

Capture and store:

1. Screenshots:
- Pre-consent network state
- Post-consent network state
- Post-withdrawal network state
2. One screenshot per major surface (`/`, `/access`, `/clienthub`, `/assess`, one `/p/*` page).
3. Termly consent log screenshot/export for test window.
4. Commit SHAs and Cloud Build IDs deployed.

## 9. Go/No-Go Checklist

Release is Go only if all are true:

1. Consent tests pass for all scoped surfaces.
2. SPA route tracking works only post-consent.
3. Core UX flows unaffected (staff/client/pitch).
4. Legal links + consent preferences are visible and functional.
5. Evidence package is attached to release notes.

## 10. Execution Record (2026-02-28)

Final status: `GO`

Validated outcomes:

1. Pre-consent: no non-essential analytics collection.
2. Post-consent: analytics requests fired successfully (`g/collect` `204`).
3. Post-withdrawal: analytics collection stopped.
4. SPA route tracking: verified for Assess and Client Hub route navigation.
5. UX non-regression: key sign-in paths, access forms, and consent controls remained functional.
6. Legal links: `/hub-terms.html`, `/hub-privacy.html`, `/hub-cookie-notice.html` confirmed reachable with correct content.

Detailed run record:

1. `docs/GA4_CONSENT_UAT_RESULTS_2026-02-28.md`
