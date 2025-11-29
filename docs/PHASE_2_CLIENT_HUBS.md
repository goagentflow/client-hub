# Phase 2: Client Hub Expansion

**Document Version:** 1.3
**Last Updated:** November 2025
**Status:** Planning Complete — Ready for Implementation
**Revision:** Final polish — added 409 responses, async job SLA fields, filter semantics, freshness metadata, explicit evidence rules, audit fields

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
```typescript
Project {
  id: string
  hubId: string
  name: string
  description?: string
  status: ProjectStatus
  startDate: string // ISO date
  targetEndDate?: string // ISO date
  lead?: string // user ID
  milestones: ProjectMilestone[]
}
ProjectStatus: "active" | "on_hold" | "completed" | "cancelled"
ProjectMilestone { id, name, targetDate, status, description }
```

**Project Associations** — Add `projectId?: string` to existing types:
- `src/types/document.ts` — `Document.projectId?: string`
- `src/types/video.ts` — `Video.projectId?: string`
- `src/types/message.ts` — `Message.projectId?: string`
- `src/types/meeting.ts` — `Meeting.projectId?: string`

This enables filtering artifacts by project and rolling up views per workstream.

`src/types/client-intelligence.ts`:
```typescript
// Async AI Job Pattern
InstantAnswerRequest { id: string, hubId: string, question: string, createdAt: string }
InstantAnswerResponse {
  id: string
  status: "queued" | "ready" | "error"
  question: string
  answer?: string
  source?: string
  confidence?: "high" | "medium" | "low"
  evidence?: Evidence[]
  createdAt: string
  completedAt?: string
}

// Decision Queue (full schema)
DecisionItem {
  id: string
  hubId: string
  title: string
  description?: string
  dueDate?: string // ISO date
  requestedBy: string // user ID
  assignee?: string // user ID
  status: DecisionStatus
  relatedResource?: { type: "message" | "document" | "meeting", id: string }
  createdAt: string
  updatedAt: string
}
DecisionStatus: "open" | "in_review" | "approved" | "declined"
DecisionTransition { fromStatus: DecisionStatus, toStatus: DecisionStatus, comment?: string, changedBy: string, changedAt: string }

// Meeting Intelligence (async)
MeetingPrepRequest { meetingId: string, status: "queued" | "ready" | "error" }
MeetingPrep {
  meetingId: string
  status: "queued" | "ready" | "error"
  summary?: string
  sinceLastMeeting?: string[]
  decisionsNeeded?: string[]
  generatedAt?: string
}
MeetingFollowUp {
  meetingId: string
  status: "queued" | "ready" | "error"
  summary?: string
  agreedActions?: string[]
  decisions?: string[]
  generatedAt?: string
}

// Performance (async)
PerformanceNarrative {
  hubId: string
  projectId?: string
  period: string
  status: "queued" | "ready" | "error"
  summaries?: string[]
  recommendations?: string[]
  generatedAt?: string
}

InstitutionalMemoryEvent { date: string, event: string, significance: "high" | "medium" | "low" }
RiskAlert { id, type, severity: "high"|"medium"|"low", driver, title, description, recommendation, acknowledgedAt?, acknowledgedBy? }
```

`src/types/relationship-intelligence.ts`:
```typescript
RelationshipHealth {
  hubId: string
  score: number // 0-100
  status: "strong" | "stable" | "at_risk"
  trend: "improving" | "stable" | "declining"
  drivers: HealthDriver[]
  lastCalculated: string // ISO timestamp
}
HealthDriver { type: string, weight: number, excerpt?: string, timestamp: string }

ExpansionOpportunity {
  id: string
  hubId: string
  title: string
  confidence: "high" | "medium" | "low"
  status: "open" | "in_progress" | "won" | "lost"
  evidence: Evidence[]
  notes?: string
  createdAt: string
  updatedAt: string
}

// Shared Evidence type with PII handling
Evidence {
  id: string
  source: string // e.g., "email", "meeting_transcript", "document"
  sourceLink?: string // link to original resource
  excerpt: string // HTML-sanitized, PII-scrubbed
  redacted: boolean // true if excerpt was modified for privacy
  date: string
}
```

`src/types/user.ts` (modify existing):
```typescript
// Add admin permission for leadership access
UserRole: "staff" | "client"
UserPermissions {
  isAdmin: boolean // Required for /leadership/* endpoints
  canConvertHubs: boolean
  canViewAllHubs: boolean
}
// Full user type includes: User { id, email, displayName, role, permissions }
```

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

### Hub Conversion (Atomic Operation)

```
POST   /hubs/{hubId}/convert
       — Convert pitch to client hub
       — MUST be idempotent: calling twice returns same result, no side effects
       — Request: { initialProjectName?: string }
       — Response: {
           hub: Hub, // Includes convertedAt, convertedBy audit fields
           archiveSummary: {
             proposalArchived: boolean,
             proposalDocumentId?: string, // ID of archived proposal in Documents
             questionnaireArchived: boolean,
             questionnaireHistoryId?: string // ID of questionnaire in History
           },
           project?: Project, // If initialProjectName was provided
           alreadyConverted: boolean,
           audit: {
             convertedBy: string, // User ID who performed conversion
             convertedAt: string // ISO timestamp
           }
         }
```

**Conversion Operations (must be atomic):**
1. Archive proposal → Create document in Documents section with `category: "archived_proposal"`
2. Archive questionnaire → If completed, create entry in History; if incomplete, mark as hidden
3. Set `hubType = "client"`, `convertedAt = now()`, `convertedBy = currentUserId`
4. Optionally create first Project if `initialProjectName` provided

**Idempotency behavior:**
- If hub already converted (`hubType === "client"`), return existing state without modification
- Response includes `alreadyConverted: boolean` flag

```
POST   /hubs/{hubId}/convert/rollback
       — INTERNAL USE ONLY — Early-phase recovery
       — Requires: staff + isAdmin
       — Reverses conversion: restore proposal, unarchive questionnaire, set hubType="pitch"
       — NOT for production use — document as non-production endpoint
```

### Relationship Intelligence

```
GET    /hubs/{hubId}/relationship-health
       — Response: {
           score: 0-100,
           status: "strong" | "stable" | "at_risk",
           trend: "improving" | "stable" | "declining",
           drivers: [{ type, weight, excerpt?, timestamp }],
           lastCalculatedAt: string, // When score was computed
           lastRefreshedAt: string // When source data was fetched
         }

GET    /hubs/{hubId}/expansion-opportunities
       — Response: {
           opportunities: [{ id, title, evidence[], confidence, status }],
           lastCalculatedAt: string
         }

PATCH  /hubs/{hubId}/expansion-opportunities/{id}
       — Request: { status: "open"|"in_progress"|"won"|"lost", notes?: string }
       — Response includes audit fields: { updatedBy, updatedAt }
```

### Projects

```
GET    /hubs/{hubId}/projects
       — List projects (supports pagination)
       — Query params: ?status=active&page=1&pageSize=20

POST   /hubs/{hubId}/projects
       — Create project
       — Request: { name, description?, status?, startDate?, targetEndDate?, lead? }

GET    /hubs/{hubId}/projects/{projectId}
       — Get project with milestones

PATCH  /hubs/{hubId}/projects/{projectId}
       — Update project
       — Request: { name?, description?, status?, startDate?, targetEndDate?, lead? }

DELETE /hubs/{hubId}/projects/{projectId}
       — Soft delete (mark as cancelled, retain for history)
```

**Project-filtered artifact endpoints:**
All existing artifact endpoints accept optional `?projectId=` filter:
```
GET    /hubs/{hubId}/documents?projectId={projectId}
GET    /hubs/{hubId}/videos?projectId={projectId}
GET    /hubs/{hubId}/messages?projectId={projectId}
GET    /hubs/{hubId}/meetings?projectId={projectId}
```

**Filter Semantics:**
- No `projectId` param → Returns ALL artifacts (assigned + unassigned)
- `projectId={id}` → Returns only artifacts assigned to that project
- `projectId=unassigned` → Returns only UNASSIGNED artifacts (projectId is null/undefined)

**Note:** Use `"unassigned"` string value (not `null`) for URL-friendliness. Types use `EntityId | "unassigned"`.

**Assigning artifacts to projects:**
```
PATCH  /hubs/{hubId}/documents/{docId}         — { projectId?: string }
PATCH  /hubs/{hubId}/videos/{videoId}          — { projectId?: string }
PATCH  /hubs/{hubId}/messages/{msgId}          — { projectId?: string }
PATCH  /hubs/{hubId}/meetings/{meetingId}      — { projectId?: string }
```

### Client Intelligence (Async Job Pattern for AI)

All AI-powered endpoints use a consistent async job pattern:

**Pattern: POST creates job → GET polls for result**

**Job SLA Fields (included in all async responses):**
- `expiresAt`: ISO timestamp when job will be garbage collected (default: createdAt + 1 hour)
- `pollIntervalHint`: Suggested polling interval in milliseconds (default: 2000)
- `retryAfter`: If rate-limited, seconds to wait before retrying

#### Instant Answers
```
POST   /hubs/{hubId}/instant-answer/requests
       — Request: { question: string }
       — Response: {
           answerId: string,
           status: "queued",
           createdAt: string,
           expiresAt: string, // Job TTL
           pollIntervalHint: 2000 // Suggested poll interval (ms)
         }

GET    /hubs/{hubId}/instant-answer/{answerId}
       — Response: {
           id: string,
           status: "queued" | "ready" | "error",
           question: string,
           answer?: string,
           source?: string,
           confidence?: "high" | "medium" | "low",
           evidence?: Evidence[], // PII-scrubbed excerpts
           createdAt: string,
           expiresAt: string,
           completedAt?: string,
           error?: string // Only if status="error"
         }
       — Poll using pollIntervalHint until status="ready" or "error"
       — Show "preparing..." state while status="queued"

DELETE /hubs/{hubId}/instant-answer/{answerId}
       — Cancel a queued job (optional, returns 404 if already completed)
       — Response: { cancelled: boolean }

GET    /hubs/{hubId}/instant-answer/latest
       — Returns most recent answers for this hub (cached, max 10)
       — Query params: ?limit=10
```

#### Meeting Prep/Follow-up (Async)
```
POST   /hubs/{hubId}/meetings/{meetingId}/prep/generate
       — Triggers prep generation
       — Response: { status: "queued" }

GET    /hubs/{hubId}/meetings/{meetingId}/prep
       — Response: {
           meetingId: string,
           status: "queued" | "ready" | "error",
           summary?: string,
           sinceLastMeeting?: string[],
           decisionsNeeded?: string[],
           generatedAt?: string
         }

POST   /hubs/{hubId}/meetings/{meetingId}/follow-up/generate
       — Triggers follow-up generation (call after meeting ends)

GET    /hubs/{hubId}/meetings/{meetingId}/follow-up
       — Same pattern as prep
```

#### Performance Narratives (Async)
```
POST   /hubs/{hubId}/performance/generate
       — Request: { projectId?: string, period?: string }
       — Response: { narrativeId: string, status: "queued" }

GET    /hubs/{hubId}/performance/{narrativeId}
       — Response: {
           id: string,
           hubId: string,
           projectId?: string,
           period: string,
           status: "queued" | "ready" | "error",
           summaries?: string[],
           recommendations?: string[],
           generatedAt?: string
         }

GET    /hubs/{hubId}/performance/latest
       — Returns most recent narrative (cached)
```

### Decision Queue (Full Specification)

**Schema:** See `DecisionItem` in types section.

**State Machine:**
```
Valid transitions:
  open → in_review (staff picks up)
  open → approved (fast-track approval)
  open → declined (fast-track decline)
  in_review → approved
  in_review → declined
  in_review → open (return to queue)

Invalid transitions return 409 Conflict:
  approved → * (terminal state)
  declined → * (terminal state)
  Any other invalid transition

Response: { error: "Invalid transition", message: "Cannot transition from {current} to {requested}", validTransitions: [...] }
```

**Source Mapping (how decisions are created):**
- Tagged messages: Messages with `requiresDecision: true` flag
- Flagged documents: Documents with `awaitingApproval: true`
- Meeting action items: Action items marked `type: "decision_required"`
- Manual creation: Staff creates via UI

```
GET    /hubs/{hubId}/decision-queue
       — Query params: ?status=open&assignee=userId&page=1&pageSize=20
       — Response: { items: DecisionItem[], total: number, page: number }

POST   /hubs/{hubId}/decision-queue
       — Create decision item manually
       — Request: { title, description?, dueDate?, assignee?, relatedResource? }

GET    /hubs/{hubId}/decision-queue/{id}
       — Get single decision with transition history

PATCH  /hubs/{hubId}/decision-queue/{id}
       — Update decision (state transition)
       — Request: {
           status: DecisionStatus,
           reason?: string, // Why this decision was made
           comment?: string // Additional notes
         }
       — Only valid state transitions allowed (see state machine)
       — Invalid transitions return 409 Conflict
       — Creates audit log entry (DecisionTransition)
       — Response: {
           item: DecisionItem, // Includes updatedBy, updatedAt
           transition: DecisionTransition
         }

GET    /hubs/{hubId}/decision-queue/{id}/history
       — Get all transitions for a decision (audit trail)
```

### History & Alerts

```
GET    /hubs/{hubId}/history
       — Get institutional memory timeline
       — Query params: ?page=1&pageSize=20&type=...&fromDate=...&toDate=...
       — Types: "message", "meeting", "document", "decision", "milestone", "conversion"

GET    /hubs/{hubId}/risk-alerts
       — Get active risk alerts
       — Response: { alerts: RiskAlert[], acknowledgedCount: number }

PATCH  /hubs/{hubId}/risk-alerts/{id}/acknowledge
       — Acknowledge alert (removes from active list)
       — Request: { comment?: string }
       — Creates audit log entry
       — Response: {
           alert: RiskAlert,
           audit: {
             acknowledgedBy: string, // User ID
             acknowledgedAt: string, // ISO timestamp
             comment?: string
           }
         }
```

### Leadership (RBAC: Staff + Admin Required)

**Access Control:**
- Requires: `role === "staff" && permissions.isAdmin === true`
- Portal/client users: 403 Forbidden
- Staff without admin: 403 Forbidden with message "Leadership views require admin permissions"

```
GET    /leadership/portfolio
       — Get portfolio overview (aggregated metrics)
       — Response: {
           totalClients: number,
           atRiskCount: number,
           expansionReadyCount: number,
           avgHealthScore: number,
           dataStaleTimestamp: string // ISO timestamp of oldest data
         }

GET    /leadership/clients
       — Get clients grid (health vs expansion matrix)
       — Query params: ?sortBy=health|expansion|name&order=asc|desc
       — Response: {
           clients: [{
             hubId, name, healthScore, healthStatus, expansionPotential, lastActivity
           }],
           dataStaleTimestamp: string
         }

GET    /leadership/at-risk
       — Get at-risk clients (healthStatus === "at_risk")
       — Response: { clients: [...], dataStaleTimestamp }

GET    /leadership/expansion
       — Get expansion candidates (have opportunities with confidence ≥ medium)
       — Response: { clients: [...], opportunities: [...], dataStaleTimestamp }
```

**Data Freshness:**
- All responses include freshness metadata:
  - `dataStaleTimestamp`: ISO timestamp of the oldest data point used
  - `lastCalculatedAt`: ISO timestamp when metrics were last computed
  - `lastRefreshedAt`: ISO timestamp when data was last fetched from sources
- UI should show warning if `dataStaleTimestamp` > 24 hours old
- Refresh endpoint to trigger recalculation:

```
POST   /leadership/refresh
       — Triggers async recalculation of all portfolio metrics
       — Response: { status: "queued", estimatedCompletionMs: number }
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

### 7.4 Privacy & Data Handling (Contract)

**Evidence Type Contract:**
All evidence excerpts in API responses MUST use this structure:
```typescript
Evidence {
  id: string
  source: "email" | "meeting_transcript" | "document" | "chat"
  sourceLink?: string // Link to original (staff-only, omit for client-facing)
  excerpt: string // HTML-sanitized, PII-scrubbed text
  redacted: boolean // true if excerpt was modified for privacy
  date: string // ISO date
}
```

**PII Scrubbing Rules:**
1. **Always scrub:** Phone numbers, email addresses, physical addresses, financial account numbers
2. **Context-dependent:** Names of non-hub members, company names not in hub context
3. **Never show to clients:** Internal staff discussions, pricing discussions, competitor mentions

**Redaction Policy:**
- When PII is removed, set `redacted: true`
- Replace PII with `[REDACTED]` placeholder
- If entire excerpt would be redacted, omit the evidence item entirely

**HTML Sanitization (Server-side):**
- Strip all HTML tags except: `<b>`, `<i>`, `<em>`, `<strong>`
- Encode special characters
- Limit excerpt length to 500 characters

**Client vs Staff Evidence (EXPLICIT RULES):**

| Field | Staff-facing | Client-facing |
|-------|--------------|---------------|
| sourceLink | Include | **NEVER include** — always omit |
| Internal sources | Include | **NEVER include** — omit entire evidence item |
| Raw HTML | Sanitized | **NEVER include** — server sanitizes all excerpts |
| Redaction level | Light | Strict |

**Enforcement:**
- Server MUST strip `sourceLink` from all client-facing responses before sending
- Server MUST filter out evidence items from internal sources for client-facing responses
- Server MUST sanitize all HTML before including in any response (staff or client)
- Client should never receive raw HTML or unsanitized content

**Data Retention:**
- Instant Answers: Cache for 24 hours, then expire
- Performance Narratives: Cache for 7 days
- Meeting Prep/Follow-up: Cache until meeting + 7 days
- Evidence excerpts: Do not cache; regenerate from source on each request

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
- Test: Content lifecycle — proposal archived to Documents, questionnaire handled correctly
- Test: First project created if name provided during conversion

**Hub Type Routing:**
- `hub-type-routing.spec.ts` — Correct features shown per hub type
- Test: Pitch hub shows proposal section, no projects
- Test: Client hub shows projects section, archived proposal in Documents
- Test: Navigation item count respects progressive disclosure limits (max 7 staff / 6 client)

**Client Portal Transition:**
- `client-transition.spec.ts` — Client experiences after conversion
- Test: Client sees welcome modal on first visit to converted hub
- Test: Modal dismissal persists (localStorage)
- Test: New client features (Decision Queue, Instant Answers) are accessible
- Test: Domain-restricted invite still works (security)

**Empty States:**
- `empty-states.spec.ts` — All sections render appropriately when empty
- Test: Each new section shows designed empty state
- Test: Empty states have correct CTAs where applicable

**Projects:**
- `projects.spec.ts` — Project CRUD and artifact filtering
- Test: Create project with all fields
- Test: Assign document/video/message/meeting to project via PATCH
- Test: Filter artifacts by projectId shows correct subset
- Test: Delete project (soft delete) retains in history

**Intelligence (Async):**
- `intelligence.spec.ts` — Async job flows
- Test: Instant Answer shows "preparing..." while status="queued"
- Test: Instant Answer displays result when status="ready"
- Test: Instant Answer shows error state when status="error"
- Test: Stale cache behavior (answers older than 24h marked as stale)
- Test: Meeting prep generates and displays correctly

**Decision Queue:**
- `decision-queue.spec.ts` — State transitions and audit
- Test: Valid transitions only (open→in_review, in_review→approved, etc.)
- Test: Invalid transitions rejected with error message
- Test: Transition creates audit log entry
- Test: Filter by status and assignee works

**Leadership Views:**
- `leadership.spec.ts` — Portfolio view access and rendering
- Test: Staff with admin role can access `/leadership`
- Test: Staff without admin gets 403 with helpful message
- Test: Client/portal users get 403 (no access)
- Test: Portfolio grid renders with client cards
- Test: Filters work correctly
- Test: Data freshness indicator shows when stale (>24h)

### 10.2 Unit Test Priorities

**Type Guards:**
- `isPitchHub()` / `isClientHub()` — discriminator functions work correctly
- `isValidDecisionTransition()` — state machine enforcement

**Service Functions:**
- `convertToClientHub()` — returns expected structure, handles idempotency
- `getRelationshipHealth()` — handles missing data gracefully
- Health score calculation when activity count < threshold
- Decision transition validation

**Hook Behavior:**
- Query key factories produce correct keys with projectId filters
- Mutation invalidates correct queries after conversion
- Polling hooks stop when status !== "queued"

**Evidence/PII:**
- Evidence scrubbing removes PII correctly
- Redacted flag set when content modified
- Client-facing evidence omits sourceLink

### 10.3 Manual Testing Checklist

- [ ] Conversion flow feels celebratory, not bureaucratic
- [ ] Hub type is visually obvious within 2 seconds
- [ ] Navigation doesn't exceed 7 items (staff) / 6 items (client)
- [ ] All empty states are helpful, not just "No data"
- [ ] AI interfaces have clear "preparing..." states
- [ ] Badge thresholds work (no badges on insufficient data)
- [ ] Decision Queue shows valid action buttons per state
- [ ] Project filtering updates artifact lists immediately
- [ ] Leadership data freshness warning appears when appropriate

---

## 11. Implementation Guardrails

These guardrails ensure consistency with GOLDEN_RULES.md and existing patterns.

### 11.1 Types First

Before writing any services or components, complete all type definitions:

```
Order of implementation:
1. src/types/hub.ts — Add hubType, convertedAt, convertedBy
2. src/types/user.ts — Add UserPermissions with isAdmin
3. src/types/project.ts — New file with Project, ProjectStatus, ProjectMilestone
4. src/types/client-intelligence.ts — New file with all AI types
5. src/types/relationship-intelligence.ts — New file with health/expansion types
6. Modify existing types — Add projectId to Document, Video, Message, Meeting
```

### 11.2 Services & Hooks

**Query Key Factories:**
```typescript
// Pattern: serialize with projectId and pagination
const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (hubId: string, filters?: { status?: string; page?: number }) =>
    [...projectKeys.lists(), hubId, filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (hubId: string, projectId: string) =>
    [...projectKeys.details(), hubId, projectId] as const,
}
```

**Async Polling Pattern:**
```typescript
// Use React Query's refetchInterval for polling
const { data } = useQuery({
  queryKey: ['instant-answer', answerId],
  queryFn: () => getInstantAnswer(hubId, answerId),
  refetchInterval: (data) =>
    data?.status === 'queued' ? 2000 : false, // Poll every 2s while queued
  enabled: !!answerId,
})
```

**Cache Recent Results:**
- Cache instant answers per hub (max 10, expire after 24h)
- Use `staleTime` and `cacheTime` appropriately

### 11.3 UI Guardrails

**Feature Gating by Hub Type:**
```typescript
// Pattern: Use hubType discriminator for conditional rendering
const isClientHub = hub.hubType === 'client'

// In navigation
{isClientHub && <NavItem to="projects">Projects</NavItem>}
{!isClientHub && <NavItem to="proposal">Proposal</NavItem>}
```

**Progressive Disclosure Enforcement:**
```typescript
// Constants for nav limits
const MAX_STAFF_NAV_ITEMS = 7
const MAX_CLIENT_NAV_ITEMS = 6

// Validate in component
if (visibleNavItems.length > MAX_STAFF_NAV_ITEMS) {
  console.warn('Navigation exceeds maximum items')
}
```

**Component Size Limits:**
- Extract subcomponents from day one
- No file over 300 lines
- No function over 40 lines
- If a component grows large, split into: Container (logic) + Presentation (UI)

### 11.4 Observability

**Event Logging:**
Extend existing `trackHubViewed` pattern with new events:

```typescript
// New event types to add
type HubEventType =
  | 'hub_converted'
  | 'project_created'
  | 'project_updated'
  | 'decision_transitioned'
  | 'health_viewed'
  | 'expansion_viewed'
  | 'expansion_status_changed'
  | 'instant_answer_requested'
  | 'leadership_accessed'

// Log pattern
trackEvent({
  type: 'decision_transitioned',
  hubId,
  decisionId,
  fromStatus,
  toStatus,
  userId: currentUser.id,
  timestamp: new Date().toISOString(),
})
```

### 11.5 Error Handling

**Async Job Errors:**
- Display user-friendly error messages, not raw API errors
- Offer retry action for failed jobs
- Log errors for debugging

**State Transition Errors:**
- Decision Queue: Show which transitions are valid from current state
- Conversion: If partial failure, show what succeeded and what failed

---

## 12. Success Criteria

Phase 2 is complete when:

### Functional Requirements
1. Staff can convert a won pitch to a Client Hub via guided wizard (atomic, idempotent)
2. Client Hubs show Projects, Relationship Health, and Expansion Radar
3. Clients see Instant Answers, Decision Queue, Performance, and History
4. Leadership can view portfolio grid with health/expansion dimensions (admin-only)
5. Projects can be created and artifacts assigned via projectId
6. Decision Queue supports full state machine with audit trail
7. AI features show "preparing..." state and handle errors gracefully

### UX Requirements
8. All new sections have designed empty states
9. Navigation uses progressive disclosure (max 7 staff / 6 client items)
10. Hub type is visually obvious within 2 seconds

### Technical Requirements
11. All types defined before services/components
12. Query keys include projectId filters and pagination
13. Async polling stops when job completes
14. Evidence excerpts are PII-scrubbed with redacted flag
15. Event logging covers all new user actions

### Documentation Requirements
16. API specification updated with all new endpoints (async patterns documented)
17. Decision Queue state machine and source mapping documented
18. RBAC requirements documented for leadership endpoints
19. PII scrubbing contract codified

---

*This is a wireframe prototype. All features are visual placeholders with mock data. Real functionality requires Stephen's middleware implementation.*
