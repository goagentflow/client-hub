# AgentFlow Middleware — MVP Product Requirements

**Version:** 1.0
**Canon:** Simple, Clean, DRY, Secure
**Status:** Ready for Implementation

---

## 1. Product Overview

### What We're Building

A **stateless middleware layer** that:
1. Authenticates users (staff and clients) via Azure AD
2. Enforces hub-scoped access control
3. Routes requests to Microsoft Graph API using OBO flow
4. Returns normalized JSON responses to any consumer (web, Copilot, agents, workflows)

### What We're NOT Building

- A database (all data lives in customer M365)
- A file storage system (files live in SharePoint)
- An email server (emails route through Outlook)
- A meeting platform (meetings are Teams meetings)

### Success Criteria

| Metric | Target |
|--------|--------|
| Frontend connects with zero hardcoded data | Week 4 |
| Real proposal views tracked | Week 6 |
| Real messages synced | Week 4 |
| Cross-tenant requests blocked | Week 1 |
| API p95 latency | < 500ms |

---

## 2. User Personas

### Staff User (Internal)
- AgentFlow employee managing pitch hubs
- Full access to all hub features
- Can see internal + client-visible content
- Can invite clients and configure portal

### Client User (External)
- B2B guest in customer's Azure AD
- Access limited to specific hubs they're invited to
- Can only see client-visible content
- Can invite colleagues from same email domain

### Copilot User (AI)
- M365 Copilot or custom agent
- Accesses data via plugin/action
- Inherits permissions of delegating user
- Returns structured data for LLM consumption

---

## 3. Functional Requirements

### F1: Authentication & Authorization

**Objective:** Secure user identity and hub access verification.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/me` | GET | Current user profile + hub access list |
| `/hubs/{hubId}/access` | GET | Permissions for specific hub |

**Requirements:**
- FR1.1: Validate JWT tokens (issuer, audience, expiry)
- FR1.2: Extract tenant ID and user ID from claims
- FR1.3: Return user profile with role (staff/client)
- FR1.4: Return hub permissions (canViewProposal, canViewDocuments, etc.)
- FR1.5: Support OBO flow for Graph API calls

**Security:**
- All endpoints require valid Bearer token (except health check)
- Tenant isolation enforced on every hub-scoped request
- 401 for invalid/expired tokens, 403 for access denied

---

### F2: Hub Management

**Objective:** CRUD operations for pitch hubs with SharePoint integration.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hubs` | GET | List all hubs (staff only) |
| `/hubs` | POST | Create new hub |
| `/hubs/{hubId}` | GET | Hub details |
| `/hubs/{hubId}` | PATCH | Update hub |
| `/hubs/{hubId}/overview` | GET | Dashboard data (alerts, stats) |
| `/hubs/{hubId}/activity` | GET | Activity feed |
| `/hubs/{hubId}/notes` | PATCH | Update internal notes |

**Requirements:**
- FR2.1: Create SharePoint folder structure on hub creation
- FR2.2: Store hub metadata in `config.json`
- FR2.3: Support search, filter, sort, pagination for hub list
- FR2.4: Generate engagement stats (views, visitors, last visit)
- FR2.5: Surface alerts (new activity, no recent engagement)

**SharePoint Structure:**
```
/sites/{tenant}/Hubs/{hubId}/
├── config.json
├── Proposal/
├── Documents/
│   ├── ClientDocuments/
│   └── InternalDocuments/
├── Videos/
├── Meetings/
├── Messages/
└── Metadata/
    ├── engagement-events.jsonl
    └── members.json
```

---

### F3: Document Service

**Objective:** File management with visibility control and engagement tracking.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hubs/{hubId}/documents` | GET | List documents |
| `/hubs/{hubId}/documents` | POST | Upload document |
| `/hubs/{hubId}/documents/{docId}` | GET | Document details |
| `/hubs/{hubId}/documents/{docId}` | PATCH | Update metadata |
| `/hubs/{hubId}/documents/{docId}` | DELETE | Delete document |
| `/hubs/{hubId}/documents/{docId}/engagement` | GET | View/download stats |

**Requirements:**
- FR3.1: Upload files to SharePoint (max 50MB)
- FR3.2: Support visibility: `client` or `internal`
- FR3.3: Support categories: `proposal`, `contract`, `reference`, `brief`, `deliverable`, `other`
- FR3.4: Generate embed URLs for Office Online preview
- FR3.5: Generate download URLs (presigned)
- FR3.6: Track views and downloads per document

**File Types:**
- Allowed: `.pdf`, `.pptx`, `.docx`, `.xlsx`, `.jpg`, `.png`, `.mp4`, `.mov`
- Max size: 50MB per file

---

### F4: Proposal Service

**Objective:** Primary pitch document with slide-level engagement.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hubs/{hubId}/proposal` | GET | Current proposal |
| `/hubs/{hubId}/proposal` | POST | Upload/replace proposal |
| `/hubs/{hubId}/proposal/settings` | PATCH | Update settings |
| `/hubs/{hubId}/proposal/engagement` | GET | Slide-level analytics |

**Requirements:**
- FR4.1: Single proposal per hub (replace on re-upload)
- FR4.2: Generate thumbnails for slides (or placeholder)
- FR4.3: Track time spent per slide
- FR4.4: Track total views and unique viewers
- FR4.5: Support download toggle (client can/cannot download)
- FR4.6: Support commenting on slides (creates message)

---

### F5: Message Service

**Objective:** Email integration scoped to hub via category labels.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hubs/{hubId}/messages` | GET | List message threads |
| `/hubs/{hubId}/messages/{threadId}` | GET | Thread with messages |
| `/hubs/{hubId}/messages` | POST | Send/reply message |
| `/hubs/{hubId}/messages/{threadId}/notes` | PATCH | Update team notes |
| `/hubs/{hubId}/messages/{threadId}` | PATCH | Archive/unarchive |

**Requirements:**
- FR5.1: Use shared mailbox for hub communications
- FR5.2: Apply category label `AgentFlow-Hub:{hubId}` to messages
- FR5.3: Filter inbox by category for hub-scoped view
- FR5.4: Support team notes (internal, stored in SharePoint)
- FR5.5: Track read status and message count
- FR5.6: Support archive/unarchive for thread management

**Graph Scopes:** `Mail.Read`, `Mail.Send`

---

### F6: Meeting Service

**Objective:** Teams meeting integration with recordings and transcripts.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hubs/{hubId}/meetings` | GET | List meetings |
| `/hubs/{hubId}/meetings` | POST | Schedule meeting |
| `/hubs/{hubId}/meetings/{meetingId}` | GET | Meeting details |
| `/hubs/{hubId}/meetings/{meetingId}` | PATCH | Update meeting |
| `/hubs/{hubId}/meetings/{meetingId}/agenda` | PATCH | Update agenda |
| `/hubs/{hubId}/meetings/{meetingId}/notes` | PATCH | Update team notes |
| `/hubs/{hubId}/meetings/{meetingId}/transcript` | GET | Get transcript |

**Requirements:**
- FR6.1: Create Teams online meetings via Graph
- FR6.2: Include hub identifier in meeting subject/description
- FR6.3: List upcoming and past meetings
- FR6.4: Retrieve recording URLs (Teams Premium required)
- FR6.5: Retrieve transcripts (Teams Premium required)
- FR6.6: Graceful degradation if Teams Premium unavailable

**Graph Scopes:** `Calendars.ReadWrite`, `OnlineMeetings.ReadWrite`

---

### F7: Engagement Service

**Objective:** Event logging and analytics aggregation.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hubs/{hubId}/events` | POST | Log engagement event |
| `/hubs/{hubId}/engagement` | GET | Aggregated engagement stats |

**Event Types (Enum):**
```typescript
enum EventType {
  HUB_VIEWED = 'hub.viewed',
  PROPOSAL_VIEWED = 'proposal.viewed',
  PROPOSAL_SLIDE_TIME = 'proposal.slide_time',
  DOCUMENT_VIEWED = 'document.viewed',
  DOCUMENT_DOWNLOADED = 'document.downloaded',
  VIDEO_WATCHED = 'video.watched',
  VIDEO_COMPLETED = 'video.completed',
  MESSAGE_SENT = 'message.sent',
  MESSAGE_READ = 'message.read',
  MEETING_JOINED = 'meeting.joined',
  SHARE_SENT = 'share.sent',
  SHARE_ACCEPTED = 'share.accepted'
}
```

**Requirements:**
- FR7.1: Log events to JSONL file in SharePoint
- FR7.2: Aggregate on-read with 15-minute cache
- FR7.3: Return stats: total views, unique viewers, avg time, last visit
- FR7.4: Support per-resource engagement (document, video, etc.)

---

### F8: Member Service

**Objective:** Hub membership and access management.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hubs/{hubId}/members` | GET | List hub members |
| `/hubs/{hubId}/invites` | GET | List pending invites |
| `/hubs/{hubId}/invites` | POST | Send invite |
| `/hubs/{hubId}/members/{memberId}` | PATCH | Update access level |
| `/hubs/{hubId}/members/{memberId}` | DELETE | Remove member |
| `/hubs/{hubId}/share-links` | POST | Create share link |
| `/hubs/{hubId}/share-links` | GET | List share links |

**Requirements:**
- FR8.1: Staff can invite anyone (staff or client)
- FR8.2: Clients can only invite colleagues from same domain
- FR8.3: Domain restriction: `inviteeEmail.domain === hub.clientDomain`
- FR8.4: Create B2B guest via Graph Invitation API
- FR8.5: Support access levels: `full_access`, `proposal_only`, `documents_only`, `view_only`
- FR8.6: Log all access changes as activity events

---

### F9: Portal Configuration

**Objective:** Customize what clients see in their portal.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/hubs/{hubId}/portal-config` | GET | Get portal config |
| `/hubs/{hubId}/portal-config` | PATCH | Update portal config |
| `/hubs/{hubId}/publish` | POST | Publish portal |

**Requirements:**
- FR9.1: Configure headline and welcome message
- FR9.2: Configure hero content (image/video)
- FR9.3: Toggle section visibility (proposal, videos, documents, etc.)
- FR9.4: Publish/unpublish portal
- FR9.5: Track portal publish history

---

## 4. Non-Functional Requirements

### NFR1: Performance

| Metric | Target |
|--------|--------|
| API p50 latency | < 200ms |
| API p95 latency | < 500ms |
| API p99 latency | < 1000ms |
| Hub list (100 hubs) | < 1s |
| File upload (50MB) | < 30s |

### NFR2: Scalability

- Stateless middleware (horizontal scaling)
- Target: 1000 concurrent users per instance
- Auto-scale: 2-10 instances based on CPU/memory
- Graph rate limit handling with retry + backoff

### NFR3: Availability

- SLA: 99.5% (pilot), 99.9% (post-GA)
- Graceful degradation if Graph API unavailable
- Circuit breaker for Graph calls
- Health check endpoint: `/health`

### NFR4: Security

- All traffic over HTTPS
- JWT validation on every request
- Tenant isolation on every hub-scoped request
- Secrets in Azure Key Vault (production)
- No customer data stored in AgentFlow infrastructure
- Audit logging for all access changes

### NFR5: Observability

- Structured JSON logging (Pino)
- Request/response tracing (correlation ID)
- Application Insights integration
- Custom dashboards for key metrics
- Alert rules for errors and latency

---

## 5. API Contract Summary

### Request Format

```
Authorization: Bearer <token>
Content-Type: application/json
X-Correlation-ID: <uuid>  (optional, generated if missing)
```

### Response Format (Success)

```json
{
  "data": { ... },
  "metadata": {
    "timestamp": "2025-12-01T12:00:00Z",
    "correlationId": "abc-123"
  }
}
```

### Response Format (List)

```json
{
  "items": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

### Response Format (Error)

```json
{
  "error": {
    "code": "HUB_NOT_FOUND",
    "message": "Hub with ID 'xyz' not found",
    "details": { "hubId": "xyz" },
    "retryable": false
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (delete) |
| 400 | Bad Request (validation) |
| 401 | Unauthorized (invalid token) |
| 403 | Forbidden (access denied) |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## 6. Data Models

### Hub

```typescript
interface Hub {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  clientDomain: string;
  status: 'draft' | 'active' | 'won' | 'lost';
  hubType: 'pitch' | 'client';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  clientsInvited: number;
  lastVisit: string | null;
}
```

### Document

```typescript
interface Document {
  id: string;
  hubId: string;
  name: string;
  fileName: string;
  category: 'proposal' | 'contract' | 'reference' | 'brief' | 'deliverable' | 'other';
  visibility: 'client' | 'internal';
  downloadUrl: string;
  embedUrl: string | null;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  views: number;
  downloads: number;
}
```

### Message Thread

```typescript
interface MessageThread {
  id: string;
  hubId: string;
  subject: string;
  participants: Participant[];
  lastMessageAt: string;
  messageCount: number;
  isRead: boolean;
  isArchived: boolean;
  teamNotes: string | null;
}
```

### Engagement Event

```typescript
interface EngagementEvent {
  id: string;
  eventType: EventType;
  hubId: string;
  userId: string;
  resourceId: string | null;
  resourceType: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}
```

---

## 7. Graph API Permissions

### Delegated (User Consent)

| Permission | Purpose |
|------------|---------|
| User.Read | User profile |

### Application (Admin Consent)

| Permission | Purpose |
|------------|---------|
| Files.ReadWrite.All | SharePoint file operations |
| Mail.Read | Read emails for hub |
| Mail.Send | Send emails from hub |
| Calendars.ReadWrite | Meeting management |
| OnlineMeetings.ReadWrite | Teams meeting creation |
| User.Invite.All | B2B guest invitations |
| Sites.ReadWrite.All | SharePoint site access |

---

## 8. Dependencies

### External Services

| Service | Dependency | Fallback |
|---------|------------|----------|
| Azure AD | Authentication | None (required) |
| Microsoft Graph | All M365 operations | Cached data, retry |
| SharePoint | File storage | None (required) |
| Teams | Meetings, recordings | Graceful degradation |
| Redis | Token cache, rate limit | In-memory (degraded) |

### Teams Premium Features

| Feature | Teams Premium Required |
|---------|------------------------|
| Meeting recordings | Yes (for automatic retrieval) |
| Meeting transcripts | Yes |
| AI meeting summaries | Yes |
| Basic meetings | No |

---

## 9. Out of Scope (MVP)

The following are explicitly out of scope for the MVP:

- Client Hub features (ongoing delivery, not pitch)
- AI-powered features (expansion radar, health scoring)
- Leadership portfolio views
- Video recording in browser (upload only)
- Real-time notifications (polling only)
- Multi-tenant marketplace deployment
- Questionnaire deep integration (link only)
- Custom Copilot agent (plugin only)

---

## 10. Implementation Priority

### P0 (Must Have)
1. Authentication + Hub access check
2. Hub CRUD + SharePoint integration
3. Document upload/list/download
4. Proposal upload + engagement
5. Message list + send

### P1 (Should Have)
6. Meeting list + schedule
7. Engagement event logging
8. Member management
9. Portal configuration

### P2 (Nice to Have)
10. Meeting recordings/transcripts
11. Share links
12. Activity feed
13. Alerts

---

## References

- [ARCHITECTURE_REFINED.md](./ARCHITECTURE_REFINED.md) — Full architecture design
- [AGENTS.md](../../AGENTS.md) — Development canon
- [perplexity-Implementation_Roadmap.md](./perplexity-Implementation_Roadmap.md) — Week-by-week plan
