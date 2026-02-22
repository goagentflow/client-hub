# AgentFlow M365 SaaS Platform Architecture
## Enterprise-Grade Multi-Tenant Middleware for Microsoft 365

**Document**: Strategic Architecture & Implementation Roadmap  
**Version**: 1.0  
**Status**: Ready for Development  
**Audience**: Stephen (Middleware Developer), Hamish (Frontend/Product), Technical Decision-Makers

---

## Executive Summary

You are building a **stateless, secure, tenant-aware middleware layer** that transforms Microsoft 365 into a professional services delivery platform. The architecture enables:

- **Single codebase**, infinite skins (Pitch Hub is Skin #1)
- **Zero data persistence** in AgentFlow infrastructure (all data lives in customer's M365)
- **Multi-tenant from day one** (security, isolation, scalability built in)
- **Modular APIs** (humans, Copilot, agents, workflows all consume the same endpoints)
- **Production-ready** after the Pitch Hub MVP

### Core Principle
> **"Your middleware is a router and transformer, not a database. Every interaction crosses the M365 Graph boundary, every response is scoped to the authenticated user's tenant."**

---

## Part 1: High-Level Architecture

### 1.1 The Three-Layer Stack

```
┌─────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Pluggable Skins)              │
│  ┌──────────────┬──────────────┬──────────────────┐ │
│  │ Pitch Hub    │ Skin #2      │ Skin #3...       │ │
│  │ (React SPA)  │ (Custom UI)  │ (White-label)    │ │
│  └──────────────┴──────────────┴──────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS/JSON
┌──────────────────────┴──────────────────────────────┐
│  MIDDLEWARE LAYER (Stateless & Secure)             │
│                                                    │
│  ┌──────────────┬──────────────┬──────────────────┐ │
│  │ API Gateway  │ Auth/MSAL    │ Request Router   │ │
│  │ + Rate Limit │ + OBO Flow   │ + Middleware     │ │
│  └──────────────┴──────────────┴──────────────────┘ │
│                                                    │
│  ┌──────────────┬──────────────┬──────────────────┐ │
│  │ Hubs Service │ Documents    │ Messages Service │ │
│  │ (Hub Mgmt)   │ Service      │ (Email Router)   │ │
│  └──────────────┴──────────────┴──────────────────┘ │
│                                                    │
│  ┌──────────────┬──────────────┬──────────────────┐ │
│  │ Meetings     │ Engagement   │ Async Tasks      │ │
│  │ Service      │ Tracker      │ (Background)     │ │
│  └──────────────┴──────────────┴──────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ Microsoft Graph REST API
┌──────────────────────┴──────────────────────────────┐
│  CUSTOMER'S MICROSOFT 365 TENANT                    │
│                                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ SharePoint (Hub Data, Files, Metadata)      │   │
│  │ • /sites/AgentFlow/Hubs/{hubId}/            │   │
│  │ • Proposal, Documents, Videos, Config       │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ Outlook (Messages, Meeting Invites)         │   │
│  │ • Category Labels = Hub scoping             │   │
│  │ • Calendar Events = Meetings                │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ Teams (Recordings, Chat Integration)        │   │
│  │ • Meeting recordings in OneDrive             │   │
│  │ • Future: Teams chat sync                    │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │ Azure AD (Identity, B2B Guests)             │   │
│  │ • MFA, Conditional Access applied           │   │
│  │ • Guest invitations for external clients    │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 1.2 Authentication Flow: OBO (On-Behalf-Of)

**Why OBO?** The frontend NEVER touches Graph tokens. This keeps:
- Graph permissions scoped to middleware only
- Client secrets server-side only
- Token risk contained

**Flow:**

```
1. Frontend (Pitch Hub SPA)
   └─> MSAL.js acquires token for scope: "api://agentflow-backend/.default"
   
2. Frontend sends request to middleware with backend token
   └─> POST /api/v1/hubs/hub-123/documents
   └─> Header: Authorization: Bearer {backend_token}
   
3. Middleware (server-side)
   └─> Receives backend token
   └─> Validates token claims (userId, tenantId)
   └─> Exchanges for Graph token using OBO flow
       (Uses clientId, clientSecret, backend token)
   └─> Graph token is ephemeral (used once, discarded)
   
4. Middleware calls Microsoft Graph using Graph token
   └─> GET /v1.0/sites/{siteId}/drive/root
   └─> All Graph calls in context of authenticated user
   
5. Response returned to frontend
   └─> Frontend never sees Graph tokens or endpoints
```

### 1.3 Multi-Tenant Security Model

Each customer (tenant) is isolated:

- **Tenant ID from token**: Every request carries `tid` (tenant ID) in JWT claims
- **SharePoint Site Isolation**: Each tenant has their own SharePoint site or folder
  - `agentflow.sharepoint.com/sites/TenantName/`
- **Email Domain Scoping**: Messages filtered by customer's email domain
- **No cross-tenant data leakage**: Middleware validates tenant ID on every request

**Example: User attempts cross-tenant access**
```
Request to GET /api/v1/hubs/hub-from-different-tenant/documents
Middleware extracts tenantId from token = "tenant-B"
Hub's stored tenantId = "tenant-A"
Result: 403 Forbidden
```

---

## Part 2: Middleware Layer Architecture

### 2.1 Core Concepts

#### **Hub**: The Entity Model

A Hub is the atomic unit of your platform. Everything belongs to a hub.

```typescript
Hub {
  id: string                    // UUID
  tenantId: string              // Customer's Azure AD tenant
  type: "pitch" | "client"      // Pitch = new business, Client = ongoing delivery
  companyName: string
  contactEmail: string
  contactName: string
  clientDomain?: string         // Email domain for email scoping
  status: "draft" | "active" | "won" | "lost" | "archived"
  createdAt: ISO timestamp
  createdBy: userId
  updatedAt: ISO timestamp
  sharePointUrl: string         // /{tenantId}/hubs/{hubId}/
  meta: {
    totalClients: number
    lastActivityAt: ISO timestamp
    engagementScore?: number
  }
}
```

#### **Hub Scoping**: The Sacred Rule

**Every data-bearing endpoint is hub-scoped:**
- ✅ `/api/v1/hubs/{hubId}/documents`
- ✅ `/api/v1/hubs/{hubId}/messages`
- ✅ `/api/v1/hubs/{hubId}/proposals`
- ❌ `/api/v1/documents` (never do this)

This makes multi-tenant isolation trivial: just check `hub.tenantId === token.tid`.

#### **Engagement Tracking**: What Gets Measured?

Every significant action fires an event:

```typescript
type EngagementEventType =
  | "hub.viewed"
  | "proposal.viewed"
  | "proposal.downloaded"
  | "slide.viewed"
  | "video.started"
  | "video.completed"
  | "document.downloaded"
  | "message.sent"
  | "message.opened"
  | "meeting.joined"
  | "questionnaire.started"
  | "questionnaire.completed"
  | "share.sent"
  | "share.accepted"

Event Structure {
  eventType: EngagementEventType
  hubId: string
  userId: string              // The person taking action
  tenantId: string
  timestamp: ISO 8601
  metadata: {
    resourceId: string        // proposal-123, doc-456, etc.
    duration?: number         // seconds watched, time spent
    metadata?: object         // custom context
  }
  correlationId: string       // for tracing
}

// Events stored in SharePoint as JSON
// /hubs/{hubId}/Metadata/events.jsonl (newline-delimited JSON)
```

### 2.2 Service Architecture: Six Core Services

#### **Service #1: Hub Service** (Hub Lifecycle)

Responsibilities:
- Create, read, update, delete hubs
- Convert pitch hub → client hub (atomic operation)
- Manage hub members and access
- Store hub metadata in SharePoint

Key methods:
```typescript
class HubService {
  // Hub Lifecycle
  async createHub(req: CreateHubRequest, tenantId, userId): Promise<Hub>
  async getHub(hubId, tenantId): Promise<Hub>
  async listHubs(tenantId, pagination): Promise<PaginatedList<Hub>>
  async updateHub(hubId, update, tenantId, userId): Promise<Hub>
  async deleteHub(hubId, tenantId, userId): Promise<void>
  
  // Hub Conversion
  async convertPitchToClientHub(
    hubId, 
    initialProjectName?: string, 
    tenantId, 
    userId
  ): Promise<{ hub: Hub, project?: Project }>
  
  // Access Management
  async addMember(hubId, email, role, tenantId): Promise<HubMember>
  async listMembers(hubId, tenantId): Promise<HubMember[]>
  async updateMemberAccess(memberId, newRole, tenantId): Promise<HubMember>
  
  // SharePoint Operations (internal)
  private async ensureHubFolder(hubId, tenantId): Promise<string>
  private async writeHubMetadata(hub: Hub): Promise<void>
}
```

**SharePoint Folder Structure** (the database):
```
/sites/TenantName/
  └─ Hubs/
      └─ hubId-whitmore-associates/
          ├─ config.json          # Hub metadata
          ├─ Proposal/
          │   ├─ proposal.pptx
          │   └─ versions.json
          ├─ Documents/
          │   ├─ ClientDocuments/
          │   ├─ InternalDocuments/
          │   └─ index.json
          ├─ Videos/
          │   ├─ video-1.mp4
          │   └─ videos.json
          ├─ Meetings/
          │   └─ meetings.json
          ├─ Messages/
          │   └─ metadata.json
          ├─ Questionnaires/
          │   └─ forms.json
          └─ Metadata/
              ├─ engagement-events.jsonl
              ├─ members.json
              └─ activity-log.json
```

#### **Service #2: Documents Service** (File Management)

Responsibilities:
- Upload, store, version documents
- Manage visibility (client vs internal)
- Track downloads and engagement

Key methods:
```typescript
class DocumentService {
  async uploadDocument(
    hubId: string,
    file: File,
    category: "proposal" | "contract" | "reference" | "brief" | "other",
    visibility: "client" | "internal",
    tenantId: string,
    userId: string
  ): Promise<Document>
  
  async getDocument(hubId: string, docId: string, tenantId: string): Promise<Document>
  async listDocuments(hubId: string, filters?: {visibility?, category?}, tenantId: string): Promise<Document[]>
  
  async updateDocumentMetadata(hubId: string, docId: string, updates: Partial<Document>, tenantId: string): Promise<Document>
  async deleteDocument(hubId: string, docId: string, tenantId: string): Promise<void>
  
  async getDocumentEngagement(hubId: string, docId: string, tenantId: string): Promise<DocumentEngagement>
  
  // Proposal-specific
  async uploadProposal(hubId: string, file: File, tenantId: string, userId: string): Promise<Proposal>
  async getProposal(hubId: string, tenantId: string): Promise<Proposal | null>
}
```

**Data Structure** (JSON in SharePoint):
```json
{
  "documents": [
    {
      "id": "doc-123",
      "name": "Pricing Breakdown",
      "fileName": "pricing-2024.xlsx",
      "category": "proposal",
      "visibility": "client",
      "mimeType": "application/vnd.ms-excel",
      "size": 52428,
      "driveItemId": "01ABCDEF123456",
      "uploadedAt": "2024-01-15T10:00:00Z",
      "uploadedBy": "user-1",
      "uploadedByName": "Hamish Nicklin",
      "officeOnlineUrl": "https://...",
      "engagement": {
        "totalViews": 5,
        "totalDownloads": 2,
        "viewers": [{"userId": "client-1", "viewedAt": "..."}]
      }
    }
  ]
}
```

#### **Service #3: Messages Service** (Email Router)

Responsibilities:
- Sync emails with Outlook
- Route emails to correct hub (by domain/category)
- Handle OBO calls to Graph Mail API

Key concept: **Email Category Labels**

Every email sent from/through the hub gets a category label:
- `AgentFlow-Hub-{hubId}` 

When listing messages for a hub, middleware filters by this category.

```typescript
class MessageService {
  // Fetch messages (OBO call to Graph)
  async getMessageThreads(
    hubId: string,
    tenantId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedList<MessageThread>>
  
  async getMessageThread(
    hubId: string,
    threadId: string,
    tenantId: string
  ): Promise<MessageThreadDetail>
  
  // Send message (OBO call to Graph)
  async sendMessage(
    hubId: string,
    to: string[],
    cc?: string[],
    subject: string,
    bodyHtml: string,
    attachments?: File[],
    tenantId: string,
    userId: string
  ): Promise<Message>
  
  // Management
  async archiveThread(hubId: string, threadId: string, tenantId: string): Promise<void>
  async updateTeamNotes(hubId: string, threadId: string, notes: string, tenantId: string): Promise<void>
  
  // Internal routing
  private async applyHubCategoryLabel(messageId: string, hubId: string): Promise<void>
}
```

**How It Works:**

1. **User sends from hub:**
   - Frontend: POST `/api/v1/hubs/{hubId}/messages` with to, subject, body
   - Middleware: OBO → Graph: `POST /v1.0/me/sendMail` (authenticated user's mailbox)
   - Middleware: Applies category label `AgentFlow-Hub-{hubId}`

2. **Middleware polls for new mail:**
   - Webhook (preferred) or Timer trigger every 30 seconds
   - Graph: `GET /v1.0/me/mailFolders/inbox/messages?$filter=categories/any(a:a eq 'AgentFlow-Hub-{hubId}')`
   - Stores latest sync timestamp in SharePoint
   - If client email detected (from domain), creates thread notification

#### **Service #4: Meetings Service** (Teams/Calendar)

Responsibilities:
- Schedule Teams meetings
- Retrieve meeting recordings & transcripts
- Manage meeting notes

```typescript
class MeetingsService {
  async scheduleMeeting(
    hubId: string,
    title: string,
    description: string,
    startTime: ISO 8601,
    endTime: ISO 8601,
    attendeeEmails: string[],
    tenantId: string,
    userId: string
  ): Promise<Meeting>
  
  async getMeeting(hubId: string, meetingId: string, tenantId: string): Promise<Meeting>
  async listMeetings(hubId: string, tenantId: string, filters?: {status?, fromDate?, toDate?}): Promise<Meeting[]>
  
  async updateMeetingAgenda(hubId: string, meetingId: string, agenda: string, tenantId: string): Promise<Meeting>
  async updateMeetingNotes(hubId: string, meetingId: string, notes: string, tenantId: string): Promise<void>
  
  // Recording & Transcript (best-effort, Teams Premium required)
  async getMeetingRecording(hubId: string, meetingId: string, tenantId: string): Promise<{url?: string}>
  async getMeetingTranscript(hubId: string, meetingId: string, tenantId: string): Promise<{content?: string}>
  
  // Background job: Generate AI summary
  async generateMeetingSummary(hubId: string, meetingId: string, transcript: string, tenantId: string): Promise<void>
}
```

#### **Service #5: Engagement Tracker** (Analytics Engine)

Responsibilities:
- Aggregate engagement events
- Calculate metrics (views, time spent, completion)
- Detect patterns

```typescript
class EngagementService {
  // Log events from frontend
  async trackEvent(
    hubId: string,
    eventType: EngagementEventType,
    resourceId: string,
    metadata: any,
    tenantId: string,
    userId: string
  ): Promise<void>
  
  // Query aggregated data
  async getHubEngagement(hubId: string, tenantId: string): Promise<HubEngagement>
  async getProposalEngagement(hubId: string, tenantId: string): Promise<ProposalEngagement>
  async getDocumentEngagement(hubId: string, docId: string, tenantId: string): Promise<DocumentEngagement>
  async getVideoEngagement(hubId: string, videoId: string, tenantId: string): Promise<VideoEngagement>
}
```

#### **Service #6: Async Jobs** (Background Processing)

Responsibilities:
- AI summaries (meetings, emails, decisions)
- Long-running operations (file conversions, thumbnail generation)
- Polling webhooks

```typescript
class AsyncJobService {
  // Queue jobs
  async queueMeetingSummary(hubId: string, meetingId: string, tenantId: string): Promise<Job>
  async queueInstantAnswer(hubId: string, question: string, tenantId: string): Promise<Job>
  async queuePerformanceNarrative(hubId: string, projectId?: string, tenantId: string): Promise<Job>
  
  // Poll status
  async getJobStatus(jobId: string, tenantId: string): Promise<Job>
  
  // Internal: Worker process
  async processQueue(): Promise<void>  // Runs every 30 seconds
}
```

### 2.3 API Gateway & Security

**The API Gateway is your first line of defense:**

```typescript
// Middleware request/response flow

1. Incoming Request
   └─> Express middleware stack
       ├─> CORS validation
       ├─> Rate limit check (by IP + token)
       ├─> Request logging (no secrets)
       ├─> MSAL token validation
       │   ├─ Verify signature
       │   ├─ Check expiration
       │   ├─ Extract tenantId, userId, email
       ├─> Extract hubId from URL
       ├─> Validate user has access to hub
       └─> Call service layer
       
2. Service Layer
   └─> Re-validate tenant (paranoia pays off)
   └─> Execute business logic
   └─> OBO call to Graph if needed
   
3. Response
   └─> Strip secrets before returning
   └─> Log event
   └─> Return JSON
```

**Rate Limiting Strategy:**

```
By Token (authenticated user):
  - 1000 requests/hour
  - 10 concurrent requests

By IP (unauthenticated):
  - 100 requests/hour
  - 3 concurrent requests

Graph API limits (handled internally):
  - Retry with exponential backoff
  - Circuit breaker pattern
  - Graceful degradation
```

---

## Part 3: Security & Compliance

### 3.1 Threat Model & Mitigations

| Threat | Mitigation |
|--------|-----------|
| **Cross-tenant data leakage** | Hub-scoped endpoints, tenantId validation on every call |
| **Token theft** | No Graph tokens in frontend, OBO server-side only |
| **Unauthorized file access** | Access check: user must be hub member + file visibility |
| **Email spoofing** | Category labels = hub scoping, domain validation |
| **Meeting recording leak** | Conditional access policies (Azure AD), visibility controls |
| **Account takeover** | MFA enforced by Azure AD, Conditional Access policies |
| **API key leak** | ClientSecret never in frontend code, env vars only |
| **XSS in documents** | Sanitize HTML before storage, encode before rendering |

### 3.2 Data Residency

**AgentFlow stores ZERO data:**
- No customer hub data stored in AgentFlow databases
- No email copies
- No file copies
- Only metadata: audit logs, correlation IDs, event timestamps

**All persistent data lives in customer's M365 tenant:**
- SharePoint = authoritative store
- OneDrive = video/file storage
- Outlook = message store
- Azure AD = identity store

### 3.3 Secrets Management

```
.env (local development - never committed)
├─ MSAL_CLIENT_ID=...
├─ MSAL_CLIENT_SECRET=...
├─ MSAL_AUTHORITY=https://login.microsoftonline.com/common
├─ GRAPH_API_SCOPE=https://graph.microsoft.com/.default
└─ SHAREPOINT_SITE_ID=...

Azure Key Vault (production)
├─ agentflow/msal/client-id
├─ agentflow/msal/client-secret
├─ agentflow/secrets/encryption-key
└─ agentflow/audit/master-key

Rotation policy: 90 days
```

---

## Part 4: Minimal Viable Project Architecture (MVP)

### 4.1 Phase 1: Foundation (Weeks 1-4)

**Goal**: Middleware can authenticate, access customer's M365, and serve data for Pitch Hub.

#### Deliverables

1. **Authentication Module** (`src/auth/`)
   - MSAL server-side configuration
   - OBO token exchange
   - JWT validation
   - Role extraction

2. **Hub Service** (`src/services/hub.service.ts`)
   - Create hub
   - Get hub
   - Ensure SharePoint folder structure

3. **Documents Service** (`src/services/documents.service.ts`)
   - Upload proposal
   - Upload documents
   - List documents with visibility filtering

4. **Messages Service** (`src/services/messages.service.ts`)
   - List message threads (OBO → Graph)
   - Send message (OBO → Graph)
   - Apply category labels

5. **API Gateway** (`src/middleware/`)
   - Rate limiter
   - CORS
   - Request logging
   - Tenant validation

6. **Type Definitions** (`src/types/`)
   - All TypeScript interfaces from frontend API spec

#### Key Decisions

- **Database**: None (stateless). SharePoint is the store.
- **Cache**: Redis for rate limiter + OBO token cache (10 min TTL)
- **Async**: Node Timer for polling (future: Azure Functions, Logic Apps)
- **Logging**: Structured JSON to Azure Application Insights

#### Success Criteria

- ✅ User authenticates via MSAL
- ✅ Middleware obtains OBO token
- ✅ Can read/write to customer's SharePoint
- ✅ Pitch Hub frontend shows real data from M365
- ✅ No data stored in AgentFlow infrastructure

### 4.2 Phase 2: Engagement & Intelligence (Weeks 5-8)

**Goal**: Track engagement, aggregate analytics, surface insights.

#### Deliverables

1. **Engagement Tracker** (`src/services/engagement.service.ts`)
   - Log events to SharePoint (JSONL)
   - Aggregate engagement by hub/proposal/document

2. **Meetings Service** (`src/services/meetings.service.ts`)
   - List meetings (OBO → Graph Calendar)
   - Schedule meeting
   - Fetch recording/transcript URLs

3. **Questionnaire Integration** (`src/services/questionnaire.service.ts`)
   - Link Microsoft Forms
   - Fetch response counts

4. **Activity Feed** 
   - Generate activity events from engagement data
   - API endpoint: `GET /api/v1/hubs/{hubId}/activity`

#### Success Criteria

- ✅ Frontend sends engagement events
- ✅ Dashboard shows proposal views, document downloads, time spent
- ✅ Meetings appear in hub
- ✅ Engagement data is queryable

### 4.3 Phase 3: Multi-Tenant & Production Hardening (Weeks 9-12)

**Goal**: Production-ready for scale.

#### Deliverables

1. **Multi-Tenant Isolation Validation**
   - Audit every endpoint for cross-tenant vulnerabilities
   - Automated tests to verify isolation

2. **Async Jobs Infrastructure**
   - Job queue (Azure Service Bus or background worker)
   - Meeting summary generation (Claude API)
   - Error handling + retries

3. **Telemetry & Monitoring**
   - Application Insights instrumentation
   - Alerts for failures, rate limits, errors
   - Dashboard for operations team

4. **Documentation**
   - Deployment runbook
   - API reference (OpenAPI/Swagger)
   - Troubleshooting guide

#### Success Criteria

- ✅ System passes security audit
- ✅ Handles 10x traffic with graceful degradation
- ✅ Can operate unattended for 30 days
- ✅ Clear runbook for deployments

---

## Part 5: Frontend Skin Architecture

### 5.1 Why "Skinnable"?

Your frontend is 90% generic M365 crud operations. It should look like this:

```
Frontend (Pitch Hub) ──GET/POST──> Middleware ──OBO──> Graph
Frontend (Skin #2)   ──GET/POST──> Middleware ──OBO──> Graph
Frontend (Skin #3)   ──GET/POST──> Middleware ──OBO──> Graph
```

All frontends consume the same API. Differentiation is purely visual.

### 5.2 Frontend Configuration Layer

Your React SPA already has a config system. Extend it:

```typescript
// config.ts (per skin)
const skinConfig = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
  msalClientId: process.env.REACT_APP_MSAL_CLIENT_ID,
  theme: {
    primaryColor: "#2180d1",
    logo: "/logos/agentflow.svg",
    brandName: "AgentFlow"
  },
  features: {
    showProposal: true,
    showMessages: true,
    showMeetings: true,
    showQuestionnaire: true,
    enableClientSharing: true,
    enableAIFeatures: false  // Feature flag for Phase 2
  }
}
```

Deploy the same bundle with different `.env` files for different customers.

---

## Part 6: Integration Points: Humans, Copilot, Agents, Workflows

### 6.1 All Four Access Patterns Share the Same API

#### **Pattern 1: Humans (via Pitch Hub SPA)**

```
User clicks "Send message"
└─> Frontend POST /api/v1/hubs/{hubId}/messages
└─> Middleware OBO sends email via Graph
└─> User sees confirmation
```

#### **Pattern 2: Copilot (M365 Copilot Plugin)**

```
User in Outlook: "What's the status of Whitmore proposal?"
└─> Copilot plugin calls GET /api/v1/hubs/{whitmore-hub}/engagement
└─> Middleware returns { proposal viewed 5 times, 12 min avg }
└─> Copilot synthesizes: "The proposal has been viewed 5 times..."
```

#### **Pattern 3: Agents (Autonomous AI)**

```
Background job:
└─> Agent reads GET /api/v1/hubs/{hubId}/activity
└─> Agent detects: "No client activity in 7 days"
└─> Agent creates decision: POST /api/v1/hubs/{hubId}/decisions
└─> Staff sees: "Follow up needed" alert
```

#### **Pattern 4: Workflows (Power Automate)**

```
Power Automate trigger: "When document is downloaded"
└─> HTTP action: POST /api/v1/hubs/{hubId}/events
└─> Workflow: Send notification to team in Teams
└─> Workflow: Log to Excel
```

**Key insight**: Every consumer (human, copilot, agent, workflow) uses the same RESTful API. No special backends.

---

## Part 7: Pitch Hub → Phase 2 Path (Roadmap)

### Phase 2: Client Hub Expansion

Once Pitch Hub MVP is live:

1. **Hub Conversion**: Pitch hub converts to Client hub with one API call
2. **Projects**: Multi-project support within a hub
3. **Intelligence**:
   - Relationship Health scoring
   - Expansion Radar (upsell opportunities)
   - Decision Queue (waiting on you)
4. **Client Self-Service**:
   - Instant answers (AI QA)
   - Performance narratives
5. **Leadership Portfolio**: Roll-up view across all clients

Each phase adds new endpoints/services without breaking existing ones.

---

## Part 8: Deployment Architecture

### 8.1 Recommended Stack (Azure-Native)

```
Frontend (Pitch Hub)
├─ Static HTML/JS
├─ Deployed to: Azure Static Web Apps
├─ CDN: Azure CDN (global distribution)
└─ Domain: app.agentflow.com

Middleware
├─ Node.js/Express
├─ Deployed to: Azure App Service (or Azure Container Instances)
├─ Auto-scale: 2-10 instances based on CPU/memory
├─ Domain: api.agentflow.com
└─ Monitoring: Application Insights

Secrets Management
├─ Azure Key Vault
├─ Rotation: 90 days
└─ Access: Managed Identity (no connection strings in code)

Database (Events/Logs)
├─ Structured logging: Application Insights
├─ Long-term archive: Azure Blob Storage (events.jsonl)
└─ No customer data persisted

Authentication
├─ Azure AD app registration (multi-tenant)
├─ Conditional Access policies
├─ MFA required for staff users
└─ B2B guest invitations for clients
```

### 8.2 Deployment Pipeline

```
GitHub
└─> Push to main
    ├─> GitHub Actions: Run tests, lint, type check
    ├─> GitHub Actions: Build Docker image
    ├─> GitHub Actions: Push to Azure Container Registry
    └─> Azure App Service: Auto-deploy latest image
    
Rollback:
└─> Can revert to previous image in seconds
```

---

## Part 9: Success Metrics (How We Know It Works)

### Technical Metrics

| Metric | Target | Why |
|--------|--------|-----|
| **API Latency (p95)** | < 500ms | User experience |
| **Uptime** | 99.5% | Business continuity |
| **Graph API Errors** | < 1% | Reliability |
| **Auth Success Rate** | > 99% | User trust |
| **Cross-tenant Data Leakage** | 0 incidents | Security |
| **Time to Deploy** | < 5 min | DevOps velocity |

### Product Metrics (From Pilot)

| Metric | Target |
|--------|--------|
| **Time to create hub** | < 2 min |
| **Proposal views per hub** | > 3 |
| **Time spent per proposal view** | > 5 min |
| **Messages per hub** | > 5 |
| **Client adoption** | > 80% of invited clients access hub |

---

## Part 10: Risk Mitigation

### Known Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Graph API rate limits** | High | High | Caching, retry logic, backoff |
| **Large file uploads fail** | Medium | Medium | Chunked upload, resumable transfers |
| **Teams Premium licensing** | High | Low | Graceful degradation (no recording/transcript) |
| **Azure AD guest invitation flow** | Medium | Medium | Pre-document process, automation |
| **Email category label collision** | Low | High | UUID for label, no human-readable IDs |
| **SharePoint storage quota exceeded** | Low | High | Monitor usage, alert at 80% |

---

## Summary: Your Implementation Checklist

### Week 1-4 (Foundation)
- [ ] Set up Azure AD app registration (multi-tenant)
- [ ] Implement MSAL server-side OBO flow
- [ ] Build HubService (create, read, update, delete)
- [ ] Build DocumentsService (upload, list, visibility)
- [ ] Build MessagesService (list, send, category labels)
- [ ] Set up rate limiter + API Gateway
- [ ] Ensure SharePoint folder structure works
- [ ] Connect Pitch Hub frontend to middleware
- [ ] Manual testing with real M365 tenant

### Week 5-8 (Engagement & Intelligence)
- [ ] Implement engagement tracking (events API)
- [ ] Build aggregation (HubEngagement, ProposalEngagement, etc.)
- [ ] Implement MeetingsService
- [ ] Integrate QuestionnaireService
- [ ] Activity feed generation
- [ ] Pitch Hub dashboard shows real data

### Week 9-12 (Production Hardening)
- [ ] Security audit (cross-tenant, token handling)
- [ ] Load testing (1000 concurrent users)
- [ ] Async jobs framework + meeting summary
- [ ] Monitoring/alerting + runbooks
- [ ] Documentation complete
- [ ] Ready for production pilot

---

**Document version**: 1.0  
**Last updated**: December 2025  
**Status**: Ready for development  
**Next step**: Begin Phase 1 implementation
