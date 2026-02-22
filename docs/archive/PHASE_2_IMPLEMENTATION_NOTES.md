# Phase 2 Implementation Notes

**Status:** Complete (November 2025)
**Purpose:** Documents implementation decisions, mock data scenarios, and known limitations for the Phase 2 Client Hubs wireframe.

---

## 1. Implementation Decisions

### 1.1 Navigation Structure

**Client Hub Sidebar (Staff View):** 7 navigation items
- Overview, Projects, Decisions, Documents, Messages, Meetings, Intelligence

**Client Hub Sidebar (Client View):** 8 navigation items
- Overview, Messages, Meetings, Documents, Decisions, Performance, Instant Answers, History

**Pitch Hub Sidebar (Staff View):** 7 navigation items
- Overview, Client Portal, Proposal, Videos, Documents, Messages, Meetings

**Pitch Hub Sidebar (Client View):** 6 navigation items
- Overview, Proposal, Videos, Documents, Meetings, Questionnaire

**Decisions:**
- Staff sidebar limited to max 7 items per GOLDEN_RULES
- "Intelligence" consolidates Relationship Health + Expansion Radar into tabbed view
- Client sidebar allowed 8 items to accommodate core collaboration features (Messages, Meetings) alongside Phase 2 features

### 1.2 Hub Type Differentiation

- Badge in header: "Client Hub" (sage green) vs "Client View" (blue)
- Same URL pattern `/portal/:hubId/...` for both hub types
- Hub type determined by `hubType: "pitch" | "client"` discriminator on Hub entity
- No separate URL structure to avoid route migration complexity

### 1.3 Decision Queue Related Resources

Decisions can link to related resources (documents, messages, meetings). Implementation:
- `relatedResource: { type: "document" | "message" | "meeting", id: string }`
- Links navigate to the appropriate portal section
- Uses `getResourceUrl()` helper in `DecisionItemCard.tsx`

### 1.4 Staff Decisions ("Waiting on Client")

Staff view for tracking items awaiting client action:
- **Route:** `/hub/:hubId/decisions`
- **Features:** Pending/Completed tabs, summary cards, create decision requests
- **Removed:** "Remind" button deferred pending API contract (v2)
- **Date handling:** `toISODate()` converts date picker values to ISO timestamps (`YYYY-MM-DDT00:00:00Z`)

Component architecture (all files <300 lines per GOLDEN_RULES):
```
src/components/
├── StaffDecisionsSection.tsx (orchestrator)
└── staff-decisions/
    ├── decision-utils.ts (formatDate, getDaysUntilDue, toISODate)
    ├── DecisionSummaryCards.tsx
    ├── StaffDecisionCard.tsx
    ├── DecisionEmptyState.tsx
    └── CreateDecisionDialog.tsx
```

### 1.5 AI Features (Mock Implementation)

All AI-powered features use mock data in the wireframe:
- **Instant Answers:** Pre-defined question/answer pairs
- **Meeting Prep/Follow-up:** Static summaries with realistic content
- **Performance Narratives:** Mock KPI summaries
- **Relationship Health:** Pre-calculated scores and drivers

These follow the async job pattern (POST creates job, GET polls for result) defined in the API spec, but return mock data immediately.

---

## 2. Mock Data Scenarios

### 2.1 Example Client Hub: Meridian Digital (hub-3)

A fully-populated client hub demonstrating typical client relationship data:

**Company Profile:**
- Name: Meridian Digital
- Primary Contact: Alex Chen (alex@meridiandigital.co)
- Relationship: Active client with multiple projects

**Projects:**
1. Website Redesign (65% complete, On Track)
2. Q1 Marketing Campaign (45% complete, At Risk - near deadline)

**Documents (8 total):**
| Document | Category | Purpose |
|----------|----------|---------|
| Signed Master Services Agreement | Contract | Legal foundation |
| NDA - Mutual Non-Disclosure | Contract | Confidentiality |
| Website Redesign - Scope of Work | Brief | Project definition |
| Q1 Campaign - Scope of Work | Brief | Project definition |
| Brand Guidelines | Reference | Client assets |
| Discovery Session Notes | Brief | Initial findings |
| Homepage Hero Design Options | Deliverable | Awaiting approval |
| Monthly Status Report - November | Deliverable | Progress report |

**Meetings (5 total):**
| Meeting | Date | Type |
|---------|------|------|
| Contract Signing & Onboarding | 45 days ago | Completed with transcript |
| Discovery Workshop | 42 days ago | Completed with transcript |
| Design System Review | 21 days ago | Completed with transcript |
| Weekly Status Call | 5 days ago | Completed with transcript |
| Weekly Status Call | Future | Scheduled |

**Message Threads (4 total):**
- Re: Homepage Hero Concepts (unread)
- Weekly Status Update - Nov 25
- Q1 Campaign Brief Feedback
- Invoice Query - October

**Decision Queue:**
- Approve Homepage Hero Design (open, due in 3 days)
- Sign off Q1 Campaign Messaging (open, due in 7 days)

### 2.2 Test Accounts

| Email | Password | Role | Hub Access |
|-------|----------|------|------------|
| hamish@goagentflow.com | password123 | Staff | All hubs |
| alex@meridiandigital.co | password123 | Client | hub-3 (Meridian Digital) |
| sarah@whitmorelaw.co.uk | password123 | Client | hub-1 (Whitmore & Associates) |

---

## 3. Known Wireframe Limitations

### 3.1 Placeholder Features

| Feature | Current State | Requires |
|---------|---------------|----------|
| Performance tab | Empty state with explanation | Backend AI integration + data sources |
| History tab | Empty state with explanation | Backend event aggregation |
| Instant Answers | Mock responses | Backend AI integration |
| Meeting transcripts | Mock text | Teams Premium license + Graph API |
| AI summaries | Mock content | Backend AI integration |

### 3.2 Data Not Persisted

All data operations in the wireframe use in-memory mock data:
- Form submissions show success toasts but don't persist
- Decisions can be approved/declined (updates local state only)
- File uploads are simulated

### 3.3 Features Requiring Backend

| Feature | Dependency |
|---------|------------|
| Real authentication | MSAL + Azure AD configuration |
| Hub conversion | Atomic backend operation |
| Relationship Health scoring | AI analysis of communications |
| Expansion Radar detection | AI analysis of communications |
| Email integration | Microsoft Graph Mail API |
| Meeting scheduling | Microsoft Graph Calendar API |
| File storage | SharePoint/OneDrive integration |

---

## 4. File Structure (Phase 2 Additions)

```
src/
├── components/
│   ├── client-decision-queue/      # Decision Queue components
│   ├── client-hub-overview/        # Client Hub overview widgets
│   ├── client-instant-answers/     # AI Q&A interface
│   ├── conversion/                 # Hub conversion wizard
│   ├── expansion-radar/            # Expansion opportunity cards
│   ├── projects/                   # Project management UI
│   └── relationship-health/        # Health dashboard
├── hooks/
│   ├── use-client-intelligence.ts  # AI feature hooks
│   ├── use-decisions.ts            # Decision queue hooks
│   ├── use-leadership.ts           # Portfolio hooks
│   ├── use-projects.ts             # Project CRUD hooks
│   └── use-relationship-intelligence.ts
├── services/
│   ├── client-intelligence/        # AI service functions
│   ├── hub-conversion.service.ts   # Conversion logic
│   ├── leadership.service.ts       # Portfolio aggregation
│   └── project.service.ts          # Project CRUD
└── types/
    ├── project.ts                  # Project types
    ├── client-intelligence.ts      # AI response types
    └── relationship-intelligence.ts # Health/expansion types
```

---

## 5. API Patterns Implemented

### 5.1 Async Job Pattern (AI Features)

```typescript
// 1. Create job
POST /hubs/{hubId}/instant-answer/requests
Response: { answerId, status: "queued", pollIntervalHint: 2000 }

// 2. Poll for result
GET /hubs/{hubId}/instant-answer/{answerId}
Response: { status: "ready" | "queued" | "error", answer?, evidence? }
```

### 5.2 Decision State Machine

```
Valid transitions:
  open → in_review → approved
  open → in_review → declined
  open → approved (fast-track)
  open → declined (fast-track)
  in_review → open (return to queue)

Terminal states: approved, declined (no further transitions)
```

### 5.3 Project Filtering

```
GET /hubs/{hubId}/documents                    # All documents
GET /hubs/{hubId}/documents?projectId={id}     # Assigned to project
GET /hubs/{hubId}/documents?projectId=unassigned  # Not assigned
```

---

## 6. Testing Notes

### 6.1 Testing the Client Hub

1. Log in as `alex@meridiandigital.co` / `password123`
2. You'll see the Client Hub overview for Meridian Digital
3. Navigate through: Messages, Meetings, Documents, Decisions
4. Try approving/declining a decision in the Decision Queue

### 6.2 Testing Hub Conversion (Staff)

1. Log in as `hamish@goagentflow.com` / `password123`
2. Go to Hub List, find a pitch hub with "Won" status
3. Click "Convert to Client Hub"
4. Complete the conversion wizard

### 6.3 Testing Leadership Portfolio (Admin)

1. Log in as `hamish@goagentflow.com` / `password123`
2. Navigate to `/leadership`
3. View portfolio overview, at-risk clients, expansion candidates

---

*This document captures implementation decisions for future reference. See `PHASE_2_CLIENT_HUBS.md` for the full specification.*
