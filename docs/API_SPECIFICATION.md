# AgentFlow Pitch Hub - API Specification v1.2

> **HISTORICAL API CONTRACT DRAFT.**
> This file contains aspirational and partially outdated endpoint contracts and should not be treated as the source of truth for live behavior.
> Use `docs/CURRENT_STATE.md` for live-vs-aspirational status and `docs/PRODUCTION_ROADMAP.md` for tracked endpoint inventory.

This document defines the complete API contract between the AgentFlow front-end and Stephen's Microsoft 365 middleware. The front-end is fully wired up to call these endpoints — middleware just needs to implement them.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Endpoints](#endpoints)
   - [Auth](#auth-endpoints)
   - [Hubs](#hub-endpoints)
   - [Proposal](#proposal-endpoints)
   - [Videos](#video-endpoints)
   - [Documents](#document-endpoints)
   - [Messages](#message-endpoints)
   - [Meetings](#meeting-endpoints)
   - [Questionnaires](#questionnaire-endpoints)
   - [Members & Access](#member-endpoints)
   - [Activity & Events](#activity-endpoints)
   - [Leadership (Admin)](#leadership-endpoints)
   - [Hub Conversion (Phase 2)](#hub-conversion-endpoints)
   - [Projects (Phase 2)](#project-endpoints)
   - [Relationship Intelligence (Phase 2)](#relationship-intelligence-endpoints)
   - [Client Intelligence (Phase 2)](#client-intelligence-endpoints)
   - [Decision Queue (Phase 2)](#decision-queue-endpoints)
   - [History & Alerts (Phase 2)](#history-alerts-endpoints)
5. [Type Definitions](#type-definitions)
6. [Event Types](#event-types)

---

## Overview

### Base URL
```
https://api.agentflow.com/api/v1
```

### Authentication Model
- **Front-end obtains tokens for the backend API scope only** using MSAL Browser
- Token scope: `api://agentflow-backend/access_as_user`
- **Front-end NEVER requests Graph scopes** — middleware performs OBO for Graph calls
- All requests include `Authorization: Bearer <token>` header

### Data Flow
```
User → MSAL (get backend token) → Front-end → Backend API → OBO → Microsoft Graph
```

---

## Common Patterns

### Request Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Pagination
All list endpoints support pagination:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `pageSize` | number | 20 | Items per page (max 100) |
| `sort` | string | - | Sort field:direction (e.g., `createdAt:desc`) |
| `filter` | string | - | Filter expression (e.g., `status:active`) |
| `search` | string | - | Full-text search query |

### Paginated Response
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

### Error Responses
All errors return:
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {},
  "correlationId": "uuid-for-tracing"
}
```

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHENTICATED` | No valid token |
| 403 | `FORBIDDEN` | User lacks permission |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Duplicate resource |
| 413 | `PAYLOAD_TOO_LARGE` | File exceeds limit |
| 429 | `RATE_LIMITED` | Too many requests |
| 5xx | `INTERNAL_ERROR` | Server error |

---

## Auth Endpoints

### Get Current User
```http
GET /auth/me
```

Returns the authenticated user and their hub access.

**Response: `AuthMeResponse`**
```json
{
  "user": {
    "id": "user-123",
    "email": "hamish@goagentflow.com",
    "displayName": "Hamish Nicklin",
    "role": "staff",
    "avatarUrl": "https://...",
    "tenantId": "tenant-uuid",
    "domain": "goagentflow.com"
  },
  "hubAccess": [
    {
      "hubId": "hub-1",
      "hubName": "Whitmore & Associates",
      "accessLevel": "full_access",
      "grantedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Check Hub Access
```http
GET /hubs/{hubId}/access
```

Verify user's access to a specific hub.

**Response: `HubAccessCheckResponse`**
```json
{
  "hasAccess": true,
  "accessLevel": "full_access",
  "permissions": {
    "canViewProposal": true,
    "canViewDocuments": true,
    "canViewVideos": true,
    "canViewMessages": true,
    "canViewMeetings": true,
    "canViewQuestionnaire": true,
    "canInviteMembers": true,
    "canManageAccess": true
  }
}
```

### Logout
```http
POST /auth/logout
```

Invalidate the current session.

---

## Hub Endpoints

### List Hubs
```http
GET /hubs
```

Returns paginated list of hubs the user has access to.

**Query Parameters:** Standard pagination + `filter=status:active`

**Response: `PaginatedList<Hub>`**

### Get Hub
```http
GET /hubs/{hubId}
```

**Response: `Hub`**
```json
{
  "id": "hub-1",
  "companyName": "Whitmore & Associates",
  "contactName": "Sarah Mitchell",
  "contactEmail": "sarah@whitmorelaw.co.uk",
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z",
  "lastActivity": "2024-01-20T15:30:00Z",
  "clientsInvited": 3,
  "lastVisit": "2024-01-20T14:00:00Z",
  "clientDomain": "whitmorelaw.co.uk"
}
```

### Create Hub
```http
POST /hubs
```

**Request: `CreateHubRequest`**
```json
{
  "companyName": "Whitmore & Associates",
  "contactName": "Sarah Mitchell",
  "contactEmail": "sarah@whitmorelaw.co.uk",
  "clientDomain": "whitmorelaw.co.uk"
}
```

**Response: `Hub`**

### Update Hub
```http
PATCH /hubs/{hubId}
```

**Request: `UpdateHubRequest`**
```json
{
  "companyName": "Whitmore & Associates Ltd",
  "status": "active"
}
```

**Response: `Hub`**

### Get Hub Overview
```http
GET /hubs/{hubId}/overview
```

Dashboard data with alerts and stats.

**Response: `HubOverview`**
```json
{
  "hub": { ... },
  "alerts": [
    {
      "id": "alert-1",
      "type": "proposal_viewed",
      "title": "Sarah viewed the proposal",
      "description": "Spent 12 minutes on slides 1-8",
      "createdAt": "2024-01-20T14:00:00Z",
      "isRead": false
    }
  ],
  "internalNotes": "Follow up next week",
  "engagementStats": {
    "totalViews": 45,
    "uniqueVisitors": 3,
    "avgTimeSpent": 420,
    "lastVisit": "2024-01-20T14:00:00Z",
    "proposalViews": 12,
    "documentDownloads": 5,
    "videoWatchTime": 1800
  }
}
```

### Update Hub Notes
```http
PATCH /hubs/{hubId}/notes
```

**Request:**
```json
{
  "notes": "Internal notes text"
}
```

### Get Hub Activity Feed
```http
GET /hubs/{hubId}/activity
```

**Response: `PaginatedList<ActivityFeedItem>`**

### Get Portal Config
```http
GET /hubs/{hubId}/portal-config
```

**Response: `PortalConfig`**
```json
{
  "hubId": "hub-1",
  "isPublished": true,
  "welcomeHeadline": "Welcome to your AgentFlow Hub",
  "welcomeMessage": "We're excited to share our proposal...",
  "heroContentType": "video",
  "heroContentId": "video-1",
  "sections": {
    "showProposal": true,
    "showVideos": true,
    "showDocuments": true,
    "showMessages": true,
    "showMeetings": true,
    "showQuestionnaire": true
  }
}
```

### Update Portal Config
```http
PATCH /hubs/{hubId}/portal-config
```

**Request: `UpdatePortalConfigRequest`**

### Publish Portal
```http
POST /hubs/{hubId}/publish
```

Makes the portal live for clients.

**Response: `PortalConfig`**

---

## Proposal Endpoints

### Get Proposal (Staff)
```http
GET /hubs/{hubId}/proposal
```

Returns `null` if no proposal uploaded.

**Response: `Proposal | null`**
```json
{
  "id": "proposal-1",
  "hubId": "hub-1",
  "fileName": "AgentFlow_Proposal_v2.pptx",
  "fileSize": 5242880,
  "mimeType": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "uploadedAt": "2024-01-15T10:00:00Z",
  "uploadedBy": "user-staff-1",
  "totalSlides": 24,
  "embedUrl": "https://view.officeapps.live.com/...",
  "downloadUrl": "https://storage.blob.core.windows.net/...",
  "thumbnailUrl": "https://...",
  "settings": {
    "isClientVisible": true,
    "isDownloadEnabled": true
  },
  "versions": [
    {
      "id": "version-1",
      "versionNumber": 1,
      "uploadedAt": "2024-01-15T10:00:00Z",
      "uploadedBy": "user-staff-1",
      "uploadedByName": "Hamish Nicklin",
      "fileName": "AgentFlow_Proposal_v1.pptx"
    }
  ]
}
```

### Upload Proposal
```http
POST /hubs/{hubId}/proposal
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: PowerPoint file (.pptx)
- `replaceExisting`: "true" | "false"

**Response: `Proposal`**

### Delete Proposal
```http
DELETE /hubs/{hubId}/proposal
```

### Update Proposal Settings
```http
PATCH /hubs/{hubId}/proposal/settings
```

**Request: `UpdateProposalSettingsRequest`**
```json
{
  "isClientVisible": true,
  "isDownloadEnabled": false
}
```

**Response: `Proposal`**

### Get Proposal Engagement
```http
GET /hubs/{hubId}/proposal/engagement
```

**Response: `ProposalEngagement`**
```json
{
  "totalViews": 12,
  "uniqueViewers": 3,
  "avgTimeSpent": 420,
  "totalTimeSpent": 1260,
  "lastViewedAt": "2024-01-20T14:00:00Z",
  "viewers": [
    { "id": "user-1", "name": "Sarah Mitchell", "email": "sarah@..." }
  ],
  "mostViewedSlide": 5,
  "slideViews": [
    { "slideNumber": 1, "title": "Introduction", "timeSpent": 45 }
  ],
  "slideEngagement": [
    { "slideNumber": 1, "views": 12, "avgTimeSpent": 30, "dropOffRate": 5 }
  ]
}
```

### Get Portal Proposal (Client)
```http
GET /hubs/{hubId}/portal/proposal
```

Returns `null` if not visible to client.

**Response: `Proposal | null`**

### Submit Proposal Comment (Client)
```http
POST /hubs/{hubId}/portal/proposal/comment
```

Creates a comment that spawns a message thread.

**Request: `CreateProposalCommentRequest`**
```json
{
  "slideNumber": 5,
  "content": "Can you clarify the timeline on this slide?"
}
```

**Response: `ProposalComment`**
```json
{
  "id": "comment-1",
  "proposalId": "proposal-1",
  "slideNumber": 5,
  "authorId": "user-client-1",
  "authorName": "Sarah Mitchell",
  "authorEmail": "sarah@whitmorelaw.co.uk",
  "content": "Can you clarify the timeline on this slide?",
  "createdAt": "2024-01-20T14:00:00Z",
  "threadId": "thread-123"
}
```

---

## Video Endpoints

### List Videos (Staff)
```http
GET /hubs/{hubId}/videos
```

**Response: `PaginatedList<Video>`**

### Get Video
```http
GET /hubs/{hubId}/videos/{videoId}
```

**Response: `Video`**
```json
{
  "id": "video-1",
  "hubId": "hub-1",
  "title": "Company Introduction",
  "description": "Meet the AgentFlow team",
  "sourceType": "upload",
  "sourceUrl": "https://storage.blob.core.windows.net/...",
  "thumbnailUrl": "https://...",
  "duration": 180,
  "visibility": "client",
  "uploadedAt": "2024-01-15T10:00:00Z",
  "uploadedBy": "user-staff-1",
  "uploadedByName": "Hamish Nicklin",
  "views": 8,
  "avgWatchTime": 120
}
```

### Upload Video
```http
POST /hubs/{hubId}/videos
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Video file
- `title`: string
- `description`: string (optional)
- `visibility`: "client" | "internal"

**Response: `Video`**

### Add Video Link
```http
POST /hubs/{hubId}/videos/link
```

For YouTube, Vimeo, etc.

**Request: `AddVideoLinkRequest`**
```json
{
  "title": "Product Demo",
  "description": "Full product walkthrough",
  "url": "https://youtube.com/watch?v=...",
  "visibility": "client"
}
```

**Response: `Video`**

### Update Video
```http
PATCH /hubs/{hubId}/videos/{videoId}
```

**Request: `UpdateVideoRequest`**
```json
{
  "title": "Updated Title",
  "visibility": "internal"
}
```

**Response: `Video`**

### Delete Video
```http
DELETE /hubs/{hubId}/videos/{videoId}
```

### Get Video Engagement
```http
GET /hubs/{hubId}/videos/{videoId}/engagement
```

**Response: `VideoEngagement`**
```json
{
  "videoId": "video-1",
  "totalViews": 8,
  "uniqueViewers": 3,
  "avgWatchTime": 165,
  "completionRate": 85,
  "viewHistory": [
    {
      "viewerId": "user-1",
      "viewerName": "Sarah Mitchell",
      "viewerEmail": "sarah@...",
      "watchTime": 180,
      "percentComplete": 100,
      "timestamp": "2024-01-20T14:00:00Z"
    }
  ]
}
```

### Bulk Video Action
```http
POST /hubs/{hubId}/videos/bulk
```

**Request: `BulkVideoActionRequest`**
```json
{
  "videoIds": ["video-1", "video-2"],
  "action": "delete" | "set_visibility",
  "visibility": "client"
}
```

### Get Portal Videos (Client)
```http
GET /hubs/{hubId}/portal/videos
```

Returns only client-visible videos.

**Response: `PaginatedList<Video>`**

---

## Document Endpoints

### List Documents (Staff)
```http
GET /hubs/{hubId}/documents
```

**Query Parameters:**
- Standard pagination
- `visibility`: "client" | "internal"
- `category`: "proposal" | "contract" | "reference" | "brief" | "deliverable" | "other"
- `search`: Full-text search

**Response: `PaginatedList<Document>`**

### Get Document
```http
GET /hubs/{hubId}/documents/{documentId}
```

**Response: `Document`**
```json
{
  "id": "doc-1",
  "hubId": "hub-1",
  "name": "Pricing Breakdown",
  "description": "Detailed pricing for all services",
  "fileName": "Pricing_2024.xlsx",
  "fileSize": 52428,
  "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "category": "proposal",
  "visibility": "client",
  "uploadedAt": "2024-01-15T10:00:00Z",
  "uploadedBy": "user-staff-1",
  "uploadedByName": "Hamish Nicklin",
  "downloadUrl": "https://storage.blob.core.windows.net/...",
  "embedUrl": "https://view.officeapps.live.com/...",
  "views": 5,
  "downloads": 2,
  "versions": [...]
}
```

### Upload Document
```http
POST /hubs/{hubId}/documents
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Document file
- `name`: Display name
- `category`: DocumentCategory
- `visibility`: "client" | "internal"
- `description`: string (optional)

**Response: `Document`**

### Update Document
```http
PATCH /hubs/{hubId}/documents/{documentId}
```

**Request: `UpdateDocumentRequest`**

**Response: `Document`**

### Delete Document
```http
DELETE /hubs/{hubId}/documents/{documentId}
```

### Get Document Engagement
```http
GET /hubs/{hubId}/documents/{documentId}/engagement
```

**Response: `DocumentEngagement`**

### Bulk Document Action
```http
POST /hubs/{hubId}/documents/bulk
```

**Request: `BulkDocumentActionRequest`**
```json
{
  "documentIds": ["doc-1", "doc-2"],
  "action": "delete" | "set_visibility" | "set_category",
  "visibility": "client",
  "category": "reference"
}
```

### Get Portal Documents (Client)
```http
GET /hubs/{hubId}/portal/documents
```

**Response: `PaginatedList<Document>`**

---

## Message Endpoints

Messages are stored in/synced with Microsoft Outlook. The middleware uses email category labels to scope messages to hubs.

### List Message Threads (Staff)
```http
GET /hubs/{hubId}/messages
```

**Query Parameters:**
- Standard pagination
- `isArchived`: boolean
- `isRead`: boolean

**Response: `PaginatedList<MessageThreadSummary>`**
```json
{
  "items": [
    {
      "id": "thread-1",
      "hubId": "hub-1",
      "subject": "Re: Proposal Questions",
      "lastMessagePreview": "Thanks for clarifying the timeline...",
      "lastMessageAt": "2024-01-20T14:00:00Z",
      "messageCount": 5,
      "isRead": false,
      "isArchived": false,
      "participants": [
        { "email": "sarah@...", "name": "Sarah Mitchell", "isClient": true }
      ]
    }
  ]
}
```

### Get Message Thread
```http
GET /hubs/{hubId}/messages/{threadId}
```

**Response: `MessageThreadDetail`**
```json
{
  "id": "thread-1",
  "hubId": "hub-1",
  "subject": "Re: Proposal Questions",
  "lastMessagePreview": "...",
  "lastMessageAt": "2024-01-20T14:00:00Z",
  "messageCount": 5,
  "isRead": true,
  "isArchived": false,
  "participants": [...],
  "teamNotes": "Follow up on pricing question",
  "messages": [
    {
      "id": "msg-1",
      "threadId": "thread-1",
      "from": { "email": "sarah@...", "name": "Sarah Mitchell" },
      "to": [{ "email": "hamish@...", "name": "Hamish Nicklin" }],
      "cc": [],
      "subject": "Re: Proposal Questions",
      "bodyPreview": "Thanks for clarifying...",
      "bodyHtml": "<p>Thanks for clarifying...</p>",
      "sentAt": "2024-01-20T14:00:00Z",
      "isRead": true,
      "attachments": [
        {
          "id": "att-1",
          "name": "requirements.pdf",
          "size": 102400,
          "mimeType": "application/pdf",
          "downloadUrl": "https://..."
        }
      ]
    }
  ]
}
```

### Send Message
```http
POST /hubs/{hubId}/messages
```

**Request: `SendMessageRequest`**
```json
{
  "threadId": "thread-1",
  "to": ["sarah@whitmorelaw.co.uk"],
  "cc": [],
  "subject": "Re: Proposal Questions",
  "bodyHtml": "<p>Great question! Here's the clarification...</p>",
  "attachments": []
}
```

Omit `threadId` to start a new thread.

**Response: `Message`**

### Update Team Notes
```http
PATCH /hubs/{hubId}/messages/{threadId}/notes
```

**Request:**
```json
{
  "notes": "Internal notes for the team"
}
```

### Archive/Unarchive Thread
```http
PATCH /hubs/{hubId}/messages/{threadId}
```

**Request:**
```json
{
  "isArchived": true
}
```

### Get Portal Messages (Client)
```http
GET /hubs/{hubId}/portal/messages
```

**Response: `PaginatedList<MessageThreadSummary>`**

### Send Portal Message (Client)
```http
POST /hubs/{hubId}/portal/messages
```

**Request: `SendMessageRequest`**

**Response: `Message`**

---

## Meeting Endpoints

Meetings are created in Microsoft Teams via Graph API.

### List Meetings
```http
GET /hubs/{hubId}/meetings
```

**Query Parameters:**
- Standard pagination
- `status`: "scheduled" | "completed" | "cancelled"
- `fromDate`: ISO date string
- `toDate`: ISO date string

**Response: `PaginatedList<Meeting>`**

### Get Meeting
```http
GET /hubs/{hubId}/meetings/{meetingId}
```

**Response: `Meeting`**
```json
{
  "id": "meeting-1",
  "hubId": "hub-1",
  "title": "Project Kickoff",
  "description": "Initial project planning session",
  "startTime": "2024-01-25T14:00:00Z",
  "endTime": "2024-01-25T15:00:00Z",
  "status": "scheduled",
  "organizer": {
    "email": "hamish@goagentflow.com",
    "name": "Hamish Nicklin",
    "isOrganizer": true,
    "isClient": false,
    "responseStatus": "accepted"
  },
  "attendees": [
    {
      "email": "sarah@whitmorelaw.co.uk",
      "name": "Sarah Mitchell",
      "isOrganizer": false,
      "isClient": true,
      "responseStatus": "tentative"
    }
  ],
  "joinUrl": "https://teams.microsoft.com/l/meetup-join/...",
  "agenda": "1. Introductions\n2. Project scope...",
  "teamNotes": "Prepare demo environment",
  "recording": null,
  "transcript": null,
  "aiSummary": null
}
```

### Schedule Meeting
```http
POST /hubs/{hubId}/meetings
```

**Request: `ScheduleMeetingRequest`**
```json
{
  "title": "Project Kickoff",
  "description": "Initial project planning session",
  "startTime": "2024-01-25T14:00:00Z",
  "endTime": "2024-01-25T15:00:00Z",
  "attendeeEmails": ["sarah@whitmorelaw.co.uk"],
  "agenda": "1. Introductions\n2. Project scope..."
}
```

**Response: `Meeting`**

### Update Meeting
```http
PATCH /hubs/{hubId}/meetings/{meetingId}
```

**Request: `UpdateMeetingRequest`**

**Response: `Meeting`**

### Update Meeting Agenda
```http
PATCH /hubs/{hubId}/meetings/{meetingId}/agenda
```

**Request:**
```json
{
  "agenda": "Updated agenda..."
}
```

### Update Meeting Notes
```http
PATCH /hubs/{hubId}/meetings/{meetingId}/notes
```

**Request:**
```json
{
  "notes": "Team-only notes"
}
```

### Cancel Meeting
```http
DELETE /hubs/{hubId}/meetings/{meetingId}
```

### Get Meeting Recording (Teams Premium)
```http
GET /hubs/{hubId}/meetings/{meetingId}/recording
```

**Response:**
```json
{
  "url": "https://..." | null
}
```

### Get Meeting Transcript (Teams Premium)
```http
GET /hubs/{hubId}/meetings/{meetingId}/transcript
```

**Response:**
```json
{
  "content": "Transcript text..." | null
}
```

### Get Portal Meetings (Client)
```http
GET /hubs/{hubId}/portal/meetings
```

**Response: `PaginatedList<Meeting>`**

---

## Questionnaire Endpoints

Questionnaires link to Microsoft Forms. Due to Forms API limitations, response analytics are best-effort.

### List Questionnaires
```http
GET /hubs/{hubId}/questionnaires
```

**Response: `PaginatedList<Questionnaire>`**

### Get Questionnaire
```http
GET /hubs/{hubId}/questionnaires/{questionnaireId}
```

**Response: `Questionnaire`**
```json
{
  "id": "questionnaire-1",
  "hubId": "hub-1",
  "title": "Project Requirements",
  "description": "Help us understand your needs",
  "formUrl": "https://forms.office.com/r/abc123",
  "formId": "abc123",
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z",
  "createdBy": "user-staff-1",
  "createdByName": "Hamish Nicklin",
  "responseCount": 2,
  "completions": [
    {
      "userId": "user-client-1",
      "userName": "Sarah Mitchell",
      "userEmail": "sarah@...",
      "startedAt": "2024-01-18T10:00:00Z",
      "completedAt": "2024-01-18T10:15:00Z"
    }
  ]
}
```

### Link Questionnaire
```http
POST /hubs/{hubId}/questionnaires
```

**Request: `LinkQuestionnaireRequest`**
```json
{
  "title": "Project Requirements",
  "description": "Help us understand your needs",
  "formUrl": "https://forms.office.com/r/abc123"
}
```

**Response: `Questionnaire`**

### Update Questionnaire
```http
PATCH /hubs/{hubId}/questionnaires/{questionnaireId}
```

**Request: `UpdateQuestionnaireRequest`**

**Response: `Questionnaire`**

### Unlink Questionnaire
```http
DELETE /hubs/{hubId}/questionnaires/{questionnaireId}
```

### Get Questionnaire Analytics
```http
GET /hubs/{hubId}/questionnaires/{questionnaireId}/responses
```

**Response: `QuestionnaireAnalytics`**
```json
{
  "questionnaireId": "questionnaire-1",
  "totalResponses": 2,
  "completionRate": 66.7,
  "avgCompletionTime": 300,
  "questionSummaries": null
}
```

### Get Portal Questionnaires (Client)
```http
GET /hubs/{hubId}/portal/questionnaires
```

**Response: `PaginatedList<Questionnaire>`**

---

## Member Endpoints

### List Members
```http
GET /hubs/{hubId}/members
```

**Response: `PaginatedList<HubMember>`**

### Get Pending Invites
```http
GET /hubs/{hubId}/invites
```

**Response: `HubInvite[]`**

### Create Invite
```http
POST /hubs/{hubId}/invites
```

**Request: `CreateInviteRequest`**
```json
{
  "email": "tom@whitmorelaw.co.uk",
  "accessLevel": "view_only",
  "message": "Hey Tom, check out our proposal!"
}
```

**Note:** Domain restriction is enforced server-side. Client invites can only invite users from their domain.

**Response: `HubInvite`**

### Revoke Invite
```http
DELETE /hubs/{hubId}/invites/{inviteId}
```

### Update Member Access
```http
PATCH /hubs/{hubId}/members/{memberId}
```

**Request: `UpdateMemberAccessRequest`**
```json
{
  "accessLevel": "proposal_only"
}
```

**Response: `HubMember`**

### Remove Member
```http
DELETE /hubs/{hubId}/members/{memberId}
```

### Create Share Link
```http
POST /hubs/{hubId}/share-link
```

**Request: `CreateShareLinkRequest`**
```json
{
  "accessLevel": "view_only",
  "expiresInDays": 7,
  "maxUses": 5
}
```

**Response: `ShareLink`**
```json
{
  "id": "link-1",
  "hubId": "hub-1",
  "token": "sharetoken-abc123",
  "url": "https://hub.agentflow.com/join/sharetoken-abc123",
  "accessLevel": "view_only",
  "createdBy": "user-staff-1",
  "createdByName": "Hamish Nicklin",
  "createdAt": "2024-01-20T10:00:00Z",
  "expiresAt": "2024-01-27T10:00:00Z",
  "maxUses": 5,
  "useCount": 0,
  "isActive": true
}
```

### Accept Invite
```http
POST /invites/{token}/accept
```

**Response: `AcceptInviteResponse`**
```json
{
  "hubId": "hub-1",
  "hubName": "Whitmore & Associates",
  "accessLevel": "view_only"
}
```

### Get Member Activity
```http
GET /hubs/{hubId}/members/activity
```

**Response: `PaginatedList<MemberActivity>`**

### Get Portal Members (Client)
```http
GET /hubs/{hubId}/portal/members
```

**Response: `PaginatedList<HubMember>`**

### Invite Colleague (Client Portal)
```http
POST /hubs/{hubId}/portal/invite
```

Domain restriction enforced — clients can only invite colleagues from their email domain.

**Request:**
```json
{
  "email": "tom@whitmorelaw.co.uk",
  "accessLevel": "view_only"
}
```

**Response: `HubInvite`**

---

## Activity Endpoints

### Log Event
```http
POST /hubs/{hubId}/events
```

**Request: `LogEventRequest`**

Event type determines metadata shape (discriminated union):

```json
{
  "eventType": "hub.viewed",
  "metadata": { "section": "portal-overview" }
}
```

```json
{
  "eventType": "proposal.viewed",
  "metadata": { "proposalId": "proposal-1", "slideNum": 5 }
}
```

```json
{
  "eventType": "video.watched",
  "metadata": { "videoId": "video-1", "watchTime": 120, "percentComplete": 65 }
}
```

### Get Events (Staff Only)
```http
GET /hubs/{hubId}/events
```

**Response: `PaginatedList<ActivityEvent>`**

---

## Type Definitions

### Access Levels
```typescript
type AccessLevel = "full_access" | "proposal_only" | "documents_only" | "view_only";
```

### Hub Status
```typescript
type HubStatus = "draft" | "active" | "won" | "lost";
```

### Document Categories
```typescript
type DocumentCategory = "proposal" | "contract" | "reference" | "brief" | "deliverable" | "other";
```

### Visibility
```typescript
type DocumentVisibility = "client" | "internal";
type VideoVisibility = "client" | "internal";
```

### Meeting Status
```typescript
type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
```

### Invite Status
```typescript
type InviteStatus = "pending" | "accepted" | "expired" | "revoked";
```

---

## Leadership Endpoints

Admin-only endpoints for portfolio management. All endpoints require staff role with `permissions.isAdmin = true`. Returns `403 Forbidden` for non-admin users.

### Get Portfolio Overview
```http
GET /leadership/portfolio
```

**Response: `PortfolioOverview`**
```json
{
  "totalClients": 24,
  "atRiskCount": 3,
  "expansionReadyCount": 8,
  "avgHealthScore": 76,
  "dataStaleTimestamp": "2024-01-19T10:00:00Z",
  "lastCalculatedAt": "2024-01-20T08:00:00Z",
  "lastRefreshedAt": "2024-01-20T08:00:00Z"
}
```

### Get Portfolio Clients
```http
GET /leadership/clients
```

**Query Parameters:**
- `sortBy`: "health" | "expansion" | "name" | "lastActivity" (default: "health")
- `order`: "asc" | "desc" (default: "desc")

**Response: `PortfolioClientsResponse`**
```json
{
  "clients": [
    {
      "hubId": "hub-client-1",
      "name": "Whitmore Law LLP",
      "healthScore": 85,
      "healthStatus": "strong",
      "expansionPotential": "high",
      "lastActivity": "2024-01-20T14:30:00Z"
    }
  ],
  "dataStaleTimestamp": "2024-01-19T10:00:00Z",
  "lastCalculatedAt": "2024-01-20T08:00:00Z",
  "lastRefreshedAt": "2024-01-20T08:00:00Z"
}
```

### Get At-Risk Clients
```http
GET /leadership/at-risk
```

Returns clients with `healthStatus = "at_risk"`.

**Response: `PortfolioClientsResponse`** (filtered to at-risk only)

### Get Expansion Candidates
```http
GET /leadership/expansion
```

Returns clients with `expansionPotential` of "high" or "medium".

**Response:**
```json
{
  "clients": [...],
  "opportunities": [
    {
      "id": "opp-1",
      "hubId": "hub-client-1",
      "type": "upsell",
      "description": "Client mentioned interest in additional consulting services",
      "confidence": "high",
      "estimatedValue": 50000,
      "detectedAt": "2024-01-15T10:00:00Z",
      "status": "new"
    }
  ],
  "dataStaleTimestamp": "2024-01-19T10:00:00Z",
  "lastCalculatedAt": "2024-01-20T08:00:00Z",
  "lastRefreshedAt": "2024-01-20T08:00:00Z"
}
```

### Refresh Portfolio Metrics
```http
POST /leadership/refresh
```

Triggers async recalculation of health scores and expansion opportunities.

**Response:**
```json
{
  "status": "queued",
  "estimatedCompletionMs": 5000
}
```

### Log Leadership Event
```http
POST /leadership/events
```

**Request:**
```json
{
  "eventType": "leadership.accessed",
  "metadata": {
    "view": "overview"
  }
}
```

`view` must be one of: "overview" | "all" | "at-risk" | "expansion"

**Response:** `204 No Content`

---

## Hub Conversion Endpoints

Convert a pitch hub to a client hub after winning the deal.

### Convert Hub
```http
POST /hubs/{hubId}/convert
```

Atomically converts a pitch hub to a client hub. This operation is idempotent.

**Request:**
```json
{
  "initialProjectName": "Q1 Implementation"
}
```

**Response:**
```json
{
  "hub": { /* Updated Hub object with hubType: "client" */ },
  "archiveSummary": {
    "proposalArchived": true,
    "proposalDocumentId": "doc-archived-1",
    "questionnaireArchived": true,
    "questionnaireHistoryId": "history-q-1"
  },
  "project": { /* Project if initialProjectName provided */ },
  "alreadyConverted": false,
  "audit": {
    "convertedBy": "user-1",
    "convertedAt": "2024-01-20T10:00:00Z"
  }
}
```

**Conversion Operations (atomic):**
1. Archive proposal → Create document with `category: "archived_proposal"`
2. Archive questionnaire → Create history entry or mark as hidden
3. Set `hubType = "client"`, `convertedAt`, `convertedBy`
4. Optionally create first Project

**Idempotency:** If already converted, returns existing state with `alreadyConverted: true`

### Rollback Conversion (Admin Only)
```http
POST /hubs/{hubId}/convert/rollback
```

**INTERNAL USE ONLY** — Early-phase recovery. Requires staff + isAdmin.

Reverses conversion: restore proposal, unarchive questionnaire, set `hubType="pitch"`.

**Response:** Updated Hub object

---

## Project Endpoints

Projects organize work streams within client hubs.

### List Projects
```http
GET /hubs/{hubId}/projects
```

**Query Parameters:**
- Standard pagination
- `status`: "active" | "completed" | "on_hold" | "cancelled"

**Response: `PaginatedList<Project>`**

### Create Project
```http
POST /hubs/{hubId}/projects
```

**Request:**
```json
{
  "name": "Q1 Implementation",
  "description": "Initial rollout phase",
  "status": "active",
  "startDate": "2024-01-15",
  "targetEndDate": "2024-03-31",
  "lead": "user-1"
}
```

**Note:** `lead` is a user ID (EntityId). The response includes `leadName` denormalized for display.

**Response: `Project`**
```json
{
  "id": "project-1",
  "hubId": "hub-client-1",
  "name": "Q1 Implementation",
  "description": "Initial rollout phase",
  "status": "active",
  "startDate": "2024-01-15",
  "targetEndDate": "2024-03-31",
  "lead": "user-1",
  "leadName": "Hamish Nicklin",
  "milestones": [],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "createdBy": "user-1"
}
```

### Get Project
```http
GET /hubs/{hubId}/projects/{projectId}
```

**Response: `Project`** (includes milestones array)

### Update Project
```http
PATCH /hubs/{hubId}/projects/{projectId}
```

**Request:** Partial Project fields

**Response: `Project`**

### Delete Project
```http
DELETE /hubs/{hubId}/projects/{projectId}
```

Soft delete (marks as cancelled, retained for history).

**Response:** `204 No Content`

### Project-Filtered Artifacts

Existing artifact endpoints accept optional `?projectId=` filter:

```http
GET /hubs/{hubId}/documents?projectId={projectId}
GET /hubs/{hubId}/videos?projectId={projectId}
GET /hubs/{hubId}/messages?projectId={projectId}
GET /hubs/{hubId}/meetings?projectId={projectId}
```

**Filter Semantics:**
- No `projectId` → Returns ALL artifacts
- `projectId={id}` → Returns artifacts assigned to project
- `projectId=unassigned` → Returns only unassigned artifacts

**Assign Artifact to Project:**
```http
PATCH /hubs/{hubId}/documents/{docId}
PATCH /hubs/{hubId}/videos/{videoId}
PATCH /hubs/{hubId}/messages/{threadId}
PATCH /hubs/{hubId}/meetings/{meetingId}
```

**Request:** `{ "projectId": "project-1" }` (or `null` to unassign)

---

## Relationship Intelligence Endpoints

AI-powered relationship health scoring and expansion detection.

### Get Relationship Health
```http
GET /hubs/{hubId}/relationship-health
```

**Response:**
```json
{
  "score": 78,
  "status": "stable",
  "trend": "improving",
  "drivers": [
    {
      "type": "email_sentiment",
      "weight": 0.3,
      "excerpt": "Client expressed enthusiasm about recent deliverables",
      "timestamp": "2024-01-19T14:00:00Z"
    }
  ],
  "lastCalculatedAt": "2024-01-20T08:00:00Z",
  "lastRefreshedAt": "2024-01-20T06:00:00Z"
}
```

**Status values:** "strong" | "stable" | "at_risk"
**Trend values:** "improving" | "stable" | "declining"

### Get Expansion Opportunities
```http
GET /hubs/{hubId}/expansion-opportunities
```

**Response:**
```json
{
  "opportunities": [
    {
      "id": "opp-1",
      "title": "Additional consulting services",
      "evidence": [
        {
          "id": "ev-1",
          "source": "email",
          "excerpt": "We might need help with the Phase 2 rollout",
          "redacted": false,
          "date": "2024-01-18T10:00:00Z"
        }
      ],
      "confidence": "high",
      "status": "open"
    }
  ],
  "lastCalculatedAt": "2024-01-20T08:00:00Z"
}
```

**Confidence values:** "high" | "medium" | "low"
**Status values:** "open" | "in_progress" | "won" | "lost"

### Update Expansion Opportunity
```http
PATCH /hubs/{hubId}/expansion-opportunities/{id}
```

**Request:**
```json
{
  "status": "in_progress",
  "notes": "Scheduled discovery call for next week"
}
```

**Response:** Updated opportunity with audit fields (`updatedBy`, `updatedAt`)

---

## Client Intelligence Endpoints

AI-powered async endpoints for instant answers, meeting prep, and performance narratives.

### Async Job Pattern

All AI endpoints use a consistent pattern:
1. **POST** creates a job → returns `{ status: "queued", jobId, pollIntervalHint }`
2. **GET** polls for result → returns status until "ready" or "error"

**Standard Job Fields:**
- `expiresAt`: When job will be garbage collected (default: +1 hour)
- `pollIntervalHint`: Suggested polling interval in ms (default: 2000)
- `retryAfter`: If rate-limited, seconds to wait

### Instant Answers

#### Create Answer Request
```http
POST /hubs/{hubId}/instant-answer/requests
```

**Request:**
```json
{
  "question": "What was the budget discussed in our last meeting?"
}
```

**Response:**
```json
{
  "answerId": "ans-123",
  "status": "queued",
  "createdAt": "2024-01-20T10:00:00Z",
  "expiresAt": "2024-01-20T11:00:00Z",
  "pollIntervalHint": 2000
}
```

#### Get Answer
```http
GET /hubs/{hubId}/instant-answer/{answerId}
```

**Response (ready):**
```json
{
  "id": "ans-123",
  "status": "ready",
  "question": "What was the budget discussed?",
  "answer": "The budget of £50,000 was discussed in the January 15th meeting.",
  "source": "Meeting transcript from Jan 15",
  "confidence": "high",
  "evidence": [
    {
      "id": "ev-1",
      "source": "meeting_transcript",
      "excerpt": "...agreed on a £50,000 budget for Phase 1...",
      "redacted": false,
      "date": "2024-01-15T14:30:00Z"
    }
  ],
  "createdAt": "2024-01-20T10:00:00Z",
  "completedAt": "2024-01-20T10:00:05Z"
}
```

#### Get Recent Answers
```http
GET /hubs/{hubId}/instant-answer/latest?limit=10
```

Returns cached recent answers for the hub.

### Meeting Prep

#### Generate Meeting Prep
```http
POST /hubs/{hubId}/meetings/{meetingId}/prep/generate
```

**Response:** `{ status: "queued" }`

#### Get Meeting Prep
```http
GET /hubs/{hubId}/meetings/{meetingId}/prep
```

**Response:**
```json
{
  "meetingId": "meeting-1",
  "status": "ready",
  "summary": "This is a quarterly review with key stakeholders...",
  "sinceLastMeeting": [
    "Completed Phase 1 deliverables",
    "Resolved billing query from Dec 15"
  ],
  "decisionsNeeded": [
    "Approve Phase 2 budget",
    "Confirm Q2 timeline"
  ],
  "generatedAt": "2024-01-20T09:00:00Z"
}
```

### Meeting Follow-up

#### Generate Follow-up
```http
POST /hubs/{hubId}/meetings/{meetingId}/follow-up/generate
```

**Response:** `{ status: "queued" }`

#### Get Follow-up
```http
GET /hubs/{hubId}/meetings/{meetingId}/follow-up
```

Same structure as prep, with action items and summary.

### Performance Narratives

#### Generate Narrative
```http
POST /hubs/{hubId}/performance/generate
```

**Request:**
```json
{
  "projectId": "project-1",
  "period": "Q4 2023"
}
```

**Response:**
```json
{
  "narrativeId": "narr-1",
  "status": "queued"
}
```

#### Get Narrative
```http
GET /hubs/{hubId}/performance/{narrativeId}
```

**Response:**
```json
{
  "id": "narr-1",
  "hubId": "hub-1",
  "projectId": "project-1",
  "period": "Q4 2023",
  "status": "ready",
  "summaries": [
    "Successfully delivered all Q4 milestones on schedule",
    "Client satisfaction score improved from 7.5 to 8.2"
  ],
  "recommendations": [
    "Consider expanding scope to include Phase 2 modules",
    "Schedule quarterly reviews to maintain engagement"
  ],
  "generatedAt": "2024-01-20T10:00:00Z"
}
```

#### Get Latest Narrative
```http
GET /hubs/{hubId}/performance/latest
```

Returns most recent cached narrative.

---

## Decision Queue Endpoints

Track items requiring client or stakeholder decisions.

### Decision State Machine

```
Valid transitions:
  open → in_review (staff picks up)
  open → approved (fast-track)
  open → declined (fast-track)
  in_review → approved
  in_review → declined
  in_review → open (return to queue)

Terminal states: approved, declined
Invalid transitions return 409 Conflict
```

### List Decisions
```http
GET /hubs/{hubId}/decision-queue
```

**Query Parameters:**
- Standard pagination
- `status`: "open" | "in_review" | "approved" | "declined"
- `assignee`: User ID

**Response: `{ items: DecisionItem[], total: number }`**

### Create Decision
```http
POST /hubs/{hubId}/decision-queue
```

**Request:**
```json
{
  "title": "Approve Phase 2 budget",
  "description": "Client needs to approve £75,000 budget for Phase 2",
  "dueDate": "2024-02-01T00:00:00Z",
  "assignee": {
    "id": "user-1",
    "name": "Sarah Mitchell"
  },
  "relatedResource": {
    "type": "document",
    "id": "doc-budget-1"
  }
}
```

**Response: `DecisionItem`**

> **Due Date Semantics:** The `dueDate` field accepts ISO 8601 timestamps. When the UI provides a date-only value (from a date picker), it is sent as `YYYY-MM-DDT00:00:00Z` (UTC midnight). The backend should treat this as a date-only boundary and avoid timezone shifts that could cause off-by-one errors in overdue calculations.

### Get Decision
```http
GET /hubs/{hubId}/decision-queue/{id}
```

**Response:** DecisionItem with transition history

### Update Decision (State Transition)
```http
PATCH /hubs/{hubId}/decision-queue/{id}
```

**Request:**
```json
{
  "status": "approved",
  "reason": "Budget approved by CFO",
  "comment": "Proceed with Phase 2 kickoff"
}
```

**Response:**
```json
{
  "item": { /* Updated DecisionItem */ },
  "transition": {
    "id": "trans-1",
    "decisionId": "decision-1",
    "fromStatus": "open",
    "toStatus": "approved",
    "reason": "Budget approved by CFO",
    "comment": "Proceed with Phase 2 kickoff",
    "changedBy": "user-1",
    "changedByName": "Hamish Nicklin",
    "changedAt": "2024-01-20T15:00:00Z"
  }
}
```

**Error (invalid transition):** `409 Conflict`
```json
{
  "error": "Invalid transition",
  "message": "Cannot transition from approved to open",
  "validTransitions": []
}
```

### Get Decision History
```http
GET /hubs/{hubId}/decision-queue/{id}/history
```

**Response:** Array of DecisionTransition objects (audit trail)

---

## History & Alerts Endpoints

Institutional memory and proactive risk monitoring.

### Get History Timeline
```http
GET /hubs/{hubId}/history
```

**Query Parameters:**
- Standard pagination
- `type`: "message" | "meeting" | "document" | "decision" | "milestone" | "conversion"
- `fromDate`: ISO date string
- `toDate`: ISO date string

**Response: `PaginatedList<HistoryEvent>`**
```json
{
  "items": [
    {
      "id": "hist-1",
      "type": "meeting",
      "title": "Quarterly Review",
      "description": "Discussed Q4 results and Q1 planning",
      "timestamp": "2024-01-15T14:00:00Z",
      "actor": {
        "id": "user-1",
        "name": "Hamish Nicklin"
      },
      "resourceLink": "/hub/hub-1/meetings/meeting-1"
    }
  ],
  "pagination": { /* ... */ }
}
```

### Get Risk Alerts
```http
GET /hubs/{hubId}/risk-alerts
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert-1",
      "type": "declining_engagement",
      "severity": "medium",
      "title": "Response times increasing",
      "description": "Average email response time has increased by 40% over the last 2 weeks",
      "detectedAt": "2024-01-19T10:00:00Z",
      "acknowledged": false
    }
  ],
  "acknowledgedCount": 3
}
```

### Acknowledge Risk Alert
```http
PATCH /hubs/{hubId}/risk-alerts/{id}/acknowledge
```

**Request:**
```json
{
  "comment": "Reached out to client - they were on holiday"
}
```

**Response:**
```json
{
  "alert": { /* Updated RiskAlert with acknowledged: true */ },
  "audit": {
    "acknowledgedBy": "user-1",
    "acknowledgedAt": "2024-01-20T11:00:00Z",
    "comment": "Reached out to client - they were on holiday"
  }
}
```

---

## Event Types

Events use strict enum values for reliable analytics:

| Event Type | Metadata |
|------------|----------|
| `hub.viewed` | `{ section: string }` |
| `proposal.viewed` | `{ proposalId, slideNum }` |
| `proposal.slide_time` | `{ proposalId, slideNum, seconds }` |
| `video.watched` | `{ videoId, watchTime, percentComplete }` |
| `video.completed` | `{ videoId }` |
| `document.viewed` | `{ documentId }` |
| `document.downloaded` | `{ documentId }` |
| `meeting.joined` | `{ meetingId }` |
| `message.sent` | `{ threadId }` |
| `message.read` | `{ threadId, messageId }` |
| `questionnaire.started` | `{ questionnaireId }` |
| `questionnaire.completed` | `{ questionnaireId }` |
| `share.sent` | `{ recipientEmail, resource: { type, id } }` |
| `share.accepted` | `{ inviteId }` |
| `leadership.accessed` | `{ view: "overview" \| "all" \| "at-risk" \| "expansion" }` |

---

## Implementation Notes for Stephen

### Priority Order
1. **Auth** (`/auth/me`, `/hubs/{hubId}/access`) — needed for app bootstrap
2. **Hubs** (`/hubs`, `/hubs/{hubId}`, `/hubs/{hubId}/overview`) — core navigation
3. **Proposal** — primary content
4. **Messages** — Outlook integration
5. **Meetings** — Teams integration
6. **Documents & Videos** — SharePoint/OneDrive
7. **Questionnaires** — Forms integration (best-effort analytics)
8. **Activity** — engagement tracking
9. **Leadership** — admin portfolio views (Phase 2)

### Microsoft Graph Mapping
| Feature | Graph API |
|---------|-----------|
| Messages | Mail API (categories for hub scoping) |
| Meetings | Calendar/Online Meetings API |
| Documents | SharePoint/OneDrive Files API |
| Proposals | SharePoint/OneDrive + Office Online |
| Questionnaires | Forms API (limited) |

### Security Considerations
- All endpoints require valid JWT from MSAL
- Middleware performs OBO for Graph calls
- Domain restriction enforced server-side for client invites
- Sanitize all HTML content before storing (bodyHtml)
- Presigned URLs for file downloads (time-limited)

---

*Document version: 1.2*
*Last updated: 2024-01-20*
*Front-end version: Phase 7 complete (Routing Updates)*
*Includes: Phase 2 Client Hubs endpoints (Conversion, Projects, Relationship Intelligence, Client Intelligence, Decision Queue, History & Alerts)*
