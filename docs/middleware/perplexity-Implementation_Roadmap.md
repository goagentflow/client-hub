# AgentFlow Middleware - Quick Start Guide for Stephen
## Week-by-Week Implementation Checklist

**Prepared for**: Stephen (Middleware Developer)  
**Reference**: M365_SaaS_Architecture.md + MVP_PRD.md  
**Duration**: 12 weeks  
**Status**: Ready to begin

---

## How to Use This Document

This is your **implementation roadmap**. Each week has:
1. **High-level goal** (what you're building)
2. **Specific tasks** (what you actually do)
3. **Test scenario** (how to verify it works)
4. **Deliverable** (what's done)

Read the detailed docs first (Architecture + PRD). Then follow this week-by-week.

---

## Phase 1: Foundation (Weeks 1-4)

### Week 1: Authentication & API Gateway Setup

**Goal**: Users can authenticate, middleware validates tokens, rate limiting works.

**Tasks**:
- [ ] Set up Node.js project
  ```bash
  npm init -y
  npm install express dotenv
  npm install -D typescript @types/express
  ```

- [ ] Create `.env.local` (never commit):
  ```
  MSAL_CLIENT_ID=your-app-id
  MSAL_CLIENT_SECRET=your-secret
  MSAL_AUTHORITY=https://login.microsoftonline.com/common
  GRAPH_API_SCOPE=https://graph.microsoft.com/.default
  REDIS_URL=redis://localhost:6379
  LOG_LEVEL=info
  ```

- [ ] Implement MSAL OBO flow (`src/auth/msal.ts`):
  - [ ] Initialize MSAL confidential client
  - [ ] Exchange backend token for Graph token
  - [ ] Cache OBO tokens for 10 minutes
  - [ ] Handle token errors gracefully

- [ ] Implement JWT validation middleware:
  - [ ] Validate token signature
  - [ ] Check expiration
  - [ ] Extract userId, email, tenantId, role
  - [ ] Return 401 if invalid

- [ ] Implement rate limiter:
  - [ ] Track requests by token + IP
  - [ ] Limit: 1000 req/hr per user, 100 req/hr per IP
  - [ ] Return 429 if exceeded

- [ ] Create auth routes:
  - [ ] `GET /auth/me` → returns `{ user: { id, email, role }, hubAccess: [...] }`
  - [ ] `POST /auth/logout` → invalidates token (no-op for stateless)

- [ ] Add request logging:
  - [ ] Log every request: method, path, userId, statusCode
  - [ ] NO secrets in logs
  - [ ] Use structured JSON format

**Test**:
```bash
# Local: Get a backend token from Pitch Hub frontend
# Copy it to BEARER_TOKEN env var

curl -H "Authorization: Bearer $BEARER_TOKEN" \
  http://localhost:3000/auth/me

# Expected response:
{
  "user": {
    "id": "user-123",
    "email": "hamish@agentflow.com",
    "displayName": "Hamish Nicklin",
    "role": "staff"
  },
  "hubAccess": []
}
```

**Deliverable**: ✅ User can authenticate, middleware validates token, logs all requests.

---

### Week 2: Hub Service & SharePoint Integration

**Goal**: Create hubs in SharePoint, store metadata, list hubs.

**Tasks**:
- [ ] Learn Microsoft Graph SDK:
  ```bash
  npm install @microsoft/graph-client
  ```

- [ ] Implement SharePoint operations (`src/services/sharepoint.service.ts`):
  - [ ] `ensureSiteCollection(tenantId)` → creates /sites/AgentFlowPitchHubs if missing
  - [ ] `createFolder(path)` → creates folder in SharePoint
  - [ ] `writeJson(path, data)` → writes JSON file to SharePoint
  - [ ] `readJson(path)` → reads JSON file from SharePoint
  - [ ] Error handling: 404 → graceful, 401 → retry with new token

- [ ] Implement Hub Service (`src/services/hub.service.ts`):
  - [ ] `createHub(name, contact, contactEmail, clientDomain)` →
    - [ ] Generate hubId (UUID)
    - [ ] Create folder: `/Hubs/hubId-{name-slug}/`
    - [ ] Create config.json with metadata
    - [ ] Create subfolders: Proposal, Documents/, Videos, Meetings, Messages, Metadata
    - [ ] Store in-memory cache
    - [ ] Return hub object

  - [ ] `getHub(hubId, tenantId)` →
    - [ ] Check cache first
    - [ ] Read config.json from SharePoint
    - [ ] Validate tenantId matches
    - [ ] Cache for 5 min
    - [ ] Return hub

  - [ ] `listHubs(tenantId, pagination)` →
    - [ ] Read all folders in /Hubs/
    - [ ] Filter by tenantId
    - [ ] Support pagination (page, pageSize)
    - [ ] Return array of hubs

  - [ ] `updateHub(hubId, updates, tenantId)` →
    - [ ] Validate tenantId
    - [ ] Update config.json
    - [ ] Invalidate cache
    - [ ] Return updated hub

- [ ] Create hub routes (`src/routes/hubs.routes.ts`):
  - [ ] `POST /api/v1/hubs` → call createHub
  - [ ] `GET /api/v1/hubs` → call listHubs
  - [ ] `GET /api/v1/hubs/:hubId` → call getHub
  - [ ] `PATCH /api/v1/hubs/:hubId` → call updateHub
  - [ ] All routes: validate tenantId from token

- [ ] Add tenant isolation check:
  - [ ] Every endpoint: verify `hub.tenantId === token.tid`
  - [ ] Return 403 if mismatch
  - [ ] Log attempt (security)

**Test**:
```bash
# Create hub
curl -X POST \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Whitmore Associates",
    "contactName": "Sarah Mitchell",
    "contactEmail": "sarah@whitmore.co.uk",
    "clientDomain": "whitmore.co.uk"
  }' \
  http://localhost:3000/api/v1/hubs

# Expected: hub created, returns hubId

# List hubs
curl -H "Authorization: Bearer $BEARER_TOKEN" \
  http://localhost:3000/api/v1/hubs

# Expected: array with one hub

# Verify SharePoint folder structure
# Open: https://agentflow.sharepoint.com/sites/AgentFlowPitchHubs/Hubs/
# Should see: hub-abc123/ folder with config.json, Proposal/, etc.
```

**Deliverable**: ✅ Hubs can be created, listed, updated. Hub metadata stored in SharePoint. Cross-tenant access blocked.

---

### Week 3: Documents Service & File Upload

**Goal**: Upload proposals and documents, list with visibility filtering.

**Tasks**:
- [ ] Implement file upload handling:
  ```bash
  npm install multer
  ```

- [ ] Implement Documents Service (`src/services/documents.service.ts`):
  - [ ] `uploadDocument(hubId, file, category, visibility, userId)` →
    - [ ] Validate file type (pptx, pdf, xlsx, docx, jpg, png)
    - [ ] Validate file size (< 50MB)
    - [ ] Call Graph to upload to SharePoint
    - [ ] Store metadata in JSON
    - [ ] Return document object

  - [ ] `getDocument(hubId, docId, userId)` →
    - [ ] Check visibility: if internal, user must be staff
    - [ ] Return document + URLs (Office Online, download)

  - [ ] `listDocuments(hubId, filters, userId)` →
    - [ ] If user is client: filter by visibility === "client"
    - [ ] If user is staff: return all
    - [ ] Support pagination
    - [ ] Return array

  - [ ] `uploadProposal(hubId, file, userId)` →
    - [ ] Special case: store in Proposal/ folder
    - [ ] Increment version number
    - [ ] Keep version history
    - [ ] Return proposal object

  - [ ] `getProposal(hubId, userId)` →
    - [ ] Return latest proposal
    - [ ] Include version history, thumbnails

- [ ] Create document routes (`src/routes/documents.routes.ts`):
  - [ ] `POST /api/v1/hubs/:hubId/documents` → multipart upload
  - [ ] `GET /api/v1/hubs/:hubId/documents` → list
  - [ ] `GET /api/v1/hubs/:hubId/documents/:docId` → get one
  - [ ] `PATCH /api/v1/hubs/:hubId/documents/:docId` → update metadata
  - [ ] `DELETE /api/v1/hubs/:hubId/documents/:docId` → delete
  - [ ] `POST /api/v1/hubs/:hubId/proposal` → upload proposal
  - [ ] `GET /api/v1/hubs/:hubId/proposal` → get proposal

- [ ] Implement Graph file operations:
  - [ ] `uploadToSharePoint(siteId, folderPath, file)` → returns driveItemId, officeOnlineUrl
  - [ ] Handle chunked upload for large files
  - [ ] Retry logic for transient errors

**Test**:
```bash
# Upload document
curl -X POST \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -F "file=@pricing.xlsx" \
  -F "category=proposal" \
  -F "visibility=client" \
  http://localhost:3000/api/v1/hubs/hub-123/documents

# Expected: document created, stored in SharePoint

# List documents (as staff)
curl -H "Authorization: Bearer $BEARER_TOKEN" \
  http://localhost:3000/api/v1/hubs/hub-123/documents

# Expected: both client and internal documents

# Verify in SharePoint:
# /sites/AgentFlowPitchHubs/Hubs/hub-123/Documents/
# Should see uploaded file + metadata JSON
```

**Deliverable**: ✅ Can upload documents, files stored in SharePoint, metadata persisted. Visibility filtering works. Proposals versioned.

---

### Week 4: Messages Service & Email Integration

**Goal**: Send emails via middleware, receive emails, scope by category labels.

**Tasks**:
- [ ] Understand email category labels:
  - [ ] Each hub gets a unique label: `AgentFlow-Hub-{hubId}`
  - [ ] Filter inbox by category to get hub-scoped messages

- [ ] Implement Messages Service (`src/services/messages.service.ts`):
  - [ ] `sendMessage(hubId, to, cc, subject, bodyHtml, userId)` →
    - [ ] Call Graph OBO: `POST /v1.0/me/sendMail`
    - [ ] Auto-apply category label `AgentFlow-Hub-{hubId}`
    - [ ] Store metadata in SharePoint
    - [ ] Return message object

  - [ ] `listMessageThreads(hubId, userId, pagination)` →
    - [ ] Call Graph OBO: `GET /v1.0/me/mailFolders/inbox/messages?$filter=categories/any(a:a eq 'AgentFlow-Hub-{hubId}')`
    - [ ] Group by subject (thread)
    - [ ] Return threads with last message preview
    - [ ] Support pagination

  - [ ] `getMessageThread(hubId, threadId, userId)` →
    - [ ] Fetch all messages in thread from Graph
    - [ ] Return with full message bodies

  - [ ] `applyHubCategoryLabel(messageId, hubId)` →
    - [ ] Add category label to message
    - [ ] Call Graph: `PATCH /v1.0/me/messages/{messageId}`

- [ ] Set up message polling:
  - [ ] Timer: every 30 seconds
  - [ ] Query new messages (filter by lastSyncTime)
  - [ ] Auto-detect hub from clientDomain (if from @whitmore.co.uk → whitmore hub)
  - [ ] Apply category label
  - [ ] Update lastSyncTime

- [ ] Create message routes (`src/routes/messages.routes.ts`):
  - [ ] `GET /api/v1/hubs/:hubId/messages` → list threads
  - [ ] `GET /api/v1/hubs/:hubId/messages/:threadId` → get thread
  - [ ] `POST /api/v1/hubs/:hubId/messages` → send message
  - [ ] `PATCH /api/v1/hubs/:hubId/messages/:threadId` → archive
  - [ ] `PATCH /api/v1/hubs/:hubId/messages/:threadId/notes` → team notes

- [ ] Implement team notes storage:
  - [ ] Store in SharePoint JSON metadata
  - [ ] Internal-only (not sent to Graph)

**Test**:
```bash
# Send message from hub
curl -X POST \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "sarah@whitmore.co.uk",
    "subject": "Proposal Questions",
    "bodyHtml": "<p>Thanks for reaching out...</p>"
  }' \
  http://localhost:3000/api/v1/hubs/hub-123/messages

# Expected: message sent, appears in Outlook

# List messages
curl -H "Authorization: Bearer $BEARER_TOKEN" \
  http://localhost:3000/api/v1/hubs/hub-123/messages

# Expected: list of threads

# Verify in Outlook:
# Should see email in sent folder with category label "AgentFlow-Hub-hub-123"
```

**Deliverable**: ✅ Can send emails via middleware, category labels applied, messages received and listed. Team notes persisted.

---

## Phase 2: Intelligence & Analytics (Weeks 5-8)

### Week 5: Meetings Service

**Goal**: List meetings, schedule new meetings, manage agendas.

**Tasks**:
- [ ] Implement Meetings Service (`src/services/meetings.service.ts`):
  - [ ] `listMeetings(hubId, userId, filters)` →
    - [ ] Call Graph OBO: `GET /v1.0/me/calendarview?startDateTime=...&endDateTime=...`
    - [ ] Filter by attendee domain (matches clientDomain if hub has one)
    - [ ] Return with join URL, attendees, response status

  - [ ] `scheduleMeeting(hubId, title, startTime, endTime, attendeeEmails, userId)` →
    - [ ] Call Graph OBO: `POST /v1.0/me/events`
    - [ ] Create Teams meeting automatically
    - [ ] Send calendar invites
    - [ ] Store metadata in SharePoint

  - [ ] `getMeetingRecording(hubId, meetingId)` →
    - [ ] Query Teams API for recording URL
    - [ ] Teams Premium required (gracefully return null if not)

  - [ ] `getMeetingTranscript(hubId, meetingId)` →
    - [ ] Query Teams API for transcript
    - [ ] Teams Premium required (gracefully return null if not)

- [ ] Create meeting routes (`src/routes/meetings.routes.ts`):
  - [ ] `GET /api/v1/hubs/:hubId/meetings` → list
  - [ ] `POST /api/v1/hubs/:hubId/meetings` → schedule
  - [ ] `GET /api/v1/hubs/:hubId/meetings/:meetingId` → get one
  - [ ] `PATCH /api/v1/hubs/:hubId/meetings/:meetingId/agenda` → update
  - [ ] `PATCH /api/v1/hubs/:hubId/meetings/:meetingId/notes` → team notes

**Test**: User can schedule meeting from Pitch Hub, calendar invite sent to client, attendees can join via Teams.

---

### Week 6: Engagement Tracking

**Goal**: Log user actions, aggregate analytics, display on dashboard.

**Tasks**:
- [ ] Implement Engagement Service (`src/services/engagement.service.ts`):
  - [ ] `trackEvent(hubId, eventType, resourceId, metadata, userId)` →
    - [ ] Validate eventType (enum)
    - [ ] Append to JSONL file in SharePoint: `/Hubs/{hubId}/Metadata/engagement-events.jsonl`
    - [ ] Return event object

  - [ ] `getHubEngagement(hubId)` →
    - [ ] Read all events from JSONL
    - [ ] Aggregate: total views, unique visitors, avg time spent
    - [ ] Cache for 15 min
    - [ ] Return metrics

  - [ ] `getProposalEngagement(hubId)` →
    - [ ] Filter events by eventType = "proposal.viewed"
    - [ ] Calculate: total views, unique viewers, avg time, slide engagement
    - [ ] Return proposal-specific metrics

- [ ] Create event routes (`src/routes/engagement.routes.ts`):
  - [ ] `POST /api/v1/hubs/:hubId/events` → track event
  - [ ] `GET /api/v1/hubs/:hubId/engagement` → get hub engagement
  - [ ] `GET /api/v1/hubs/:hubId/proposals/engagement` → get proposal engagement
  - [ ] `GET /api/v1/hubs/:hubId/documents/:docId/engagement` → get doc engagement

- [ ] Wire up frontend:
  - [ ] Frontend sends event on every action: proposal view, document download, video play
  - [ ] Middleware validates event type
  - [ ] Middleware stores in JSONL

**Test**: Frontend sends engagement event, appears in hub engagement stats on dashboard.

---

### Week 7: Questionnaire & Video Services

**Goal**: Link Microsoft Forms, upload videos, track engagement.

**Tasks**:
- [ ] Implement Questionnaire Service (`src/services/questionnaire.service.ts`):
  - [ ] `linkQuestionnaire(hubId, formUrl, title, description, userId)` →
    - [ ] Extract form ID from URL
    - [ ] Store metadata in SharePoint
    - [ ] Return questionnaire object

  - [ ] `listQuestionnaires(hubId)` → return linked forms

  - [ ] `getQuestionnaireCompletions(hubId, questionnaireId)` →
    - [ ] Query Forms API (best-effort)
    - [ ] Return completion status by user

- [ ] Implement Video Service (`src/services/videos.service.ts`):
  - [ ] `uploadVideo(hubId, file, title, visibility, userId)` →
    - [ ] Store in SharePoint: `/Hubs/{hubId}/Videos/`
    - [ ] Generate thumbnail (client-side)
    - [ ] Store metadata
    - [ ] Return video object

  - [ ] `listVideos(hubId, userId)` →
    - [ ] If client: filter by visibility
    - [ ] Return all for staff

  - [ ] `getVideoEngagement(hubId, videoId)` →
    - [ ] Filter engagement events by video plays
    - [ ] Calculate: views, unique viewers, avg watch time, completion %

- [ ] Create routes (`src/routes/videos.routes.ts`, `src/routes/questionnaire.routes.ts`)

**Test**: User can upload video, link form, see engagement on dashboard.

---

### Week 8: Dashboard & Activity Feed

**Goal**: Pitch Hub dashboard shows real data.

**Tasks**:
- [ ] Implement hub overview endpoint:
  - [ ] `GET /api/v1/hubs/:hubId/overview` →
    - [ ] Aggregate all metrics: engagement, activity, team
    - [ ] Return dashboard data

- [ ] Implement activity feed:
  - [ ] `GET /api/v1/hubs/:hubId/activity` →
    - [ ] Generate feed from events + actions (new messages, new meetings, uploads)
    - [ ] Return sorted by timestamp

- [ ] Pitch Hub frontend integration:
  - [ ] Replace mock data with real API calls
  - [ ] Dashboard shows real engagement
  - [ ] Activity feed shows real activity

**Test**: Open Pitch Hub dashboard, see real metrics (proposal views, message count, document downloads, video watch time).

---

## Phase 3: Production Hardening (Weeks 9-12)

### Week 9: Security Audit

**Goal**: Zero security issues.

**Tasks**:
- [ ] OWASP Top 10 checklist:
  - [ ] ✅ Injection: parameterized queries, no SQL (using JSON)
  - [ ] ✅ Broken auth: JWT validation, OBO flow
  - [ ] ✅ XSS: output encoding, no eval()
  - [ ] ✅ CSRF: none (stateless, token-based)
  - [ ] ✅ Broken access control: hub-scoped, tenant validation
  - [ ] ✅ Sensitive data exposure: TLS, no secrets in logs
  - [ ] ✅ Broken objects: rate limiting, no object escalation
  - [ ] ✅ External API risks: OBO flow, token caching
  - [ ] ✅ Logging/monitoring: structured logs, alerts

- [ ] Cross-tenant isolation test:
  - [ ] [ ] Create hub in tenant-A
  - [ ] [ ] Try to access from tenant-B token
  - [ ] [ ] Verify 403 response, no data leaked

- [ ] Token handling:
  - [ ] [ ] Frontend never sees Graph tokens
  - [ ] [ ] OBO tokens cached server-side only
  - [ ] [ ] No token logging

- [ ] Input validation:
  - [ ] [ ] File types, sizes validated
  - [ ] [ ] Email addresses validated
  - [ ] [ ] Hub names sanitized (no special chars)
  - [ ] [ ] All user input validated before use

- [ ] Secrets audit:
  - [ ] [ ] No hardcoded secrets in code
  - [ ] [ ] All secrets from env vars
  - [ ] [ ] .env.local gitignored
  - [ ] [ ] Secrets rotation process documented

**Test**: Run security checklist, pass all items. Attempt cross-tenant access, denied.

---

### Week 10: Monitoring & Observability

**Goal**: Ops can see what's happening.

**Tasks**:
- [ ] Set up Application Insights:
  ```bash
  npm install applicationinsights
  ```

- [ ] Instrument all key operations:
  - [ ] [ ] Hub creation/access
  - [ ] [ ] File uploads
  - [ ] [ ] API errors
  - [ ] [ ] Graph API calls (count, latency)
  - [ ] [ ] Rate limit hits
  - [ ] [ ] Authentication failures

- [ ] Create alerts:
  - [ ] [ ] Error rate > 1%
  - [ ] [ ] Latency p95 > 1s
  - [ ] [ ] Rate limit hits > 10/min
  - [ ] [ ] Graph API errors > 5%

- [ ] Create dashboards:
  - [ ] [ ] Request volume + latency
  - [ ] [ ] Error rate
  - [ ] [ ] Active users
  - [ ] [ ] Hub creation rate
  - [ ] [ ] File upload volume

- [ ] Create runbook:
  - [ ] [ ] How to diagnose high latency
  - [ ] [ ] How to handle Graph API outage
  - [ ] [ ] How to check rate limit status
  - [ ] [ ] How to view logs for a user
  - [ ] [ ] How to rollback deployment

**Test**: Trigger error (simulate Graph API failure), verify alert fires, logs show context.

---

### Week 11: Load Testing & Optimization

**Goal**: Can handle scale.

**Tasks**:
- [ ] Load testing:
  ```bash
  npm install -D artillery
  ```

- [ ] Test scenarios:
  - [ ] [ ] 100 concurrent users, 1000 reqs/min
  - [ ] [ ] Hub creation: 10 req/s
  - [ ] [ ] Document upload: 5 concurrent 50MB files
  - [ ] [ ] Message list (1000 threads): p95 < 1s
  - [ ] [ ] Engagement aggregation (100k events): < 5s

- [ ] Optimize slow paths:
  - [ ] [ ] Add Redis caching for aggregations
  - [ ] [ ] Batch Graph API calls
  - [ ] [ ] Async job processing (don't block API)
  - [ ] [ ] Profile database queries (SharePoint reads)

- [ ] Configure auto-scaling:
  - [ ] [ ] Set up load balancer (Azure)
  - [ ] [ ] Configure scale-out rules (CPU > 70%)
  - [ ] [ ] Set max instances (10)

**Test**: Run load test, verify p95 latency < 500ms, no errors, system scales automatically.

---

### Week 12: Documentation & Pilot Prep

**Goal**: Ready for production.

**Tasks**:
- [ ] Complete documentation:
  - [ ] [ ] README: setup, run locally, test
  - [ ] [ ] API reference: all endpoints, examples
  - [ ] [ ] Deployment guide: Azure setup, env vars
  - [ ] [ ] Runbook: common issues, troubleshooting
  - [ ] [ ] Architecture: data flow, sequence diagrams

- [ ] Create deployment automation:
  - [ ] [ ] Docker image build
  - [ ] [ ] GitHub Actions CI/CD
  - [ ] [ ] Zero-downtime deployment

- [ ] Prepare pilot:
  - [ ] [ ] Set up pilot Azure tenant/subscription
  - [ ] [ ] Configure MSAL for pilot
  - [ ] [ ] Deploy middleware to pilot
  - [ ] [ ] Test with real customer (Hamish's team using Pitch Hub)

- [ ] Pilot checklist:
  - [ ] [ ] Create hub
  - [ ] [ ] Upload proposal
  - [ ] [ ] Send message to client email
  - [ ] [ ] Client receives email, replies
  - [ ] [ ] Reply appears in hub
  - [ ] [ ] Schedule meeting
  - [ ] [ ] Dashboard shows engagement
  - [ ] [ ] Zero errors in logs

**Test**: Complete end-to-end pilot flow. Hamish and Stephen can use Pitch Hub without hardcoded data.

---

## Success Criteria Checklist

### Phase 1 ✅
- [ ] User authenticates via MSAL
- [ ] Backend token obtained via OBO
- [ ] Hubs created in SharePoint
- [ ] Documents uploaded to SharePoint
- [ ] Messages sent via Graph (appears in Outlook)
- [ ] Message replies received and listed
- [ ] Rate limiting prevents abuse
- [ ] Cross-tenant access blocked
- [ ] All sensitive data stripped from logs

### Phase 2 ✅
- [ ] Meetings listed from Calendar
- [ ] Meetings scheduled via Teams
- [ ] Engagement events logged
- [ ] Dashboard shows real metrics
- [ ] Questionnaires linked
- [ ] Videos uploaded and tracked

### Phase 3 ✅
- [ ] Security audit: zero issues
- [ ] Load testing: handles 1000 concurrent users
- [ ] Monitoring: alerts configured, dashboards live
- [ ] Documentation: complete, runbook tested
- [ ] Deployment: automated, zero-downtime
- [ ] Pilot: successful with real users

---

## Critical Decision Points

### Week 2: SharePoint Site Structure
**Decision**: One site for all hubs vs. one site per tenant?
- **Recommendation**: One site per tenant (better isolation)
- **For MVP**: Single shared site (easier setup, partition by folder)
- **Document**: Site structure, folder naming convention

### Week 4: Email Polling vs. Webhook
**Decision**: How to detect new messages?
- **MVP**: Timer polling (every 30 seconds)
- **Future**: Graph webhook (push-based)

### Week 6: Event Storage: Database vs. JSONL
**Decision**: Store engagement events in database or as files?
- **MVP**: JSONL in SharePoint (no database, zero persistence in AgentFlow)
- **Future**: Analytics database if volumes require

---

## Quick Reference: Key Services & Endpoints

| Service | Port | Key Endpoints |
|---------|------|---------------|
| Middleware | 3000 | `POST /api/v1/hubs`, `GET /api/v1/hubs/:hubId/documents` |
| Redis | 6379 | Used for rate limiter + token cache |
| SharePoint | - | `/sites/AgentFlowPitchHubs/Hubs/{hubId}/*` |
| Graph API | - | `https://graph.microsoft.com/v1.0` |

---

## Troubleshooting: Common Issues

### "401 Unauthorized" when calling API
- ✅ Check token is valid (not expired)
- ✅ Check token scope includes `api://agentflow-backend/.default`
- ✅ Check Authorization header format: `Bearer {token}`

### "403 Forbidden" accessing hub
- ✅ Check user is member of hub (stored in SharePoint)
- ✅ Check tenantId in token matches hub's tenantId
- ✅ Check user role (staff vs. client)

### Graph API returns 429 (rate limit)
- ✅ Implement exponential backoff
- ✅ Add caching to reduce calls
- ✅ Batch requests where possible
- ✅ Check service limits quota

### SharePoint file upload fails
- ✅ Check file size < 50MB
- ✅ Check file type is allowed
- ✅ Check SharePoint site has storage quota
- ✅ Implement chunked upload for large files

### Email not appearing in hub
- ✅ Check email is from correct domain (matches clientDomain)
- ✅ Check category label applied manually if polling missed it
- ✅ Check Outlook mailbox actually received email
- ✅ Verify polling is running (check logs)

---

**Next Step**: Start Week 1. Read Architecture + PRD docs first. Then follow this roadmap task-by-task.

**Questions?** Review the detailed docs, or ask Hamish for clarification on requirements.

**Good luck!** 🚀
