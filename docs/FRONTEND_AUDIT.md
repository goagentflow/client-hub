# AgentFlow Pitch Hub - Frontend Audit

**Phase 1 Complete** - Comprehensive audit of current state, identifying what works, what's placeholder, and what Stephen needs to build in the middleware.

---

## 1. Authentication & Routing

### Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Login page | **Working (Demo)** | Hardcoded credentials, localStorage-based |
| Role detection | **Placeholder** | Checks `localStorage.userRole` |
| Route guards | **Missing** | No protection - anyone can access any route |
| MSAL integration | **Not implemented** | Disabled "Sign in with Microsoft" button |

### Current Implementation

**Login.tsx (lines 17-27)**:
```typescript
// Hardcoded demo credentials
if (email === "sarah@neverlandcreative.com" && password === "password123") {
  localStorage.setItem("userRole", "client");
  localStorage.setItem("userEmail", email);
  navigate("/portal/overview");
} else if (email === "hamish@goagentflow.com" && password === "password123") {
  localStorage.setItem("userRole", "staff");
  localStorage.setItem("userEmail", email);
  navigate("/hubs");
}
```

### Routes (App.tsx)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Index | Redirect to login |
| `/login` | Login | Authentication |
| `/hubs` | HubList | Staff: list of pitch hubs |
| `/hub/*` | HubDetail | Staff: hub sections |
| `/portal/*` | PortalDetail | Client: portal sections |
| `*` | NotFound | 404 page |

### Required for Production

1. **MSAL Browser integration**
   - Acquire token for `api://agentflow-backend/access_as_user`
   - Store token in memory (not localStorage)
   - Handle token refresh

2. **Route guards** (`src/routes/guards.tsx`)
   - `RequireAuth` - Redirect to login if no token
   - `RequireStaff` - Block clients from staff routes
   - `RequireClient` - Block staff from client routes
   - `RequireHubAccess` - Verify user has access to specific hub

3. **API Endpoints Required**:
   - `GET /api/auth/me` - Return current user profile and role
   - `GET /api/hubs/:hubId/access` - Check user's access level for a hub

---

## 2. Sharing & Access

### Current State

| Feature | Status | Notes |
|---------|--------|-------|
| Invite client (Staff) | **Placeholder** | Button exists, no functionality |
| Share link (Staff) | **Placeholder** | Displays static URL |
| Domain restriction | **Placeholder** | UI validates but doesn't enforce |
| Invite colleague (Client) | **Placeholder** | Modal with form, no API call |
| Revoke access | **Placeholder** | Dropdown menu item, no functionality |
| Permission levels | **UI Only** | Full Access, Proposal Only, Documents Only |

### UI Locations

- **Staff**: ClientPortalSection.tsx - "Invite Client" button, share link display
- **Staff**: OverviewSection.tsx - "Invite Client" quick action
- **Client**: ClientPeopleSection.tsx - "Invite Someone" button, manage access
- **Client**: ClientProposalSection.tsx - Share modal with domain validation

### Required API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/hubs/:hubId/invites` | POST | Invite a guest to a hub |
| `/api/hubs/:hubId/invites` | GET | List pending invites |
| `/api/hubs/:hubId/invites/:id` | DELETE | Revoke invite |
| `/api/hubs/:hubId/members` | GET | List members with access |
| `/api/hubs/:hubId/members/:id` | PATCH | Update access level |
| `/api/hubs/:hubId/members/:id` | DELETE | Remove member access |
| `/api/hubs/:hubId/share-link` | POST | Generate shareable link |
| `/api/invites/:token/accept` | POST | Accept invite via token |

### Domain Restriction Logic

Currently in ClientProposalSection.tsx (line 56-63):
```typescript
if (!shareEmail.endsWith("@neverlandcreative.com")) {
  toast({ title: "Invalid email", description: "You can only share with people at Neverland Creative" });
  return;
}
```

**Needs**: Server-side validation of email domain against hub's allowed domain.

---

## 3. Hub List Page

### Current State

| Feature | Status | Notes |
|---------|--------|-------|
| Display hub cards | **Placeholder** | Static mockHubs array |
| Create new hub | **Placeholder** | Button exists, no functionality |
| Click hub to view | **Working** | Uses window.location.href (should use navigate) |
| Search hubs | **Placeholder** | Input renders but doesn't filter |
| Filter by status | **Placeholder** | Dropdown renders but doesn't filter |
| User avatar/name | **Placeholder** | Shows "JD" / "John Doe" |

### Mock Data (HubList.tsx lines 15-51)

```typescript
const mockHubs = [
  { id: 1, companyName: "Client Example123", contactName: "Sarah Mitchell", status: "Active", lastActivity: "2 days ago" },
  // ... 5 total mock hubs
];
```

### Required API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/hubs` | GET | List hubs (with search/filter params) |
| `/api/hubs` | POST | Create new hub |

### Hub Object Schema (for Stephen)

```typescript
interface Hub {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  status: "Active" | "Won" | "Lost" | "Draft";
  createdAt: string;
  lastActivity: string;
  clientsInvited: number;
  lastVisit?: string;
}
```

---

## 4. Staff View Sections

### 4.1 Overview (OverviewSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| Hub status cards | **Placeholder** | Static hubStatus array |
| Quick actions | **Placeholder** | Buttons exist, no handlers |
| Activity feed | **Placeholder** | Static recentActivity array |
| Alerts/To-dos | **Placeholder** | Static alerts array |
| Internal notes | **Placeholder** | Static text, edit button no-op |
| Engagement stats | **Placeholder** | Static engagementStats array |
| "See what Sarah sees" | **Placeholder** | No navigation |

**API Required**:
- `GET /api/hubs/:hubId` - Hub details
- `GET /api/hubs/:hubId/activity` - Activity feed
- `GET /api/hubs/:hubId/alerts` - Action items/alerts
- `GET /api/hubs/:hubId/engagement` - Engagement statistics
- `PATCH /api/hubs/:hubId/notes` - Update internal notes

### 4.2 Client Portal (ClientPortalSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| Portal status (draft/live) | **Working (Local)** | useState |
| Welcome headline/message | **Placeholder** | Input fields, no save |
| Hero content selection | **Working (Local)** | RadioGroup with useState |
| Section toggles | **Working (Local)** | Switch components |
| Publishing checklist | **Placeholder** | Static checklistItems |
| Invite client | **Placeholder** | Button with no handler |
| Share link | **Placeholder** | Static URL |
| Preview as client | **Placeholder** | Button with no handler |

**API Required**:
- `GET /api/hubs/:hubId/portal-config` - Portal settings
- `PATCH /api/hubs/:hubId/portal-config` - Update settings
- `POST /api/hubs/:hubId/publish` - Publish portal

### 4.3 Proposal (ProposalSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| Upload proposal | **Placeholder** | Drag-drop area, no handler |
| Document viewer | **Placeholder** | Shows placeholder icon |
| Slide navigation | **Working (Local)** | useState for currentSlide |
| Replace/Delete | **Placeholder** | Buttons exist, no handlers |
| Client access toggle | **Placeholder** | Switch, no persistence |
| Download enabled toggle | **Placeholder** | Checkbox, no persistence |
| Engagement stats | **Placeholder** | Static data |
| Slide engagement | **Placeholder** | Static data |
| Version history | **Placeholder** | Static versions |

**API Required**:
- `GET /api/hubs/:hubId/proposal` - Proposal metadata + presigned URL
- `POST /api/hubs/:hubId/proposal` - Upload new proposal (chunked)
- `DELETE /api/hubs/:hubId/proposal` - Delete proposal
- `GET /api/hubs/:hubId/proposal/engagement` - View analytics
- `PATCH /api/hubs/:hubId/proposal/settings` - Visibility/download settings

### 4.4 Videos (VideosSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| Video grid/list | **Placeholder** | Static mockVideos array |
| Record video | **Placeholder** | Modal opens, no recording |
| Upload video | **Placeholder** | Drag-drop, no handler |
| Add link | **Placeholder** | Input, no validation |
| Edit video details | **Working (Local)** | Modal with form fields |
| Visibility toggle | **Placeholder** | Switch, no persistence |
| Bulk actions | **Placeholder** | Bar appears, actions no-op |
| View counts | **Placeholder** | Static data |

**API Required**:
- `GET /api/hubs/:hubId/videos` - List videos
- `POST /api/hubs/:hubId/videos` - Upload video (chunked)
- `POST /api/hubs/:hubId/videos/link` - Add external video link
- `PATCH /api/hubs/:hubId/videos/:id` - Update video metadata
- `DELETE /api/hubs/:hubId/videos/:id` - Delete video
- `GET /api/hubs/:hubId/videos/:id/engagement` - View analytics

### 4.5 Documents (DocumentsSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| Client/Internal tabs | **Working (Local)** | useState activeTab |
| Document table | **Placeholder** | Static clientDocuments/internalDocuments |
| Upload document | **Placeholder** | Modal, no handler |
| Category filters | **Placeholder** | Buttons render, filter doesn't work |
| Search | **Placeholder** | Input renders, no filtering |
| Document detail panel | **Placeholder** | Sheet opens with static data |
| Version history | **Placeholder** | Static versions |
| Move between tabs | **Placeholder** | Menu item, no handler |
| Bulk actions | **Placeholder** | Bar appears, actions no-op |

**API Required**:
- `GET /api/hubs/:hubId/documents` - List documents (with visibility filter)
- `POST /api/hubs/:hubId/documents` - Upload document (chunked)
- `PATCH /api/hubs/:hubId/documents/:id` - Update metadata/visibility
- `DELETE /api/hubs/:hubId/documents/:id` - Delete document
- `GET /api/hubs/:hubId/documents/:id/engagement` - View analytics

### 4.6 Messages (MessagesSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| Thread list | **Placeholder** | Static threads array |
| Thread view | **Working (Local)** | selectedThread state |
| Compose message | **Placeholder** | Modal, no send handler |
| Reply to thread | **Placeholder** | Textarea, no send handler |
| Attachments | **Placeholder** | Button exists, no handler |
| Team notes | **Placeholder** | Textarea toggle, no persistence |
| Search | **Placeholder** | Input renders, no filtering |
| Archive | **Placeholder** | Button exists, no handler |

**API Required**:
- `GET /api/hubs/:hubId/messages` - List email threads (via OBO to Graph)
- `POST /api/hubs/:hubId/messages` - Send message (via OBO to Graph)
- `GET /api/hubs/:hubId/messages/:threadId` - Get thread messages
- `PATCH /api/hubs/:hubId/messages/:threadId/notes` - Update team notes

### 4.7 Meetings (MeetingsSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| Upcoming/Past tabs | **Working (Local)** | Tabs component |
| Meeting cards | **Placeholder** | Static inline data |
| Schedule meeting | **Placeholder** | Modal, no handler |
| Join meeting | **Placeholder** | Button, no handler |
| Agenda edit | **Placeholder** | Modal, no persistence |
| Recording | **Placeholder** | Placeholder video area |
| Transcript | **Placeholder** | Static text |
| AI summary | **Placeholder** | Static summary |
| Meeting notes | **Placeholder** | Textarea, no persistence |

**API Required**:
- `GET /api/hubs/:hubId/meetings` - List meetings (via OBO to Graph Calendar)
- `POST /api/hubs/:hubId/meetings` - Schedule meeting (via OBO)
- `PATCH /api/hubs/:hubId/meetings/:id/agenda` - Update agenda
- `PATCH /api/hubs/:hubId/meetings/:id/notes` - Update team notes
- `GET /api/hubs/:hubId/meetings/:id/recording` - Get recording URL
- `GET /api/hubs/:hubId/meetings/:id/transcript` - Get transcript

### 4.8 Questionnaire (QuestionnaireSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| Questionnaire list | **Placeholder** | Static questionnaires array |
| Add questionnaire | **Placeholder** | Modal, form fields |
| View responses | **Placeholder** | Chart visualizations |
| Individual responses | **Placeholder** | Static table |
| Share questionnaire | **Placeholder** | Copy link, email send |
| QR code | **Placeholder** | Icon placeholder |

**API Required**:
- `GET /api/hubs/:hubId/questionnaires` - List linked questionnaires
- `POST /api/hubs/:hubId/questionnaires` - Link Microsoft Forms questionnaire
- `GET /api/hubs/:hubId/questionnaires/:id` - Get questionnaire details
- `GET /api/hubs/:hubId/questionnaires/:id/responses` - Fetch responses (via Graph)
- `DELETE /api/hubs/:hubId/questionnaires/:id` - Unlink questionnaire

---

## 5. Client View Sections

### 5.1 Client Overview (ClientOverviewSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| Welcome modal | **Working (Local)** | useState showWelcomeModal |
| Welcome message | **Placeholder** | Static text "Welcome, Sarah" |
| Hero content | **Placeholder** | Static heroContent state |
| Quick links grid | **Placeholder** | Static quickLinks array |
| Recent activity | **Placeholder** | Static recentActivity array |
| "Getting Started" CTA | **Working** | Opens modal |

**API Required**:
- `GET /api/portal/config` - Portal welcome config
- `GET /api/portal/activity` - Recent activity feed

### 5.2 Client Proposal (ClientProposalSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| Slide viewer | **Placeholder** | Shows slide number only |
| Navigation | **Working (Local)** | currentSlide state |
| Thumbnail strip | **Working (Local)** | Clickable slide indicators |
| Download PDF | **Placeholder** | Shows toast, no download |
| Share with colleague | **Placeholder** | Modal with domain validation |
| Comment on slide | **Placeholder** | Form, shows confirmation |
| Sidebar info | **Placeholder** | Static data |

**API Required**:
- `GET /api/portal/proposal` - Get proposal for viewing
- `POST /api/portal/proposal/comment` - Submit comment (creates message thread)
- `POST /api/portal/share` - Share with colleague (domain-restricted)

### 5.3 Client Videos (assumed similar pattern)

**API Required**:
- `GET /api/portal/videos` - List visible videos

### 5.4 Client Documents (assumed similar pattern)

**API Required**:
- `GET /api/portal/documents` - List visible documents

### 5.5 Client Messages (assumed similar pattern)

**API Required**:
- `GET /api/portal/messages` - List messages
- `POST /api/portal/messages` - Send message

### 5.6 Client Meetings (assumed similar pattern)

**API Required**:
- `GET /api/portal/meetings` - List upcoming meetings

### 5.7 Client Questionnaire (assumed similar pattern)

**API Required**:
- `GET /api/portal/questionnaires` - List questionnaires to complete

### 5.8 Client People (ClientPeopleSection.tsx)

| Feature | Status | Data Source |
|---------|--------|-------------|
| People list | **Placeholder** | Static mockPeople array |
| Invite someone | **Placeholder** | Modal with form |
| Manage access | **Placeholder** | Modal with dropdown |
| Resend invite | **Placeholder** | Button, no handler |
| Remove access | **Placeholder** | Button, no handler |
| Recent activity | **Placeholder** | Static recentActivity |

**API Required**:
- `GET /api/portal/members` - List hub members
- `POST /api/portal/invite` - Invite colleague (domain-restricted)
- `PATCH /api/portal/members/:id` - Update access level
- `DELETE /api/portal/members/:id` - Remove access

---

## 6. Shared Components

### HubLayout.tsx

| Feature | Status | Notes |
|---------|--------|-------|
| Header | **Working** | AgentFlow logo, hub name, view badge |
| User avatar | **Working** | Shows initials from email |
| Sign out | **Working** | Clears localStorage, redirects |
| Sidebar | **Working** | Uses HubSidebar component |
| Footer | **Working** | Static copyright |

### ClientHubLayout.tsx

| Feature | Status | Notes |
|---------|--------|-------|
| Header | **Working** | Same as HubLayout |
| Sidebar | **Working** | 8 nav items with badges |
| Navigation | **Working** | NavLink component |
| Footer | **Working** | "Send a Message" link |

### HubSidebar.tsx

| Feature | Status | Notes |
|---------|--------|-------|
| 8 nav items | **Working** | Overview through Questionnaire |
| Active state | **Working** | Visual highlight on current route |
| Collapsible | **Working** | Icon-only mode |

### Navigation Issues

- HubList uses `window.location.href` instead of React Router's `navigate()` - causes full page reload
- Some buttons use `window.location.href` instead of proper navigation

---

## 7. Engagement Tracking

### Events to Track

| Event | Location | Data |
|-------|----------|------|
| `hub.viewed` | Hub sections | hubId, userId, section |
| `proposal.viewed` | ProposalSection | hubId, userId, slideNum |
| `proposal.slide_time` | ProposalSection | hubId, slideNum, seconds |
| `video.watched` | VideosSection | hubId, videoId, watchTime |
| `document.downloaded` | DocumentsSection | hubId, documentId |
| `document.viewed` | DocumentsSection | hubId, documentId |
| `meeting.joined` | MeetingsSection | hubId, meetingId |
| `message.sent` | MessagesSection | hubId, threadId |
| `questionnaire.completed` | QuestionnaireSection | hubId, questionnaireId |
| `share.sent` | Various | hubId, recipientEmail |

### Normalized Schema

```typescript
interface ActivityEvent {
  eventType: string;
  hubId: string;
  userId: string;
  timestamp: string;
  metadata: Record<string, any>;
}
```

**API Required**:
- `POST /api/events` - Log engagement event

---

## 8. Summary: What Works vs What Needs Implementation

### Working (Local State Only)
- Login form submission (demo credentials)
- Sign out
- Navigation between sections
- Tab switching
- Modal open/close
- Local form state
- Slide navigation
- View mode toggles

### Placeholder (UI Exists, No Backend)
- All data displays (using static mock data)
- All "Save", "Create", "Upload" buttons
- Search and filter inputs
- Share/invite flows
- Engagement statistics
- Activity feeds
- Version history
- Bulk actions

### Missing
- MSAL authentication
- Route guards
- Real API calls
- File upload handlers
- Real-time updates (polling)
- Error handling
- Loading states
- TypeScript interfaces for API data

---

## 9. Next Steps

**Phase 2 will create**:
1. `src/types/*.ts` - TypeScript interfaces for all data
2. `src/services/*.ts` - API service layer with mock implementations
3. `src/hooks/*.ts` - React Query hooks for data fetching
4. `src/routes/guards.tsx` - Protected route components

Once Phase 2 is complete, Stephen will have a complete API contract to build the middleware.
