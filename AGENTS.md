# AGENTS.md — AgentFlow Development Canon

## The Four Pillars

All AgentFlow development—code, architecture, documentation—must adhere to these four principles:

```
SIMPLE → CLEAN → DRY → SECURE
```

### 1. SIMPLE
- Prefer the obvious solution over the clever one
- One way to do each thing
- Minimal moving parts
- If it needs extensive documentation, simplify it
- Build only what's needed now, not what might be needed later

### 2. CLEAN
- Code reads like prose
- Clear naming: functions describe actions, variables describe values
- Consistent patterns throughout the codebase
- No orphaned code, no dead branches, no commented-out blocks
- Every file has one clear purpose

### 3. DRY (Don't Repeat Yourself)
- Extract shared logic to utilities, hooks, or services
- Single source of truth for data models and types
- Reuse existing patterns before creating new ones
- If you copy-paste, you're doing it wrong
- One change, one place

### 4. SECURE
- Never trust input from any source
- Secrets in environment variables or Key Vault—never in code
- Least privilege access everywhere
- Validate server-side, even if validated client-side
- Log actions, never secrets
- Security is not optional, it's foundational

---

## Architecture Canon

### The Middleware is a Router, Not a Database

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXPERIENCE LAYER                              │
│  Web SPAs │ Teams Apps │ Copilot │ Power Automate │ AI Agents   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS/JSON (Bearer Token)
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                              │
│  Stateless │ Secure │ Tenant-Aware │ Hub-Scoped                 │
│                                                                  │
│  • Validates identity (JWT from MSAL)                           │
│  • Enforces access control (hub membership + tenant isolation)  │
│  • Transforms requests to Graph API calls (OBO flow)            │
│  • Returns normalized JSON responses                             │
│                                                                  │
│  STORES NOTHING. CACHES MINIMALLY. OWNS NO DATA.                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Microsoft Graph API (OBO Token)
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER M365 TENANT                          │
│  SharePoint │ Outlook │ Teams │ OneDrive │ Forms                │
│                                                                  │
│  ALL DATA LIVES HERE. CUSTOMER OWNS IT. CUSTOMER CONTROLS IT.   │
└─────────────────────────────────────────────────────────────────┘
```

### Core Architectural Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **OBO Flow** | Frontend never sees Graph tokens; secrets server-side only | Minimal latency overhead |
| **SharePoint as DB** | Zero customer data in AgentFlow infrastructure | No real-time query flexibility |
| **Hub-scoped endpoints** | Multi-tenant isolation trivial to enforce | Longer URLs |
| **Stateless middleware** | Infinite horizontal scalability | Each request validates tenant |
| **SharePoint Lists** | Native filtering, no JSON parsing | SharePoint API learning curve |
| **No AgentFlow database** | One less thing; customer owns all data | Query complexity in SharePoint |

### SharePoint Organization — The Simple Way

**Use SharePoint as SharePoint was designed:**
- **Lists** for structured metadata (Hubs, Members, Engagement)
- **Document Libraries** for files (with metadata columns)
- **Don't** reinvent a database with JSON files

```
Site: AgentFlowHubs (in customer's M365)
│
├── Lists/
│   ├── Hubs (id, companyName, status, tenantId, ...)
│   ├── Members (hubId, userId, role, accessLevel, ...)
│   └── Engagement (hubId, eventType, userId, timestamp, ...)
│
└── Document Libraries/
    └── HubFiles (columns: hubId, category, visibility)
        ├── /hub-abc123/Proposal/
        ├── /hub-abc123/Documents/
        └── /hub-abc123/Videos/
```

**Why Lists over JSON files:**
- Native filtering (no full-file reads)
- No race conditions on writes
- SharePoint search works
- Standard Microsoft pattern

### URL Pattern: Always Hub-Scoped

```
✅ CORRECT: /api/v1/hubs/{hubId}/documents
✅ CORRECT: /api/v1/hubs/{hubId}/messages
✅ CORRECT: /api/v1/hubs/{hubId}/events

❌ WRONG: /api/v1/documents
❌ WRONG: /api/v1/users/{userId}/documents
```

Every data endpoint requires `{hubId}`. This makes tenant isolation automatic.

---

## Security Canon

### The OBO Flow is Non-Negotiable

```
1. Frontend acquires token for scope: api://agentflow-backend/.default
2. Frontend sends request with Authorization: Bearer <backend-token>
3. Middleware validates JWT (issuer, audience, expiry, tenant)
4. Middleware exchanges for Graph token via OBO (ephemeral, single-use)
5. Middleware calls Graph API on behalf of user
6. Frontend NEVER sees Graph tokens or Graph endpoints
```

**Why this matters:**
- Graph tokens have broad permissions (Files.ReadWrite.All, Mail.Send)
- If leaked, attacker can access customer M365 data
- OBO flow means: token theft at frontend = limited blast radius
- Graph secrets exist only in middleware (Key Vault in production)

### Tenant Isolation Checklist (Every Request)

```typescript
// MANDATORY on every hub-scoped endpoint
function validateTenantAccess(req: Request, hub: Hub): void {
  const tokenTenantId = req.user.tid;  // From JWT claims
  const hubTenantId = hub.tenantId;

  if (tokenTenantId !== hubTenantId) {
    logger.warn('Cross-tenant access attempt', {
      requestedHub: hub.id,
      tokenTenant: tokenTenantId,
      hubTenant: hubTenantId,
      userId: req.user.oid
    });
    throw new ForbiddenError('Tenant mismatch');
  }
}
```

### What We Never Do

| Anti-Pattern | Why |
|--------------|-----|
| Store customer emails/files in AgentFlow DB | Data residency violation, liability |
| Log email bodies, file contents, or PII | GDPR, compliance risk |
| Use Graph tokens in frontend code | Token theft = full M365 access |
| Allow cross-tenant queries | Multi-tenant isolation breach |
| Skip hub access checks | Unauthorized data access |
| Hardcode secrets anywhere | Secrets leak via git/logs |
| Trust client-side visibility filters | Server must enforce all access |

---

## Four Access Patterns, One API

The same middleware API serves all consumers:

### 1. Humans (Web SPA)
```
User clicks "Download proposal"
└─> Frontend: GET /api/v1/hubs/{hubId}/documents/{docId}/download
└─> Middleware: Validate JWT → Check hub access → OBO to Graph
└─> User: Receives download URL
```

### 2. M365 Copilot (Plugin/Agent)
```
User in Outlook: "What's the status of the Whitmore pitch?"
└─> Copilot: GET /api/v1/hubs/whitmore/overview (via plugin)
└─> Middleware: Validate JWT → Check hub access → Return overview
└─> Copilot: Synthesizes natural language response
```

### 3. Autonomous Agents
```
Background scheduler:
└─> Agent: GET /api/v1/hubs/{hubId}/engagement
└─> Agent: Detects "No client activity in 7 days"
└─> Agent: POST /api/v1/hubs/{hubId}/alerts (creates follow-up alert)
└─> Staff: Sees alert in dashboard
```

### 4. Power Automate / Logic Apps
```
Trigger: "When document is downloaded"
└─> Workflow: POST /api/v1/hubs/{hubId}/events (log event)
└─> Workflow: Send Teams notification to owner
└─> Workflow: Update Excel tracker
```

**The Principle:** If it works for humans, it works for AI. Same endpoints, same auth, same permissions.

---

## Code Standards Quick Reference

### File Limits
- **Max 300 lines per file**
- **Max 40 lines per function**
- If approaching limits, extract to new module

### Naming Conventions
```typescript
// Services: noun + "Service"
class HubService { }
class DocumentService { }

// Functions: verb + noun
async function getHub(hubId: string): Promise<Hub>
async function createDocument(hubId: string, file: File): Promise<Document>

// Types: PascalCase, descriptive
interface Hub { }
interface CreateHubRequest { }
interface HubOverviewResponse { }

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE_MB = 50
const TOKEN_CACHE_TTL_SECONDS = 600
```

### Error Handling Pattern
```typescript
// Use domain-specific errors
class HubNotFoundError extends NotFoundError {
  constructor(hubId: string) {
    super(`Hub not found: ${hubId}`);
  }
}

class TenantMismatchError extends ForbiddenError {
  constructor() {
    super('Access denied: tenant mismatch');
  }
}

// Catch at boundaries, not everywhere
// Let errors bubble up to middleware error handler
```

### Logging Pattern
```typescript
// DO: Structured logs with context
logger.info('Document uploaded', {
  hubId,
  documentId,
  fileName: file.name,
  sizeBytes: file.size,
  userId: req.user.oid
});

// DON'T: Log sensitive data
logger.info('Email sent', { body: email.body }); // NEVER
logger.info('User token', { token }); // NEVER
```

---

## Agent Development Guidelines

When building AI agents or Copilot integrations:

### 1. Agents Use the Same API
- No special agent endpoints
- Same authentication (service principal or delegated)
- Same hub-scoped access controls

### 2. Agents Respect Permissions
- Agent cannot access hubs the user cannot access
- Agent cannot bypass visibility filters
- Agent actions are logged with agent identifier

### 3. Agents are Auditable
```typescript
interface AgentRequest {
  agentId: string;        // Which agent made the request
  agentType: 'copilot' | 'autonomous' | 'workflow';
  delegatedUserId?: string;  // User the agent acts on behalf of
  correlationId: string;  // Trace ID for debugging
}
```

### 4. Agents Fail Gracefully
- Return structured errors, not stack traces
- Provide actionable error messages
- Include retry guidance when appropriate

---

## Quick Decision Framework

When facing an architectural decision:

```
1. Does it follow SIMPLE → CLEAN → DRY → SECURE?
2. Does it keep data in customer M365?
3. Does it work for all four access patterns?
4. Can we explain it in one sentence?
5. Would we be comfortable if a security auditor saw it?
```

If any answer is "no", reconsider the approach.

---

## References

**Start Here:**
- [docs/middleware/ARCHITECTURE_V3_FINAL.md](./docs/middleware/ARCHITECTURE_V3_FINAL.md) — **Final architecture** (self-hosted, hidden lists)
- [docs/middleware/ARCHITECTURE_DECISIONS.md](./docs/middleware/ARCHITECTURE_DECISIONS.md) — **Why we made these choices**

**Standards:**
- [GOLDEN_RULES.md](./GOLDEN_RULES.md) — Coding standards
- [VISION_AND_ASSUMPTIONS.md](./VISION_AND_ASSUMPTIONS.md) — Product vision

**Implementation:**
- [docs/middleware/PRD_MVP_SUMMARY.md](./docs/middleware/PRD_MVP_SUMMARY.md) — MVP requirements
- [docs/middleware/perplexity-Implementation_Roadmap.md](./docs/middleware/perplexity-Implementation_Roadmap.md) — Week-by-week plan

**Research (for reference):**
- [docs/middleware/ARCHITECTURE_V2_CRITICAL_REVIEW.md](./docs/middleware/ARCHITECTURE_V2_CRITICAL_REVIEW.md) — Analysis of research conflicts
- [docs/middleware/perplexity-M365_SaaS_Architecture.md](./docs/middleware/perplexity-M365_SaaS_Architecture.md) — Original research
