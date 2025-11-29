# Phase 2: Client Hub Expansion

**Document Version:** 1.1
**Last Updated:** November 2025
**Status:** Planning Complete — Ready for Implementation
**Revision:** Incorporated senior dev review feedback (routing, async patterns, type specifics, testing plan)

---

## Executive Summary

This document outlines the expansion of AgentFlow from Pitch Hubs (new business) to full Client Hubs (ongoing client service). When a prospect signs and becomes a client, their hub "switches on" additional features for client delivery.

**Key Principle:** The hub itself becomes part of the value proposition — clients should love the experience so much that it influences their decision to work with AgentFlow.

---

## 1. Objectives

### 1.1 Business Objective

AgentFlow Pitch Hub is a new business tool. The goal is that clients love their pitch experience so much that **the hub itself becomes part of the value proposition** — when they sign, the hub "switches on" additional features for ongoing client service. This creates stickiness and differentiates AgentFlow from competitors.

### 1.2 Product Objectives

1. **Seamless Pitch → Client transition**: Convert hub with a single action — no data loss, no re-setup
2. **Client-facing value that justifies the hub**: Instant answers, clear decision queue, meeting prep, performance summaries, relationship history
3. **Staff intelligence for proactive management**: Relationship Health scoring, Expansion Radar, multi-project management
4. **Leadership visibility**: Portfolio view showing all clients by health and expansion potential
5. **Developer handoff**: Complete API specification for Stephen's middleware

### 1.3 Technical Objectives

1. Add `hubType: "pitch" | "client"` discriminator to Hub entity
2. Build explicit conversion flow (won pitch → client hub)
3. Add Projects entity (multiple projects per client hub)
4. Create full wireframes for all new features
5. Extend API specification with all new endpoints

---

## 2. Core UX Principle: The First 30 Seconds

> **A user's first interaction with any screen must be super simple, immediately valuable, and meet a need right away. No confusion, no overwhelm, no "where do I start?"**

This principle applies to:
- Staff first opening a Client Hub (after conversion)
- Client first logging into their hub
- Every new section a user visits for the first time

**Implementation implications:**
- Every new section needs a designed empty state
- Navigation must use progressive disclosure (max 7 items visible)
- Onboarding flows for complex features (AI interfaces, conversion)
- Visual differentiation between hub types

---

## 3. What's New in Client Hubs

### 3.1 Carries Over from Pitch Hubs (Already Built)

- Proposal, Videos, Documents, Messages, Meetings, Questionnaire sections
- Hub overview with activity feed, notes, engagement stats
- Portal configuration (what clients see)
- Member/access management

### 3.2 New Client-Facing Features

| Feature | Description | First 30 Seconds |
|---------|-------------|------------------|
| **Instant Answers** | AI Q&A box ("Where are we on X?") | Suggested questions as clickable chips |
| **Decision Queue** | "Waiting on you" items list | Clear empty state explaining the feature |
| **Meeting Prep/Follow-up** | AI-generated briefs | Auto-appears before/after meetings |
| **Performance View** | KPI narrative summaries | Shows when project data available |
| **Institutional Memory** | History view | Timeline defaulting to "This year" |
| **Risk Alerts** | Proactive warnings | Framed as "Heads up" not "Warning" |

### 3.3 New Staff-Facing Features

| Feature | Description | First 30 Seconds |
|---------|-------------|------------------|
| **Projects** | Multiple workstreams per client | "Create first project" CTA |
| **Relationship Health** | Strong/Stable/At Risk scoring | Score with "Why this score?" explainer |
| **Expansion Radar** | Cross-sell opportunity detection | Evidence-backed suggestions |
| **Leadership Portfolio** | Cross-client roll-up view | Grid of clients by health/potential |

---

## 4. UX Requirements

### 4.1 Conversion Experience Design

The moment a pitch becomes a client is significant. Don't just "convert" — celebrate and guide.

**Multi-step flow:**
1. **Celebrate** — "Congratulations!" with visual celebration
2. **Preview** — Show what changes (before/after comparison)
3. **First Project** — Guided setup for initial project
4. **Confirm** — Final confirmation and redirect

### 4.2 Empty States

Every new section needs a designed empty state:

| Section | Empty State Message | Call to Action |
|---------|---------------------|----------------|
| Projects | "No projects yet. Create your first project to start tracking work." | "Create Project" button |
| Instant Answers | "Ask me anything about your project." + suggested questions | Clickable question chips |
| Decision Queue | "No decisions waiting on you. When your team needs input, you'll see it here." | None (informational) |
| Performance | "Performance insights will appear once project data is available." | Link to project setup |
| History | "Your relationship history will build over time." | None (informational) |
| Relationship Health | Initial score with "Why this score?" | Explainer link |
| Expansion Radar | "No expansion opportunities detected yet." | "How this works" link |

### 4.3 Progressive Disclosure for Navigation

**Staff sidebar (Client Hub):** Max 7 visible items
- Always show: Overview, Projects, Messages, Meetings, Documents
- Show with badge if has content: Relationship Health, Expansion Radar
- Collapse to "More": Videos, Questionnaire

**Client sidebar (Client Hub):** Max 6 visible items
- Always show: Overview, Decisions, Messages, Meetings, Documents
- Show conditionally: Instant Answers, Performance, History
- Hide/archive: Proposal, Questionnaire (completed)

**Content thresholds for badges:**
- Relationship Health: Show badge only after ≥5 activity events (otherwise score is meaningless)
- Expansion Radar: Show badge only when opportunities exist with confidence ≥ medium
- Decision Queue: Show count badge when pending items > 0

### 4.4 Visual Hub Type Differentiation

Staff switching between hubs must immediately know which type they're in:
- "Client Hub" badge in sidebar header
- Subtle accent color change (e.g., different header tint)
- **Keep existing URL pattern**: `/hub/:hubId` with `hubType` discriminator — do NOT introduce `/client/{id}` or `/pitch/{id}` (breaks existing routes/tests, unnecessary migration risk)

### 4.5 Client Transition Messaging

One-time welcome modal for clients accessing a converted hub:
- "Welcome to your Client Hub!"
- "Now that we're working together, you have access to new features..."
- Brief tour of key features
- Dismissal stored in localStorage

### 4.6 Content Lifecycle After Conversion

| Section | After Conversion |
|---------|------------------|
| Proposal | Archive — move to Documents, remove from nav |
| Questionnaire | Archive — show in History if completed, hide if not |
| Pitch activity | Preserve in History/Timeline |
| Internal notes | Keep but de-emphasize pitch-related notes |

---

## 5. Implementation Phases

### Phase 1: Foundation — Types & Data Model

**Files to modify:**
- `src/types/hub.ts` — Add `hubType: "pitch" | "client"`, `convertedAt`, `convertedBy`

**Files to create:**

`src/types/project.ts`:
- `Project { id, hubId, name, description, status, startDate, targetEndDate, lead, milestones[] }`
- `ProjectStatus: "active" | "on_hold" | "completed" | "cancelled"`
- `ProjectMilestone { id, name, targetDate, status, description }`
- Links to documents/messages/meetings via IDs

`src/types/client-intelligence.ts`:
- `InstantAnswer { id, question, answer, source, confidence: "high"|"medium"|"low", status: "queued"|"ready"|"failed" }`
- `DecisionItem { id, title, description, dueDate, status, assignee, reason }`
- `MeetingPrep { meetingId, summary, sinceLastMeeting[], decisionsNeeded[] }`
- `MeetingFollowUp { meetingId, summary, agreedActions[], decisions[] }`
- `PerformanceNarrative { hubId, period, summaries[], recommendations[] }`
- `InstitutionalMemoryEvent { date, event, significance }`
- `RiskAlert { id, type, severity: "high"|"medium"|"low", driver, title, description, recommendation, acknowledgedAt? }`

`src/types/relationship-intelligence.ts`:
- `RelationshipHealth { score: 0-100, status, trend, drivers[] }`
- `HealthDriver { type, weight, excerpt?, timestamp }`
- `ExpansionOpportunity { id, title, evidence[], confidence, status: "open"|"in_progress"|"won"|"lost", notes? }`
- `ExpansionEvidence { source, excerpt, date, evidenceRedacted: boolean }`

### Phase 2: Services & Mock Data

**Files to modify:**
- `src/services/hub.service.ts` — Add conversion, health, expansion functions
- `src/services/mock-data.ts` — Add client hub examples with all new data types

**Files to create:**
- `src/services/project.service.ts` — Project CRUD
- `src/services/client-intelligence.service.ts` — AI feature functions
- `src/services/leadership.service.ts` — Portfolio functions

### Phase 3: React Query Hooks

**Files to create:**
- `src/hooks/use-projects.ts`
- `src/hooks/use-client-intelligence.ts`
- `src/hooks/use-relationship-intelligence.ts`
- `src/hooks/use-leadership.ts`

**Files to modify:**
- `src/hooks/use-hubs.ts` — Add `useConvertToClientHub`

### Phase 4: Staff UI Components

**Key components:**
- `src/components/conversion/` — Multi-step conversion wizard
- `src/components/projects/` — Project management UI
- `src/components/relationship-health/` — Health dashboard
- `src/components/expansion-radar/` — Opportunity cards with evidence
- `src/components/ClientHubOverviewSection.tsx` — Modified overview

### Phase 5: Client-Facing UI Components

**Key components:**
- `src/components/client-onboarding/` — Welcome modal
- `src/components/client-instant-answers/` — AI Q&A with suggestions
- `src/components/client-decision-queue/` — Decision items with actions
- `src/components/client-performance/` — KPI narratives
- `src/components/client-history/` — Relationship timeline

### Phase 6: Leadership Portfolio View

**Files to create:**
- `src/pages/LeadershipPortfolio.tsx`
- `src/components/leadership/` — Portfolio grid, filters, lists

### Phase 7: Routing Updates

**Files to modify:**
- `src/App.tsx` — Add `/leadership` route
- `src/pages/HubDetail.tsx` — Add client hub routes
- `src/pages/PortalDetail.tsx` — Add client-facing routes
- `src/pages/HubList.tsx` — Add "Pitch Hubs" | "Client Hubs" tabs

### Phase 8: API Specification & Documentation

**Files to modify:**
- `docs/API_SPECIFICATION.md` — Add all new endpoints
- `.cursorrules`, `README.md`, `CLAUDE.md` — Update scope

---

## 6. API Endpoints for Stephen

### Hub Conversion

```
POST   /hubs/{hubId}/convert
       — Convert pitch to client hub (MUST be idempotent)
       — Request: { initialProjectName?: string }
       — Response: { hub: Hub, archiveSummary: { proposalArchived, questionnaireArchived } }
       — Migration: Archive proposal → Documents, questionnaire → History, set hubType="client"
```

**Note:** Consider `POST /hubs/{hubId}/convert/rollback` for recovery in early phases (internal only).

### Relationship Intelligence

```
GET    /hubs/{hubId}/relationship-health
       — Response: { score: 0-100, status, trend, drivers: [{ type, weight, excerpt?, timestamp }], lastCalculated }

GET    /hubs/{hubId}/expansion-opportunities
       — Response: { opportunities: [{ id, title, evidence[], confidence, status }] }

PATCH  /hubs/{hubId}/expansion-opportunities/{id}
       — Request: { status: "open"|"in_progress"|"won"|"lost", notes?: string }
```

### Projects

```
GET    /hubs/{hubId}/projects                   — List projects (supports pagination)
POST   /hubs/{hubId}/projects                   — Create project
GET    /hubs/{hubId}/projects/{projectId}       — Get project
PATCH  /hubs/{hubId}/projects/{projectId}       — Update project
DELETE /hubs/{hubId}/projects/{projectId}       — Delete project
```

### Client Intelligence (Async Pattern for AI)

AI-powered endpoints use async pattern to handle latency:

```
POST   /hubs/{hubId}/instant-answer
       — Request: { question: string }
       — Response: { answerId: string, status: "queued" }

GET    /hubs/{hubId}/instant-answer/{answerId}
       — Response: { status: "queued"|"ready"|"failed", answer?, source?, confidence? }
       — UI should poll until status="ready" or show "preparing..." state

GET    /hubs/{hubId}/instant-answer/latest
       — Returns most recent answers for this hub (cached)
```

```
GET    /hubs/{hubId}/decision-queue             — Get pending decisions
PATCH  /hubs/{hubId}/decision-queue/{id}        — Update decision status

GET    /hubs/{hubId}/meetings/{id}/prep         — Get meeting prep (may be async)
GET    /hubs/{hubId}/meetings/{id}/follow-up    — Get meeting follow-up (may be async)

GET    /hubs/{hubId}/performance                — Get performance narrative
       — Query params: ?projectId=...
       — Response includes { status: "ready"|"generating" }

GET    /hubs/{hubId}/history                    — Get institutional memory
       — Query params: ?page=1&pageSize=20&type=...&fromDate=...&toDate=...

GET    /hubs/{hubId}/risk-alerts                — Get risk alerts
PATCH  /hubs/{hubId}/risk-alerts/{id}/acknowledge — Acknowledge alert
```

### Leadership (Staff Role Required)

```
GET    /leadership/portfolio                    — Get portfolio overview
GET    /leadership/clients                      — Get clients grid (health vs expansion)
GET    /leadership/at-risk                      — Get at-risk clients
GET    /leadership/expansion                    — Get expansion candidates

All leadership endpoints:
- Require: staff role + internal admin scope
- No portal/client role access
- Include: { dataStaleTimestamp } for freshness indicator
```

---

## 7. Middleware Assumptions for Stephen

### 7.1 Relationship Health Scoring

**Inputs (from Microsoft 365):**
- Email sentiment and response times
- Meeting attendance and participation
- Escalation frequency
- Invoice/payment status
- Project delivery metrics

**Output:** Score (0-100), Status (Strong/Stable/At Risk), Trend, Drivers

**Open questions:**
- Which AI model for sentiment analysis?
- How to weight different factors?
- How often to recalculate?

### 7.2 Expansion Radar

**Inputs:**
- Email and chat content mentioning needs/challenges
- Meeting transcripts
- Project scope discussions

**Output:** Opportunities with evidence excerpts, confidence levels, suggested talk tracks

**Open questions:**
- How to map detected needs to AgentFlow services?
- How to avoid false positives?
- Privacy considerations for evidence excerpts?

### 7.3 Instant Answers

**Approach:**
- Query structured project data first (fast, reliable)
- Fall back to captured communications if needed (slower, less certain)
- Flag responses as "confirmed" vs "inferred"

**Open questions:**
- Response latency targets?
- How to handle "I don't know" gracefully?
- Context window management for large histories?

### 7.4 Privacy & Data Handling

**PII Scrubbing:**
- Evidence excerpts shown in Expansion Radar must be scrubbed of sensitive PII
- Consider `evidenceRedacted: boolean` flag when full excerpt cannot be shown
- Client-facing surfaces (Instant Answers) need stricter filtering than staff-facing

**Data Retention:**
- Define retention policies for AI-generated content
- Cached answers should expire (suggested: 24h for instant answers, 7d for performance narratives)

### 7.5 Rate Limiting & Performance

**AI Endpoint Considerations:**
- Instant Answer requests should be rate-limited per user/hub
- Consider queueing mechanism for high-traffic periods
- Performance narratives should be pre-generated on schedule, not on-demand

**Graph API Rate Limits:**
- Microsoft Graph has throttling limits — middleware must handle 429 responses gracefully
- Batch requests where possible to reduce API calls

### 7.6 Data Source Feasibility

**V1 (Available Now):**
- Email sentiment and response times (Graph API)
- Meeting attendance (Graph API)
- Document engagement (tracked in hub)
- Message activity (tracked in hub)

**V2 (Requires Additional Integration):**
- Invoice/payment status — requires accounting system integration (Xero, QuickBooks)
- Project delivery metrics — requires project management tool integration or manual entry
- Escalation frequency — can be inferred from email patterns, but dedicated tagging is more reliable

**Recommendation:** Start with V1 data sources. Design UI to gracefully show "No data available" for V2 metrics. Plan V2 integrations as separate milestone.

---

## 8. Estimated Scope

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Types | 3 | 2 |
| Services | 3 | 2 |
| Hooks | 4 | 1 |
| Staff Components | ~20 | 3 |
| Client Components | ~15 | 3 |
| Pages | 1 | 3 |
| Documentation | 1 | 4 |
| **Total** | **~47** | **~18** |

---

## 9. Risk Considerations

### Technical Risks

1. **Component Size** — Extract sub-components early to stay under 300 lines
2. **Mock Data Complexity** — Start simple, iterate on realism
3. **Navigation Complexity** — Ensure consistent hub-type logic everywhere
4. **Pattern Consistency** — Follow existing service/hook patterns exactly

### Middleware/API Risks

5. **AI Latency** — Async pattern adds complexity; ensure UI handles "preparing..." states gracefully
6. **Rate Limiting** — Graph API throttling could impact Relationship Health calculations during peak usage
7. **Data Source Gaps** — V2 data sources (invoices, project metrics) may not be available; UI must degrade gracefully
8. **PII Exposure** — Evidence excerpts in Expansion Radar could leak sensitive information; scrubbing is critical

### UX Risks

9. **Empty State Neglect** — Every section MUST have designed empty state before feature dev
10. **First 30 Seconds Failure** — Test each key entry point rigorously
11. **Cognitive Overload** — Monitor nav item count, implement progressive disclosure
12. **Conversion Anticlimax** — Make conversion feel significant, not just a button click
13. **AI Intimidation** — Instant Answers needs onboarding, not empty text box

---

## 10. Testing Plan

### 10.1 Playwright E2E Scenarios

**Conversion Flow:**
- `conversion.spec.ts` — Staff can complete full conversion wizard
- Test: Navigate to won pitch → Click convert → Complete all steps → Verify hub type changed
- Test: Conversion is idempotent (re-converting already converted hub shows appropriate message)

**Hub Type Routing:**
- `hub-type-routing.spec.ts` — Correct features shown per hub type
- Test: Pitch hub shows proposal section, no projects
- Test: Client hub shows projects section, archived proposal
- Test: Navigation item count respects progressive disclosure limits

**Client Portal Transition:**
- `client-transition.spec.ts` — Client experiences after conversion
- Test: Client sees welcome modal on first visit to converted hub
- Test: Modal dismissal persists (localStorage)
- Test: New client features (Decision Queue, Instant Answers) are accessible

**Empty States:**
- `empty-states.spec.ts` — All sections render appropriately when empty
- Test: Each new section shows designed empty state
- Test: Empty states have correct CTAs where applicable

**Leadership Views:**
- `leadership.spec.ts` — Portfolio view access and rendering
- Test: Staff with admin role can access `/leadership`
- Test: Portfolio grid renders with client cards
- Test: Filters work correctly

### 10.2 Unit Test Priorities

**Type Guards:**
- `isPitchHub()` / `isClientHub()` — discriminator functions work correctly

**Service Functions:**
- `convertToClientHub()` — returns expected structure
- `getRelationshipHealth()` — handles missing data gracefully
- Health score calculation when activity count < threshold

**Hook Behavior:**
- Query key factories produce correct keys
- Mutation invalidates correct queries after conversion

### 10.3 Manual Testing Checklist

- [ ] Conversion flow feels celebratory, not bureaucratic
- [ ] Hub type is visually obvious within 2 seconds
- [ ] Navigation doesn't exceed 7 items (staff) / 6 items (client)
- [ ] All empty states are helpful, not just "No data"
- [ ] AI interfaces have clear "thinking" states
- [ ] Badge thresholds work (no badges on insufficient data)

---

## 11. Success Criteria

Phase 2 is complete when:

1. Staff can convert a won pitch to a Client Hub via guided wizard
2. Client Hubs show Projects, Relationship Health, and Expansion Radar
3. Clients see Instant Answers, Decision Queue, Performance, and History
4. Leadership can view portfolio grid with health/expansion dimensions
5. All new sections have designed empty states
6. Navigation uses progressive disclosure (max 7 staff / 6 client items)
7. API specification is updated with all new endpoints
8. Documentation is updated for Stephen's middleware development

---

*This is a wireframe prototype. All features are visual placeholders with mock data. Real functionality requires Stephen's middleware implementation.*
