# AgentFlow Pitch Hub — Project Status

**Last Updated:** 19 February 2026

---

## Summary

The **frontend wireframe** is feature-complete for Phase 1 (Pitch Hubs) and Phase 2 (Client Hubs). The **middleware API layer** (104 endpoints) is built with full auth, access control, and public portal endpoints. **MSAL JWT authentication** (Azure AD) is code-complete — awaiting Azure AD app registration setup to test end-to-end.

---

## Recently Completed

### P1 Senior Review Fixes (COMPLETE — 13 priorities)
- [x] Portal JWT auth with signed hub-bound tokens (jose, HS256)
- [x] Staff-only guards (requireStaffAccess) on all non-portal endpoints
- [x] Public endpoints: portal-meta, password-status, verify-password
- [x] Rate limiting, timing-safe password comparison, non-enumerating responses
- [x] Frontend portal token injection with positive endpoint allowlist
- [x] Hub list search/filter/sort with backwards-compatible filter parsing
- [x] Leadership events schema (nullable hub_id, separate LeadershipEvent DTO)
- [x] Cross-hub milestone vulnerability fix
- [x] FormData Content-Type fix, handleShareClick event handler fix
- [x] 56 tests passing across 3 test files
- [x] Senior dev approved after 3 review rounds

### MSAL JWT Authentication — Phases 2+3 (CODE COMPLETE)
- [x] Azure AD RS256 JWT validation via jose JWKS (middleware)
- [x] Dual audience acceptance (GUID and api:// URI formats)
- [x] Staff detection via `roles` claim (mandatory deployment prerequisite)
- [x] `GET /auth/me` endpoint returning user profile + hub access stub
- [x] Lazy Supabase adapter (Proxy) — prevents crash when DEMO_MODE=false
- [x] MSAL.js frontend integration (@azure/msal-browser)
- [x] `loginWithMsal()`, `getAccessToken()`, `fetchCurrentUser()` in auth.service
- [x] `setTokenGetter` wired in App.tsx (production mode only)
- [x] DEMO_MODE=false deployment gate removed
- [x] 10 new JWT auth tests with scoped JWKS mocking (66 total tests passing)
- [x] MSAL auth plan approved by senior dev after 4 review rounds

---

## ACTION REQUIRED: Azure AD App Registration (Hamish)

Before MSAL auth can be tested end-to-end, two app registrations must be created in the Azure Portal. This is Phase 1 of the MSAL plan — a manual step that cannot be done in code.

**What needs to happen:**
1. Create **backend** app registration (`AgentFlow Middleware`)
   - Expose API with delegated scope `access_as_user`
   - Create mandatory `Staff` app role
   - Assign Staff role to AgentFlow staff users
2. Create **frontend** app registration (`AgentFlow Frontend`)
   - SPA platform, auth code flow with PKCE
   - API permission: `api://{backendId}/access_as_user`
3. Set environment variables:
   - Frontend: `VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID`, `VITE_AZURE_BACKEND_CLIENT_ID`
   - Middleware: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`

**Guide:** `docs/middleware/MSAL_AUTH_IMPLEMENTATION_PLAN.md` (Phase 1 section)

---

## What's Done

### Phase 1: Pitch Hubs (COMPLETE)

#### Staff View
- [x] Login (demo credentials + MSAL code ready)
- [x] Hub List — paginated grid with filters, search, create
- [x] Hub Overview — activity feed, notes, engagement stats
- [x] Client Portal management — curate what clients see
- [x] Proposal — document viewer with version history
- [x] Videos — upload, record, manage, engagement tracking
- [x] Documents — upload, list, download, embed
- [x] Messages — email integration placeholder
- [x] Meetings — scheduling, recordings, transcripts
- [x] Questionnaire — Microsoft Forms placeholder

#### Client View (Portal)
- [x] Overview — welcome page, hero content, quick links
- [x] Proposal — document viewer with commenting
- [x] Videos — watch shared videos
- [x] Documents — view, download, upload back
- [x] Messages — conversation history
- [x] Meetings — view, join, request
- [x] Questionnaire — complete forms
- [x] People — team members and access

### Phase 2: Client Hubs (COMPLETE — UI/Wireframes)

#### Hub Conversion
- [x] Multi-step conversion wizard
- [x] Hub type discriminator (`hubType: "pitch" | "client"`)
- [x] Visual differentiation between hub types

#### Staff-Facing Features
- [x] Projects — create, manage, milestones, artifact assignment
- [x] Relationship Health Dashboard — AI-powered scoring
- [x] Expansion Radar — opportunity cards with evidence
- [x] Staff Decision Queue — state machine management
- [x] Intelligence Section — tabbed health + expansion view

#### Client-Facing Features
- [x] Client Onboarding — welcome modal for converted hubs
- [x] Instant Answers — AI Q&A
- [x] Decision Queue — pending items with status actions
- [x] Performance — KPI narratives
- [x] History — institutional memory timeline
- [x] Risk Alerts

#### Leadership Portfolio (Admin-Only)
- [x] Portfolio overview — revenue, pipeline, health metrics
- [x] Client grid — health vs expansion matrix
- [x] RBAC with RequireAdmin guard

### Middleware API (104 endpoints)
- [x] Express/TypeScript foundation with correlation IDs, structured logging
- [x] Auth middleware: portal JWT + Azure AD JWT + demo headers
- [x] Hub CRUD with search/filter/sort (live, backed by Supabase)
- [x] Staff guards on all non-portal endpoints
- [x] Public endpoints with rate limiting
- [x] Portal auth flow (password verify, token issuance)
- [x] GET /auth/me endpoint
- [x] ~60 stub endpoints (501) for Phase 2+ features
- [x] 66 tests passing (contract, portal-auth, public-routes, jwt-auth)

### Documentation
- [x] P1 Plan (v13, all 13 priorities, senior dev approved)
- [x] MSAL Auth Plan (v4, senior dev approved)
- [x] API Specification, Architecture v3, ADRs, MVP PRD
- [x] Implementation Roadmap

---

## What Still Needs Doing

### Next: Production Readiness

| Priority | Item | Status |
|----------|------|--------|
| **P0** | Azure AD app registrations | ACTION: Hamish (see above) |
| **P0** | End-to-end MSAL testing | Blocked by app registrations |
| **P0** | SharePoint adapter | Replace Supabase with SharePoint for DEMO_MODE=false |
| **P1** | OBO token exchange | Needed for Graph API calls (AZURE_CLIENT_SECRET) |
| **P1** | Implement stub endpoints | Messages, meetings, members, etc. |
| **P2** | AI endpoints | Instant answers, health scoring, expansion radar |
| **P3** | CI pipeline with build gate | Add `vite build` to CI |

### Authentication & Security

| Priority | Item | Status |
|----------|------|--------|
| **P0** | MSAL integration | Code complete, awaiting app registration |
| **P0** | JWT validation | Code complete, tested with mocked JWKS |
| ~~P0~~ | ~~Portal JWT auth~~ | Done (P1 plan) |
| ~~P0~~ | ~~Staff access guards~~ | Done (P1 plan) |
| **P1** | Production security hardening | OWASP review |
| **P2** | Multi-tenant deployment | Tenant isolation testing |

---

## Architecture Snapshot

```
Frontend (React/Vite)
  ├── MSAL.js for Azure AD login (code ready, needs app reg)
  ├── setTokenGetter wired for production token flow
  ├── Portal JWT tokens for client hub access
  ├── Supabase direct (hubs, videos, documents) — CONNECTED
  └── Middleware API (auth, hubs, portal, events) — CONNECTED

Middleware (Express/Node.js) — 104 ENDPOINTS
  ├── Auth: portal JWT + Azure AD JWT + demo headers
  ├── Hub CRUD with search/filter/sort — LIVE
  ├── Public endpoints with rate limiting — LIVE
  ├── GET /auth/me — LIVE
  ├── Staff guards on all endpoints — LIVE
  ├── ~60 stub endpoints (501) — SCAFFOLDED
  └── 66 tests passing

External Services
  ├── Supabase (demo data layer) — CONNECTED
  ├── Microsoft Graph API — NOT YET (needs OBO)
  ├── SharePoint (production data layer) — NOT YET
  └── AI model — NOT YET
```

---

## Key Decisions Made

1. **Self-hosted middleware** — Express on customer infrastructure
2. **SharePoint hidden lists** — Data store in customer M365 tenant
3. **OBO auth flow** — On-Behalf-Of for Graph API delegation
4. **Supabase for demo** — Direct connection for dev; middleware for production
5. **jose for JWT validation** — Both portal (HS256) and Azure AD (RS256)
6. **Lazy Supabase adapter** — Proxy pattern prevents crash in DEMO_MODE=false
7. **Staff app roles mandatory** — Not optional; deployment prerequisite
8. **Async job pattern** — All AI endpoints use POST-to-create, GET-to-poll
