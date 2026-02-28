# Briefing Note: Unified Access Front Door - Copy & UX Feedback

**To:** Dev team
**From:** Hamish
**Date:** 26 February 2026
**Re:** UNIFIED_ACCESS_FRONT_DOOR_PLAN.md - copy rewrites and UX refinements

---

## 1. Copy Rewrites

The architecture and flow are right. The copy needs warming up - it reads functional but not like us. Below are final rewrites for each section. Replace the corresponding sections in the plan.

### 5.1 Main site nav copy

- Primary nav item: `Sign in`
- Optional helper in dropdown/footer: `Clients and staff start here`

### 5.2 /access page copy

**Hero**

- Heading: `Get back to your AgentFlow`
- Subheading: `Lost a link or need to sign in? You're in the right place.`

**Option cards**

- Card 1 title: `I'm a client`
- Card 1 body: `Find the hubs and reports that have been shared with you.`
- Card 1 CTA: `Find my stuff`

- Card 2 title: `I'm AgentFlow staff`
- Card 2 body: `Sign in with Microsoft and get to your tools.`
- Card 2 CTA: `Staff sign in`

**Footer helper**

- Text: `Not sure? Start with "I'm a client". Staff can always come back and sign in here.`

### 5.3 Client email form copy (/access/client)

- Heading: `Find my client access`
- Body: `Pop in your work email and we'll send you a secure link to everything that's been shared with you.`
- Email label: `Work email`
- Placeholder: `name@company.com`
- Button: `Send my access link`
- Success state: `If we found anything for that email, your link is on its way.`
- Secondary note: `Check spam or promotions if it doesn't show up in a few minutes.`

**Error copy**

- Rate limited: `Too many requests. Give it a minute and try again.`
- Service unavailable: `We couldn't send your link right now. Please try again shortly.`

### 5.4 Client recovery email copy

- Subject: `Here's your way back in`
- Preheader: `Your AgentFlow links - all in one place.`
- Heading: `Your AgentFlow links`
- Body: `Here are your AgentFlow links - all in one place.`
- Primary CTA: `Open My AgentFlow`
- Expiry line: `This secure link expires in 20 minutes.`
- Safety line: `If you didn't request this, you can ignore this email.`

### 5.5 my-access page copy

- Heading: `Welcome back`
- Subheading: `Here's everything that's been shared with you.`

**Section labels**

- Recommended card title: `Recommended next step`
- Active section title: `Active hubs`
- Past section title: `Past hubs`

**Card metadata labels**

- Product chip examples: `Client Hub`, `Pitch Hub`, `Co-Pilot Quiz`, `Discovery`
- Activity line: `Updated {timeAgo}`
- Action button: `Open`

**Empty state**

- Title: `Nothing here yet`
- Body: `We couldn't find anything for this email. If you're expecting access, ask your AgentFlow contact to share it with you.`
- Secondary action: `Try a different email`

### 5.6 Staff launcher copy

- Heading: `AgentFlow staff tools`
- Subheading: `Where do you need to be?`
- Card titles: `Client Hub Admin`, `Co-Pilot Quiz`, `Discovery`
- Note under Co-Pilot Quiz/Discovery cards: `You might need to sign in again for Co-Pilot Quiz and Discovery - we're working on fixing that.`

---

## 2. Terminology change - global

Replace "workspaces" with "hubs" throughout the plan (and "reports" where referring to Co-Pilot Quiz/Discovery items). "Workspaces" is generic - hubs is our language.

Replace "Assess" with "Co-Pilot Quiz" in all user-facing copy. Internal/technical references can stay as-is where needed for route paths.

---

## 3. UX Refinements

The flow is solid. Four things to add before build:

### 3.1 Single-hub shortcut

If a client has only one active hub, the recovery email should deep-link straight to that hub (skip the my-access page). The my-access page only adds value when there are multiple items to choose from. For single-hub clients it's an unnecessary extra click.

### 3.2 Expired token page

The email link expires in 20 minutes. Spec what happens when someone clicks an expired link. Suggested UX:

- Heading: `This link has expired`
- Body: `No worries - just request a fresh one.`
- CTA button: `Send me a new link` (takes them back to /access/client, pre-filled with their email if possible)

### 3.3 Pitch hub gap - known limitation

Pitch hubs are password-protected with no email on file. That means pitch-hub-only clients will go through this flow, enter their email and get nothing back. This is a known Phase 1 limitation - not a bug. But the team should be aware so it doesn't surface as a surprise in UAT. The empty state copy ("ask your AgentFlow contact to share it with you") covers this gracefully enough for now.

### 3.4 Mobile layout

The two-card choice on /access needs to stack vertically on mobile. Worth calling out explicitly since clients are likely hitting this from a phone (they got a hub link in an email, lost it, and they're now searching on their phone). Single-thumb CTA taps - make the buttons full-width on mobile.

---

## 4. What's not changing

Everything else in the plan - the technical implementation (section 7), API shape (section 8), rollout phases (section 9), measurement (section 10), UAT checklist (section 11) and decision record (section 13) - is good as-is. This feedback is copy and UX only.
