# AgentFlow Pitch Hub MVP - Product Requirements Document (PRD)
## Minimal Viable Product: Middleware & First Skin

**Version**: 1.0  
**Status**: Ready for Development  
**Target Release**: Q1 2025  
**Audience**: Engineering (Stephen), Product (Hamish), Stakeholders

---

## 1. Executive Summary

### Vision
Build a stateless, multi-tenant middleware that connects AgentFlow's Pitch Hub frontend to customer Microsoft 365 environments. The middleware authenticates users, routes requests securely, manages hub lifecycle, and orchestrates communication between the frontend and Graph API.

### Success Definition
Hamish and Stephen can log into Pitch Hub with their Microsoft 365 accounts and see real proposal/document/message data from their M365 tenant without any hardcoded data.

### Scope: Pitch Hub MVP Only
- **IN**: Pitch hubs, proposals, documents, messages, meetings (basic), questionnaires (link only), engagement tracking
- **OUT**: Client hubs, relationship intelligence, Copilot integration, leadership views
- **OUT**: Multi-tenant deployment (code ready, but first pilot is single-tenant)

### Timeline
- Phase 1 Foundation (4 weeks): Auth, hub service, documents, messaging, API gateway
- Phase 2 Intelligence (4 weeks): Engagement, meetings, questionnaires, analytics
- Phase 3 Hardening (4 weeks): Security audit, monitoring, docs, pilot-ready

---

## 2. Requirements Specification

### 2.1 Functional Requirements

#### F1: User Authentication & Authorization

**Requirement**: Users authenticate via Azure AD using MSAL; middleware obtains OBO token.

**Details**:
- Frontend uses MSAL.js to acquire token for scope: `api://agentflow-backend/.default`
- Frontend sends backend token to middleware
- Middleware validates JWT claims (issuer, audience, expiration)
- Middleware extracts userId, email, tenantId, role from token
- For staff users: role = "staff"
- For client users: role = "client"
- Middleware verifies user has access to requested hub (stored in SharePoint)
- All subsequent requests require valid token

**Out of Scope**:
- Passwordless auth (handled by Azure AD)
- Biometric auth
- SAML federation

**Success Criteria**:
- ✅ User logs in with Microsoft account
- ✅ MSAL returns backend token
- ✅ Middleware validates token
- ✅ Unauthorized requests return 401

---

#### F2: Hub Lifecycle Management

**Requirement**: Middleware provides CRUD operations for hubs.

**Endpoints**:
```
POST   /api/v1/hubs              - Create hub
GET    /api/v1/hubs              - List user's hubs (paginated)
GET    /api/v1/hubs/{hubId}      - Get hub details
PATCH  /api/v1/hubs/{hubId}      - Update hub metadata
DELETE /api/v1/hubs/{hubId}      - Archive hub
```

**Hub Metadata** (stored in SharePoint):
```json
{
  "id": "hub-abc123",
  "tenantId": "tenant-uuid",
  "type": "pitch",
  "companyName": "Whitmore Associates",
  "contactName": "Sarah Mitchell",
  "contactEmail": "sarah@whitmorelaw.co.uk",
  "clientDomain": "whitmorelaw.co.uk",
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z",
  "createdBy": "hamish@agentflow.com",
  "updatedAt": "2024-01-20T15:30:00Z",
  "lastActivity": "2024-01-20T15:30:00Z",
  "clientsInvited": 2,
  "description": "Pitch for Whitmore Law new business"
}
```

**SharePoint Folder Structure** (auto-created):
```
/sites/AgentFlowPitchHubs/Hubs/
  └─ hub-abc123/
      ├─ config.json
      ├─ Proposal/
      ├─ Documents/
      │   ├─ ClientDocuments/
      │   └─ InternalDocuments/
      ├─ Videos/
      ├─ Meetings/
      ├─ Messages/
      ├─ Questionnaires/
      └─ Metadata/
```

**Permissions**:
- Staff user who created hub = hub owner
- Hub owner can:
  - Update hub metadata
  - Invite/remove members
  - Upload documents
  - Publish portal
- Client users in hub can:
  - View shared content
  - Send messages
  - View meetings

**Success Criteria**:
- ✅ Can create hub (auto-creates SharePoint folder)
- ✅ Hub appears in hub list
- ✅ Can retrieve hub metadata
- ✅ Can update hub name/description
- ✅ Hub metadata is readable JSON in SharePoint

---

#### F3: Document Management (Proposal + Supporting Docs)

**Requirement**: Upload, store, list, and manage document visibility.

**Endpoints**:
```
POST   /api/v1/hubs/{hubId}/proposal          - Upload proposal (PowerPoint or PDF)
GET    /api/v1/hubs/{hubId}/proposal          - Get proposal metadata
DELETE /api/v1/hubs/{hubId}/proposal          - Delete proposal
PATCH  /api/v1/hubs/{hubId}/proposal/settings - Update visibility

POST   /api/v1/hubs/{hubId}/documents         - Upload supporting document
GET    /api/v1/hubs/{hubId}/documents         - List documents (filter by visibility)
GET    /api/v1/hubs/{hubId}/documents/{docId} - Get document metadata
PATCH  /api/v1/hubs/{hubId}/documents/{docId} - Update metadata
DELETE /api/v1/hubs/{hubId}/documents/{docId} - Delete document

GET    /api/v1/hubs/{hubId}/documents/{docId}/engagement - Get download count, viewers
```

**Document Metadata** (JSON in SharePoint):
```json
{
  "id": "doc-123",
  "hubId": "hub-abc123",
  "name": "Pricing Breakdown",
  "description": "Detailed pricing for all services",
  "fileName": "pricing-2024.xlsx",
  "fileSize": 52428,
  "mimeType": "application/vnd.ms-excel",
  "category": "proposal",
  "visibility": "client",
  "uploadedAt": "2024-01-15T10:00:00Z",
  "uploadedBy": "hamish@agentflow.com",
  "uploadedByName": "Hamish Nicklin",
  "driveItemId": "01ABCDEF...",
  "officeOnlineUrl": "https://view.officeapps.live.com/op/view.aspx?src=...",
  "downloadUrl": "https://storage.blob.core.windows.net/...",
  "engagement": {
    "totalViews": 5,
    "totalDownloads": 2,
    "lastViewed": "2024-01-20T14:00:00Z"
  }
}
```

**Proposal Metadata** (Extended):
```json
{
  "id": "proposal-1",
  "hubId": "hub-abc123",
  "fileName": "AgentFlowProposal.pptx",
  "fileSize": 5242880,
  "totalSlides": 24,
  "uploadedAt": "2024-01-15T10:00:00Z",
  "uploadedBy": "hamish@agentflow.com",
  "driveItemId": "01ABCDEF...",
  "officeOnlineUrl": "https://view.officeapps.live.com/...",
  "downloadUrl": "https://...",
  "thumbnailUrl": "https://...",
  "settings": {
    "isClientVisible": true,
    "isDownloadEnabled": true
  },
  "versions": [
    {"versionNumber": 1, "uploadedAt": "2024-01-15T10:00:00Z", "fileName": "...v1.pptx"},
    {"versionNumber": 2, "uploadedAt": "2024-01-18T14:00:00Z", "fileName": "...v2.pptx"}
  ],
  "engagement": {
    "totalViews": 12,
    "uniqueViewers": 3,
    "avgTimeSpent": 420,
    "totalTimeSpent": 1260,
    "lastViewedAt": "2024-01-20T14:00:00Z",
    "viewers": [
      {"userId": "client-1", "email": "sarah@whitmorelaw.co.uk", "viewedAt": "2024-01-20T14:00:00Z"}
    ],
    "slideEngagement": [
      {"slideNumber": 1, "views": 12, "avgTimeSpent": 30}
    ]
  }
}
```

**Upload Constraints**:
- Max file size: 50 MB
- Allowed formats: .pptx, .pdf, .xlsx, .docx, .jpg, .png
- Multipart form data
- Resumable/chunked for large files (future)

**Visibility Rules**:
- `client`: Visible to invited clients in portal
- `internal`: Visible to staff only

**Success Criteria**:
- ✅ Can upload 50 MB proposal
- ✅ SharePoint stores file + metadata
- ✅ Can list documents with visibility filter
- ✅ engagement shows view/download counts
- ✅ Proposal versions are tracked

---

#### F4: Message Threading (Email Integration)

**Requirement**: Route Outlook emails to correct hub, send messages via middleware.

**Endpoints**:
```
GET    /api/v1/hubs/{hubId}/messages             - List message threads
GET    /api/v1/hubs/{hubId}/messages/{threadId}  - Get thread with all messages
POST   /api/v1/hubs/{hubId}/messages             - Send new message or reply
PATCH  /api/v1/hubs/{hubId}/messages/{threadId}/notes - Update team notes
PATCH  /api/v1/hubs/{hubId}/messages/{threadId}  - Archive/unarchive thread
```

**How It Works**:

1. **Hub Creation**:
   - Middleware creates category label: `AgentFlow-Hub-{hubId}`
   - Stored mapping: `{ clientDomain: "whitmorelaw.co.uk", hubId: "hub-abc123" }`

2. **Outbound** (Staff sends message via hub):
   - Frontend: `POST /api/v1/hubs/{hubId}/messages`
   - Body: `{ to: "sarah@whitmorelaw.co.uk", subject: "...", bodyHtml: "..." }`
   - Middleware: OBO → Graph: `POST /v1.0/me/sendMail` (from staff mailbox)
   - Middleware: Auto-apply category label `AgentFlow-Hub-{hubId}` to sent message

3. **Inbound** (Client sends reply via email):
   - Client sends email to staff member
   - Middleware webhook/polling detects new mail
   - If from `sarah@whitmorelaw.co.uk` (matches clientDomain), apply label
   - Auto-detect thread by subject, link to existing thread
   - Frontend shows new message in thread

4. **Team Notes**:
   - `PATCH /api/v1/hubs/{hubId}/messages/{threadId}/notes` stores in SharePoint metadata
   - Notes are internal-only (not shared with client)

**Message Thread Metadata** (JSON in SharePoint):
```json
{
  "id": "thread-1",
  "hubId": "hub-abc123",
  "subject": "Re: Proposal Questions",
  "lastMessagePreview": "Thanks for clarifying the timeline...",
  "lastMessageAt": "2024-01-20T14:00:00Z",
  "messageCount": 5,
  "isArchived": false,
  "participants": [
    {"email": "sarah@whitmorelaw.co.uk", "name": "Sarah Mitchell", "isClient": true},
    {"email": "hamish@agentflow.com", "name": "Hamish Nicklin", "isClient": false}
  ],
  "teamNotes": "Follow up on pricing question",
  "messages": [
    {
      "id": "msg-1",
      "from": {"email": "sarah@...", "name": "Sarah Mitchell"},
      "to": [{"email": "hamish@...", "name": "Hamish Nicklin"}],
      "subject": "Re: Proposal Questions",
      "sentAt": "2024-01-20T14:00:00Z",
      "bodyHtml": "<p>Thanks for clarifying...</p>",
      "attachments": []
    }
  ]
}
```

**Success Criteria**:
- ✅ Staff sends message from hub via POST endpoint
- ✅ Message appears in Outlook as real email
- ✅ Category label applied automatically
- ✅ Client reply detected and appears in thread
- ✅ Team notes are persisted
- ✅ No data loss, no duplicate messages

---

#### F5: Meetings Integration

**Requirement**: List meetings, schedule Teams meetings, manage notes.

**Endpoints**:
```
GET    /api/v1/hubs/{hubId}/meetings             - List meetings
GET    /api/v1/hubs/{hubId}/meetings/{meetingId} - Get meeting details
POST   /api/v1/hubs/{hubId}/meetings             - Schedule meeting
PATCH  /api/v1/hubs/{hubId}/meetings/{meetingId}/agenda - Update agenda
PATCH  /api/v1/hubs/{hubId}/meetings/{meetingId}/notes  - Update team notes
```

**Meeting Metadata** (JSON + Graph):
```json
{
  "id": "meeting-1",
  "hubId": "hub-abc123",
  "title": "Project Kickoff",
  "description": "Initial project planning session",
  "startTime": "2024-01-25T14:00:00Z",
  "endTime": "2024-01-25T15:00:00Z",
  "status": "scheduled",
  "organizer": {
    "email": "hamish@agentflow.com",
    "name": "Hamish Nicklin",
    "isOrganizer": true
  },
  "attendees": [
    {
      "email": "sarah@whitmorelaw.co.uk",
      "name": "Sarah Mitchell",
      "responseStatus": "tentative"
    }
  ],
  "joinUrl": "https://teams.microsoft.com/l/meetup-join/...",
  "agenda": "1. Introductions\n2. Project scope\n3. Timeline",
  "teamNotes": "Prepare demo environment",
  "recording": null,
  "transcript": null
}
```

**Constraints**:
- Teams Premium required for recordings/transcripts (gracefully degrade if not available)
- Meetings scoped to hub by attendee domain matching

**Success Criteria**:
- ✅ Can list meetings for hub (via Graph Calendar)
- ✅ Can schedule meeting and send invites
- ✅ Meeting appears in Outlook calendar
- ✅ Team notes stored in SharePoint
- ✅ Attendee list reflects Teams invite

---

#### F6: Questionnaire Integration

**Requirement**: Link Microsoft Forms, track completion, link to hub.

**Endpoints**:
```
GET    /api/v1/hubs/{hubId}/questionnaires       - List linked forms
POST   /api/v1/hubs/{hubId}/questionnaires       - Link new form
GET    /api/v1/hubs/{hubId}/questionnaires/{qId} - Get form details + completion status
DELETE /api/v1/hubs/{hubId}/questionnaires/{qId} - Unlink form
```

**Questionnaire Metadata** (JSON in SharePoint):
```json
{
  "id": "questionnaire-1",
  "hubId": "hub-abc123",
  "title": "Project Requirements",
  "description": "Help us understand your needs",
  "formUrl": "https://forms.office.com/r/abc123",
  "formId": "abc123",
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z",
  "createdBy": "hamish@agentflow.com",
  "responseCount": 2,
  "completions": [
    {
      "userId": "client-1",
      "userName": "Sarah Mitchell",
      "userEmail": "sarah@whitmorelaw.co.uk",
      "startedAt": "2024-01-18T10:00:00Z",
      "completedAt": "2024-01-18T10:15:00Z"
    }
  ]
}
```

**Limitation** (Documented):
- Microsoft Forms API has limited response retrieval
- For v0.1, track completion status only (started/completed)
- Detailed response analytics require viewing in Forms directly

**Success Criteria**:
- ✅ Can link existing Microsoft Forms
- ✅ Completion status tracked
- ✅ Form URL accessible from portal
- ✅ Metadata stored in SharePoint

---

#### F7: Engagement Tracking

**Requirement**: Log user actions (views, downloads, watches) and aggregate analytics.

**Endpoints**:
```
POST   /api/v1/hubs/{hubId}/events               - Log engagement event
GET    /api/v1/hubs/{hubId}/engagement           - Get hub engagement stats
GET    /api/v1/hubs/{hubId}/proposals/engagement - Get proposal stats
GET    /api/v1/hubs/{hubId}/documents/{docId}/engagement - Get document stats
GET    /api/v1/hubs/{hubId}/videos/{videoId}/engagement  - Get video stats
```

**Event Types** (Enum - NOT free-text):
```typescript
type EngagementEventType =
  | "hub.viewed"
  | "proposal.viewed"
  | "proposal.downloaded"
  | "slide.viewed"
  | "slide.commented"
  | "video.started"
  | "video.completed"
  | "document.viewed"
  | "document.downloaded"
  | "message.sent"
  | "message.viewed"
  | "meeting.joined"
  | "meeting.scheduled"
  | "questionnaire.started"
  | "questionnaire.completed"
  | "share.sent"
  | "share.accepted"
```

**Event Payload**:
```json
{
  "eventType": "proposal.viewed",
  "hubId": "hub-abc123",
  "userId": "client-1",
  "userEmail": "sarah@whitmorelaw.co.uk",
  "tenantId": "tenant-uuid",
  "timestamp": "2024-01-20T14:00:00Z",
  "metadata": {
    "resourceId": "proposal-1",
    "duration": 420,
    "slideNumbers": [1, 2, 3, 5]
  },
  "correlationId": "req-12345"
}
```

**Storage**: Events stored in SharePoint as JSONL (newline-delimited JSON):
```
/Hubs/hub-abc123/Metadata/engagement-events.jsonl
```

**Aggregation** (computed on-read):
```json
{
  "hubId": "hub-abc123",
  "totalViews": 45,
  "uniqueVisitors": 3,
  "avgTimeSpent": 420,
  "lastVisit": "2024-01-20T15:30:00Z",
  "engagement": {
    "proposalViews": 12,
    "documentDownloads": 5,
    "videoWatchTime": 1800,
    "messagesExchanged": 7,
    "meetingsJoined": 2
  }
}
```

**Success Criteria**:
- ✅ Frontend sends event on every significant action
- ✅ Events stored in SharePoint JSONL
- ✅ Engagement dashboard shows accurate counts
- ✅ No PII in metadata (only userId, not names)

---

#### F8: API Gateway & Security

**Requirement**: Authenticate, authorize, rate-limit, log all requests.

**Middleware Stack**:
1. CORS validation (allow frontend domain only)
2. Rate limiting (1000 req/hour per token)
3. Request logging (no secrets)
4. JWT validation + tenant extraction
5. Hub access check (user is member of hub)
6. Route handler
7. Response filtering (no secrets)

**Rate Limits**:
- Authenticated user: 1000 req/hour, 10 concurrent
- Unauthenticated: 100 req/hour, 3 concurrent
- Graph API circuit breaker: fail gracefully if quota hit

**Error Response Format** (all errors):
```json
{
  "code": "FORBIDDEN",
  "message": "User does not have access to this hub",
  "details": {
    "userId": "user-123",
    "hubId": "hub-abc123",
    "reason": "Not a member of this hub"
  },
  "correlationId": "req-uuid",
  "timestamp": "2024-01-20T14:00:00Z"
}
```

**Success Criteria**:
- ✅ Unauthorized requests return 401 with no data
- ✅ Cross-tenant access returns 403
- ✅ Rate-limited requests get 429
- ✅ All errors logged with correlation ID

---

### 2.2 Non-Functional Requirements

#### NF1: Performance

| Metric | Target | Rationale |
|--------|--------|-----------|
| **API Latency (p95)** | < 500ms | User experience |
| **Hub List (100 hubs)** | < 1s | Dashboard responsiveness |
| **Large File Upload (50MB)** | < 30s | Acceptable upload time |
| **Search/Filter** | < 500ms | Query responsiveness |
| **Authentication** | < 2s | Login latency |

#### NF2: Availability

- **Uptime SLA**: 99.5% (pilot phase; 99.9% post-GA)
- **Max acceptable downtime**: 4 hours/month
- **Graceful degradation**: If Graph API unavailable, return cached data or error gracefully
- **Automatic failover**: Middleware can run 2+ instances behind load balancer

#### NF3: Security

- **Encryption in transit**: TLS 1.2+
- **Encryption at rest**: SharePoint encryption (default)
- **Token expiration**: 1 hour (renewed by frontend)
- **Rate limiting**: Prevent brute force, abuse
- **Input validation**: All user input validated server-side
- **Output encoding**: HTML encoding for all responses
- **Audit logging**: All hub creation/modification logged with userId
- **Secrets management**: No hardcoded secrets, use env vars
- **CORS**: Whitelist frontend domain only

#### NF4: Scalability

- **Horizontal scaling**: Can add more middleware instances
- **Stateless design**: No session affinity required
- **Caching strategy**:
  - OBO tokens: 10 min (in-memory + Redis)
  - Hub metadata: 5 min (Redis)
  - Engagement aggregates: 15 min (Redis)
- **Database**: No persistent database; SharePoint = source of truth

#### NF5: Maintainability

- **Code documentation**: Inline comments for complex logic, README for setup
- **Error messages**: Clear, actionable, safe (no stack traces to client)
- **Logging**: Structured JSON logs, no PII
- **Monitoring**: Alerts for errors, rate limit hits, Graph failures
- **Deployment**: Zero-downtime deployments (rolling update)

#### NF6: Compliance

- **Data residency**: All data in customer's Microsoft 365 tenant
- **GDPR**: No data retention beyond customer's M365 lifecycle
- **SOC 2**: Audit logging available for compliance
- **Multi-tenant isolation**: No cross-tenant data leakage

---

### 2.3 API Contract (Full Specification)

See accompanying `API_SPECIFICATION.md` (generated from frontend requirements).

Key principles:
- ✅ All endpoints hub-scoped (`/api/v1/hubs/{hubId}/...`)
- ✅ All responses include `data`, `pagination`, and error info
- ✅ All requests require Bearer token
- ✅ All requests logged with correlation ID

---

## 3. Technical Architecture

### 3.1 Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Runtime** | Node.js 18+ | Async, lightweight, fits Microsoft ecosystem |
| **Framework** | Express.js | Minimal, well-known, good middleware support |
| **Authentication** | MSAL (server-side) | Handles Azure AD, OBO flow |
| **Graph Client** | @microsoft/graph-client | Official SDK, well-maintained |
| **Data Store** | SharePoint + JSON | No database needed; S3/Blob for large files |
| **Cache** | Redis or in-memory | Rate limiter + token cache |
| **Async Jobs** | Node Timer (MVP), Azure Functions (future) | Simple polling initially |
| **Logging** | Bunyan + Application Insights | Structured JSON, centralized |
| **Testing** | Jest + Nock (mock Graph) | Unit + integration tests |
| **Deployment** | Docker + Azure App Service | Containerized, auto-scaling |

### 3.2 Folder Structure

```
middleware/
├─ src/
│  ├─ auth/
│  │  ├─ msal.ts              # MSAL initialization, OBO token exchange
│  │  ├─ jwt.ts               # JWT validation, claims extraction
│  │  └─ index.ts             # Barrel export
│  ├─ middleware/
│  │  ├─ auth.ts              # Express middleware for token validation
│  │  ├─ errorHandler.ts      # Centralized error handling
│  │  ├─ rateLimiter.ts       # Rate limiting logic
│  │  ├─ logging.ts           # Request/response logging
│  │  ├─ cors.ts              # CORS validation
│  │  └─ tenantValidator.ts   # Multi-tenant isolation check
│  ├─ services/
│  │  ├─ hub.service.ts       # Hub CRUD, folder management
│  │  ├─ documents.service.ts # Upload, list, engagement
│  │  ├─ messages.service.ts  # Email routing, send/receive
│  │  ├─ meetings.service.ts  # Calendar, Teams scheduling
│  │  ├─ engagement.service.ts # Event logging, aggregation
│  │  ├─ questionnaire.service.ts # Forms integration
│  │  ├─ sharepoint.service.ts # Low-level SharePoint operations
│  │  ├─ graph.service.ts     # Graph API wrapper (OBO calls)
│  │  └─ index.ts
│  ├─ routes/
│  │  ├─ auth.routes.ts       # GET /auth/me, POST /auth/logout
│  │  ├─ hubs.routes.ts       # CRUD /hubs/{hubId}
│  │  ├─ documents.routes.ts  # /hubs/{hubId}/documents
│  │  ├─ messages.routes.ts   # /hubs/{hubId}/messages
│  │  ├─ meetings.routes.ts   # /hubs/{hubId}/meetings
│  │  ├─ engagement.routes.ts # /hubs/{hubId}/events, /engagement
│  │  ├─ questionnaire.routes.ts
│  │  └─ index.ts             # Mount all routes
│  ├─ types/
│  │  ├─ hub.ts               # Hub, HubMember interfaces
│  │  ├─ document.ts
│  │  ├─ message.ts
│  │  ├─ meeting.ts
│  │  ├─ engagement.ts        # Event, EngagementStats
│  │  ├─ api.ts               # Common API response types
│  │  ├─ auth.ts              # JWT claims, OBO response
│  │  └─ index.ts
│  ├─ utils/
│  │  ├─ logger.ts            # Structured logging
│  │  ├─ cache.ts             # Redis/in-memory wrapper
│  │  ├─ errors.ts            # Custom error classes
│  │  ├─ validators.ts        # Input validation helpers
│  │  └─ index.ts
│  ├─ config.ts               # Environment variables, constants
│  ├─ app.ts                  # Express app setup, middleware stack
│  └─ server.ts               # Entry point, listen()
├─ tests/
│  ├─ unit/
│  │  ├─ services/
│  │  ├─ utils/
│  │  └─ routes/
│  ├─ integration/
│  │  ├─ hub.integration.test.ts
│  │  ├─ documents.integration.test.ts
│  │  └─ messages.integration.test.ts
│  └─ fixtures/
│     ├─ hub.fixture.ts
│     ├─ mock-graph.ts        # Nock mocks for Graph API
│     └─ test-utils.ts
├─ .env.example               # Template
├─ .env.local                 # Local development (git-ignored)
├─ .eslintrc.json
├─ tsconfig.json
├─ jest.config.js
├─ Dockerfile
├─ docker-compose.yml         # Local: Node + Redis
├─ package.json
├─ README.md
└─ DEPLOYMENT.md              # Azure deployment guide
```

---

## 4. Implementation Plan

### Phase 1: Foundation (Weeks 1-4)

#### Week 1: Setup & Auth

**Tasks**:
- [ ] Initialize Node project, install dependencies
- [ ] Configure TypeScript, ESLint
- [ ] Set up Express app skeleton
- [ ] Implement MSAL server-side (OBO flow)
- [ ] Implement JWT validation middleware
- [ ] Implement rate limiter middleware
- [ ] Create auth routes (`GET /auth/me`, `POST /auth/logout`)

**Deliverables**:
- ✅ Can authenticate frontend user
- ✅ Middleware obtains OBO token
- ✅ Rate limiting works
- ✅ Unit tests for auth flow

**Test**: `curl -H "Authorization: Bearer {token}" http://localhost:3000/auth/me` returns user info

---

#### Week 2: Hub Service & SharePoint Integration

**Tasks**:
- [ ] Implement Hub Service (create, read, update, list)
- [ ] Implement SharePoint folder structure creation
- [ ] Implement hub metadata storage (JSON in SharePoint)
- [ ] Create hub routes
- [ ] Add tenant isolation checks
- [ ] Implement hub member management

**Deliverables**:
- ✅ `POST /api/v1/hubs` creates hub + SharePoint folder
- ✅ `GET /api/v1/hubs` lists user's hubs
- ✅ Hub metadata readable in SharePoint
- ✅ Cross-tenant access blocked

**Test**:
```bash
POST /api/v1/hubs
Body: {companyName: "Whitmore", contactEmail: "sarah@whitmore.co.uk"}
Response: Hub created with id, SharePoint folder auto-created
```

---

#### Week 3: Documents Service

**Tasks**:
- [ ] Implement Documents Service (upload, list, metadata)
- [ ] Implement Proposal Service (special case of documents)
- [ ] Implement file storage to SharePoint
- [ ] Implement visibility filtering (client vs internal)
- [ ] Create document routes
- [ ] Implement version tracking for proposals

**Deliverables**:
- ✅ `POST /api/v1/hubs/{hubId}/documents` uploads file
- ✅ `GET /api/v1/hubs/{hubId}/documents` lists with visibility filter
- ✅ Proposal upload with version tracking
- ✅ Metadata in SharePoint JSON

**Test**:
```bash
POST /api/v1/hubs/hub-123/documents
Body: multipart/form-data (file: proposal.pptx, visibility: "client")
Response: Document created, stored in SharePoint
```

---

#### Week 4: Messages Service

**Tasks**:
- [ ] Implement Messages Service (list, send, manage threads)
- [ ] Implement email category label logic
- [ ] Implement OBO call to Graph Mail API
- [ ] Create message routes
- [ ] Implement team notes storage
- [ ] Add polling for new mail (or webhook setup)

**Deliverables**:
- ✅ `GET /api/v1/hubs/{hubId}/messages` lists threads
- ✅ `POST /api/v1/hubs/{hubId}/messages` sends email via OBO
- ✅ Category labels applied
- ✅ Team notes persisted in SharePoint

**Test**:
```bash
POST /api/v1/hubs/hub-123/messages
Body: {to: "sarah@whitmore.co.uk", subject: "...", bodyHtml: "..."}
Response: Message sent, appears in Outlook, thread updated
```

---

### Phase 2: Intelligence & Analytics (Weeks 5-8)

#### Week 5: Meetings Service

**Tasks**:
- [ ] Implement Meetings Service (list, schedule, manage)
- [ ] Implement Calendar API calls (OBO)
- [ ] Implement Teams meeting creation
- [ ] Create meeting routes
- [ ] Add recording URL retrieval (best-effort)

#### Week 6: Engagement Tracking

**Tasks**:
- [ ] Implement Engagement Service (event logging, aggregation)
- [ ] Implement event storage to JSONL in SharePoint
- [ ] Implement aggregation queries (hub, proposal, document)
- [ ] Create event routes
- [ ] Add engagement queries to all data endpoints

#### Week 7: Questionnaire & Video Services

**Tasks**:
- [ ] Implement Questionnaire Service (link Forms, track completion)
- [ ] Implement Video Service (upload, list, engagement)
- [ ] Add Video routes
- [ ] Implement video metadata

#### Week 8: Analytics & Dashboard APIs

**Tasks**:
- [ ] Implement hub overview endpoint (aggregated stats)
- [ ] Implement activity feed generation
- [ ] Implement engagement calculations
- [ ] Wire up Pitch Hub frontend to real APIs

---

### Phase 3: Production Hardening (Weeks 9-12)

#### Week 9: Security Audit

**Tasks**:
- [ ] Full security review (cross-tenant, token handling, XSS)
- [ ] OWASP Top 10 checklist
- [ ] Penetration test (internal)
- [ ] Fix issues

#### Week 10: Monitoring & Observability

**Tasks**:
- [ ] Wire up Application Insights
- [ ] Create operational dashboards
- [ ] Add alerts (errors, rate limits, Graph failures)
- [ ] Create runbook for common issues

#### Week 11: Load Testing & Scaling

**Tasks**:
- [ ] Load test (1000 concurrent users)
- [ ] Optimize slow queries
- [ ] Configure auto-scaling
- [ ] Document performance characteristics

#### Week 12: Documentation & Pilot Prep

**Tasks**:
- [ ] Complete API reference documentation
- [ ] Create deployment runbook
- [ ] Create troubleshooting guide
- [ ] Prepare pilot environment

---

## 5. Success Metrics

### Phase 1 Completion (Week 4)

- ✅ Pitch Hub frontend connects to middleware (zero hardcoded data)
- ✅ Real proposals/documents visible
- ✅ Real messages sync
- ✅ Engagement tracking fires
- ✅ Cross-tenant requests blocked
- ✅ Rate limiting works
- ✅ No sensitive data in logs

### Phase 2 Completion (Week 8)

- ✅ Meetings visible and can be scheduled
- ✅ Engagement dashboard shows real metrics
- ✅ Questionnaires can be linked
- ✅ Videos can be uploaded and tracked
- ✅ Activity feed shows real activities

### Phase 3 Completion (Week 12)

- ✅ Zero security issues found in audit
- ✅ 99.5% uptime in load test
- ✅ Can handle 1000 concurrent users
- ✅ Operations team can deploy and troubleshoot
- ✅ Ready for pilot with real customers

---

## 6. Dependencies & Assumptions

### Dependencies

- Azure AD tenant (with multi-tenant app registration)
- SharePoint Online site (for hub storage)
- Outlook mailboxes (for messages)
- Microsoft Graph API access (must be approved)
- MSAL.js library (already in frontend)

### Assumptions

- Users have Microsoft 365 accounts (AAD or B2B guest)
- SharePoint and Outlook available in customer's tenant
- Graph permissions can be granted (requires tenant admin)
- Network connectivity to Microsoft Graph (no air-gapped)
- Email filtering by domain is acceptable (not perfect for large enterprises)

### Open Questions

1. **Email Storage**: Copy emails to SharePoint or just reference them?
   - **Decision**: Reference only for MVP (less storage, faster)
   - **Trade-off**: Requires Graph call per view; acceptable

2. **Video Thumbnail Generation**: Client-side or server-side?
   - **Decision**: Client-side for MVP (JavaScript)
   - **Future**: Server-side for quality

3. **Async Job Persistence**: In-memory or durable queue?
   - **Decision**: In-memory for MVP (simple, works for scale)
   - **Future**: Azure Service Bus for durable queue

4. **B2B Guest Invitation**: Automated or manual?
   - **Decision**: Middleware can trigger, but AAD admin approval needed
   - **Future**: Automate with service principal + delegated permissions

---

## 7. Out of Scope (Phase 2+)

- Client Hub mode (ongoing delivery)
- Relationship Health scoring
- Expansion Radar (upsell detection)
- Copilot integration
- Leadership portfolio views
- Multi-tenant SaaS deployment
- Custom domain support
- Advanced analytics (cohort, funnel)

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Graph API rate limits hit | Medium | Medium | Caching, backoff, circuit breaker |
| Large file upload fails | Low | Medium | Chunked upload, retry logic |
| Email sync misses messages | Low | High | Polling + webhook fallback, audit log |
| SharePoint quota exceeded | Low | High | Monitor usage, alert at 80% |
| OBO token exchange fails | Low | High | Detailed error logging, fallback |
| Cross-tenant data leak | Low | Critical | Code review, automated tests |

---

**Document prepared by**: [Architect Name]  
**Date**: December 2025  
**Next step**: Kickoff meeting with Stephen, begin Week 1 tasks
