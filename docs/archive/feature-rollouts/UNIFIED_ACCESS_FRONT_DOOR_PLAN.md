# Unified Access Front Door Plan (Client + Staff)

**Date:** 26 February 2026  
**Audience:** Product, engineering, marketing, UX review  
**Status:** Proposed implementation plan (no rebuild)

---

## 1. Goal

Create one memorable entry point for all users:

- `goagentflow.com/access`

From there:

1. Clients can recover access without knowing product names or old links.
2. Staff can sign in from the same place and launch into the right tools.
3. We reduce confusion immediately without replacing existing auth systems.

---

## 2. Problem We Are Solving Now

Current confusion is caused by multiple disconnected login patterns:

- Main site sign-in points to Co-Pilot Quiz (Assess).
- Client Hub has separate staff login and per-hub client gates.
- Pitch pages can be password-only and link-dependent.

The immediate user pain is not "identity architecture". It is "I do not know where to go to log in or recover access."

---

## 3. Scope and Non-Goals

## In scope (Phase 1)

1. Single front door at `/access`.
2. Client recovery flow by email for Client Hub records (`portal_contact`).
3. Staff sign-in path from `/access`.
4. Staff launcher page after sign-in.
5. Replace existing public login CTA links with `/access`.

## Out of scope (Phase 1)

1. Full cross-product entitlement service.
2. Replacing existing Co-Pilot Quiz/Discovery auth internals.
3. Rebuilding static pitch pages to account-based auth.

---

## 4. UX Architecture (What users actually do)

## 4.1 Universal entry

Every login-related CTA points to:

- `https://www.goagentflow.com/access`

Examples to update:

1. Main nav "Sign in/Login"
2. Footer login links
3. Email footer "Lost your link?"
4. Client hub gate helper links

## 4.2 Access decision page

The page has only two high-clarity options:

1. `I'm a client`
2. `I'm AgentFlow staff`

No product names on first decision.

## 4.3 Client flow

1. User clicks `I'm a client`.
2. User enters email and submits.
3. UI shows generic success response (no enumeration leak).
4. Email sends one primary CTA: `Open My AgentFlow`.
5. CTA opens `goagentflow.com/my-access` with a short-lived signed token.
6. `my-access` shows:
   - One recommended next step card.
   - Active hubs and reports grouped by company.
   - Older hubs and reports in collapsed "Past" section.

## 4.4 Staff flow

1. User clicks `I'm AgentFlow staff`.
2. Redirect to existing Microsoft sign-in (`/clienthub/login`).
3. On successful auth, land on staff launcher (`/clienthub/launcher`).
4. Launcher shows cards:
   - Client Hub Admin
   - Co-Pilot Quiz
   - Discovery

If Co-Pilot Quiz/Discovery still require separate session, show explicit helper text.

---

## 5. Detailed Screen Copy (Recommended Draft)

## 5.1 Main site nav copy

- Primary nav item: `Sign in`
- Optional helper in dropdown/footer: `Clients and staff start here`

## 5.2 `/access` page copy

### Hero

- Heading: `Get back to your AgentFlow`
- Subheading: `Lost a link or need to sign in? You're in the right place.`

### Option cards

- Card 1 title: `I'm a client`
- Card 1 body: `Find the hubs and reports that have been shared with you.`
- Card 1 CTA: `Find my stuff`

- Card 2 title: `I'm AgentFlow staff`
- Card 2 body: `Sign in with Microsoft and get to your tools.`
- Card 2 CTA: `Staff sign in`

### Footer helper

- Text: `Not sure? Start with "I'm a client". Staff can always come back and sign in here.`

## 5.3 Client email form copy (`/access/client`)

- Heading: `Find my client access`
- Body: `Pop in your work email and we'll send you a secure link to everything that's been shared with you.`
- Email label: `Work email`
- Placeholder: `name@company.com`
- Button: `Send my access link`
- Success state: `If we found anything for that email, your link is on its way.`
- Secondary note: `Check spam or promotions if it doesn't show up in a few minutes.`

### Error copy

- Rate limited: `Too many requests. Give it a minute and try again.`
- Service unavailable: `We couldn't send your link right now. Please try again shortly.`

## 5.4 Client recovery email copy

- Subject: `Here's your way back in`
- Preheader: `Your AgentFlow links - all in one place.`
- Heading: `Your AgentFlow links`
- Body: `Here are your AgentFlow links - all in one place.`
- Primary CTA: `Open My AgentFlow`
- Expiry line: `This secure link expires in 20 minutes.`
- Safety line: `If you didn't request this, you can ignore this email.`

## 5.5 `my-access` page copy

- Heading: `Welcome back`
- Subheading: `Here's everything that's been shared with you.`

### Section labels

- Recommended card title: `Recommended next step`
- Active section title: `Active hubs`
- Past section title: `Past hubs`

### Card metadata labels

- Product chip examples: `Client Hub`, `Pitch Hub`, `Co-Pilot Quiz`, `Discovery`
- Activity line: `Updated {timeAgo}`
- Action button: `Open`

### Empty state

- Title: `Nothing here yet`
- Body: `We couldn't find anything for this email. If you're expecting access, ask your AgentFlow contact to share it with you.`
- Secondary action: `Try a different email`

## 5.6 Staff launcher copy

- Heading: `AgentFlow staff tools`
- Subheading: `Where do you need to be?`
- Card titles: `Client Hub Admin`, `Co-Pilot Quiz`, `Discovery`
- Note under Co-Pilot Quiz/Discovery cards: `You might need to sign in again for Co-Pilot Quiz and Discovery - we're working on fixing that.`

---

## 6. UX Refinements Before Build

## 6.1 Single-hub shortcut

If a client has only one active hub, the recovery email should deep-link straight to that hub and skip `my-access`.

`my-access` is shown when there are multiple active items or when routing to reports requires a selection step.

## 6.2 Expired token page

If a recovery link is opened after expiry (20 minutes), show:

- Heading: `This link has expired`
- Body: `No worries - just request a fresh one.`
- CTA button: `Send me a new link`

The CTA should return the user to `/access/client` and pre-fill email when possible.

## 6.3 Pitch hub gap (known Phase 1 limitation)

Pitch-hub-only clients may enter their email and receive no results if their hub has no portal-contact identity record.

This is a known Phase 1 limitation, not a bug. The empty-state copy in Section 5.5 is designed to handle this gracefully.

## 6.4 Mobile layout

On `/access`, the two choice cards must stack vertically on mobile, with full-width CTA buttons sized for single-thumb tap targets.

## 6.5 Ranking rules to avoid "4 equal links" confusion

`my-access` should not render a flat list. It should rank and group.

1. Pick one `Recommended next step`:
   - Most recently active hub or report in last 14 days.
   - If tie: prioritize `Client Hub` over `Pitch Hub`.
   - If still tie: latest `updatedAt`.
2. Show remaining active items under `Active hubs`.
3. Move stale items (no activity for 60+ days) into `Past hubs` collapsed by default.

This gives one obvious action first, then optional depth.

---

## 7. Technical Implementation Plan

## 7.1 Repo: `AFv2-temp` (main website)

1. Add route/page for `/access`.
2. Add route/page for `/access/client` (or modal/step inside `/access`).
3. Add route/page shell for `/my-access`.
4. Update all existing sign-in/login links to `/access`.
5. Add "Lost your link?" references in relevant marketing templates pointing to `/access`.

## 7.2 Repo: `client-hub` middleware

Add public recovery endpoints:

1. `POST /api/v1/public/access/request-link`
   - Input: `{ email }`
   - Behavior: always respond `{ data: { sent: true } }`.
   - Lookup: published hubs where `portal_contact.email = normalisedEmail`.
   - Send recovery email if matches exist.

2. `GET /api/v1/public/access/items?token=...`
   - Validate short-lived signed token (`type: access_recovery`, `sub: email`).
   - Return grouped access items for rendering `my-access`.

3. Security controls:
   - Rate limit per IP and per email.
   - Generic success response for request endpoint.
   - Structured audit logs (request, email domain, count returned, no secrets).

4. Email service:
   - Add template function `sendAccessRecoveryEmail(...)`.
   - Reuse existing Resend wiring in `email.service.ts`.

## 7.3 Repo: `client-hub` frontend

1. Add staff launcher route `/launcher` (staff guard).
2. Launcher cards deep-link:
   - `/clienthub/hubs`
   - `/assess/auth` (Co-Pilot Quiz current route)
   - `/discovery/admin/login` (or current Discovery entry route)
3. Ensure post-login redirect can target `/launcher`.

## 7.4 Repo: `agentflow-insight-pulse`

1. Confirm and standardize canonical auth route (`/assess/auth` vs `/assess/login`).
2. Preserve `return_to` handling for staff deep links from launcher.

---

## 8. API Response Shape for `my-access`

```json
{
  "data": {
    "recommended": {
      "title": "Acme Growth Hub",
      "product": "Client Hub",
      "url": "https://www.goagentflow.com/clienthub/portal/abc",
      "updatedAt": "2026-02-25T15:12:00.000Z",
      "reason": "Most recently active"
    },
    "active": [
      {
        "title": "Acme Discovery Report",
        "product": "Discovery",
        "url": "https://www.goagentflow.com/discovery/...",
        "updatedAt": "2026-02-18T10:20:00.000Z"
      }
    ],
    "past": []
  }
}
```

Phase 1 can ship with Client Hub items only. Keep the schema product-agnostic for future expansion.

---

## 9. Rollout Plan

## Sprint 1 (Immediate confusion fix)

1. Ship `/access` page and replace all login CTAs.
2. Ship client request-link endpoint + recovery email.
3. Ship `my-access` page with recommended + grouped Client Hub links.
4. Ship staff path from `/access` to Microsoft sign-in.
5. Ship single-hub shortcut (email deep-links straight to hub when only one active hub exists).
6. Ship expired-link page flow (`This link has expired` -> `Send me a new link`).

## Sprint 2 (Staff clarity)

1. Ship `/clienthub/launcher` after staff login.
2. Normalize Co-Pilot Quiz/Discovery entry URLs used by launcher.
3. Add lightweight instrumentation dashboards.

## Sprint 3 (Optional expansion)

1. Add Co-Pilot Quiz/Discovery client-visible hubs and reports into `my-access` if entitlement data is available.
2. Decide whether static pitch pages remain intentionally link/password based or move to identity-backed access.

---

## 10. Measurement and Success Criteria

Track from day one:

1. `% of sign-in clicks landing on /access` (target: >90%).
2. Client recovery email request volume.
3. Recovery success proxy: `my-access` opens after email send.
4. Support tickets tagged "can't find login" or "lost link" (target: meaningful drop in 2-4 weeks).
5. Staff launcher usage split by product card.

---

## 11. UAT Checklist (Cross-team)

1. From homepage, a client can reach `/access` in one click.
2. Client can request recovery using valid email and see non-enumerating response.
3. Unknown email returns identical response shape and similar latency profile.
4. Recovery email arrives with one CTA and valid expiry behavior.
5. `my-access` shows one recommended card and grouped links.
6. Staff can start at `/access`, sign in, and reach launcher.
7. Launcher links open intended tools with clear fallback text for secondary sign-in.
8. Single-hub users are deep-linked directly to the hub from recovery email.
9. Expired recovery links show the expiry page and recover via `/access/client`.
10. On mobile, `/access` cards stack vertically and CTAs are full-width tap targets.

---

## 12. Marketing + UX Review Notes

Marketing should review:

1. Tone of "Access" vs "Login" terminology.
2. Email subject and CTA wording for open/click performance.
3. Safety language to avoid confusion with phishing concerns.

UX should review:

1. Two-choice decision clarity on `/access`.
2. Information hierarchy on `my-access` (recommended first, not list overload).
3. Mobile layout for card scanning and single-thumb CTA taps.
4. Error/retry states (rate limit, delayed email).

---

## 13. Decision Record

This plan intentionally prioritizes immediate user clarity over full auth unification.

- It solves current confusion with one front door and one recovery motion.
- It reuses existing infrastructure (portal contacts, middleware, Resend).
- It keeps future unification options open without forcing a rebuild now.
