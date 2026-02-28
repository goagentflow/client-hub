# UAT Plan: Pitch Hub — Staff-to-Client Flow

> **HISTORICAL DOCUMENT (pre-Phase 0b/2b).**
> This plan references `DEMO_MODE` and SharePoint-adapter assumptions that are no longer the active architecture.
> Use `docs/CURRENT_STATE.md` for live-vs-aspirational behavior and `docs/PRODUCTION_ROADMAP.md` for current sequencing.

## Context

We've just completed Phase 1 (Azure AD app registrations) and Phases 2+3 (MSAL auth code) are committed. This UAT plan covers the end-to-end pitch-to-client journey — what works today and what's still to come.

---

## What's Testable Today (Demo Mode)

The app currently runs in **DEMO_MODE=true** with Supabase mock data. Azure AD auth code is in place but needs the middleware running with real tokens to test fully.

---

## Scenario 1: Staff Creates & Sends a Pitch Hub

**As an AgentFlow staff member, I want to create a pitch hub and share it with a prospective client.**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in at `localhost:5173` | Azure AD login via MSAL popup/redirect, lands on dashboard |
| 2 | Click "Create Hub" | Form appears: company name, contact name, contact email |
| 3 | Fill in details, submit | New pitch hub created, appears in hub list |
| 4 | Open the hub | Hub detail page with tabs: Proposal, Videos, Documents, Questionnaire |
| 5 | Upload proposal PDF | **Currently returns 501 (not implemented)** — uploads are Phase B |
| 6 | Configure portal access | Set client password, toggle which sections are visible |
| 7 | Copy portal link | URL like `localhost:5173/portal/{hubId}` ready to send to client |

**What works now:** Steps 1-4, 6-7 (with demo data). Step 5 (file upload) is stubbed.

### Where Do Documents Go?

- **Today (demo):** Nowhere — upload endpoints return 501
- **Target (production):** SharePoint `HubFiles` document library, organised as:
  - `/hub-{hubId}/Proposal/` — proposal PDFs
  - `/hub-{hubId}/Documents/` — supporting docs
  - `/hub-{hubId}/Videos/` — video files
- **Metadata** (hub config, members, engagement tracking) goes into hidden SharePoint lists under `_AppConfig/`

---

## Scenario 2: Client Receives Link & Responds

**As a prospective client, I receive a pitch hub link and want to review the proposal and respond.**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open portal link from email | Password gate appears |
| 2 | Enter password provided by AgentFlow | Portal loads — sees only sections staff enabled |
| 3 | View proposal tab | Proposal PDF/content displayed |
| 4 | View videos tab | Embedded videos visible |
| 5 | Open questionnaire | Questions displayed (configured by staff) |
| 6 | Submit questionnaire responses | Responses saved, staff notified |

**What works now:** Steps 1-4 work with demo data. Questionnaire submission is functional. Client auth uses a hub-bound JWT (not Azure AD — clients don't need Microsoft accounts).

**Key point:** Client portal auth is completely separate from staff Azure AD auth. Clients just need the link + password.

---

## What's NOT Yet Built (Phase B — After Auth)

| Feature | Status | Dependency |
|---------|--------|------------|
| File upload to SharePoint | 501 stub | SharePoint adapter + OBO token (Phase 4) |
| SharePoint adapter (replacing Supabase) | Not started | OBO token exchange |
| Real document viewing from SharePoint | Not started | SharePoint adapter |
| Microsoft Forms integration | Planned | Graph API access |

---

## How to Run the UAT Today

1. **Start middleware:** `cd middleware && npm run dev` (runs on port 3001, DEMO_MODE=true)
2. **Start frontend:** `npm run dev` (runs on port 5173)
3. **Test staff login:** Should trigger Azure AD login (if DEMO_MODE is false) or bypass (if true)
4. **Walk through Scenario 1** steps 1-4, 6-7 with demo data
5. **Walk through Scenario 2** using a demo portal link

### To Test Real Azure AD Auth

Set `DEMO_MODE=false` in `middleware/.env` — this will require real Azure AD tokens. The frontend will show the Microsoft login popup, and the middleware will validate the JWT.

---

## Summary

- **Today:** You can test the full UI flow with demo data — hub creation, portal access, questionnaire
- **Auth works:** Azure AD is configured, MSAL code is committed, ready to test with `DEMO_MODE=false`
- **File uploads:** Not yet — this needs the SharePoint adapter (Phase B), which depends on OBO token exchange (Phase 4 of the auth plan)
- **Client experience:** Fully separate from Azure AD — just a link and password
