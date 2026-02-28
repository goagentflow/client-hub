# GA4 + Consent UAT Results (Production)

Date: 2026-02-28  
Decision: `GO`  
Owners: Engineering, Product, Marketing

## 1. Scope Verified

1. Marketing pages
- `/`
- `/founders.html`
- `/our-approach.html`
2. Access pages
- `/access/`
- `/access/client/`
- `/my-access/`
3. Assess SPA
- `/assess/`
4. Client Hub SPA
- `/clienthub/*` (post-login route tracking)

## 2. Final Outcomes

1. Pre-consent: no non-essential analytics collection.
2. Post-consent: GA requests fired correctly (`gtag` requests successful, `g/collect` returning `204`).
3. Post-withdrawal: analytics collection stopped.
4. SPA route tracking: verified on route navigation for both Assess and Client Hub.
5. UX regression: no blocker found in sign-in CTAs, access forms, and consent controls.
6. Legal links: `/hub-terms.html`, `/hub-privacy.html`, `/hub-cookie-notice.html` reachable with correct content.
7. Consent preferences entry-point is available and functional.

## 3. Blocker Closure

1. `g/collect` `503` reports were confirmed as environment artefacts; clean-browser verification returned `204`.
2. Client Hub post-login route tracking was manually verified and passed.
3. No remaining blockers in the GA4 + consent release gate.

## 4. Release Evidence Summary

1. Network evidence captured for pre-consent, post-consent, and post-withdrawal states.
2. Termly consent controls exercised in production.
3. Production deployment version aligned with current SHAs and build metadata at test time.

