# AgentFlow Pitch Hub — Project Status

**Last Updated:** 18 February 2026

---

## Summary

The **frontend wireframe** is feature-complete for both Phase 1 (Pitch Hubs) and Phase 2 (Client Hubs). Supabase integration is partially connected (hubs, videos, documents). The middleware foundation exists but has no functional endpoints yet. The project is ready for backend development.

---

## What's Done

### Phase 1: Pitch Hubs (COMPLETE)

#### Staff View
- [x] Login (demo credentials, no real MSAL yet)
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
- [x] Multi-step conversion wizard (Celebrate → Preview → First Project → Confirm)
- [x] Hub type discriminator (`hubType: "pitch" | "client"`)
- [x] Visual differentiation between hub types
- [x] Content lifecycle after conversion (proposal archived, questionnaire handled)

#### Staff-Facing Features
- [x] Projects — create, manage, milestones, artifact assignment
- [x] Relationship Health Dashboard — AI-powered scoring, trend, drivers
- [x] Expansion Radar — opportunity cards with evidence, confidence levels
- [x] Staff Decision Queue — state machine management
- [x] Intelligence Section — tabbed health + expansion view

#### Client-Facing Features
- [x] Client Onboarding — welcome modal for converted hubs
- [x] Instant Answers — AI Q&A with suggested question chips
- [x] Decision Queue — pending items with status actions
- [x] Performance — KPI narratives and recommendations
- [x] History — institutional memory timeline
- [x] Risk Alerts

#### Leadership Portfolio (Admin-Only)
- [x] Portfolio overview — revenue, pipeline, health metrics
- [x] Client grid — health vs expansion matrix
- [x] At-risk clients view
- [x] Expansion candidates view
- [x] RBAC with RequireAdmin guard

### Infrastructure & Patterns
- [x] React Query for data fetching with polling
- [x] Async job pattern for AI endpoints (POST creates → GET polls)
- [x] Feature flags for live vs mock data toggle
- [x] Role-based access control with route guards
- [x] Progressive disclosure navigation (max 7 staff / 6 client items)
- [x] Empty states for all new sections
- [x] Comprehensive type system

### Supabase Integration (Partial)
- [x] Hubs table — fetch, create, update
- [x] Videos table — list, filter by hub
- [x] Documents table — list, filter by hub
- [x] Password verification via RPC (hash never sent to frontend)
- [x] Feature flag toggle between live and mock data

### Documentation
- [x] Phase 2 Client Hubs specification
- [x] API Specification (all endpoints documented)
- [x] Middleware Architecture v3 Final
- [x] Architecture Decision Records
- [x] MVP PRD Summary
- [x] Implementation Roadmap
- [x] Git Workflow
- [x] Golden Rules, AGENTS.md canon

---

## What Still Needs Doing

### Backend / Middleware (NOT STARTED — Stephen's Domain)

| Priority | Item | Detail |
|----------|------|--------|
| **P0** | Microsoft Graph API integration | OBO flow, email/calendar/Teams access |
| **P0** | SharePoint data access layer | Hidden lists as data store |
| **P0** | MSAL authentication | Replace demo credentials with real SSO |
| **P0** | Hub CRUD endpoints | `/api/v1/hubs/*` — currently only health check exists |
| **P0** | Project endpoints | `/api/v1/hubs/{hubId}/projects/*` |
| **P0** | Document/Video endpoints | Full CRUD via middleware |
| **P1** | Message endpoints | Email integration via Graph API |
| **P1** | Meeting endpoints | Calendar + Teams integration |
| **P1** | Hub conversion endpoint | Atomic pitch→client conversion |
| **P1** | Decision Queue endpoints | State machine with audit trail |
| **P2** | AI: Instant Answers | RAG over hub data |
| **P2** | AI: Relationship Health scoring | Sentiment analysis, engagement scoring |
| **P2** | AI: Expansion Radar | Opportunity detection from comms |
| **P2** | AI: Meeting Prep/Follow-up | Meeting intelligence generation |
| **P2** | AI: Performance Narratives | KPI summaries |
| **P3** | Rate limiting & throttling | Graph API 429 handling |
| **P3** | PII scrubbing | Evidence excerpt sanitisation |
| **P3** | Data retention policies | Cache expiry for AI results |

### Frontend — Remaining Supabase Connections

| Priority | Item | Detail |
|----------|------|--------|
| **P1** | Proposals table | Connect proposal viewer to Supabase |
| **P1** | Members table | Team management from Supabase |
| **P1** | Messages table | Message history from Supabase |
| **P1** | Meetings table | Meeting data from Supabase |
| **P1** | Questionnaires table | Form data from Supabase |
| **P1** | Activity/engagement tables | Real activity feeds |
| **P2** | Projects table | When middleware serves project data |
| **P2** | Decision Queue table | When middleware serves decisions |

### Authentication & Security

| Priority | Item | Detail |
|----------|------|--------|
| **P0** | MSAL integration | Microsoft SSO for staff login |
| **P0** | JWT validation | Middleware auth middleware |
| **P1** | Domain-restricted invites | Client portal access control |
| **P1** | Production security hardening | OWASP top 10 review |
| **P2** | Multi-tenant deployment | Tenant isolation |

### Testing

| Priority | Item | Detail |
|----------|------|--------|
| **P1** | Playwright E2E tests | Conversion, routing, empty states, projects, decisions |
| **P1** | Unit tests | Type guards, service functions, hook behaviour |
| **P2** | Manual QA checklist | UX review against Phase 2 success criteria |

### Nice-to-Haves / Future

| Item | Detail |
|------|--------|
| Real-time notifications | WebSocket or SSE for live updates |
| Offline support | Service worker for intermittent connectivity |
| Analytics dashboard | Usage tracking beyond basic events |
| Mobile responsive polish | Currently functional but not optimised |
| Accounting integration | Xero/QuickBooks for invoice/payment data (V2 data source) |
| Project management integration | External PM tools for delivery metrics |

---

## Architecture Snapshot

```
Frontend (React/Vite)
  ├── Feature flags toggle mock ↔ live data
  ├── Supabase direct (hubs, videos, documents) ← CONNECTED
  └── Middleware API (everything else) ← NOT CONNECTED

Middleware (Express/Node.js) ← FOUNDATION ONLY
  ├── Health check endpoint ← WORKING
  ├── Correlation ID + logging ← WORKING
  └── All other endpoints ← NOT BUILT

External Services ← NOT INTEGRATED
  ├── Microsoft Graph API (email, calendar, Teams, files)
  ├── SharePoint (hidden lists as data store)
  ├── MSAL (authentication)
  └── AI model (sentiment, RAG, scoring)
```

---

## Key Decisions Made

1. **Self-hosted middleware** — Not Azure Functions; Express on customer infrastructure
2. **SharePoint hidden lists** — Data store co-located with customer M365 tenant
3. **OBO auth flow** — On-Behalf-Of for Graph API delegation
4. **Supabase for demo** — Direct connection for pitch demo hubs; middleware for production
5. **Feature flags** — Gradual migration from mock → Supabase → middleware
6. **Async job pattern** — All AI endpoints use POST-to-create, GET-to-poll pattern
