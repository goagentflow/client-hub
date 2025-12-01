# AgentFlow Middleware — Critical Architecture Review v2

**Canon:** Simple, Clean, DRY, Secure
**Status:** Architecture Decision Record

---

## 1. Executive Summary

After reviewing all research from Perplexity, GPT5Pro, and existing docs, this document:
1. Identifies **conflicts** between recommendations
2. Proposes **resolutions** based on our canon
3. Defines the **simplest viable architecture**
4. Answers: "Is this doable?"

**Answer: Yes, this is absolutely doable. But we need to simplify.**

---

## 2. Critical Decisions Required

### Decision 1: Deployment Model

**The Question:** Where does the middleware run?

| Option | Description | Data Residency | Complexity |
|--------|-------------|----------------|------------|
| **A: AgentFlow SaaS** | AgentFlow hosts middleware for all customers | Data flows through AgentFlow | Simpler ops |
| **B: Customer-hosted** | Each customer deploys to their own Azure | Data stays in customer boundary | Complex updates |
| **C: Hybrid** | AgentFlow hosts, customer owns app registration | Data flows through, customer controls permissions | Middle ground |

**Recommendation: Option A (AgentFlow SaaS) for MVP**

Rationale:
- Simplest to build and operate
- OBO flow means we don't store customer data — we just route it
- Customer grants app permissions, AgentFlow middleware accesses on-behalf-of users
- Can evolve to Option B later if customers require

**Security Implication:**
- AgentFlow middleware sees data in transit (memory only, not persisted)
- All persistent storage is in customer's M365
- This is the standard pattern for M365 ISV apps

---

### Decision 2: Database — YES or NO?

| Source | Recommendation |
|--------|----------------|
| Perplexity | No database, SharePoint only |
| GPT5Pro | Azure SQL/Cosmos for metadata |

**Recommendation: NO DATABASE for MVP**

Rationale:
- **Simple**: One less thing to manage
- **Secure**: No AgentFlow-side data storage = no data residency issues
- **DRY**: SharePoint already has metadata capabilities

**Trade-off Acknowledged:**
- Query performance is limited by SharePoint API
- Complex aggregations require reading files
- Acceptable for MVP scale (< 1000 hubs)

**Migration Path:**
- If we need database later, it's an optimization, not a fundamental change
- Start simple, measure, optimize

---

### Decision 3: SharePoint Structure — JSON Files vs SharePoint Lists

**Current Design (JSON files):**
```
/Hubs/{hubId}/
  config.json
  members.json
  engagement-events.jsonl
  documents/index.json
  ...
```

**Problems:**
- No native search/filter
- Full file read required
- Race conditions on write
- Not using SharePoint's strengths

**Alternative Design (SharePoint Lists):**
```
SharePoint Site: AgentFlow Hubs
├── Lists:
│   ├── Hubs (id, companyName, status, tenantId, ...)
│   ├── Members (hubId, userId, role, accessLevel, ...)
│   ├── Engagement (hubId, eventType, userId, timestamp, ...)
│   └── Messages (hubId, threadId, subject, lastMessageAt, teamNotes, ...)
│
└── Document Libraries:
    └── Hub Files (with columns: hubId, category, visibility)
        ├── /hub-abc123/Proposal/
        ├── /hub-abc123/Documents/
        └── /hub-abc123/Videos/
```

**Recommendation: HYBRID — Lists for metadata, JSON for simple config**

| Data Type | Storage | Why |
|-----------|---------|-----|
| Hub metadata | SharePoint List | Native filtering, columns |
| Members | SharePoint List | Easy queries by hubId or userId |
| Engagement events | SharePoint List | Native filtering, pagination |
| Team notes | SharePoint List | Part of Messages list |
| Portal config | JSON in Document Library | Complex nested structure, rarely queried |
| Files (docs, videos) | Document Library | Standard file storage |

**Benefits:**
- **Simple**: Use SharePoint as intended
- **Clean**: Lists for structured data, Libraries for files
- **DRY**: No custom JSON parsing for queries
- **Secure**: SharePoint permissions apply naturally

---

### Decision 4: Email Integration — Polling vs Webhooks

**Current Design:** Poll every 30 seconds

**Problem:** 100 hubs × 2 polls/minute = 12,000 Graph calls/hour

**Recommendation: Graph Webhooks (Subscriptions)**

```
Graph Subscription:
  resource: /users/{userId}/mailFolders/inbox/messages
  changeType: created
  notificationUrl: https://api.agentflow.com/webhooks/mail
  expirationDateTime: (renew every 3 days)
```

**How it works:**
1. Staff user grants Mail.Read permission
2. Middleware creates subscription for their inbox
3. Graph pushes notification when new mail arrives
4. Middleware checks if mail matches hub (by domain/category)
5. No polling needed

**Trade-off:**
- More complex setup (webhook endpoint, subscription management)
- Subscriptions expire (need renewal job)
- Worth it for scalability

**For MVP:** Start with polling (simpler), add webhooks in Phase 2.

---

### Decision 5: B2B Guest Lifecycle

**Current Gap:** How do we handle external client users?

**Recommendation: Explicit Guest Management**

```typescript
// When staff invites client
async function inviteClient(hubId: string, email: string): Promise<Invite> {
  // 1. Create B2B guest invitation via Graph
  const invitation = await graphClient.invitations.create({
    invitedUserEmailAddress: email,
    inviteRedirectUrl: `https://app.agentflow.com/portal/${hubId}`,
    sendInvitationMessage: true
  });

  // 2. Store pending invite in Members list
  await membersService.createInvite({
    hubId,
    email,
    status: 'pending',
    invitedAt: new Date()
  });

  return invitation;
}

// When guest accepts invitation and first accesses portal
async function handleFirstAccess(hubId: string, userId: string): Promise<void> {
  // 1. Update member status to 'active'
  await membersService.activateMember(hubId, userId);

  // 2. Log activity
  await engagementService.track(hubId, 'share.accepted', userId);
}

// When access is revoked
async function revokeMemberAccess(hubId: string, memberId: string): Promise<void> {
  // 1. Remove from Members list
  await membersService.remove(hubId, memberId);

  // 2. Note: B2B guest remains in Azure AD (tenant admin decision to remove)
  // 3. Access check will fail on next request
}
```

---

## 3. Simplified Architecture

### 3.1 The Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXPERIENCE LAYER                             │
│  Pitch Hub SPA │ Client Portal │ Future Skins │ Copilot Plugin  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS + Bearer Token
┌─────────────────────────────────────────────────────────────────┐
│                     MIDDLEWARE (AgentFlow)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Express.js App                         │   │
│  │  • JWT Validation (MSAL)                                  │   │
│  │  • Rate Limiting                                          │   │
│  │  • Request Logging                                        │   │
│  │  • Hub Access Check                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Graph Service                          │   │
│  │  • OBO Token Exchange (cached 10 min)                     │   │
│  │  • Retry with Exponential Backoff                         │   │
│  │  • Circuit Breaker                                        │   │
│  │  • Rate Limit Handling                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐  │
│  │  Hub    │  Doc    │  Msg    │  Meet   │  Engage │  Member │  │
│  │ Service │ Service │ Service │ Service │ Service │ Service │  │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘  │
│                                                                  │
│  STORES NOTHING PERSISTENTLY. ALL STATE IN CUSTOMER M365.       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Microsoft Graph API (OBO)
┌─────────────────────────────────────────────────────────────────┐
│                  CUSTOMER'S M365 TENANT                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SharePoint Site: AgentFlow Hubs                          │   │
│  │                                                           │   │
│  │  Lists:                                                   │   │
│  │    • Hubs (structured metadata)                           │   │
│  │    • Members (hubId, userId, role, accessLevel)           │   │
│  │    • Engagement (events, queryable)                       │   │
│  │                                                           │   │
│  │  Document Libraries:                                      │   │
│  │    • Hub Files (with metadata columns)                    │   │
│  │      /hub-{id}/Proposal/, /hub-{id}/Documents/, etc.     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Outlook (via Graph)                                      │   │
│  │    • Category labels for hub scoping                      │   │
│  │    • OBO access to staff mailboxes                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Teams / Calendar (via Graph)                             │   │
│  │    • Online meetings                                      │   │
│  │    • Recordings (Teams Premium)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Azure AD                                                 │   │
│  │    • Staff users                                          │   │
│  │    • B2B guest users (clients)                            │   │
│  │    • Conditional Access applies                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 SharePoint Organization — The Simple Way

**One SharePoint Site per Customer Tenant:**
```
https://{customer}.sharepoint.com/sites/AgentFlowHubs/
```

**Structure:**
```
Site: AgentFlowHubs
│
├── Lists/
│   │
│   ├── Hubs
│   │   Columns: id, companyName, contactName, contactEmail,
│   │            clientDomain, status, hubType, createdAt,
│   │            createdBy, updatedAt, lastActivity
│   │
│   ├── Members
│   │   Columns: hubId, odataId (user), email, displayName, role,
│   │            accessLevel, invitedAt, acceptedAt, lastAccess
│   │
│   ├── Engagement
│   │   Columns: hubId, eventType, userId, resourceId, resourceType,
│   │            timestamp, durationSeconds, metadata (JSON)
│   │
│   └── PortalConfig
│       Columns: hubId, isPublished, headline, welcomeMessage,
│                heroType, heroUrl, sectionsConfig (JSON)
│
└── Document Libraries/
    │
    └── HubFiles
        Columns: hubId, category, visibility, uploadedBy, uploadedAt

        Folders:
        ├── hub-abc123/
        │   ├── Proposal/
        │   │   └── proposal-v2.pptx
        │   ├── Documents/
        │   │   ├── pricing.xlsx
        │   │   └── contract.pdf
        │   └── Videos/
        │       └── intro.mp4
        │
        └── hub-def456/
            └── ...
```

### 3.3 Why This is Better

| Aspect | JSON Files (Old) | SharePoint Lists (New) |
|--------|------------------|------------------------|
| Query "all hubs where status=active" | Read all config.json, filter in memory | Native CAML/OData filter |
| Query "members of hub X" | Read members.json | Filter list by hubId |
| Query "last 10 engagement events" | Read entire JSONL, take last 10 | Filter list, top 10 |
| Add member | Read file, parse, modify, write | Add list item |
| Race conditions | Possible (concurrent writes) | SharePoint handles |
| Search | Not possible | SharePoint search works |

---

## 4. Simplified Data Model

### 4.1 Hub (SharePoint List Item)

```typescript
interface Hub {
  // SharePoint List Item ID (auto-generated)
  id: number;

  // Core fields (SharePoint columns)
  hubId: string;           // Our UUID
  companyName: string;
  contactName: string;
  contactEmail: string;
  clientDomain: string;
  status: 'draft' | 'active' | 'won' | 'lost';
  hubType: 'pitch' | 'client';

  // Timestamps
  createdAt: string;       // ISO 8601
  createdBy: string;       // userId
  updatedAt: string;
  lastActivity: string;

  // Computed (cached, updated on write)
  memberCount: number;

  // Internal notes (rich text column)
  internalNotes: string;
}
```

### 4.2 Member (SharePoint List Item)

```typescript
interface Member {
  id: number;              // SharePoint List Item ID

  hubId: string;
  userId: string;          // Azure AD object ID
  email: string;
  displayName: string;
  role: 'staff' | 'client';
  accessLevel: 'full_access' | 'proposal_only' | 'documents_only' | 'view_only';

  status: 'pending' | 'active' | 'revoked';
  invitedAt: string;
  invitedBy: string;
  acceptedAt: string | null;
  lastAccess: string | null;
}
```

### 4.3 Engagement Event (SharePoint List Item)

```typescript
interface EngagementEvent {
  id: number;              // SharePoint List Item ID

  hubId: string;
  eventType: EngagementEventType;  // Enum: hub.viewed, proposal.viewed, etc.
  userId: string;

  resourceId: string | null;       // proposal-1, doc-123, etc.
  resourceType: string | null;     // proposal, document, video, etc.

  timestamp: string;               // ISO 8601
  durationSeconds: number | null;  // For timed events

  metadata: string;                // JSON string for extra data
}
```

### 4.4 Document (SharePoint Document Library Item)

```typescript
interface Document {
  // SharePoint provides automatically:
  id: number;              // List Item ID
  name: string;            // File name
  serverRelativeUrl: string;
  webUrl: string;          // Download/view URL
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;

  // Custom columns we add:
  hubId: string;
  category: 'proposal' | 'contract' | 'reference' | 'brief' | 'deliverable' | 'other';
  visibility: 'client' | 'internal';
  uploadedBy: string;      // userId
  displayName: string;     // User-friendly title
  description: string;
}
```

---

## 5. API Simplification

### 5.1 Endpoint Summary (Reduced)

**Auth:**
```
GET  /auth/me                           → User info + hub access
```

**Hubs:**
```
GET  /hubs                              → List hubs (paginated, filtered)
POST /hubs                              → Create hub
GET  /hubs/{hubId}                      → Get hub with overview stats
PATCH /hubs/{hubId}                     → Update hub
GET  /hubs/{hubId}/activity             → Activity feed
```

**Documents:**
```
GET  /hubs/{hubId}/documents            → List documents
POST /hubs/{hubId}/documents            → Upload document
GET  /hubs/{hubId}/documents/{docId}    → Get document
PATCH /hubs/{hubId}/documents/{docId}   → Update metadata
DELETE /hubs/{hubId}/documents/{docId}  → Delete document
```

**Proposal (special document):**
```
GET  /hubs/{hubId}/proposal             → Get current proposal
POST /hubs/{hubId}/proposal             → Upload/replace proposal
```

**Messages:**
```
GET  /hubs/{hubId}/messages             → List threads
GET  /hubs/{hubId}/messages/{threadId}  → Get thread with messages
POST /hubs/{hubId}/messages             → Send message
PATCH /hubs/{hubId}/messages/{threadId} → Update team notes / archive
```

**Meetings:**
```
GET  /hubs/{hubId}/meetings             → List meetings
POST /hubs/{hubId}/meetings             → Schedule meeting
```

**Engagement:**
```
POST /hubs/{hubId}/events               → Log event
GET  /hubs/{hubId}/engagement           → Get aggregated stats
```

**Members:**
```
GET  /hubs/{hubId}/members              → List members
POST /hubs/{hubId}/members              → Invite member
PATCH /hubs/{hubId}/members/{memberId}  → Update access
DELETE /hubs/{hubId}/members/{memberId} → Remove member
```

**Portal:**
```
GET  /hubs/{hubId}/portal               → Get portal config
PATCH /hubs/{hubId}/portal              → Update portal config
POST /hubs/{hubId}/portal/publish       → Publish portal
```

**Total: ~25 endpoints** (down from 40+ in original spec)

---

## 6. Feasibility Assessment

### Is This Doable?

**YES.** The core pattern is proven:
- OBO flow is standard Microsoft pattern
- SharePoint Lists/Libraries are stable APIs
- Graph Mail/Calendar APIs are well-documented
- B2B guests are standard Azure AD feature

### Complexity Assessment

| Component | Complexity | Risk | Notes |
|-----------|------------|------|-------|
| OBO Authentication | Medium | Low | Well-documented, many examples |
| SharePoint Lists | Low | Low | Standard Graph API |
| SharePoint Files | Medium | Low | Chunked upload for large files |
| Email via Graph | Medium | Medium | Category labels need testing |
| Teams Meetings | Medium | Low | Standard API |
| Teams Recordings | High | Medium | Requires Teams Premium |
| B2B Guest Invites | Medium | Low | Standard API |
| Engagement Aggregation | Medium | Low | SharePoint list queries |
| Multi-tenant Isolation | Low | Low | Hub-scoped + tenant validation |

### What Could Go Wrong

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Graph rate limits | Medium | Medium | Caching, backoff, batching |
| Email category label doesn't exist | Low | High | Create label on hub creation |
| SharePoint site doesn't exist | Low | High | Admin setup guide |
| Teams Premium not available | High | Low | Graceful degradation |
| Large file upload fails | Low | Medium | Chunked upload, retry |
| Cross-tenant access attempt | Low | Critical | Validate on every request |

---

## 7. Recommended MVP Scope

### Phase 1 (4 weeks): Core Platform
- [ ] Auth + OBO flow
- [ ] Hub CRUD (SharePoint List)
- [ ] Members (SharePoint List)
- [ ] Documents (SharePoint Library)
- [ ] Proposal upload

### Phase 2 (4 weeks): Communication
- [ ] Messages (Graph Mail + category labels)
- [ ] Meetings (Graph Calendar + Teams)
- [ ] Engagement tracking (SharePoint List)

### Phase 3 (4 weeks): Production
- [ ] Security audit
- [ ] Performance testing
- [ ] Monitoring/alerting
- [ ] Documentation

### Explicitly OUT of MVP
- Webhooks (use polling)
- Teams recordings/transcripts
- AI features
- Copilot plugin
- Multi-tenant marketplace

---

## 8. Questions for You

Before finalizing, I need clarity on:

1. **Deployment Model:** AgentFlow hosts middleware (SaaS) or customer self-hosts?
   - Recommendation: AgentFlow SaaS for MVP

2. **SharePoint Site Creation:** Who creates the SharePoint site?
   - Option A: Customer admin creates manually (simpler)
   - Option B: Middleware creates via Graph (requires Sites.FullControl)

3. **B2B Guest Flow:** Is manual B2B invitation acceptable, or must it be automated?
   - Recommendation: Automated via Graph Invitations API

4. **Email Scope:** One shared mailbox per customer, or each staff user's mailbox?
   - Recommendation: Staff user's own mailbox (simpler, no shared mailbox setup)

5. **Forms Integration:** Link-only (iframe embed) or deep integration?
   - Recommendation: Link-only for MVP (Forms API is limited)

---

## 9. Summary

### What's Changed from Original Research

| Topic | Original | Revised |
|-------|----------|---------|
| Storage | JSON files in SharePoint folders | SharePoint Lists + Document Library |
| Database | GPT5Pro wanted Cosmos/SQL | No database (SharePoint only) |
| Email sync | Polling every 30s | Polling for MVP, webhooks Phase 2 |
| Engagement | JSONL file | SharePoint List |
| Complexity | ~40 endpoints | ~25 endpoints |

### The Canon Applied

| Principle | How Applied |
|-----------|-------------|
| **Simple** | No database, fewer endpoints, use SharePoint natively |
| **Clean** | Clear separation: Lists for metadata, Libraries for files |
| **DRY** | One Graph service handles all OBO/retry logic |
| **Secure** | OBO flow, tenant validation on every request, no data persistence |

### Final Answer: Is This Doable?

**Yes, absolutely.** The simplified architecture:
- Uses proven Microsoft patterns
- Stays within Graph API capabilities
- Avoids unnecessary complexity
- Can be built in 12 weeks with one developer

The key insight: **Use SharePoint as SharePoint was designed to be used** — Lists for structured data, Document Libraries for files. Don't reinvent a database with JSON files.
