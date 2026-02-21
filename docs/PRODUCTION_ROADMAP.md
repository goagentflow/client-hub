# AgentFlow Pitch Hub — Production Roadmap v3

**Date:** 21 Feb 2026
**Author:** Hamish Nicklin / Claude Code
**Status:** v3 — revised after senior dev review round 2 (7 findings addressed)
**Audience:** Senior developer reviewing for feasibility and sequencing

---

## Objective

Ship the AgentFlow Pitch Hub as a production application for use with real clients. This means:

1. Deploy to a public URL (not localhost)
2. Connect to real data storage (Supabase now, SharePoint later for enterprise)
3. Implement all 72 remaining 501-stubbed endpoints
4. Integrate Microsoft Graph API for email and calendar features
5. Add AI-powered client intelligence features

---

## Assumptions

| Assumption | Value | Impact |
|-----------|-------|--------|
| Tenancy at launch | Single-tenant, multi-tenant controls enforced | One Azure AD tenant, one Supabase project. `tenant_id` column + tenant guard abstraction enforced on all hub-linked tables from Phase 0. This is a hard launch requirement, not deferred. |
| Compliance | GDPR-aware | Data handling policies, right to deletion, no unnecessary PII sent to AI. Not SOC2-certified. |
| Scale | Small (<50 users, <100 hubs) | Single-instance hosting. No distributed cache needed at launch. |
| Multi-tenant expansion | Designed for, not tested at launch | Schema supports multiple tenants. Actual multi-tenant onboarding (tenant provisioning, billing, tenant admin UI) is post-launch scope. |

---

## Endpoint Inventory (Source of Truth)

Audited by reading every `middleware/src/routes/*.ts` file and counting handlers that return real responses vs 501 stubs. v2 had inaccurate counts for 6 files — corrected below.

**Integrity rule:** This table must be re-verified before each phase ships. Add a CI check (`npm run verify-endpoints`) that greps route files for `send501` / `res.status(501)` counts and fails if this table drifts from the actual codebase.

| Route File | Real | 501 Stub | Total | Notes |
|-----------|------|----------|-------|-------|
| auth.route.ts | 1 | 0 | 1 | GET /me |
| hubs.route.ts | 9 | 0 | 9 | Full CRUD + overview/notes/activity/publish/portal-preview |
| documents.route.ts | 5 | 3 | 8 | Upload, engagement stubbed |
| proposals.route.ts | 3 | 2 | 5 | Upload, engagement stubbed |
| videos.route.ts | 6 | 3 | 9 | Engagement, upload stubbed |
| projects.route.ts | 9 | 0 | 9 | Fully implemented (incl. milestones) |
| portal.route.ts | 3 | 5 | 8 | GET content real; messages, meetings, members, questionnaires stubbed |
| portal-config.route.ts | 2 | 0 | 2 | Fully implemented |
| events.route.ts | 3 | 0 | 3 | Fully implemented (incl. leadership event) |
| public.route.ts | 3 | 1 | 4 | Invite accept stubbed |
| messages.route.ts | 0 | 5 | 5 | All 501 (Graph Mail) |
| meetings.route.ts | 0 | 10 | 10 | All 501 (Graph Calendar + Teams) |
| members.route.ts | 0 | 11 | 11 | All 501 (members + invites + share-link + accept) |
| questionnaires.route.ts | 0 | 7 | 7 | All 501 |
| client-intelligence.route.ts | 0 | 18 | 18 | All 501 (AI: answers, prep, performance, decisions, history, alerts) |
| intelligence.route.ts | 0 | 3 | 3 | All 501 |
| leadership.route.ts | 2 | 3 | 5 | Portfolio/clients real; at-risk/expansion/refresh 501 |
| conversion.route.ts | 1 | 1 | 2 | POST convert real; POST rollback stubbed |
| **TOTAL** | **47** | **72** | **119** | **39% real, 61% stubbed** |

**Corrections from v2:** videos (6/3 not 8/0), hubs (9 not 10), proposals (3/2 not 3/4), portal (3/5 not 3/6), portal-config (2 not 3), events (3 not 2), public (3/1 not 3/0), meetings (10 not 6), members (11 not 7), questionnaires (7 not 4), client-intelligence (18 not 14), conversion (1/1 not 0/2). Net: 72 stubs to implement (was 59 — 22% undercount in v2).

---

## Configuration Model (Revised — Finding #4)

The current `DEMO_MODE` boolean conflates auth mode and data backend. Replace with orthogonal controls:

| Variable | Values | Purpose |
|----------|--------|---------|
| `AUTH_MODE` | `azure_ad` / `demo` | Controls whether real JWT validation or X-Dev-User-Email headers are used |
| `DATA_BACKEND` | `supabase` / `sharepoint` | Controls which data adapter is used |

**Production guardrail truth table:**

| NODE_ENV | AUTH_MODE | DATA_BACKEND | Allowed? |
|----------|-----------|-------------|----------|
| production | azure_ad | supabase | Yes |
| production | azure_ad | sharepoint | Yes |
| production | demo | * | **BLOCKED** — demo auth not allowed in production |
| development | demo | supabase | Yes (default dev config) |
| development | azure_ad | supabase | Yes (real auth testing) |
| test | demo | supabase | Yes |

This eliminates the risk of insecure auth fallback paths reaching production while allowing Supabase as a legitimate production data backend.

---

## Tenant Isolation Architecture (Finding #2, revised per v3 finding #2)

**Chosen model: Service-role with centralised tenant guards** (not RLS).

The current Supabase adapter uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS by design. Rather than rearchitecting to per-user JWTs (which would require Supabase custom JWT signing and break the OBO pattern), we enforce tenant isolation in the middleware repository layer.

**How it works:**
- Every hub-linked table has a `tenant_id` column (matches Azure AD `tid` claim)
- A centralised `TenantRepository` wrapper adds `WHERE tenant_id = :tenantId` to every query — no direct Supabase calls outside this wrapper
- `tenant_id` is extracted from `req.user.tenantId` (set by auth middleware) — never from client input
- DB-level `CHECK` constraint: `tenant_id IS NOT NULL` on all hub-linked tables (defence in depth — prevents accidental null inserts)
- Admin/leadership queries that aggregate across tenants use a separate `AdminRepository` with explicit `bypassTenant: true` flag, logged on every call

**Security invariant:** No table access without tenant guard abstraction. Any Supabase query that touches hub-linked data MUST go through `TenantRepository`. Direct `supabase.from('table')` calls outside the repository layer are a CI lint failure.

**Mandatory security tests (per phase):**
- Negative test: User A cannot read User B's hub data (cross-tenant denial at repository layer)
- Negative test: Portal token for Hub X cannot access Hub Y data
- Negative test: Client user cannot access staff-only endpoints
- Negative test: Direct Supabase query without tenant guard is rejected (lint/grep check)
- These tests run in CI — phase cannot ship without passing

---

## Production Readiness Gate (Finding #1)

Phase 0 cannot ship until ALL of these pass:

### Hard Pass/Fail Checks

| Check | Criteria | Owner |
|-------|----------|-------|
| HTTPS enforced | All endpoints redirect HTTP to HTTPS | Infra |
| Secrets management | All secrets in hosting platform env vars, not in code or .env files | Dev |
| Error monitoring | Pino logs shipped to a log aggregator (e.g. Logtail, Datadog) | Dev |
| Health endpoint | `GET /health` returns 200 with DB connectivity check | Dev |
| Backup/restore | Supabase daily backups enabled; manual restore tested once | Hamish |
| Rollback runbook | Document: how to revert to previous deployment in <5 minutes | Dev |
| Security headers | Helmet defaults: CSP, HSTS, X-Frame-Options, X-Content-Type-Options | Dev |
| Rate limiting | Express rate-limit on auth and public endpoints (already configured) | Dev |
| CORS locked | `CORS_ORIGIN` set to exact production domain (no wildcards) | Dev |
| Dependency audit | `npm audit` with zero critical/high vulnerabilities | CI |
| Secret rotation | `PORTAL_TOKEN_SECRET` is production-grade (32+ chars, no dev- prefix) | Dev |

### Schema Migration Gate (per phase, not just Phase 0)

| Check | Criteria | Owner |
|-------|----------|-------|
| Migration dry-run | Every schema migration tested against a staging snapshot before production | Dev |
| Roll-forward script | Migration script runs idempotently (safe to re-run) | Dev |
| Rollback script | Reverse migration tested and documented for each schema change | Dev |
| No destructive migration | `DROP TABLE`, `DROP COLUMN`, or data-deleting migrations require a backup checkpoint before execution. Backup verified restorable. | Dev |
| Endpoint inventory check | `npm run verify-endpoints` passes — roadmap inventory matches codebase | CI |

### Alerting (Minimum Viable)

| Alert | Condition | Channel |
|-------|-----------|---------|
| API down | Health check fails for >2 minutes | Email to Hamish |
| Error spike | >10 5xx errors in 5 minutes | Email to Hamish |
| Auth failures | >20 401s in 5 minutes (brute force indicator) | Email to Hamish |

### On-Call

At launch scale (<50 users), Hamish is the escalation point. No 24/7 on-call required. Middleware auto-restarts on crash (hosting platform handles this).

---

## Release Strategy (Finding #12)

| Control | Policy |
|---------|--------|
| Feature flags | Each phase ships behind a feature flag (env var). Enable per-phase after smoke test. |
| Rollback window | 24 hours after each phase enable. If issues found, disable flag and investigate. |
| Canary | Not needed at launch scale. Single instance serves all traffic. |
| Compatibility | Backward-compatible for one release window. Schema/API changes follow: (1) additive change ships first, (2) frontend migrates to new API, (3) old API removed in next release behind feature flag. Coordinated deploys allowed when unavoidable but must be documented in the phase plan. |
| Regression | Full Playwright E2E suite runs in CI before every deploy. |

---

## Phased Roadmap

### Phase 0: Deploy to a Real URL

**Objective:** Get the existing working app on a public URL with HTTPS, passing all production readiness checks.

**What's built:**
- Middleware deployment (single platform: Railway, Render, or Fly.io)
- Frontend deployment (Netlify — already configured)
- Production environment variables (secrets in hosting platform)
- Custom domain (e.g. `hub.goagentflow.com` + `api.goagentflow.com`)
- Azure AD redirect URIs updated for production domain
- Config model refactored: `AUTH_MODE` + `DATA_BACKEND` replacing `DEMO_MODE`
- Log shipping to aggregator (Logtail or equivalent)
- Production readiness gate checks (see above)
- Rollback runbook documented

**Success criteria:**
- All production readiness gate checks pass (table above)
- App accessible at public URL with HTTPS
- Azure AD login works end-to-end
- Portal access works (password-protected)
- CI deploys automatically on merge to main
- Rollback tested: can revert to previous deployment in <5 minutes

**Dependencies:** Azure AD app registration complete, DNS access, Supabase credentials as secrets

**Complexity:** Medium (~4-5 days, increased from v1 to account for readiness gate)

---

### Phase 1: File Storage — Document & Proposal Upload

**Objective:** Staff can upload real documents and proposals to hubs.

**What's built:**
- Supabase Storage bucket (`hub-files`) with folder structure per hub
- `POST /hubs/:hubId/documents` — multipart upload, store in Supabase Storage
- `POST /hubs/:hubId/proposal` — same pattern for proposals
- Backend download proxy endpoint (auth-checked, streams from storage)
- File deletion cleans up both DB row and stored file
- 50MB file size limit enforced

**Content security controls (Finding #8):**
- MIME type allowlist: PDF, DOCX, XLSX, PPTX, PNG, JPG, MP4 (no executables, no HTML, no SVG)
- File extension must match MIME type (reject mismatches)
- Filename sanitisation (strip path traversal, special characters)
- Storage path includes `tenant_id` prefix (isolation)

**File download approach (revised per v3 finding #4):**
- Backend download proxy: `GET /api/v1/hubs/:hubId/documents/:docId/download`
- Middleware verifies auth + hub access on every download request, then streams the file from Supabase Storage
- No signed URLs exposed to the client — the download URL is the authenticated API endpoint itself
- This eliminates link-leakage risk entirely (every request is auth-checked)

**Success criteria:**
- Staff uploads documents/proposals through the UI
- Files download via authenticated proxy endpoint (not direct storage URLs)
- Deleting removes both DB record and stored file
- Rejected: .exe, .html, .svg, .js, MIME/extension mismatch
- Unauthenticated download attempts return 401
- Cross-hub file access denied (negative test)

**Dependencies:** Phase 0, Supabase Storage enabled

**Complexity:** Medium (~4-5 days, increased for content security)

---

### Phase 2: Members & Access Management

**Objective:** Staff can invite client contacts to view their hub. Runs alongside (not replacing) password portal access during migration.

**Invite delivery (Finding #6):**
- Invite emails sent via Microsoft Graph Mail (OBO) if available, OR via a transactional email provider (e.g. Resend, Postmark) as fallback
- This means Phase 2 has a soft dependency on Phase 5 (OBO) OR requires a transactional email API key
- Fallback: if no email provider configured, invite URL is displayed in-app for staff to copy and send manually

**Portal migration plan (Finding #11):**
- **Dual-run period:** Both password access and member-based access work simultaneously
- **Feature flag:** `MEMBER_ACCESS_ENABLED=true` enables the new member system
- **No breaking change:** Password portal continues to work throughout migration
- **Migration path:** Once member system is proven, password access can be deprecated (separate decision, not in this phase)
- **Rollback:** Disable feature flag. Password access is unaffected.

**What's built:**
- New tables: `hub_member`, `hub_invite` (with `tenant_id`)
- 11 endpoints: list members, invite, revoke, accept, update access, remove, share link
- Domain restriction (invites only to `client_domain` or `goagentflow.com`)
- Hub access middleware updated to check member table (alongside existing password check)
- Invite delivery via email or manual copy

**Success criteria:**
- Staff invites client contacts by email
- Invites are domain-restricted (server-side enforcement)
- Clients who accept appear as members with appropriate access level
- Staff can change or revoke access
- Password portal still works (dual-run)
- Cross-hub member access denied (negative test)
- Invite tokens expire after 7 days

**Dependencies:** Phase 0. Soft dependency on Phase 5 (OBO) or transactional email API key.

**Complexity:** Medium (~5-6 days)

---

### Phase 3: Questionnaires

**Objective:** Staff can create questionnaires; clients can fill them in and submit responses.

**What's built:**
- New tables: `hub_questionnaire`, `hub_questionnaire_response` (JSONB for flexibility, with `tenant_id`)
- 6+ endpoints: CRUD + responses + portal submission
- Portal-facing questionnaire view and submit

**Success criteria:**
- Staff creates/edits questionnaires
- Clients fill in and submit via portal
- Staff views aggregated responses
- Cross-hub questionnaire access denied (negative test)

**Dependencies:** Phase 0

**Complexity:** Medium (~4-5 days)

---

### Phase 4: Engagement Analytics

**Objective:** Staff can see who viewed what and when. Leadership dashboard shows portfolio-wide insights.

**What's built:**
- Document engagement endpoint (aggregates from `hub_event`)
- Proposal engagement endpoint
- Hub-level engagement summary (total views, unique visitors)
- Leadership: at-risk clients (no activity in 14+ days)
- Leadership: expansion candidates (high engagement volume)
- Leadership: refresh (recalculate metrics)

**Measurable acceptance criteria (Finding #10):**
- Engagement query latency: p95 < 500ms for hubs with <10,000 events
- Data freshness: engagement data reflects events within 60 seconds of logging
- At-risk detection: flags 100% of hubs with zero events in 14+ days (no false negatives)
- False positive ceiling for expansion: <30% of flagged hubs should be irrelevant (validated by Hamish manual review of first 20 flags)

**Dependencies:** Phase 0, Phase 2 (to know WHO is engaging)

**Complexity:** Low-medium (~3-4 days)

---

### Phase 5: OBO Token Flow (Graph API Foundation)

**Objective:** Enable the middleware to call Microsoft Graph API on behalf of the signed-in user. This is infrastructure — it unlocks Messages and Meetings.

**What's built:**
- OBO token exchange using `@azure/msal-node` (already in package.json)
- Graph client factory using `@microsoft/microsoft-graph-client` (already in package.json)
- `AZURE_CLIENT_SECRET` added to env config (required when `AUTH_MODE=azure_ad` in production)

**Token caching strategy (Finding #7):**
- At launch scale (single instance, <50 users): in-memory cache keyed by user OID + requested scopes
- Tokens cached until 5 minutes before expiry
- Cache miss: acquire new token via OBO exchange with retry + exponential backoff (max 3 retries)
- CAE (Continuous Access Evaluation) handling: if Graph returns 401 with `claims` challenge, clear cached token and re-acquire with the claims parameter
- **Multi-instance note:** If/when scaling to multiple instances, replace in-memory cache with Redis. The cache interface is abstracted to make this a config change, not a code rewrite.

**Success criteria:**
- OBO exchange works: user token in, Graph token out
- Graph client can call `GET /me` successfully
- Token caching prevents redundant exchanges (verified by log inspection)
- CAE claims challenge triggers re-acquisition (unit test)
- Error handling: consent not granted returns clear error message to frontend

**Dependencies:** Phase 0, Azure AD app needs Graph API permissions + admin consent + client secret

**Complexity:** Medium (~3-4 days)

---

### Phase 6: Messages (Graph Mail)

**Objective:** Staff can view and send hub-related emails through the app.

**Hub scoping — explicit linkage, not heuristics (Finding #3):**
- New table: `hub_message_thread` (`id`, `hub_id`, `graph_conversation_id`, `linked_by`, `linked_at`)
- Messages are scoped to a hub via explicit linked thread IDs, NOT by email/domain matching
- Staff explicitly links a conversation to a hub (or the system auto-links when sending from within a hub context)
- Listing messages: `SELECT graph_conversation_id FROM hub_message_thread WHERE hub_id = :hubId`
- This eliminates the risk of data leakage between hubs that share contacts or domains

**What's built:**
- 5 endpoints: list threads, get thread, send message, add internal notes, update status
- Explicit hub-to-thread linkage table
- Internal notes stored in Supabase (never sent to clients)
- Emails sent FROM the user's own mailbox via OBO

**Success criteria:**
- Staff views only explicitly linked email threads for a hub
- Staff sends emails from the app (appears in their Sent folder, auto-linked to hub)
- Internal notes attached to threads
- Cross-hub thread access denied (negative test: thread linked to Hub A not visible in Hub B)

**Dependencies:** Phase 5 (OBO), Azure AD `Mail.Read` + `Mail.Send` permissions

**Complexity:** Medium-high (~5-6 days)

---

### Phase 7: Meetings (Graph Calendar + Teams)

**Objective:** Staff can schedule, manage, and track meetings related to a hub.

**Hub scoping — explicit linkage, not heuristics (Finding #3):**
- New table: `hub_meeting` (`id`, `hub_id`, `graph_event_id`, `agenda`, `notes`, `linked_by`, `linked_at`)
- Meetings are scoped to a hub via explicit linked event IDs
- When staff creates a meeting from within a hub, it's auto-linked
- Staff can also manually link existing calendar events to a hub

**What's built:**
- 9 endpoints: list, get, create, update, cancel, agenda, notes, recording, transcript
- Meeting creation generates Teams meeting link via Graph
- Agenda and notes stored in Supabase (augments Graph Calendar data)
- Explicit hub-to-meeting linkage

**Success criteria:**
- Staff schedules meetings with Teams links
- Meetings appear on their Outlook calendar
- Agendas, notes, recordings, and transcripts accessible
- Cross-hub meeting access denied (negative test)

**Dependencies:** Phase 5 (OBO), Azure AD `Calendars.ReadWrite` + `OnlineMeetings.ReadWrite` permissions

**Complexity:** High (~6-7 days)

---

### Phase 8: Client Intelligence (AI)

**Objective:** AI-powered features that differentiate AgentFlow — instant answers, meeting prep, performance narratives, decision tracking, risk alerts.

**Architecture:**
- AI provider called server-side only (API key in middleware env, never on frontend)
- Async job pattern: POST creates job -> GET polls for result
- New tables: `hub_ai_job`, `hub_decision`, `hub_decision_history`, `hub_risk_alert` (all with `tenant_id`)

**AI governance and safety controls (Finding #9):**

| Control | Implementation |
|---------|---------------|
| PII redaction | Strip email addresses, phone numbers, and names from AI context before sending. Use hub/project IDs instead of names where possible. |
| Prompt injection defence | System prompt is hardcoded server-side. User input is passed as a separate `user` message, never interpolated into the system prompt. Input length capped at 2,000 chars. |
| Model pinning | Pin to a specific model version (e.g. `claude-sonnet-4-6-20250514`). No auto-upgrades. Version changes require explicit config update + regression test. |
| Moderation | AI responses are checked for refusal/error patterns before storing. Failed generations stored with `status: 'failed'` and a safe error message. |
| Fallback on failure | If AI call fails after 3 retries, return `status: 'failed'` with message "Unable to generate — please try again later". Never expose raw API errors to frontend. |
| Rate limiting | Max 10 AI requests per user per hour (prevents abuse and controls cost). |
| Audit trail | Every AI job logged in `hub_ai_job` with input hash, model version, token count, latency. |
| Incident debugging | Redacted prompt/response snippets (PII-stripped, first 500 chars) stored in `hub_ai_job` with 14-day auto-expiry. Encrypted at rest (Supabase column-level encryption or vault). Access to snippet columns requires admin role and is itself audit-logged. Full raw prompts NOT stored by default — can be enabled temporarily via `AI_DEBUG_MODE=true` for incident investigation (auto-disables after 24 hours). |
| GDPR | Right to deletion: deleting a hub cascades to all AI jobs (including snippets). No AI provider data retention (use API, not fine-tuning). 14-day snippet expiry enforced by scheduled Supabase function. |

**Batch 8a — Instant Answers + Performance (Week 10):**
- 6 endpoints: submit question, get answer, recent answers, generate narrative, get narrative, latest
- AI context: hub data, projects, events, engagement history

**Batch 8b — Meeting Prep + Follow-up (Week 11):**
- 4 endpoints: generate prep, get prep, generate follow-up, get follow-up
- AI context: meeting agenda/notes, recent hub activity, previous meetings

**Batch 8c — Decisions + History + Risk Alerts (Week 12):**
- 8 endpoints: decision CRUD (state machine), institutional memory, risk alerts
- Decision queue is primarily CRUD; risk alerts use AI for signal detection

**Measurable acceptance criteria (Finding #10):**
- AI response latency: p95 < 15 seconds (async job, not blocking)
- Instant answer relevance: >70% rated "useful" by Hamish in first 20 test queries
- Risk alert false positive ceiling: <40% of alerts are irrelevant (validated by manual review)
- Performance narrative accuracy: covers all active projects and recent engagement (spot-checked against real hub data)
- Error budget: <5% of AI jobs fail after retries

**Dependencies:** Phase 4 (engagement data), Phase 7 (meetings), AI provider API key

**Complexity:** High (~8-10 days across 3 batches)

---

### Phase 9: Relationship Intelligence + Leadership Completion

**Objective:** Health dashboard, expansion radar, and complete leadership portfolio.

**What's built:**
- Relationship health score (0-100) per client hub
- Expansion radar (upsell/cross-sell signal detection)
- Leadership at-risk and expansion views (aggregated across hubs)

**Measurable acceptance criteria (Finding #10):**
- Health score latency: p95 < 1 second per hub
- Health score correlation: score of 0-30 should correspond to hubs with declining engagement (validated against event data)
- Expansion radar precision: >50% of flagged opportunities are actionable (Hamish validates first 10)

**Dependencies:** Phase 4 (engagement), Phase 8 (AI)

**Complexity:** Medium (~4-5 days)

---

### Phase 10: Conversion Rollback + End-to-End Polish

**Objective:** Zero 501 stubs remaining. Full test coverage against real API.

**What's built:**
- Hub conversion rollback endpoint
- Playwright E2E tests against real API
- Error handling audit
- Query performance review + indexing

**Success criteria:**
- Zero 501 stubs remaining (verified by grep)
- All Playwright tests pass against real API
- Consistent error responses across all endpoints
- Tenant isolation negative tests pass for every hub-scoped endpoint

**Dependencies:** All above

**Complexity:** Low-medium (~3-4 days)

---

## Summary Timeline

| Phase | Name | Est. Duration | Blocked By |
|-------|------|--------------|------------|
| 0 | Deploy + Production Readiness Gate | 4-5 days | Nothing |
| 1 | File Storage (Upload + Content Security) | 4-5 days | Phase 0 |
| 2 | Members & Access (Dual-Run Migration) | 5-6 days | Phase 0 |
| 3 | Questionnaires | 4-5 days | Phase 0 |
| 4 | Engagement Analytics | 3-4 days | Phase 0, 2 |
| 5 | OBO Token Flow | 3-4 days | Phase 0 |
| 6 | Messages (Explicit Linkage) | 5-6 days | Phase 5 |
| 7 | Meetings (Explicit Linkage) | 6-7 days | Phase 5 |
| 8 | Client Intelligence (AI + Governance) | 8-10 days | Phase 4, 7 |
| 9 | Relationship Intelligence | 4-5 days | Phase 4, 8 |
| 10 | Polish + Zero 501s | 3-4 days | All above |

**Total: ~14 weeks sequential, ~10-11 weeks with parallelisation**

Phases 1, 2, 3 can run in parallel after Phase 0. Phases 6 + 7 can partially overlap after Phase 5.

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| File storage | Supabase Storage | Already using Supabase; signed URLs built in; no extra AWS account |
| AI provider | Server-side only (Claude/OpenAI) | API key stays in middleware; async job pattern handles latency |
| Graph API auth | OBO (On-Behalf-Of) | Emails sent from user's mailbox; proper audit trail |
| Data backend | Supabase (now), SharePoint (later) | Ship fast; SharePoint adapter for enterprise customers |
| Config model | `AUTH_MODE` + `DATA_BACKEND` (orthogonal) | Prevents insecure auth/data combinations |
| Hub scoping (Graph) | Explicit linkage tables | Eliminates email/domain heuristic data leakage risk |
| Tenant isolation | Service-role + TenantRepository guard + tenant_id on all tables | RLS not viable with service-role key; centralised repository enforces isolation |
| AI safety | PII redaction, prompt isolation, model pinning | GDPR-aware, no data leakage to provider |

---

## What Hamish Needs to Do (Non-Developer Tasks)

1. **Azure AD permissions** — Grant admin consent for Graph API scopes when Phase 5 begins
2. **Azure AD client secret** — Generate one for the backend app registration (Phase 5)
3. **DNS** — Point chosen domain at hosting platforms (Phase 0)
4. **AI provider** — Choose Claude API or OpenAI and create an API key (Phase 8)
5. **Supabase Storage** — Enable Storage on the Supabase project (Phase 1)
6. **Supabase backups** — Verify daily backups are enabled (Phase 0 readiness gate)

---

## Resolved Questions (from v1)

| Question | Decision |
|----------|----------|
| Hosting platform | To be decided — Railway or Render recommended for simplicity at launch scale |
| Config model | `AUTH_MODE` + `DATA_BACKEND` (orthogonal controls, per senior dev finding #4) |
| Graph scoping | Explicit linkage tables, not email/domain heuristics (per senior dev finding #3) |
| AI provider | Defer choice to Phase 8. Interface is provider-agnostic. |
| File storage limits | 50MB per file. Per-hub quota deferred to post-launch. |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1 | 21 Feb 2026 | Initial draft |
| v2 | 21 Feb 2026 | Addressed 12 senior dev findings: added production readiness gate, tenant isolation, explicit Graph scoping, orthogonal config model, verified endpoint inventory, invite delivery dependency, OBO cache strategy with CAE, content security for uploads, AI governance controls, measurable acceptance criteria, portal migration plan, release strategy |
| v3 | 21 Feb 2026 | Addressed 7 senior dev findings from v2 review: (1) corrected endpoint inventory — 47 real / 72 stub / 119 total (was 48/59/107), added CI drift check; (2) replaced RLS model with service-role + TenantRepository guard (RLS incompatible with service-role key); (3) resolved tenancy contradiction — multi-tenant controls enforced at launch, expansion deferred; (4) replaced signed URLs with backend download proxy (eliminates link-leakage); (5) relaxed compatibility rule to one-release-window backward compat; (6) added schema migration gate with dry-run/rollback/backup checks; (7) added redacted prompt/response snippets with 14-day expiry for AI incident debugging |
