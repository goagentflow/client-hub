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

> **Updated Feb 2026** — Architecture evolved from customer-hosted SharePoint to AgentFlow-hosted Azure.
> **MVP deployment** uses Google Cloud Run + Supabase PostgreSQL (existing infrastructure, near-zero cost).
> **Production target** remains Azure App Service + Azure PostgreSQL (Phase 0a).
> Both use the same Prisma schema — migration is a config change (`DATABASE_URL`).
> See `docs/PRODUCTION_ROADMAP.md` (v4.4) for the full rationale, MVP section, and migration plan.

### Architecture Overview

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
│  • Reads/writes to PostgreSQL via TenantRepository (Prisma ORM) │
│  • Calls Graph API via OBO for email + calendar features        │
│  • Returns normalized JSON responses                             │
│                                                                  │
│  STATELESS. CACHES MINIMALLY. ALL DATA IN POSTGRESQL.            │
└─────────────────────────────────────────────────────────────────┘
                      │                         │
                      ▼                         ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   AGENTFLOW DATA LAYER       │  │   CUSTOMER M365 TENANT       │
│                              │  │                              │
│  PostgreSQL (hub data)       │  │  Outlook (email via OBO)     │
│  MVP: Supabase PG            │  │  Teams (meetings via OBO)    │
│  Prod: Azure PG (Phase 0a)   │  │  Calendar (events via OBO)   │
│  Blob Storage (files, later) │  │                              │
│  Azure AD (auth, later)      │  │  Customer controls M365 data │
└──────────────────────────────┘  └──────────────────────────────┘
```

### Core Architectural Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **OBO Flow** | Frontend never sees Graph tokens; secrets server-side only | Minimal latency overhead |
| **PostgreSQL (via Prisma)** | MVP: Supabase PG (existing). Production: Azure PG (Phase 0a). Same Prisma schema, config-only migration. | AgentFlow hosts hub data |
| **Azure Blob Storage** | Private container, AV scanning, auth-checked download proxy (Phase 1). MVP uses OneDrive links. | AgentFlow hosts files (covered by Microsoft DPA) |
| **Hub-scoped endpoints** | Multi-tenant isolation trivial to enforce | Longer URLs |
| **Stateless middleware** | Infinite horizontal scalability | Each request validates tenant |
| **TenantRepository** | Centralised tenant guard on every query; no direct DB calls | Discipline required (enforced by CI lint) |
| **Graph for email/calendar** | Customer data stays in customer M365 — we route, not store | OBO complexity, Graph API learning curve |

### Data Ownership Principle

- **Hub metadata, members, engagement, AI jobs** → PostgreSQL (MVP: Supabase PG; Production: Azure PG)
- **Files (documents, proposals, videos)** → MVP: OneDrive links; Production: Azure Blob Storage (Phase 1)
- **Emails, calendar events, Teams meetings** → Customer's M365 tenant (they own, accessed via Graph OBO)
- **We never store email bodies, file contents from M365, or Graph API responses** in our database

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
1. Frontend acquires token for scope: api://agentflow-backend/access_as_user
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
| Store customer M365 content (emails, files, calendar) in our DB | Data residency violation — Graph data stays in customer's M365 |
| Log email bodies, file contents, or PII | GDPR, compliance risk |
| Use Graph tokens in frontend code | Token theft = full M365 access |
| Allow cross-tenant queries | Multi-tenant isolation breach |
| Skip hub access checks | Unauthorized data access |
| Hardcode secrets anywhere | Secrets leak via git/logs |
| Trust client-side visibility filters | Server must enforce all access |
| Bypass TenantRepository for direct DB queries | Tenant isolation breach — enforced by CI lint |

---

## Four Access Patterns, One API

The same middleware API serves all consumers: **Humans** (Web SPA), **M365 Copilot** (plugin/agent), **Autonomous Agents** (background jobs), and **Power Automate / Logic Apps** (workflows).

**The Principle:** If it works for humans, it works for AI. Same endpoints, same auth, same permissions. See [docs/AGENT_DEVELOPMENT_GUIDELINES.md](./docs/AGENT_DEVELOPMENT_GUIDELINES.md) for detailed examples and patterns.

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

See [docs/AGENT_DEVELOPMENT_GUIDELINES.md](./docs/AGENT_DEVELOPMENT_GUIDELINES.md) for full guidelines on building AI agents and Copilot integrations. Key principle: agents use the same API, same auth, same permissions as humans.

---

## Quick Decision Framework

When facing an architectural decision:

```
1. Does it follow SIMPLE → CLEAN → DRY → SECURE?
2. Does hub data go through TenantRepository? Does M365 data stay in customer M365?
3. Does it work for all four access patterns?
4. Can we explain it in one sentence?
5. Would we be comfortable if a security auditor saw it?
```

If any answer is "no", reconsider the approach.

---

## References

**Start Here:**
- [docs/PRODUCTION_ROADMAP.md](./docs/PRODUCTION_ROADMAP.md) — **Current architecture and implementation plan** (v4.4, MVP + Azure roadmap)

**Standards:**
- [GOLDEN_RULES.md](./GOLDEN_RULES.md) — Coding standards
- [Vision_and_Assumptions.md](./docs/Vision_and_Assumptions.md) — Product vision (note: section 4.2 on storage is superseded by the roadmap)

**Implementation:**
- [docs/PRODUCTION_ROADMAP.md](./docs/PRODUCTION_ROADMAP.md) — Production phase plan and architecture (canon)
- [docs/API_SPECIFICATION.md](./docs/API_SPECIFICATION.md) — Complete API contract (113 endpoints)
- [docs/middleware/MSAL_AUTH_IMPLEMENTATION_PLAN.md](./docs/middleware/MSAL_AUTH_IMPLEMENTATION_PLAN.md) — Auth design (approved)
