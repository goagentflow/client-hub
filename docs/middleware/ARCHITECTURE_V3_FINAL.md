> **SUPERSEDED — February 2026**
> This document has been replaced by `docs/PRODUCTION_ROADMAP.md` (v4).
> Architecture changed from customer-hosted SharePoint to AgentFlow-hosted Azure (PostgreSQL + Blob Storage).
> Kept for historical reference only. Do not use for implementation decisions.

# AgentFlow Middleware — Final Architecture v3

**Canon:** Simple, Clean, DRY, Secure
**Status:** ~~Ready for Implementation~~ SUPERSEDED
**Last Updated:** December 2025

---

## Executive Summary

AgentFlow is a **self-hosted portal platform** that lives entirely within a service company's Microsoft 365 and Azure environment. The middleware acts as a **secure router** between experience layers (web apps, Copilot, agents) and the customer's M365 data.

**Key Principles:**
1. **Self-Hosted**: Customer deploys to their own Azure; data never leaves their boundary
2. **Zero External Storage**: All data lives in customer's M365 (SharePoint, Outlook, Teams)
3. **Hidden Metadata**: App configuration stored in hidden SharePoint lists (users can't break it)
4. **One API, All Consumers**: Humans, Copilot, agents, and workflows use identical endpoints

---

## 1. Deployment Architecture

### Customer-Owned, Customer-Controlled

```
┌─────────────────────────────────────────────────────────────────────┐
│              CUSTOMER'S AZURE SUBSCRIPTION                           │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Azure App Service (or Container Apps)                          │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐   │ │
│  │  │  AgentFlow Middleware                                     │   │ │
│  │  │  • Deployed from AgentFlow Docker image                   │   │ │
│  │  │  • Customer configures environment variables              │   │ │
│  │  │  • Auto-scales based on load                              │   │ │
│  │  └──────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Azure Key Vault                                                │ │
│  │  • App registration client secret                               │ │
│  │  • Customer-owned, customer-managed                             │ │
│  │  • Middleware reads via Managed Identity                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Azure AD App Registration                                      │ │
│  │  • Created by customer admin                                    │ │
│  │  • Permissions: Sites.ReadWrite.All, Mail.Send, etc.           │ │
│  │  • Consent granted by tenant admin                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              CUSTOMER'S MICROSOFT 365 TENANT                         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  SharePoint Site: AgentFlowHubs                                 │ │
│  │                                                                  │ │
│  │  ├── _AppConfig/ (HIDDEN - app-only access)                    │ │
│  │  │   ├── Hubs (list)                                           │ │
│  │  │   ├── Members (list) ← RBAC                                 │ │
│  │  │  ├── Engagement (list)                                     │ │
│  │  │   └── PortalConfig (list)                                   │ │
│  │  │                                                              │ │
│  │  └── HubFiles/ (Document Library - user accessible)            │ │
│  │      ├── /hub-abc123/Proposal/                                  │ │
│  │      ├── /hub-abc123/Documents/                                 │ │
│  │      └── /hub-abc123/Videos/                                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Outlook / Exchange                                             │ │
│  │  • Staff mailboxes (send via OBO)                               │ │
│  │  • Category labels for hub scoping (Phase 2)                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Teams / Calendar                                               │ │
│  │  • Online meetings                                              │ │
│  │  • Recordings (Teams Premium)                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Azure AD                                                       │ │
│  │  • Staff users (internal)                                       │ │
│  │  • B2B guest users (clients) — manual for MVP                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  DATA NEVER LEAVES CUSTOMER'S BOUNDARY                              │
└─────────────────────────────────────────────────────────────────────┘
```

### What AgentFlow Provides

| Artifact | Description |
|----------|-------------|
| **Docker Image** | Pre-built middleware container |
| **ARM/Bicep Template** | Azure resource definitions |
| **Setup Documentation** | Step-by-step deployment guide |
| **SharePoint Schema** | List definitions for _AppConfig |

### What Customer Provides

| Resource | Owner |
|----------|-------|
| Azure Subscription | Customer |
| M365 Tenant | Customer |
| Azure AD App Registration | Customer |
| Admin Consent for Graph Permissions | Customer |

---

## 2. SharePoint Organization

### The Simple Way: Lists for Metadata, Libraries for Files

```
SharePoint Site: AgentFlowHubs
│
├── _AppConfig/                          ← HIDDEN LISTS (app-only)
│   │
│   ├── Hubs
│   │   Columns:
│   │   • hubId (text, indexed)
│   │   • companyName (text)
│   │   • contactName (text)
│   │   • contactEmail (text)
│   │   • clientDomain (text)
│   │   • status (choice: draft|active|won|lost)
│   │   • hubType (choice: pitch|client)
│   │   • createdAt (datetime)
│   │   • createdBy (text - userId)
│   │   • updatedAt (datetime)
│   │   • lastActivity (datetime)
│   │   • internalNotes (multiline text)
│   │
│   ├── Members
│   │   Columns:
│   │   • hubId (text, indexed)
│   │   • userId (text, indexed)
│   │   • email (text)
│   │   • displayName (text)
│   │   • role (choice: staff|client)
│   │   • accessLevel (choice: full|proposal_only|documents_only|view_only)
│   │   • status (choice: pending|active|revoked)
│   │   • invitedAt (datetime)
│   │   • invitedBy (text)
│   │   • acceptedAt (datetime)
│   │   • lastAccess (datetime)
│   │
│   ├── Engagement
│   │   Columns:
│   │   • hubId (text, indexed)
│   │   • eventType (text)
│   │   • userId (text)
│   │   • resourceId (text)
│   │   • resourceType (text)
│   │   • timestamp (datetime, indexed)
│   │   • durationSeconds (number)
│   │   • metadata (multiline text - JSON)
│   │
│   └── PortalConfig
│       Columns:
│       • hubId (text, indexed, unique)
│       • isPublished (boolean)
│       • headline (text)
│       • welcomeMessage (multiline text)
│       • heroType (choice: image|video|none)
│       • heroUrl (text)
│       • sectionsEnabled (multiline text - JSON)
│       • publishedAt (datetime)
│       • publishedBy (text)
│
└── HubFiles/                            ← DOCUMENT LIBRARY (user accessible)
    │
    Columns:
    • hubId (text, indexed)
    • category (choice: proposal|contract|reference|brief|deliverable|video|other)
    • visibility (choice: client|internal)
    • displayName (text)
    • description (multiline text)
    • uploadedBy (text)
    │
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

### Why Hidden Lists?

**Problem:** Users shouldn't accidentally break app configuration (RBAC, portal settings).

**Solution:** SharePoint lists can be hidden and permission-locked:

1. **Hidden Property**: `List.Hidden = true` — doesn't show in SharePoint UI
2. **Break Inheritance**: Remove all user permissions from _AppConfig lists
3. **App-Only Access**: Middleware uses app-only token (not OBO) for these lists

```typescript
// User operations (OBO token - user permissions apply)
GET /hubs/{hubId}/documents  → OBO → SharePoint HubFiles library

// App operations (App-only token - app permissions)
GET /hubs/{hubId}            → App-only → SharePoint _AppConfig/Hubs list
POST /hubs/{hubId}/members   → App-only → SharePoint _AppConfig/Members list
```

---

## 3. Authentication Architecture

### Dual Token Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                          │
│                                                                  │
│  MSAL.js acquires token for: api://agentflow-backend/.default   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Authorization: Bearer <backend-token>
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE                                    │
│                                                                  │
│  1. Validate backend token (JWT)                                 │
│  2. Extract: userId, tenantId, email, role                      │
│                                                                  │
│  For USER operations (documents, send email):                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  OBO Token Exchange                                        │  │
│  │  Backend token → Graph token (user's permissions)          │  │
│  │  Used for: Files in HubFiles, Mail.Send, Calendar          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  For APP operations (RBAC, config):                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  App-Only Token                                            │  │
│  │  Client credentials flow (app permissions)                 │  │
│  │  Used for: _AppConfig lists (Hubs, Members, Engagement)    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSOFT GRAPH API                           │
└─────────────────────────────────────────────────────────────────┘
```

### Graph Permissions Required

**Delegated (OBO - user context):**
| Permission | Purpose |
|------------|---------|
| User.Read | User profile |
| Files.ReadWrite | Access HubFiles document library |
| Mail.Send | Send emails from staff mailbox |
| Calendars.ReadWrite | Schedule meetings |

**Application (App-only - no user):**
| Permission | Purpose |
|------------|---------|
| Sites.ReadWrite.All | Access _AppConfig hidden lists |
| User.Read.All | Resolve user info for members |

---

## 4. API Design

### Endpoint Summary

**Auth:**
```
GET  /api/v1/auth/me                    → User info + hub access
```

**Hubs:**
```
GET  /api/v1/hubs                       → List hubs (paginated)
POST /api/v1/hubs                       → Create hub
GET  /api/v1/hubs/{hubId}               → Get hub with stats
PATCH /api/v1/hubs/{hubId}              → Update hub
GET  /api/v1/hubs/{hubId}/activity      → Activity feed
```

**Documents:**
```
GET  /api/v1/hubs/{hubId}/documents     → List documents
POST /api/v1/hubs/{hubId}/documents     → Upload document
GET  /api/v1/hubs/{hubId}/documents/{id} → Get document
PATCH /api/v1/hubs/{hubId}/documents/{id} → Update metadata
DELETE /api/v1/hubs/{hubId}/documents/{id} → Delete
```

**Proposal:**
```
GET  /api/v1/hubs/{hubId}/proposal      → Get current proposal
POST /api/v1/hubs/{hubId}/proposal      → Upload/replace proposal
```

**Messages (MVP: send-only):**
```
GET  /api/v1/hubs/{hubId}/messages      → List sent messages
POST /api/v1/hubs/{hubId}/messages      → Send message
```

**Meetings:**
```
GET  /api/v1/hubs/{hubId}/meetings      → List meetings
POST /api/v1/hubs/{hubId}/meetings      → Schedule meeting
```

**Engagement:**
```
POST /api/v1/hubs/{hubId}/events        → Log event
GET  /api/v1/hubs/{hubId}/engagement    → Get aggregated stats
```

**Members:**
```
GET  /api/v1/hubs/{hubId}/members       → List members
POST /api/v1/hubs/{hubId}/members       → Add member (manual B2B for MVP)
PATCH /api/v1/hubs/{hubId}/members/{id} → Update access
DELETE /api/v1/hubs/{hubId}/members/{id} → Remove member
```

**Portal:**
```
GET  /api/v1/hubs/{hubId}/portal        → Get portal config
PATCH /api/v1/hubs/{hubId}/portal       → Update portal
POST /api/v1/hubs/{hubId}/portal/publish → Publish portal
```

**Total: ~22 endpoints**

---

## 5. Email Integration (MVP)

### Send-Only for MVP

```
┌─────────────────────────────────────────────────────────────────┐
│                    MVP EMAIL FLOW                                │
│                                                                  │
│  Staff composes message in portal                               │
│         │                                                        │
│         ▼                                                        │
│  POST /api/v1/hubs/{hubId}/messages                             │
│  Body: { to: "sarah@client.com", subject: "...", body: "..." }  │
│         │                                                        │
│         ▼                                                        │
│  Middleware: OBO → Graph: POST /me/sendMail                     │
│         │                                                        │
│         ▼                                                        │
│  Email sent from staff's mailbox (hamish@company.com)           │
│         │                                                        │
│         ▼                                                        │
│  Client replies → goes to staff's Outlook inbox                 │
│  (NOT synced to portal in MVP)                                  │
│                                                                  │
│  Portal shows: List of messages SENT from portal                │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Full Sync with Category Labels

```
Staff sends from portal → auto-applies Outlook category
Client replies → Outlook rule applies same category
Middleware polls/webhooks → finds categorized emails
Portal shows full conversation thread
```

---

## 6. B2B Guest Flow (MVP)

### Manual Guest Creation

```
┌─────────────────────────────────────────────────────────────────┐
│                    MVP B2B FLOW                                  │
│                                                                  │
│  1. Staff wants to invite client (sarah@client.com)             │
│                                                                  │
│  2. Staff asks IT admin to create B2B guest:                    │
│     - Azure AD Portal → Users → New guest user                  │
│     - Enter sarah@client.com                                     │
│     - Send invitation                                            │
│                                                                  │
│  3. Admin tells staff: "Guest created"                          │
│                                                                  │
│  4. Staff adds member in portal:                                │
│     POST /api/v1/hubs/{hubId}/members                           │
│     Body: { email: "sarah@client.com", accessLevel: "full" }    │
│                                                                  │
│  5. Sarah receives invitation, accepts, can access portal       │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Automated Invitations

```
Staff clicks "Invite" → Middleware calls Graph Invitations API
→ Azure AD sends invitation → Client accepts → Auto-added to Members
```

---

## 7. Forms Integration

### iframe Embed (Simple)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORMS INTEGRATION                             │
│                                                                  │
│  Staff:                                                          │
│  1. Creates questionnaire in Microsoft Forms                    │
│  2. Copies form URL                                              │
│  3. Pastes URL into portal: "Link Questionnaire"                │
│                                                                  │
│  Portal stores:                                                  │
│  { hubId, title, formUrl, linkedAt, linkedBy }                  │
│                                                                  │
│  Client:                                                         │
│  1. Opens portal → Questionnaire section                        │
│  2. Sees embedded iframe with Microsoft Forms                   │
│  3. Fills out form (handled entirely by Forms)                  │
│  4. Responses visible in Forms app (not portal)                 │
│                                                                  │
│  Portal shows:                                                   │
│  - List of linked forms                                          │
│  - Embed iframe                                                  │
│  - (Optional) "View Responses" link to Forms                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Node.js 20 LTS | Async I/O, Graph SDK support |
| **Framework** | Express.js | Simple, mature, well-documented |
| **Language** | TypeScript | Type safety, matches frontend |
| **Auth** | @azure/msal-node | Official Microsoft library |
| **Graph** | @microsoft/microsoft-graph-client | Official SDK |
| **Validation** | Zod | TypeScript-first, matches frontend |
| **Logging** | Pino | Fast structured logging |
| **Config** | dotenv + Azure Key Vault | Local dev + production |
| **Testing** | Vitest + MSW | Fast tests, mocked Graph |
| **Deployment** | Docker + Azure App Service | Containerized, auto-scaling |

---

## 9. Folder Structure

```
middleware/
├── src/
│   ├── server.ts                 # Entry point
│   ├── app.ts                    # Express app setup
│   │
│   ├── config/
│   │   └── index.ts              # Environment config
│   │
│   ├── auth/
│   │   ├── msal.ts               # MSAL client (OBO + App-only)
│   │   ├── tokens.ts             # Token cache
│   │   └── middleware.ts         # JWT validation
│   │
│   ├── graph/
│   │   ├── client.ts             # Graph client factory
│   │   ├── sharepoint-lists.ts   # Hidden list operations
│   │   ├── sharepoint-files.ts   # Document library operations
│   │   ├── mail.ts               # Mail operations
│   │   └── calendar.ts           # Calendar/Teams operations
│   │
│   ├── services/
│   │   ├── hub.service.ts
│   │   ├── document.service.ts
│   │   ├── message.service.ts
│   │   ├── meeting.service.ts
│   │   ├── engagement.service.ts
│   │   └── member.service.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── hub.routes.ts
│   │   ├── document.routes.ts
│   │   ├── message.routes.ts
│   │   ├── meeting.routes.ts
│   │   └── member.routes.ts
│   │
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   ├── rate-limiter.ts
│   │   ├── request-logger.ts
│   │   └── hub-access.ts         # Check membership
│   │
│   ├── types/
│   │   └── index.ts              # Shared TypeScript types
│   │
│   └── utils/
│       ├── errors.ts             # Custom error classes
│       ├── logger.ts             # Pino setup
│       └── validators.ts         # Zod schemas
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── deploy/
│   ├── Dockerfile
│   ├── docker-compose.yml        # Local dev
│   ├── azure/
│   │   ├── main.bicep            # Azure resources
│   │   └── parameters.json
│   └── scripts/
│       └── setup-sharepoint.ps1  # SharePoint provisioning
│
├── docs/
│   ├── DEPLOYMENT.md
│   ├── SETUP_GUIDE.md
│   └── API_REFERENCE.md
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 10. MVP Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- [ ] Auth + JWT validation + OBO flow
- [ ] Hub CRUD (hidden SharePoint list)
- [ ] Members list (RBAC)
- [ ] Document upload/list (SharePoint library)
- [ ] Proposal upload

### Phase 2: Communication (Weeks 5-8)
- [ ] Messages (send-only via Graph Mail)
- [ ] Meetings (Graph Calendar + Teams)
- [ ] Engagement tracking (SharePoint list)
- [ ] Portal configuration

### Phase 3: Production (Weeks 9-12)
- [ ] Security audit
- [ ] Performance testing
- [ ] Deployment automation
- [ ] Documentation

### Explicitly OUT of MVP
- Email sync (send-only for now)
- Automated B2B invitations
- Teams recordings/transcripts
- Webhooks (polling only)
- AI features
- Copilot plugin

---

## 11. Security Model

### Data Sovereignty
- All data in customer's M365 tenant
- Middleware deployed in customer's Azure
- No data leaves customer boundary
- AgentFlow never sees customer data

### Access Control
- Hidden lists for RBAC (users can't modify)
- App-only token for metadata operations
- OBO token for user operations
- Hub membership checked on every request
- Tenant isolation validated on every request

### Secrets Management
- All secrets in Azure Key Vault
- Middleware uses Managed Identity
- No secrets in code or environment variables
- Customer controls all credentials

---

## References

- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) — Decision rationale
- [AGENTS.md](../../AGENTS.md) — Development canon
- [GOLDEN_RULES.md](../../GOLDEN_RULES.md) — Coding standards
- [PRD_MVP_SUMMARY.md](./PRD_MVP_SUMMARY.md) — Requirements
