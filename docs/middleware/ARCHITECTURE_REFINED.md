# AgentFlow Middleware Architecture — Refined Design

**Version:** 1.0
**Author:** Architecture Review
**Canon:** Simple, Clean, DRY, Secure

---

## Executive Summary

AgentFlow is a **portal-as-a-service** platform that lives on a customer's Microsoft 365 tenant, enabling internal staff and external clients to collaborate through a unified, customizable interface. The middleware acts as a **secure router** between any experience layer (web apps, Copilot, agents, workflows) and the customer's M365 data.

**Key Principles:**
1. **Zero Data Persistence** — All customer data lives in their M365 tenant
2. **Security by Proxy** — Frontend never touches Graph; all M365 access via OBO flow
3. **One API, All Consumers** — Humans, Copilot, agents, and workflows use identical endpoints
4. **Infinite Skinability** — Same backend powers unlimited frontend variations

---

## 1. The Three-Layer Architecture

```
╔═══════════════════════════════════════════════════════════════════════╗
║                        EXPERIENCE LAYER                                ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    ║
║  │ Pitch    │ │ Client   │ │ Teams    │ │ M365     │ │ Power    │    ║
║  │ Hub SPA  │ │ Hub SPA  │ │ App      │ │ Copilot  │ │ Automate │    ║
║  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    ║
║       │            │            │            │            │           ║
╚═══════╪════════════╪════════════╪════════════╪════════════╪═══════════╝
        │            │            │            │            │
        └────────────┴────────────┼────────────┴────────────┘
                                  │
                    ▼ HTTPS + Bearer Token (api://agentflow-backend)
╔═══════════════════════════════════════════════════════════════════════╗
║                        MIDDLEWARE LAYER                                ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │                     API Gateway                                  │  ║
║  │  • JWT Validation (MSAL)      • Tenant Extraction               │  ║
║  │  • Rate Limiting              • Request Logging                 │  ║
║  │  • CORS Enforcement           • Error Handling                  │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                  │                                     ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │                    Hub Access Control                            │  ║
║  │  • Hub membership verification    • Role-based permissions      │  ║
║  │  • Tenant isolation enforcement   • Visibility filtering        │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                  │                                     ║
║  ┌──────────┬──────────┬──────────┬──────────┬──────────┬─────────┐  ║
║  │   Hub    │ Document │ Message  │ Meeting  │ Engage-  │  Async  │  ║
║  │ Service  │ Service  │ Service  │ Service  │  ment    │  Jobs   │  ║
║  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬────┘  ║
║       │          │          │          │          │          │        ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │                    Graph Integration Layer                       │  ║
║  │  • OBO Token Exchange         • SharePoint Operations           │  ║
║  │  • Mail Operations            • Calendar/Teams Operations       │  ║
║  │  • Retry + Circuit Breaker    • Rate Limit Handling             │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════╝
                                  │
                    ▼ Microsoft Graph API (OBO Token)
╔═══════════════════════════════════════════════════════════════════════╗
║                    CUSTOMER M365 TENANT                                ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │  SharePoint          │  Outlook/Exchange  │  Teams/Calendar      │ ║
║  │  • Hub folders       │  • Shared mailbox  │  • Online meetings   │ ║
║  │  • Documents         │  • Email threads   │  • Recordings        │ ║
║  │  • Videos            │  • Categories      │  • Transcripts       │ ║
║  │  • Metadata (JSON)   │                    │                      │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │  Azure AD / Entra ID                                              │ ║
║  │  • Staff users (internal)     • Conditional Access Policies      │ ║
║  │  • B2B Guest users (clients)  • MFA enforcement                  │ ║
║  │  • Security groups per hub    • App permissions consent          │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 2. Security Architecture — Deep Dive

### 2.1 The Proxy Security Model

The fundamental security question you raised: **"How do I use/proxy security policies with this type of portal?"**

**Answer: The middleware proxies ALL M365 access using OBO flow, inheriting the user's permissions.**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Layer 1: Azure AD / Entra ID (Customer Controls)                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  • User authentication (MFA, passwordless, FIDO2)              │ │
│  │  • Conditional Access (device compliance, location, risk)      │ │
│  │  • B2B guest policies (external collaboration settings)        │ │
│  │  • Session lifetime and sign-in frequency                      │ │
│  │  • Privileged Identity Management (PIM) for admins             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│         ↓ User authenticates, policies enforced by Azure AD         │
│                                                                      │
│  Layer 2: Application Registration (AgentFlow Controls)             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  • App ID and tenant restrictions                              │ │
│  │  • Required Graph permissions (admin consent)                  │ │
│  │  • Token audience validation                                    │ │
│  │  • Redirect URI restrictions                                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
│         ↓ Token issued with app-level scope                         │
│                                                                      │
│  Layer 3: Middleware Access Control (AgentFlow Enforces)            │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  • Hub membership verification                                  │ │
│  │  • Tenant isolation (hubTenantId === tokenTenantId)            │ │
│  │  • Role-based access (staff vs client)                         │ │
│  │  • Resource visibility (client vs internal)                    │ │
│  │  • Domain-restricted sharing (clients share within domain)     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│         ↓ Request authorized, OBO exchange initiated                │
│                                                                      │
│  Layer 4: Graph API + M365 Security (Microsoft Enforces)            │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  • SharePoint permissions (site/library/item level)            │ │
│  │  • Exchange transport rules                                     │ │
│  │  • Teams policies (meeting settings, recording access)         │ │
│  │  • Data Loss Prevention (DLP) policies                         │ │
│  │  • Sensitivity labels (Microsoft Purview)                      │ │
│  │  • Audit logging (Microsoft 365 compliance center)             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Why OBO Flow is Non-Negotiable

**The On-Behalf-Of (OBO) flow means:**
1. User authenticates to Azure AD
2. User gets token scoped to `api://agentflow-backend` (NOT Graph)
3. Frontend sends this token to middleware
4. Middleware exchanges it for a Graph token (server-side, using client secret)
5. Middleware calls Graph "as" the user (inheriting their permissions)
6. Graph token never leaves the middleware

**Security benefits:**
- Frontend code cannot be modified to call Graph directly
- Token theft at frontend = limited damage (backend scope only)
- Client secret is server-side (Key Vault in production)
- All M365 Conditional Access policies still apply
- User's SharePoint/Exchange permissions still enforced

```typescript
// OBO Exchange (Simplified)
async function getGraphToken(userToken: string): Promise<string> {
  const result = await msalClient.acquireTokenOnBehalfOf({
    oboAssertion: userToken,
    scopes: ['https://graph.microsoft.com/.default']
  });
  return result.accessToken; // Ephemeral, used for one Graph call
}
```

### 2.3 Tenant Isolation Pattern

Every hub belongs to exactly one tenant. Every request validates this:

```typescript
// MANDATORY on every hub-scoped endpoint
async function enforceHubAccess(
  req: AuthenticatedRequest,
  hubId: string
): Promise<Hub> {
  // 1. Get hub metadata
  const hub = await hubRepository.get(hubId);
  if (!hub) throw new NotFoundError(`Hub ${hubId} not found`);

  // 2. Tenant isolation (CRITICAL)
  const tokenTenantId = req.user.tid;
  if (hub.tenantId !== tokenTenantId) {
    logger.security('Cross-tenant access blocked', {
      hubId,
      hubTenant: hub.tenantId,
      tokenTenant: tokenTenantId,
      userId: req.user.oid
    });
    throw new ForbiddenError('Access denied');
  }

  // 3. Hub membership check
  const membership = await memberRepository.getMembership(hubId, req.user.oid);
  if (!membership) {
    throw new ForbiddenError('Not a member of this hub');
  }

  // 4. Return hub with membership context
  return { ...hub, userMembership: membership };
}
```

### 2.4 Client (External User) Security

**B2B Guest Model:**
- External clients are Azure AD B2B guests in the customer's tenant
- Invited via email, must accept invitation
- Subject to customer's Conditional Access policies
- Can be restricted to specific hubs only

**Domain-Restricted Sharing:**
- Clients can invite colleagues from the same email domain
- Middleware enforces: `inviteeEmail.domain === hub.clientDomain`
- Prevents clients from sharing with unauthorized parties

```typescript
// Client invite validation
function validateClientInvite(hub: Hub, inviteeEmail: string): void {
  const inviteeDomain = inviteeEmail.split('@')[1].toLowerCase();
  const allowedDomain = hub.clientDomain.toLowerCase();

  if (inviteeDomain !== allowedDomain) {
    throw new ForbiddenError(
      `Clients can only invite colleagues from ${allowedDomain}`
    );
  }
}
```

### 2.5 What Customer IT Controls

The customer retains full control over:

| Control | How |
|---------|-----|
| Who can authenticate | Azure AD users + B2B guest policies |
| MFA requirements | Conditional Access policies |
| Device compliance | Intune + Conditional Access |
| Session duration | Token lifetime policies |
| External sharing | SharePoint external sharing settings |
| Data loss prevention | Microsoft Purview DLP policies |
| Sensitivity labels | Microsoft Purview Information Protection |
| Audit trail | Microsoft 365 audit logs |
| App consent | Admin consent workflow |

**AgentFlow cannot bypass any of these.** The OBO flow means AgentFlow operates within the user's permission boundary.

---

## 3. Copilot Intelligence Layer Integration

### 3.1 The Core Question

You asked: **"How to interact with the Copilot intelligence layer that is 'tied' to user views on data?"**

**The answer: Copilot accesses data through the same API, with the same permissions.**

### 3.2 Copilot Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    M365 COPILOT INTEGRATION                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              User in Microsoft 365 (Outlook, Teams, etc.)       │ │
│  │                                                                  │ │
│  │  User: "What's the latest on the Whitmore proposal?"           │ │
│  └──────────────────────────────┬───────────────────────────────────┘ │
│                                 │                                    │
│                                 ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    M365 Copilot                                  │ │
│  │                                                                  │ │
│  │  1. Recognizes "Whitmore proposal" as AgentFlow Hub context    │ │
│  │  2. Invokes AgentFlow plugin/action                             │ │
│  │  3. Passes user's delegated token                               │ │
│  └──────────────────────────────┬───────────────────────────────────┘ │
│                                 │                                    │
│                                 ▼ Plugin HTTP call with user token   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              AgentFlow Middleware                                │ │
│  │                                                                  │ │
│  │  • Validates token (same as web requests)                       │ │
│  │  • Checks hub membership (same rules)                           │ │
│  │  • Returns JSON data (structured for LLM consumption)           │ │
│  └──────────────────────────────┬───────────────────────────────────┘ │
│                                 │                                    │
│                                 ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    M365 Copilot                                  │ │
│  │                                                                  │ │
│  │  Synthesizes response:                                          │ │
│  │  "The Whitmore proposal was viewed 12 times this week.          │ │
│  │   Sarah Chen spent 8 minutes on slides 4-7. No comments yet.   │ │
│  │   Last client login was yesterday at 2:15 PM."                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Plugin/Action Definition

AgentFlow exposes a **Copilot Plugin** (or **Teams Message Extension / AI Plugin**) that Copilot can invoke:

```yaml
# AgentFlow Copilot Plugin Manifest (Simplified)
name: AgentFlow Hubs
description: Access pitch hub data and engagement metrics
authentication:
  type: OAuthCard  # Uses delegated user token
functions:
  - name: getHubOverview
    description: Get overview of a pitch hub including engagement stats
    parameters:
      hubName:
        type: string
        description: Name or ID of the hub
    returns:
      type: HubOverview

  - name: getRecentActivity
    description: Get recent activity for a hub
    parameters:
      hubId:
        type: string
    returns:
      type: ActivityFeedItem[]

  - name: getEngagementMetrics
    description: Get proposal and document engagement metrics
    parameters:
      hubId:
        type: string
    returns:
      type: EngagementStats
```

### 3.4 Copilot Respects User Permissions

**Critical insight:** Copilot can only access what the user can access.

- If user is not a hub member → Copilot cannot query that hub
- If user is a client → Copilot only sees client-visible data
- If user is staff → Copilot sees internal + client data

This is automatic because the plugin uses the user's delegated token.

### 3.5 Grounding Copilot Responses

To prevent hallucination and ensure accurate responses:

```typescript
// API responses include grounding metadata
interface CopilotFriendlyResponse<T> {
  data: T;
  metadata: {
    hubId: string;
    hubName: string;
    asOfTimestamp: string;
    dataSource: 'sharepoint' | 'outlook' | 'teams';
    userPermissionLevel: 'staff' | 'client';
  };
  suggestedFollowUps: string[];  // Guide next questions
}
```

### 3.6 M365 Copilot vs Custom Agent

| Capability | M365 Copilot | Custom AgentFlow Agent |
|------------|--------------|------------------------|
| Deployment | Microsoft manages | Self-hosted |
| Data access | Via plugin/action | Direct API calls |
| User context | Delegated token | Service principal or delegated |
| Availability | M365 Copilot license | Any API client |
| Customization | Plugin manifest | Full control |

**Recommendation:** Start with M365 Copilot plugin for maximum adoption (users already have Copilot in Outlook/Teams). Add custom agents for autonomous background tasks.

---

## 4. Multi-Consumer API Design

### 4.1 One API Contract for All

The same endpoints serve all consumers:

```
                    AgentFlow API (/api/v1)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Web SPA      │   │  M365 Copilot │   │  Power        │
│  (React)      │   │  (Plugin)     │   │  Automate     │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                     Same endpoints
                     Same auth model
                     Same data shape
```

### 4.2 API Design Principles for Multi-Consumer

**1. Structured Responses (JSON, not HTML)**
```json
{
  "id": "hub-123",
  "companyName": "Whitmore & Associates",
  "status": "active",
  "engagement": {
    "totalViews": 47,
    "uniqueViewers": 12,
    "lastVisit": "2025-12-01T14:30:00Z"
  }
}
```

**2. Semantic Naming (Copilot-friendly)**
```
GET /hubs/{hubId}/overview       → What is the hub status?
GET /hubs/{hubId}/engagement     → How engaged is the client?
GET /hubs/{hubId}/activity       → What happened recently?
GET /hubs/{hubId}/alerts         → What needs attention?
```

**3. Consistent Error Format**
```json
{
  "error": {
    "code": "HUB_NOT_FOUND",
    "message": "Hub with ID 'xyz' not found",
    "details": {
      "hubId": "xyz"
    },
    "retryable": false
  }
}
```

**4. Pagination for Lists**
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 156,
    "totalPages": 8
  }
}
```

### 4.3 Consumer-Specific Concerns

| Consumer | Auth Method | Concern | Solution |
|----------|-------------|---------|----------|
| Web SPA | Delegated (user) | UX responsiveness | Cache, pagination, optimistic updates |
| Copilot | Delegated (user) | Response latency | Fast endpoints, pre-computed aggregates |
| Power Automate | Delegated or app | Rate limits | Retry with backoff, efficient batching |
| Custom Agent | Service principal | Scope creep | Explicit agent permissions, audit logging |

---

## 5. Minimal Viable Product Architecture

### 5.1 MVP Scope

For the first "skin" (Pitch Hub), the MVP middleware must support:

| Feature | Services Required | Graph APIs |
|---------|-------------------|------------|
| Authentication | Auth Service | User.Read |
| Hub CRUD | Hub Service | Sites, Drive |
| Documents | Document Service | Files.ReadWrite.All |
| Proposals | Document Service | Files.ReadWrite.All |
| Messages | Message Service | Mail.Read, Mail.Send |
| Meetings | Meeting Service | Calendars.ReadWrite, OnlineMeetings |
| Engagement | Engagement Service | (SharePoint JSONL) |
| Members | Member Service | User.Invite.All |

### 5.2 MVP Endpoint Summary

```
Auth:
  GET  /auth/me                        → Current user + hub access list
  GET  /hubs/{hubId}/access            → Permissions for specific hub

Hubs:
  GET  /hubs                           → List all hubs (staff)
  POST /hubs                           → Create hub
  GET  /hubs/{hubId}                   → Hub details
  PATCH /hubs/{hubId}                  → Update hub
  GET  /hubs/{hubId}/overview          → Dashboard data
  GET  /hubs/{hubId}/activity          → Activity feed

Documents:
  GET  /hubs/{hubId}/documents         → List documents
  POST /hubs/{hubId}/documents         → Upload document
  GET  /hubs/{hubId}/documents/{id}    → Document details
  PATCH /hubs/{hubId}/documents/{id}   → Update metadata
  DELETE /hubs/{hubId}/documents/{id}  → Delete document

Proposals:
  GET  /hubs/{hubId}/proposal          → Current proposal
  POST /hubs/{hubId}/proposal          → Upload/replace proposal
  GET  /hubs/{hubId}/proposal/engagement → Slide-level analytics

Messages:
  GET  /hubs/{hubId}/messages          → Message threads
  GET  /hubs/{hubId}/messages/{id}     → Thread details
  POST /hubs/{hubId}/messages          → Send/reply message
  PATCH /hubs/{hubId}/messages/{id}/notes → Update team notes

Meetings:
  GET  /hubs/{hubId}/meetings          → List meetings
  POST /hubs/{hubId}/meetings          → Schedule meeting
  GET  /hubs/{hubId}/meetings/{id}     → Meeting details
  PATCH /hubs/{hubId}/meetings/{id}    → Update meeting

Engagement:
  POST /hubs/{hubId}/events            → Log event
  GET  /hubs/{hubId}/engagement        → Aggregated stats

Members:
  GET  /hubs/{hubId}/members           → List members
  POST /hubs/{hubId}/invites           → Send invite
  PATCH /hubs/{hubId}/members/{id}     → Update access

Portal:
  GET  /hubs/{hubId}/portal-config     → Portal configuration
  PATCH /hubs/{hubId}/portal-config    → Update portal
  POST /hubs/{hubId}/publish           → Publish portal
```

### 5.3 MVP Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Node.js 20 LTS | Async I/O, Microsoft Graph SDK support |
| Framework | Express.js | Simple, mature, well-documented |
| Auth | @azure/msal-node | Official MSAL for OBO flow |
| Graph | @microsoft/microsoft-graph-client | Official SDK |
| Validation | Zod | TypeScript-first, matches frontend |
| Logging | Pino | Fast structured logging |
| Config | dotenv + Azure Key Vault | Local dev + production secrets |
| Testing | Vitest + MSW | Fast tests with mocked Graph |
| Deployment | Azure App Service | Managed Node.js, auto-scale |

### 5.4 Folder Structure

```
middleware/
├── src/
│   ├── server.ts              # Entry point
│   ├── app.ts                 # Express app setup
│   ├── config/
│   │   └── index.ts           # Environment config
│   ├── auth/
│   │   ├── msal.ts            # MSAL client setup
│   │   ├── obo.ts             # OBO token exchange
│   │   └── middleware.ts      # JWT validation middleware
│   ├── middleware/
│   │   ├── error-handler.ts   # Global error handling
│   │   ├── rate-limiter.ts    # Rate limiting
│   │   ├── request-logger.ts  # Request/response logging
│   │   └── hub-access.ts      # Hub membership check
│   ├── services/
│   │   ├── hub.service.ts
│   │   ├── document.service.ts
│   │   ├── message.service.ts
│   │   ├── meeting.service.ts
│   │   ├── engagement.service.ts
│   │   └── member.service.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── hub.routes.ts
│   │   ├── document.routes.ts
│   │   ├── message.routes.ts
│   │   ├── meeting.routes.ts
│   │   └── member.routes.ts
│   ├── graph/
│   │   ├── client.ts          # Graph client factory
│   │   ├── sharepoint.ts      # SharePoint operations
│   │   ├── mail.ts            # Mail operations
│   │   └── calendar.ts        # Calendar/Teams operations
│   ├── types/
│   │   └── index.ts           # Shared TypeScript types
│   └── utils/
│       ├── errors.ts          # Custom error classes
│       ├── logger.ts          # Logger setup
│       └── validators.ts      # Zod schemas
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## 6. Deployment Architecture

### 6.1 Azure-Native Deployment

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AZURE DEPLOYMENT                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Azure Front Door                             │ │
│  │  • Global load balancing      • WAF rules                      │ │
│  │  • SSL termination            • DDoS protection                │ │
│  └──────────────────────┬─────────────────────────────────────────┘ │
│                         │                                           │
│         ┌───────────────┴───────────────┐                          │
│         ▼                               ▼                          │
│  ┌──────────────────┐           ┌──────────────────┐               │
│  │  Static Web App  │           │  App Service     │               │
│  │  (Frontend SPA)  │           │  (Middleware)    │               │
│  │                  │           │                  │               │
│  │  • React build   │ ──API──▶ │  • Node.js       │               │
│  │  • CDN cached    │           │  • 2-10 instances│               │
│  └──────────────────┘           │  • Auto-scale    │               │
│                                 └────────┬─────────┘               │
│                                          │                          │
│                    ┌─────────────────────┼─────────────────────┐   │
│                    ▼                     ▼                     ▼   │
│            ┌──────────────┐      ┌──────────────┐      ┌──────────┐│
│            │  Key Vault   │      │  App Insights│      │  Redis   ││
│            │              │      │              │      │ (cache)  ││
│            │  • Secrets   │      │  • Telemetry │      │          ││
│            │  • Certs     │      │  • Tracing   │      │  • Tokens││
│            └──────────────┘      │  • Alerts    │      │  • Rate  ││
│                                  └──────────────┘      └──────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Microsoft Graph API
                    ┌───────────────────────────────────┐
                    │     Customer M365 Tenant          │
                    └───────────────────────────────────┘
```

### 6.2 Environment Configuration

```bash
# .env.example (Local Development)

# Azure AD / MSAL
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-app-client-id
AZURE_CLIENT_SECRET=your-client-secret  # NEVER commit this
AZURE_AUTHORITY=https://login.microsoftonline.com/common

# Graph API
GRAPH_API_SCOPE=https://graph.microsoft.com/.default

# SharePoint
SHAREPOINT_SITE_ID=your-sharepoint-site-id
SHAREPOINT_HUB_LIBRARY=Hubs

# Application
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=1000

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173
```

### 6.3 Production Secrets (Key Vault)

```
agentflow-keyvault/
├── azure-client-secret
├── azure-client-id
├── sharepoint-site-id
├── redis-connection-string
└── app-insights-key
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Week 1: Auth + Skeleton**
- [ ] Azure AD app registration (multi-tenant)
- [ ] MSAL setup with OBO flow
- [ ] JWT validation middleware
- [ ] `/auth/me` endpoint
- [ ] Basic Express app structure

**Week 2: Hub Service**
- [ ] Hub CRUD endpoints
- [ ] SharePoint folder creation
- [ ] Hub metadata storage (config.json)
- [ ] `/hubs/{hubId}/access` endpoint

**Week 3: Document Service**
- [ ] File upload to SharePoint
- [ ] Document listing with filters
- [ ] Visibility control (client/internal)
- [ ] Embed URL generation

**Week 4: Message Service**
- [ ] Email routing via shared mailbox
- [ ] Category labeling (`AgentFlow-Hub:{hubId}`)
- [ ] Thread listing and details
- [ ] Send/reply functionality

**Milestone:** Frontend connects to middleware, no hardcoded data.

### Phase 2: Intelligence (Weeks 5-8)

**Week 5: Meeting Service**
- [ ] Calendar integration
- [ ] Teams meeting creation
- [ ] Recording access (Teams Premium)

**Week 6: Engagement Service**
- [ ] Event logging (JSONL in SharePoint)
- [ ] Aggregation endpoints
- [ ] Dashboard data

**Week 7: Proposal + Video**
- [ ] Proposal upload/replace
- [ ] Slide-level engagement
- [ ] Video handling

**Week 8: Portal + Activity**
- [ ] Portal configuration
- [ ] Activity feed
- [ ] Alerts

**Milestone:** Real engagement data visible in dashboard.

### Phase 3: Hardening (Weeks 9-12)

**Week 9: Security Audit**
- [ ] Cross-tenant testing
- [ ] Token handling review
- [ ] OWASP Top 10 check

**Week 10: Monitoring**
- [ ] Application Insights integration
- [ ] Custom dashboards
- [ ] Alert rules

**Week 11: Load Testing**
- [ ] 1000 concurrent users
- [ ] Graph rate limit handling
- [ ] Performance optimization

**Week 12: Documentation + Pilot**
- [ ] API documentation
- [ ] Runbooks
- [ ] Pilot deployment

**Milestone:** Production-ready for pilot customers.

---

## 8. Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Graph rate limits exceeded | High | Medium | Implement retry with exponential backoff, request batching |
| Teams Premium required for recordings | Medium | High | Graceful degradation, clear feature flag |
| B2B guest invitation fails | Medium | Low | Fallback to share links, manual invite option |
| Cross-tenant data leak | Critical | Low | Tenant validation on every request, security audit |
| SharePoint permissions misaligned | High | Medium | Permission sync on membership changes |
| Token cache stampede | Medium | Low | Redis with jitter, circuit breaker |

---

## 9. Success Metrics

### Technical Metrics
- API p95 latency < 500ms
- Error rate < 0.1%
- Uptime > 99.5%
- Zero cross-tenant access violations

### Business Metrics
- Time to first hub creation < 5 minutes
- Client engagement data visible within 1 hour
- Zero hardcoded data in frontend

---

## References

- [AGENTS.md](../../AGENTS.md) — Development canon
- [GOLDEN_RULES.md](../../GOLDEN_RULES.md) — Coding standards
- [perplexity-M365_SaaS_Architecture.md](./perplexity-M365_SaaS_Architecture.md) — Original architecture research
- [perplexity-MVP_PRD.md](./perplexity-MVP_PRD.md) — Detailed PRD
- [perplexity-Implementation_Roadmap.md](./perplexity-Implementation_Roadmap.md) — Week-by-week plan
