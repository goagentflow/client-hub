# AgentFlow Hubs

## Product Vision & Technical Assumptions

**November 2025**

*This document outlines the full product vision for AgentFlow Hubs, explains where the Pitch Hub v0.1 wireframes fit within that vision, and documents the technical assumptions for middleware development.*

---

## 1. The Full Product Vision

### 1.1 What AgentFlow Hubs Will Become

AgentFlow Hubs is a client relationship platform for professional services firms (PSFs). It gives firms a single place to manage client work, with everything stored in Microsoft 365.

**One hub per client.** When a PSF works with a client, they have a hub for that relationship. The hub has two views:

**The client view** — what the PSF's clients see. They can check project status, access deliverables, see what's waiting on them, and get instant answers to questions like "where are we on the Q1 campaign?" without chasing their account manager. They can also access shared administrative documents — NDAs, contracts, scopes of work, invoices — all in one place rather than buried in email threads.

**The internal view** — what the PSF sees. Account managers update status, manage approvals, upload deliverables, and track the relationship. They see everything the client sees, plus internal notes, engagement stats, internal working documents, and AI-generated insights about the health of the relationship and potential growth opportunities. Administrative documents live here too, with control over which ones are shared with the client.

**New business lives inside the hub.** The internal view includes a section for managing new business pitches. When a PSF is pitching to a prospective client, they create a pitch hub to manage that process — the brief, the proposal, communications, and pitch workflow. If they win the business, the pitch hub evolves into an ongoing client hub.

**Intelligence is woven throughout, not bolted on.** AI capabilities are built into the hub experience:

**For clients:** instant answers to questions, auto-generated "waiting on you" lists, meeting prep summaries, plain English performance narratives.

**For account managers:** relationship health scoring (early warning when relationships are cooling), expansion radar (spotting upsell and cross-sell opportunities from signals buried in communications), and instant-answer capability for internal queries.

**For leadership:** roll-up views across the entire client portfolio. A CEO or practice lead can see all clients plotted by relationship health and expansion potential, identify which accounts need attention, spot trends across the business, and click through to the detailed client view when they want to dig deeper. The same intelligence that helps an account manager manage one client helps leadership manage the whole firm.

The intelligence layer reads from structured data that account managers create through the hub, plus captured communications from email and Teams. It surfaces insights rather than requiring people to dig through folders and inboxes.

### 1.2 Core Principle: Everything Stays in the Client's Tenant

All data — configuration, client information, captured communications, and derived intelligence — is stored in the firm's Microsoft 365 tenant. AgentFlow does not maintain its own database of client data. The middleware is stateless: it processes and serves, but does not persist.

### 1.3 Target Users

**Initial focus:** Independent and small network professional services firms, starting with media and advertising agencies on Microsoft 365.

**Typical users:** Account managers and directors, project managers, new business teams, practice leaders, senior leadership, and client-side contacts.

---

## 2. Where the Pitch Hub v0.1 Fits

### 2.1 Eating Our Own Dog Food

Before building the full platform, we are building a minimal Pitch Hub that AgentFlow will use to pitch its own services to prospective clients. This approach lets us experience the product as real users, validate the concept with actual prospects, and give Stephen a concrete use case for learning the Microsoft APIs.

### 2.2 What v0.1 Includes

The v0.1 wireframes cover a complete Pitch Hub with two user experiences:

**AgentFlow Staff View** — The internal workspace where Hamish and Stephen manage pitches, upload content, communicate with prospects, and track engagement.

**Client View** — What prospects see when they log into their hub: the proposal, videos, documents, messages, meetings, and questionnaires shared with them.

### 2.3 What v0.1 Does NOT Include

The following features from the full vision are out of scope for v0.1:

- Client Hubs (for ongoing client delivery)
- Expansion Radar (upsell opportunity detection)
- Relationship Health scoring
- Client Assistant AI (natural language Q&A)
- Leadership portfolio views
- Performance visibility from external platforms
- Multi-tenant deployment

---

## 3. What the Wireframes Cover

### 3.1 AgentFlow Staff Views

| Page | Purpose |
|------|---------|
| **Login** | Microsoft SSO entry point |
| **Hub List** | Dashboard showing all pitch hubs with status and last activity |
| **Hub Overview** | Workspace for managing a pitch: quick actions, activity feed, internal notes, engagement stats |
| **Client Portal** | Curate what clients see: select hero content, toggle sections, manage client access, preview and publish |
| **Videos** | Upload, record, and manage videos with tagging, visibility controls, and engagement tracking |
| **Documents** | Two tabs: Client Documents (shared) and Internal Documents (working files). Upload, categorise, track engagement |
| **Messages** | Filtered email view showing all communication with this prospect. Send and receive via the hub (powered by Outlook) |
| **Meetings** | Schedule meetings, manage agendas, access recordings and transcripts, generate AI summaries (auto and custom prompts) |
| **Questionnaire** | Link Microsoft Forms, track responses, view analytics, share with clients |

### 3.2 Client Views

| Page | Purpose |
|------|---------|
| **Overview** | Welcome page with first-time video modal, hero content, quick links, recent activity, next steps CTA |
| **Proposal** | Document viewer with slide navigation, download, comment on specific slides, share with colleagues |
| **Videos** | Watch shared videos, share links with colleagues in same domain |
| **Documents** | View and download shared documents, upload documents to share back, share links with colleagues |
| **Messages** | View conversation history, send and reply (hub sends on their behalf as email) |
| **Meetings** | View scheduled meetings, join calls, watch shared recordings, request new meetings with proposed times |
| **Questionnaire** | Complete questionnaires shared with them, share with colleagues |
| **People** | See who has access, invite colleagues from same domain with specific permissions |

---

## 4. Middleware Assumptions

> **IMPORTANT:** This section documents assumptions about how the middleware will work. These are design requirements for Stephen to investigate and implement — not instructions for the wireframe front-end. The front-end is built as placeholder UI that will be connected to middleware separately.

### 4.1 Authentication

**Assumption:** Users authenticate via Microsoft Azure AD using MSAL.js. AgentFlow staff authenticate with their AgentFlow Microsoft tenant. Clients authenticate with their own Microsoft accounts as Azure AD B2B guests.

**Technical requirement:** Azure AD app registration with appropriate redirect URIs. MSAL.js integrated into the React front-end. Token management for Graph API calls.

**Open question:** How do we handle the B2B guest invitation flow for clients? Is this automated when we invite them via the hub, or manual Azure AD setup?

### 4.2 Data Storage in SharePoint

**Assumption:** All hub data is stored in SharePoint within the AgentFlow Microsoft 365 tenant. The middleware creates a standardised folder structure when a hub is created.

**Proposed folder structure:**

```
/AgentFlow/PitchHubs/[ProspectName]/
  Config.json
  Overview.json
  Proposal/
  Videos/
  Documents/ClientDocuments/
  Documents/InternalDocuments/
  Messages/
  Meetings/
  Questionnaires/
```

**Technical requirement:** Graph API Files.ReadWrite.All permission. Middleware creates folders on hub setup. JSON files store configuration and metadata. Binary files (videos, documents) stored directly.

### 4.3 Email Integration (Messages)

**Assumption:** The Messages section shows a filtered view of Outlook emails to/from people associated with the hub. Filtering is based on email addresses or domain (e.g., all emails with @neverlandcreative.com appear in the Neverland hub).

**Sending from hub:** When AgentFlow staff send a message from the hub, it is sent as a real email via Outlook Graph API. The email appears in the recipient's inbox normally.

**Client sending:** When a client sends a message from the hub, the middleware sends an email on their behalf from a system address (e.g., hub@goagentflow.com) with clear attribution. AgentFlow receives it as a normal email, and it appears in the hub.

**Technical requirement:** Graph API Mail.Read and Mail.Send permissions. Email filtering logic based on ConfigMappings.json (which domains/addresses map to which hub). Webhook subscriptions for new mail notifications (or polling).

**Open question:** Do we store copies of emails in SharePoint, just references/pointers, or AI-generated summaries? Copies are simplest but use storage. References require Graph API calls each time. Summaries lose detail.

### 4.4 Meetings Integration

**Assumption:** Meetings are filtered from Outlook/Teams by attendee domain, similar to email filtering. Scheduling a meeting from the hub creates a Teams meeting and sends calendar invites via Outlook.

**Recordings and transcripts:** Teams meeting recordings are stored in OneDrive/SharePoint. The middleware retrieves these and surfaces them in the hub. Transcripts are generated by Teams (may require Teams Premium). Recordings are internal-only by default; AgentFlow chooses what to share with clients.

**AI summaries:** Two types: (1) Auto-summary generated by Teams/Copilot, retrieved and displayed. (2) Custom summary where user enters a prompt (e.g., "What did they say about budget?") and AI processes the transcript to answer.

**Technical requirement:** Graph API Calendars.ReadWrite, OnlineMeetings.ReadWrite. Access to Teams recording storage. AI API (Claude or GPT) for custom summaries. Logic to determine which meetings belong to which hub based on attendees.

### 4.5 Video Handling

**Assumption:** Videos can be uploaded (MP4, MOV, WebM), recorded directly in the browser (webcam/screen), or linked from external sources (YouTube, Vimeo, Loom). Uploaded videos are stored in SharePoint.

**In-browser recording:** Uses browser MediaRecorder API. Recorded video is uploaded to SharePoint. This is entirely front-end until the upload step.

**Technical requirement:** SharePoint storage for video files. Streaming playback (SharePoint supports this natively). Metadata (title, description, tags, visibility) stored in JSON alongside video. Thumbnail generation (may need to be done client-side or via a simple serverless function).

### 4.6 Document Handling

**Assumption:** Documents are stored in SharePoint in the hub folder structure. Client Documents and Internal Documents are separate folders. Visibility is controlled by which folder a document is in.

**Preview:** Office documents can be previewed using Office Online embed URLs. PDFs can be viewed inline. Images display directly.

**Technical requirement:** Graph API Files.ReadWrite.All. Logic to construct Office Online embed URLs for preview. Engagement tracking (who viewed/downloaded what) stored in metadata JSON.

### 4.7 Questionnaire Integration

**Assumption:** Questionnaires are created in Microsoft Forms (not built in the hub). The hub stores links to Forms, embeds them for completion, and retrieves responses via the Forms API.

**Limitation:** Microsoft Forms API has limited functionality. We may only be able to embed the form and track completion status, not retrieve detailed response data programmatically. If detailed response analytics are needed, users may need to view them in Forms directly.

**Technical requirement:** Forms embed via iframe. Forms API for basic response tracking (if available). Alternative: build simple native forms in the hub if Forms API proves too limited.

### 4.8 Client Sharing and Permissions

**Assumption:** Clients can share content (videos, documents, questionnaires) with colleagues in the same email domain. Sharing generates a link. When the colleague clicks the link and signs in with their Microsoft account (same domain), they are auto-granted access to that specific content. AgentFlow is notified.

**Permission levels:** When a client invites a colleague, they choose what the colleague can access: Full Access (everything they can see), Proposal Only, Documents Only, or specific items.

**Domain restriction:** Clients can only share with people in their own email domain (e.g., @neverlandcreative.com). Attempts to share outside the domain are blocked with a clear error message.

**Technical requirement:** Share links include a unique ID. When accessed, middleware checks: (1) user is authenticated via Microsoft, (2) user's email domain matches the hub's domain, (3) user has permission for this specific content. Access events are logged and surfaced as notifications to AgentFlow.

### 4.9 Proposal Comments

**Assumption:** Clients can comment on specific slides in the proposal. A comment creates a message thread in the Messages section with a reference to the slide number. The client sees a confirmation: "Your comment has been sent to the AgentFlow team. You'll find the conversation in Messages."

**Technical requirement:** Front-end tracks which slide the user is viewing when they submit a comment. Comment is saved as a new message thread with metadata indicating slide reference. AgentFlow receives notification (email and hub notification).

### 4.10 Meeting Requests

**Assumption:** Clients can request meetings but cannot directly schedule them. A meeting request includes: topic, preferred times (free text or date/time options), duration, and optional additional attendees. The request creates a message to AgentFlow. AgentFlow then schedules the actual meeting.

**Future option:** Integrate Calendly for self-service booking. Would require Calendly account and API integration. Not in scope for v0.1.

### 4.11 Engagement Tracking

**Assumption:** The middleware tracks engagement events: hub visits, proposal views (and time spent, slides viewed), video plays (and watch percentage), document downloads, message opens, meeting joins.

**Technical requirement:** Front-end sends events to middleware (or logs directly to SharePoint). Events stored in JSON in the hub folder. Aggregated for display in AgentFlow staff views.

---

## 5. Graph API Permissions Required

| Permission | Purpose |
|------------|---------|
| User.Read | User authentication and profile |
| Files.ReadWrite.All | SharePoint read/write for all hub data |
| Mail.Read | Read Outlook emails for Messages section |
| Mail.Send | Send emails from the hub |
| Calendars.ReadWrite | Read meetings, create calendar events |
| OnlineMeetings.ReadWrite | Create Teams meetings |
| Sites.ReadWrite.All | SharePoint site-level access (if needed) |

**Admin Consent:** These permissions require Admin Consent in the Azure AD tenant. This is straightforward for AgentFlow's own tenant. For future client deployments, this will be a sales/onboarding consideration.

---

## 6. Open Questions for Discovery

The following questions need to be resolved during technical discovery:

- **Email storage:** Do we store copies of emails in SharePoint, references/pointers, or AI summaries?
- **Teams recording access:** Does accessing recordings require Teams Premium? What's the workaround if not?
- **Teams transcript access:** Same question for transcripts.
- **Forms API limitations:** What response data can we actually retrieve? Is native form building needed?
- **B2B guest flow:** How do we automate the Azure AD B2B guest invitation when inviting clients?
- **Share link authentication:** How do we verify domain and grant access when someone clicks a share link?
- **Video thumbnail generation:** Client-side, serverless function, or accept no thumbnails for uploaded videos?
- **Real-time updates:** Webhooks vs polling for new emails, messages, and activity?
- **Rate limits:** How do we handle Graph API rate limits for frequent operations?

---

## 7. Development Approach

### 7.1 Hamish: Front-End Wireframes

Build wireframes in Lovable with AgentFlow branding. Export React/Next.js code to GitHub. Iterate in Cursor with AI assistance. All UI is placeholder — no real functionality, no API connections. Buttons, forms, and interactions are visual stubs.

### 7.2 Stephen: Middleware and API Research

Research and prototype Microsoft Graph API integrations. Focus areas: MSAL.js authentication, SharePoint file operations, Outlook email access, Teams meeting and recording access. Build middleware that connects the front-end to Microsoft 365.

### 7.3 Integration

Once wireframes and middleware prototypes are ready, connect them. Replace placeholder data with real API calls. Test with AgentFlow's own Microsoft 365 tenant.

---

## 8. What Success Looks Like for v0.1

A working Pitch Hub that AgentFlow uses to pitch to real prospects:

- Hamish and Stephen can log in and see a list of pitch hubs
- They can create a new hub for a prospect, upload proposal, videos, and documents
- They can invite the prospect via email
- The prospect can log in and see their personalised hub with proposal, videos, documents
- Messages sent from either side appear in both the hub and email
- Meetings can be scheduled, joined, and (ideally) recorded with summaries
- Questionnaires can be shared and completed
- AgentFlow can see engagement (who viewed what, when)
- The experience is polished enough to demonstrate the concept to future agency clients

---

*This document will be updated as we learn more during development.*
