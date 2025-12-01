# Architecture Decision Record (ADR)

**Project:** AgentFlow Middleware
**Canon:** Simple, Clean, DRY, Secure
**Status:** Decisions Finalized
**Last Updated:** December 2025

---

## Purpose

This document records the key architectural decisions for the AgentFlow middleware, including the options considered, trade-offs evaluated, and final decisions made. This serves as a reference for why things are built the way they are.

---

## ADR-001: Deployment Model

### Context
AgentFlow middleware needs to run somewhere. Options include AgentFlow-hosted SaaS, customer self-hosted, or hybrid.

### Options Considered

| Option | Description | Data Flow |
|--------|-------------|-----------|
| **A: AgentFlow SaaS** | AgentFlow hosts middleware for all customers | Data flows through AgentFlow servers |
| **B: Customer Self-Hosted** | Each customer deploys to their own Azure | Data stays in customer boundary |
| **C: Hybrid** | AgentFlow hosts, customer owns app registration | Data flows through AgentFlow |

### Decision
**Option B: Customer Self-Hosted**

### Rationale
- **Data Sovereignty**: The entire point is that data is secure and sovereign to the service company
- **Trust Model**: Customers don't need to trust an external party with their M365 data
- **Compliance**: Easier for customers to meet regulatory requirements
- **Security**: Data never leaves customer's boundary

### Trade-offs Accepted
- More complex deployment (customer needs Azure expertise)
- Harder to push updates (customer controls deployment)
- Need to provide excellent documentation and deployment artifacts

### Implementation
- Provide Docker image and ARM/Bicep templates
- Provide step-by-step deployment guide
- (Future) Automated installer/bootstrap script

---

## ADR-002: Data Storage — Database vs SharePoint

### Context
Need to store hub metadata, RBAC, engagement events, and portal configuration.

### Options Considered

| Option | Where | User Access | Complexity |
|--------|-------|-------------|------------|
| **A: SharePoint Lists (visible)** | Customer M365 | Users can see/edit | Low |
| **B: SharePoint Lists (hidden)** | Customer M365 | Hidden from users | Low |
| **C: Azure Table Storage** | Customer Azure | Fully hidden | Medium |
| **D: Cosmos DB** | Customer Azure | Fully hidden | High |
| **E: Azure SQL** | Customer Azure | Fully hidden | High |

### Decision
**Option B: Hidden SharePoint Lists with restricted permissions**

### Rationale
- **Simple**: No additional Azure resources (stays within M365)
- **Secure**: Hidden lists with broken permission inheritance
- **Sovereign**: Data stays in customer's M365 tenant
- **DRY**: Uses existing SharePoint infrastructure

### Trade-offs Accepted
- SharePoint API has a learning curve
- Query performance limited by SharePoint (acceptable for MVP scale)
- Need to manage list permissions carefully

### Implementation
```
SharePoint Site: AgentFlowHubs
│
├── _AppConfig/ (HIDDEN LIST - app-only access)
│   ├── Hubs
│   ├── Members (RBAC)
│   ├── Engagement
│   └── PortalConfig
│
└── HubFiles/ (DOCUMENT LIBRARY - user accessible)
    └── /hub-{id}/Proposal/, /Documents/, /Videos/
```

**Protection mechanisms:**
1. List property: `Hidden = true`
2. Break permission inheritance
3. Grant access only to app service principal
4. Users work with Document Library only

---

## ADR-003: SharePoint Structure — JSON Files vs Lists

### Context
Need to decide how to store structured metadata in SharePoint.

### Options Considered

| Option | Storage | Query | Write |
|--------|---------|-------|-------|
| **A: JSON files** | Files in folders | Read entire file, parse, filter | Read-modify-write |
| **B: SharePoint Lists** | List items | Native OData filtering | Direct item write |

### Decision
**Option B: SharePoint Lists**

### Rationale
- **Simple**: Use SharePoint as designed
- **Clean**: Native filtering, no JSON parsing
- **DRY**: Standard Microsoft pattern
- **Secure**: SharePoint permissions apply naturally

### Trade-offs Accepted
- Need to learn SharePoint List APIs
- Limited to ~30 million items per list (more than enough)
- Complex nested structures need JSON columns

### Evidence
Original design had 15+ JSON files per hub. Problems:
- Full file read on every query
- Race conditions on concurrent writes
- No native search/filter
- Reinventing a database

---

## ADR-004: Email Integration Strategy

### Context
Need to show hub-related emails in the portal. Staff communicate with clients via email.

### Options Considered

| Option | How It Works | Complexity | Behavior Change |
|--------|--------------|------------|-----------------|
| **A: Shared Mailbox** | All hub emails go to pitches@company.com | Medium | Staff must Cc mailbox |
| **B: Individual Mailboxes + Sync** | Filter staff inboxes by domain/category | High | None |
| **C: Category Labels** | Staff applies Outlook category to emails | Medium | Manual categorization |
| **D: Send-Only** | Portal for sending, replies go to Outlook | Low | Check Outlook for replies |

### Decision
**Option D: Send-Only for MVP**

Evolve to Option C (Category Labels) in Phase 2.

### Rationale
- **Simple**: No sync complexity for MVP
- **Clean**: Clear separation — portal sends, Outlook receives
- **Secure**: No need to read staff inboxes
- **LEAN**: Ship faster, validate need for sync

### Trade-offs Accepted
- Not a unified inbox (staff check Outlook for replies)
- Less visibility into client communication history
- May need to add sync later

### Future Path
Phase 2: Add category labels + sync
1. Staff sends from portal → auto-applies category
2. Outlook rule auto-categorizes client replies
3. Middleware polls/webhooks for categorized emails
4. Portal shows full thread

---

## ADR-005: B2B Guest Management

### Context
External clients need to access the portal. They don't have accounts in the service company's Azure AD.

### Options Considered

| Option | How It Works | Automation | Complexity |
|--------|--------------|------------|------------|
| **A: Manual B2B** | Admin creates guests in Azure AD portal | None | Low |
| **B: Automated B2B** | Middleware calls Graph Invitations API | Full | Medium |
| **C: SharePoint Sharing Links** | Anonymous or anyone-with-link access | N/A | Low |

### Decision
**Option A: Manual B2B for MVP**

Evolve to Option B in Phase 2.

### Rationale
- **Simple**: No Graph Invitations API integration needed
- **Secure**: Admin controls who gets access
- **LEAN**: Validate the portal works before automating invites

### Trade-offs Accepted
- Staff must ask admin to create guests
- Slower onboarding for clients
- Need to document the manual process

### Future Path
Phase 2: Automated B2B invitations
1. Staff clicks "Invite Client" in portal
2. Middleware calls Graph: POST /invitations
3. Azure AD sends invitation email
4. Client accepts, gets guest account
5. Middleware updates Members list

---

## ADR-006: Forms/Questionnaire Integration

### Context
Need to integrate Microsoft Forms questionnaires into the portal.

### Options Considered

| Option | How It Works | Data Access | Complexity |
|--------|--------------|-------------|------------|
| **A: Link-only (iframe)** | Embed form URL in iframe | None (view in Forms) | Low |
| **B: Deep Integration** | Call Forms API, show responses | Full response data | High |

### Decision
**Option A: Link-only (iframe)**

### Rationale
- **Simple**: Just embed a URL
- **Clean**: Forms handles everything
- **Secure**: No additional API permissions needed

### Trade-offs Accepted
- Can't show responses in portal (must use Forms app)
- Limited completion tracking
- Less integrated experience

### Evidence
Microsoft Forms API is notoriously limited. Response data is hard to access programmatically. Iframe embedding is the recommended approach.

---

## ADR-007: Authentication Flow

### Context
Need to authenticate users and call Microsoft Graph API securely.

### Options Considered

| Option | How It Works | Token Location |
|--------|--------------|----------------|
| **A: Direct Graph from Frontend** | Frontend calls Graph directly | Frontend |
| **B: OBO (On-Behalf-Of) Flow** | Frontend → Middleware → Graph | Middleware only |
| **C: App-Only (Daemon)** | No user context, app permissions | Middleware only |

### Decision
**Option B: OBO Flow for user operations**
**Option C: App-Only for hidden metadata operations**

### Rationale
- **Secure**: Frontend never sees Graph tokens
- **Simple**: Standard Microsoft pattern
- **Clean**: Clear separation of concerns

### Implementation
```
User operations (documents, messages):
  Frontend token (api://backend) → OBO → Graph token → Graph API

App metadata operations (RBAC, config):
  App-only token → Graph API (hidden lists)
```

---

## ADR-008: SharePoint Site Creation

### Context
Need a SharePoint site with lists and libraries for each customer deployment.

### Options Considered

| Option | Who Creates | When | Complexity |
|--------|-------------|------|------------|
| **A: Manual** | Customer admin | During setup | Low |
| **B: Automated via Graph** | Middleware | On first run | Medium |
| **C: ARM/Bicep Template** | Deployment script | During deployment | Medium |

### Decision
**Option A: Manual for MVP**

Evolve to Option C in Phase 2.

### Rationale
- **Simple**: Document the steps, admin follows them
- **LEAN**: Ship faster, automate later
- **Secure**: Admin explicitly grants permissions

### Trade-offs Accepted
- More setup steps for customer
- Possible human error
- Need excellent documentation

### Future Path
Phase 2: PowerShell/CLI script or ARM template that:
1. Creates SharePoint site
2. Creates hidden lists with schema
3. Creates document library with columns
4. Configures permissions
5. Registers app in Azure AD

---

## ADR-009: Middleware Technology Stack

### Context
Need to choose runtime, framework, and supporting technologies.

### Decision

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Node.js 20 LTS | Async I/O, Graph SDK support, team familiarity |
| **Framework** | Express.js | Simple, mature, well-documented |
| **Language** | TypeScript | Type safety, matches frontend |
| **Auth** | @azure/msal-node | Official Microsoft library |
| **Graph** | @microsoft/microsoft-graph-client | Official SDK |
| **Validation** | Zod | TypeScript-first, matches frontend |
| **Logging** | Pino | Fast structured logging |
| **Testing** | Vitest + MSW | Fast tests, mocked Graph responses |

### Rationale
- **Simple**: Minimal dependencies, well-known stack
- **Clean**: TypeScript throughout (frontend + backend)
- **DRY**: Share types between frontend and middleware
- **Secure**: Official Microsoft libraries for auth

---

## ADR-010: API Design — Hub-Scoped Endpoints

### Context
Need to design URL structure for API endpoints.

### Decision
**All data endpoints are hub-scoped: `/api/v1/hubs/{hubId}/...`**

### Rationale
- **Simple**: One pattern for all resources
- **Secure**: Hub ID in URL makes access control obvious
- **Clean**: No ambiguity about which hub data belongs to

### Examples
```
✅ GET  /api/v1/hubs/{hubId}/documents
✅ POST /api/v1/hubs/{hubId}/messages
✅ GET  /api/v1/hubs/{hubId}/engagement

❌ GET  /api/v1/documents (which hub?)
❌ GET  /api/v1/users/{userId}/documents (user-centric, not hub-centric)
```

---

## Decision Summary Table

| # | Decision | Choice | Phase |
|---|----------|--------|-------|
| 001 | Deployment Model | Customer Self-Hosted | MVP |
| 002 | Data Storage | Hidden SharePoint Lists | MVP |
| 003 | Metadata Format | SharePoint Lists (not JSON) | MVP |
| 004 | Email Integration | Send-Only | MVP → Sync in P2 |
| 005 | B2B Guests | Manual | MVP → Auto in P2 |
| 006 | Forms Integration | iframe embed | MVP |
| 007 | Auth Flow | OBO + App-Only | MVP |
| 008 | Site Creation | Manual | MVP → Script in P2 |
| 009 | Tech Stack | Node/Express/TypeScript | MVP |
| 010 | API Design | Hub-Scoped | MVP |

---

## References

- [ARCHITECTURE_V3_FINAL.md](./ARCHITECTURE_V3_FINAL.md) — Complete architecture
- [AGENTS.md](../../AGENTS.md) — Development canon
- [GOLDEN_RULES.md](../../GOLDEN_RULES.md) — Coding standards
