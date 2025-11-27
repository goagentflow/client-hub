# AgentFlow Pitch Hub - Production-Ready Front-End Plan

## Objective

**Transform the AgentFlow Pitch Hub wireframe into a production-ready React front-end that Stephen can connect to his Microsoft 365 middleware.**

When this plan is complete:
- Every button and interaction will be wired up and functional
- All data will flow through a service layer that can swap mock data for real API calls
- TypeScript interfaces will define the contract between front-end and middleware
- A comprehensive API specification will document exactly what endpoints Stephen needs to build
- The GUI will be ready for production use once middleware is connected

**Governance:** All implementation work will follow GOLDEN_RULES.md (Question → Plan → Approval → Code workflow, SRP, DRY, security by default, max 300 lines per file, max 40 lines per function).

---

## Architecture Principles (from Senior Review)

### Authentication Model
- **Front-end obtains tokens for the backend API scope only** (e.g., `api://agentflow-backend/access_as_user`) using MSAL Browser
- **Front-end NEVER requests Graph scopes directly** — no Graph tokens held by client
- **Middleware performs On-Behalf-Of (OBO)** to call Microsoft Graph using the backend token
- This keeps middleware stateless and Graph permissions under control

### Data Flow
```
User → MSAL (get backend token) → Front-end → Backend API → OBO → Microsoft Graph
```

### Role & Access Control
- Explicit route guards for staff vs client views
- Domain-restricted sharing (clients can only share within their email domain)
- Permission levels: Full Access, Proposal Only, Documents Only, specific items

---

## Phase 1: Audit & Document

**Goal:** Create a complete inventory of the current state — what works, what's placeholder, what's broken, and what each section needs from the middleware.

### Deliverable
`docs/FRONTEND_AUDIT.md` — A comprehensive audit document

### Tasks

#### 1.1 Audit Authentication & Routing
- Document current auth flow (localStorage-based demo)
- Define MSAL integration plan (backend API token only, no Graph tokens)
- Audit role-gating paths and redirect rules
- Document route guards needed for staff vs client separation
- Required: `src/routes/guards.tsx` or equivalent

#### 1.2 Audit Sharing & Access
- Identify UI points for: invite guest, generate share link, accept link, revoke access
- Document domain restriction logic
- Map permission levels to UI controls
- Required endpoints for B2B guest flow

#### 1.3 Audit Hub List Page
- Document data displayed (hub cards, status, dates)
- Identify all user actions (create hub, click hub, search, filter)
- Note which are functional vs placeholder
- Document required middleware endpoints

#### 1.4 Audit Staff View Sections (8 sections)
For each of: Overview, Client Portal, Proposal, Videos, Documents, Messages, Meetings, Questionnaire

- **Data displayed:** List every data point shown
- **User actions:** List every button/interaction
- **Current state:** Mark each as Working / Placeholder / Broken
- **Data source:** Where should this come from? (via middleware, not direct Graph)
- **Engagement tracking:** What events need to be captured?
- **API needs:** What endpoints does Stephen need?

#### 1.5 Audit Client View Sections (8 sections)
For each of: Overview, Proposal, Videos, Documents, Messages, Meetings, Questionnaire, People

- Same audit criteria as staff sections
- Note differences from staff view (read-only vs editable)
- **People section:** Explicitly document invite/revoke/share/domain restriction flows

#### 1.6 Audit Shared Components
- Review HubLayout, ClientHubLayout, HubSidebar
- Document navigation flow
- Identify any broken links or missing routes

---

## Phase 2: Data Architecture

**Goal:** Create the TypeScript types and service layer that enables clean separation between UI and data source.

### Deliverables
- `src/types/` — TypeScript interfaces for all data
- `src/services/` — API service abstraction
- `src/hooks/` — React Query hooks for data fetching
- `src/routes/` — Route guards and protected routes

---

## Phase 3: Section-by-Section Implementation

**Goal:** Update each component to use the new data architecture and ensure all interactions work.

### Implementation Order
1. Auth + Guards
2. Login
3. Hub List
4. Overview (Staff)
5. Proposal (Staff)
6. Documents (Staff)
7. Messages (Staff)
8. Meetings (Staff)
9. Videos (Staff)
10. Questionnaire (Staff)
11. Client Portal (Staff)
12-19. Client View sections

---

## Phase 4: Integration Documentation

**Goal:** Create a complete API specification that Stephen can use to build the middleware.

### Deliverable
`docs/API_SPECIFICATION.md` — The contract between front-end and middleware

---

## Phase 5: Testing Strategy

**Goal:** Ensure every section works correctly through automated Playwright tests, CI pipeline, and manual UAT.

---

## Implementation Workflow

### Review Checkpoints

| Checkpoint | What Gets Reviewed | Scope |
|------------|-------------------|-------|
| **1. Phase 1 Complete** | `docs/FRONTEND_AUDIT.md` | Audit document — validates understanding |
| **2a. Phase 2: Types** | `src/types/*.ts` | Data model — catches schema issues early |
| **2b. Phase 2: Services/Hooks** | `src/services/*.ts`, `src/hooks/*.ts`, `src/routes/*.ts` | Architecture patterns |
| **3. Phase 3: Sections** | Components in batches of 3-4 | Incremental review |
| **4. Phase 4 Complete** | `docs/API_SPECIFICATION.md` | API contract for Stephen |
| **5. Phase 5 Complete** | `tests/*.ts`, `.github/workflows/ci.yml` | Test coverage |

### Working Order

1. Complete work for checkpoint
2. Commit changes
3. Run build/tests to verify
4. Provide summary to Hamish
5. Wait for senior dev feedback
6. Incorporate feedback if needed
7. Proceed to next checkpoint

---

## Success Criteria

When this plan is complete:

- [ ] `docs/FRONTEND_AUDIT.md` exists with complete section-by-section analysis
- [ ] `src/types/` contains TypeScript interfaces for all data
- [ ] `src/services/` contains API abstraction with mock implementations
- [ ] `src/hooks/` contains React Query hooks for all data fetching
- [ ] `src/routes/guards.tsx` implements role-based route protection
- [ ] All 19 sections use hooks instead of inline mock data
- [ ] All buttons trigger appropriate service calls
- [ ] Loading and error states display correctly
- [ ] Engagement tracking fires on all key user actions
- [ ] `docs/API_SPECIFICATION.md` documents the complete API contract
- [ ] CI pipeline runs typecheck, lint, build, and Playwright tests
- [ ] Playwright tests exist for all sections and pass
- [ ] Stephen can read the spec and know exactly what endpoints to build
- [ ] Swapping mock services for real API calls requires only: MSAL config + API base URL
