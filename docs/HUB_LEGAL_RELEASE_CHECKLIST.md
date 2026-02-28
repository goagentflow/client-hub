# Hub Legal/Compliance Release Checklist

Last updated: 2026-02-28
Owner: Engineering release lead
Use: Mandatory checks for releases touching hub auth, hub messaging/docs, or legal/user-data behavior

## 1. Required Checks (Go/No-Go)

1. Hub legal pages are live and reachable:
- `/hub-privacy.html`
- `/hub-terms.html`
- `/hub-cookie-notice.html`
- `/hub-subprocessors.html`

2. Hub entry points show legal notice links:
- `/access`
- `/access/client`
- `/my-access`
- client portal gates (email/password)

3. Hub emails include legal footer links (terms + privacy).
4. No secret or raw token logging introduced.
5. Input validation for public auth/recovery endpoints remains enforced.
6. Access recovery token flow remains opaque and one-time.
7. Retention controls are active (cleanup logs observed).
8. Consent behavior verified on impacted pages (no pre-consent non-essential analytics).
9. GA4 pageview tracking verified on SPA routes (`/clienthub/*`, `/assess/*`) after consent.
10. Termly consent log evidence captured for the release window.

## 2. Evidence to Attach in Release Notes

1. Test pass summary (middleware + frontend).
2. Route smoke checks for key public auth endpoints.
3. Screenshot or HTTP evidence for legal pages and links.
4. Consent validation notes for changed pages.
5. Termly consent-log export or screenshots for the validation session.

## 3. Mandatory Doc Updates for Legal-Impacting Changes

1. `docs/CURRENT_STATE.md`
2. `progress/STATUS.md`
3. Relevant legal/compliance docs in `docs/`

## 4. Approval

Release owner signs off only when all checks are complete and evidence is attached.

## 5. Latest Completed Record

Release window: 2026-02-28  
Decision: `GO`

Summary:

1. Consent + GA4 release gate passed (pre-consent, post-consent, withdrawal, SPA route tracking).
2. Legal links and consent preferences verified functional.
3. Evidence captured in `docs/GA4_CONSENT_UAT_RESULTS_2026-02-28.md`.
