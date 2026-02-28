# GA4 Consent Proof Playbook

Last updated: 2026-02-28
Owner: Engineering + Marketing

## 1. Scope

This playbook is the production evidence checklist for consent-managed GA4 tracking across AgentFlow web journeys.

Covered surfaces:
- Marketing pages (`/`, `/founders.html`, `/our-approach.html`, `/our-story.html`, `/discovery-call.html`)
- Access pages (`/access`, `/access/client`, `/my-access`)
- Client Hub SPA (`/clienthub/*`)
- Co-Pilot Quiz SPA (`/assess/*`)
- Pitch pages (`/p/*`)

## 2. Tracking IDs

- Marketing + access + client-hub: `G-LHY2J56X46`
- Assess (Co-Pilot Quiz): `G-CJ8RCLCKQJ`

## 3. Consent Control

- Consent manager: Termly (`website-uuid: dc7c6ad3-3c44-4541-b5e2-146d10618f63`) on marketing/access/clienthub/assess.
- Pitch pages use explicit local consent controls and only load GA after accept.

## 4. Release Evidence Steps

For each covered surface:

1. Open a fresh private browser profile.
2. Open DevTools Network tab.
3. Confirm no GA hit before consent interaction.
4. Accept consent.
5. Confirm GA requests appear (`googletagmanager`, `google-analytics`, `collect`).
6. Navigate within SPA routes and confirm route-level pageview activity is emitted.
7. Reopen consent preferences and decline/withdraw.
8. Confirm GA requests stop for subsequent navigation.

## 5. Artefacts to Attach to Release Notes

- Screenshots of Network tab for pre-consent and post-consent states.
- Termly consent-log screenshot/export for validation window.
- Commit SHAs for each deployed repo.
- Build/deploy IDs (Cloud Build links).

## 6. Change Gate

Any change to analytics tags, consent manager scripts, or measurement IDs must include:
- Updated docs (`CURRENT_STATE`, `STATUS`, governance docs)
- Re-run of this playbook
- Release note evidence bundle
