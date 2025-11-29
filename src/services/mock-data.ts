/**
 * Mock data for development and demos
 *
 * Realistic placeholder data that demonstrates the UI.
 * Will be replaced by real API responses when middleware is connected.
 */

import type {
  Hub,
  User,
  HubOverview,
  HubAlert,
  EngagementStats,
  PortalConfig,
  Proposal,
  Video,
  Document,
  MessageThreadSummary,
  MessageThreadDetail,
  Meeting,
  Questionnaire,
  HubMember,
  HubInvite,
  ActivityFeedItem,
} from "@/types";

// Current date helpers
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

// Mock Users
export const mockStaffUser: User = {
  id: "user-staff-1",
  email: "hamish@goagentflow.com",
  displayName: "Hamish Nicklin",
  role: "staff",
  permissions: {
    isAdmin: true, // Hamish has admin access for leadership views
    canConvertHubs: true,
    canViewAllHubs: true,
  },
  tenantId: "agentflow-tenant-id",
  domain: "goagentflow.com",
};

export const mockClientUser: User = {
  id: "user-client-1",
  email: "sarah@whitmorelaw.co.uk",
  displayName: "Sarah Mitchell",
  role: "client",
  permissions: {
    isAdmin: false, // Clients never have admin access
    canConvertHubs: false,
    canViewAllHubs: false,
  },
  tenantId: "whitmore-tenant-id",
  domain: "whitmorelaw.co.uk",
};

// Mock Hubs (all pitch hubs for now - Phase 2 will add client hub examples)
export const mockHubs: Hub[] = [
  {
    id: "hub-1",
    companyName: "Whitmore & Associates",
    contactName: "Sarah Mitchell",
    contactEmail: "sarah@whitmorelaw.co.uk",
    status: "active",
    hubType: "pitch",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
    lastActivity: hoursAgo(2),
    clientsInvited: 3,
    lastVisit: hoursAgo(2),
    clientDomain: "whitmorelaw.co.uk",
  },
  {
    id: "hub-2",
    companyName: "Hartley Grant Partners",
    contactName: "John Chen",
    contactEmail: "john@hartleygrant.com",
    status: "draft",
    hubType: "pitch",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
    lastActivity: daysAgo(1),
    clientsInvited: 0,
    lastVisit: null,
    clientDomain: "hartleygrant.com",
  },
  {
    id: "hub-3",
    companyName: "Meridian Digital",
    contactName: "Alex Torres",
    contactEmail: "alex@meridiandigital.co",
    status: "won",
    hubType: "pitch",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(14),
    lastActivity: daysAgo(14),
    clientsInvited: 5,
    lastVisit: daysAgo(14),
    clientDomain: "meridiandigital.co",
  },
  {
    id: "hub-4",
    companyName: "Ashford Consulting",
    contactName: "Emma Davies",
    contactEmail: "emma@ashfordconsulting.com",
    status: "active",
    hubType: "pitch",
    createdAt: daysAgo(21),
    updatedAt: daysAgo(3),
    lastActivity: daysAgo(3),
    clientsInvited: 2,
    lastVisit: daysAgo(5),
    clientDomain: "ashfordconsulting.com",
  },
  {
    id: "hub-5",
    companyName: "Clearwater IT Solutions",
    contactName: "Marcus Webb",
    contactEmail: "marcus@clearwaterit.co.uk",
    status: "lost",
    hubType: "pitch",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(10),
    lastActivity: daysAgo(10),
    clientsInvited: 1,
    lastVisit: daysAgo(12),
    clientDomain: "clearwaterit.co.uk",
  },
];

// Mock Hub Overview (for hub-1)
export const mockHubOverview: HubOverview = {
  hub: mockHubs[0],
  alerts: [
    {
      id: "alert-1",
      type: "proposal_viewed",
      title: "Sarah viewed the proposal",
      description: "Spent 12 minutes reviewing slides 1-8",
      createdAt: hoursAgo(2),
      isRead: false,
    },
    {
      id: "alert-2",
      type: "message_received",
      title: "New message from Sarah",
      description: "Question about timeline on slide 15",
      createdAt: hoursAgo(5),
      isRead: false,
    },
  ] as HubAlert[],
  internalNotes: "Key decision maker is Sarah. Budget approved for Q1. Focus on creative capabilities.",
  engagementStats: {
    totalViews: 47,
    uniqueVisitors: 3,
    avgTimeSpent: 720,
    lastVisit: hoursAgo(2),
    proposalViews: 12,
    documentDownloads: 5,
    videoWatchTime: 1800,
  } as EngagementStats,
};

// Mock Portal Config
export const mockPortalConfig: PortalConfig = {
  hubId: "hub-1",
  isPublished: true,
  welcomeHeadline: "Welcome to Your AgentFlow Hub",
  welcomeMessage: "We're excited to share our proposal with you. Explore the materials below and let us know if you have any questions.",
  heroContentType: "video",
  heroContentId: "video-1",
  sections: {
    showProposal: true,
    showVideos: true,
    showDocuments: true,
    showMessages: true,
    showMeetings: true,
    showQuestionnaire: true,
  },
};

// Mock Proposal
export const mockProposal: Proposal = {
  id: "proposal-1",
  hubId: "hub-1",
  fileName: "AgentFlow_Proposal_WhitmoreAssociates.pptx",
  fileSize: 15728640,
  mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  uploadedAt: daysAgo(14),
  uploadedBy: "user-staff-1",
  totalSlides: 24,
  embedUrl: "https://view.officeapps.live.com/op/embed.aspx?src=...",
  downloadUrl: "https://storage.agentflow.com/proposals/proposal-1.pptx",
  thumbnailUrl: "https://storage.agentflow.com/thumbnails/proposal-1.png",
  settings: {
    isClientVisible: true,
    isDownloadEnabled: true,
  },
  versions: [
    { version: 2, uploadedAt: daysAgo(7), uploadedBy: "user-staff-1", uploadedByName: "Hamish Nicklin", fileName: "AgentFlow_Proposal_v2.pptx" },
    { version: 1, uploadedAt: daysAgo(14), uploadedBy: "user-staff-1", uploadedByName: "Hamish Nicklin", fileName: "AgentFlow_Proposal_v1.pptx" },
  ],
};

// Mock Videos
export const mockVideos: Video[] = [
  {
    id: "video-1",
    hubId: "hub-1",
    title: "Welcome from the Team",
    description: "A personal introduction from our team leads",
    sourceType: "upload",
    sourceUrl: "https://storage.agentflow.com/videos/video-1.mp4",
    thumbnailUrl: "https://storage.agentflow.com/thumbnails/video-1.png",
    duration: 180,
    visibility: "client",
    uploadedAt: daysAgo(14),
    uploadedBy: "user-staff-1",
    uploadedByName: "Hamish Nicklin",
    views: 8,
    avgWatchTime: 165,
  },
  {
    id: "video-2",
    hubId: "hub-1",
    title: "Platform Demo",
    description: "Walkthrough of key platform features",
    sourceType: "link",
    sourceUrl: "https://www.youtube.com/watch?v=example",
    thumbnailUrl: null,
    duration: 420,
    visibility: "client",
    uploadedAt: daysAgo(10),
    uploadedBy: "user-staff-1",
    uploadedByName: "Hamish Nicklin",
    views: 5,
    avgWatchTime: 380,
  },
];

// Mock Documents
export const mockDocuments: Document[] = [
  {
    id: "doc-1",
    hubId: "hub-1",
    name: "Case Study - TechStart",
    description: "How we helped TechStart increase engagement by 40%",
    fileName: "CaseStudy_TechStart.pdf",
    fileSize: 2097152,
    mimeType: "application/pdf",
    category: "reference",
    visibility: "client",
    uploadedAt: daysAgo(12),
    uploadedBy: "user-staff-1",
    uploadedByName: "Hamish Nicklin",
    downloadUrl: "https://storage.agentflow.com/docs/doc-1.pdf",
    embedUrl: "https://view.officeapps.live.com/op/embed.aspx?src=...",
    views: 3,
    downloads: 2,
    versions: [],
  },
  {
    id: "doc-2",
    hubId: "hub-1",
    name: "Pricing Breakdown",
    description: "Detailed pricing for all service tiers",
    fileName: "Pricing_2024.xlsx",
    fileSize: 524288,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    category: "contract",
    visibility: "client",
    uploadedAt: daysAgo(8),
    uploadedBy: "user-staff-1",
    uploadedByName: "Hamish Nicklin",
    downloadUrl: "https://storage.agentflow.com/docs/doc-2.xlsx",
    embedUrl: "https://view.officeapps.live.com/op/embed.aspx?src=...",
    views: 6,
    downloads: 4,
    versions: [],
  },
  {
    id: "doc-3",
    hubId: "hub-1",
    name: "Internal Brief Notes",
    description: "Discovery call notes and requirements",
    fileName: "Brief_Notes.docx",
    fileSize: 102400,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    category: "brief",
    visibility: "internal",
    uploadedAt: daysAgo(28),
    uploadedBy: "user-staff-1",
    uploadedByName: "Hamish Nicklin",
    downloadUrl: "https://storage.agentflow.com/docs/doc-3.docx",
    embedUrl: "https://view.officeapps.live.com/op/embed.aspx?src=...",
    views: 2,
    downloads: 1,
    versions: [],
  },
];

// Additional mock data exports will continue in the service files
// to keep this file under 300 lines

export const mockMessageThreads: MessageThreadSummary[] = [
  {
    id: "thread-1",
    hubId: "hub-1",
    subject: "Re: Proposal Questions",
    participants: [
      { email: "sarah@whitmorelaw.co.uk", name: "Sarah Mitchell", isClient: true },
      { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isClient: false },
    ],
    lastMessageAt: hoursAgo(2),
    lastMessagePreview: "Thanks for clarifying the timeline. One more question about...",
    messageCount: 5,
    isRead: false,
    isArchived: false,
    hasTeamNotes: true,
  },
  {
    id: "thread-2",
    hubId: "hub-1",
    subject: "Meeting Follow-up",
    participants: [
      { email: "sarah@whitmorelaw.co.uk", name: "Sarah Mitchell", isClient: true },
      { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isClient: false },
    ],
    lastMessageAt: daysAgo(3),
    lastMessagePreview: "Great meeting today! I've attached the summary...",
    messageCount: 3,
    isRead: true,
    isArchived: false,
    hasTeamNotes: false,
  },
];

export const mockMeetings: Meeting[] = [
  // Past meeting - completed with full data
  {
    id: "meeting-1",
    hubId: "hub-1",
    title: "Proposal Review Call",
    description: "Initial review of the AgentFlow proposal with key stakeholders",
    startTime: daysAgo(5),
    endTime: new Date(new Date(daysAgo(5)).getTime() + 60 * 60 * 1000).toISOString(),
    status: "completed",
    organizer: { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isOrganizer: true, isClient: false, responseStatus: "accepted" },
    attendees: [
      { email: "sarah@whitmorelaw.co.uk", name: "Sarah Mitchell", isOrganizer: false, isClient: true, responseStatus: "accepted" },
      { email: "james@whitmorelaw.co.uk", name: "James Wilson", isOrganizer: false, isClient: true, responseStatus: "accepted" },
    ],
    joinUrl: null,
    agenda: "1. Introduction & goals\n2. Proposal walkthrough\n3. Timeline & milestones\n4. Budget discussion\n5. Q&A\n6. Next steps",
    teamNotes: "Sarah is the primary decision maker. James handles budget approval. They're keen on the creative capabilities but want more detail on the AI features. Budget seems flexible if we can demonstrate ROI. Follow up with case study deck.",
    recording: {
      id: "recording-1",
      recordingUrl: "https://storage.agentflow.com/recordings/meeting-1.mp4",
      duration: 3420, // 57 minutes
      recordedAt: daysAgo(5),
    },
    transcript: {
      id: "transcript-1",
      content: "Full transcript of the proposal review call...",
      segments: [
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 0, endTime: 45, text: "Thanks everyone for joining today. I'm excited to walk you through our proposal and show you how AgentFlow can transform your client engagement process." },
        { speakerName: "Sarah Mitchell", speakerEmail: "sarah@whitmorelaw.co.uk", startTime: 46, endTime: 78, text: "Thanks Hamish. We've been looking for a solution like this for a while. Really impressed with what we've seen so far." },
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 79, endTime: 180, text: "Great to hear! Let me start by walking through the key features. The hub-based approach means each client gets their own dedicated space where you can share proposals, videos, documents..." },
        { speakerName: "James Wilson", speakerEmail: "james@whitmorelaw.co.uk", startTime: 181, endTime: 220, text: "Quick question on the pricing model - is this per-seat or per-hub? We have about 15 people who might need access." },
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 221, endTime: 280, text: "Great question. It's per-hub pricing, so your whole team can access each hub without additional per-seat costs. That typically works out much better for agencies." },
        { speakerName: "Sarah Mitchell", speakerEmail: "sarah@whitmorelaw.co.uk", startTime: 281, endTime: 340, text: "That's really helpful. And the engagement tracking - can we see which slides clients spend the most time on?" },
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 341, endTime: 420, text: "Absolutely. You'll get detailed analytics on proposal views, including time spent per slide, re-visits, and when they download documents. It gives you real insight into what's resonating." },
      ],
    },
    aiSummary: "## Meeting Summary\n\n**Attendees:** Hamish Nicklin (AgentFlow), Sarah Mitchell & James Wilson (Whitmore & Associates)\n\n### Key Discussion Points\n- Walked through the AgentFlow proposal hub features\n- Sarah expressed strong interest in the engagement tracking capabilities\n- James asked about pricing model - confirmed per-hub (not per-seat) pricing\n- Discussed AI-powered features and analytics dashboard\n- Timeline: Whitmore & Associates looking to make a decision within 2 weeks\n\n### Client Feedback\n- Very positive reception to the hub-based approach\n- Particularly interested in proposal analytics and video hosting\n- Want to see case studies from similar law firms\n\n### Action Items\n1. **Hamish:** Send case study deck featuring professional services clients\n2. **Hamish:** Prepare ROI calculator with Whitmore's specific numbers\n3. **Sarah:** Review proposal with wider team and gather feedback\n4. **James:** Get budget pre-approval for Q1 implementation\n\n### Next Steps\nSchedule follow-up call in one week to address any questions and discuss implementation timeline.",
  },
  // Future meeting - follow-up
  {
    id: "meeting-2",
    hubId: "hub-1",
    title: "Follow-up: Questions & Implementation Planning",
    description: "Address any remaining questions and discuss implementation timeline if moving forward",
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    status: "scheduled",
    organizer: { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isOrganizer: true, isClient: false, responseStatus: "accepted" },
    attendees: [
      { email: "sarah@whitmorelaw.co.uk", name: "Sarah Mitchell", isOrganizer: false, isClient: true, responseStatus: "accepted" },
    ],
    joinUrl: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc123",
    agenda: "1. Review feedback from team\n2. Answer any remaining questions\n3. Discuss implementation timeline\n4. Next steps & decision timeline",
    teamNotes: null,
    recording: null,
    transcript: null,
    aiSummary: null,
  },
];

export const mockQuestionnaires: Questionnaire[] = [
  {
    id: "questionnaire-1",
    hubId: "hub-1",
    title: "Project Requirements Survey",
    description: "Help us understand your needs better",
    formUrl: "https://forms.office.com/r/example123",
    formId: "example123",
    status: "active",
    createdAt: daysAgo(10),
    createdBy: "user-staff-1",
    createdByName: "Hamish Nicklin",
    responseCount: 1,
    completions: [
      { userId: "user-client-1", userName: "Sarah Mitchell", userEmail: "sarah@whitmorelaw.co.uk", completedAt: daysAgo(5) },
    ],
  },
];

export const mockMembers: HubMember[] = [
  {
    id: "member-1",
    hubId: "hub-1",
    userId: "user-client-1",
    email: "sarah@whitmorelaw.co.uk",
    displayName: "Sarah Mitchell",
    avatarUrl: null,
    role: "client",
    accessLevel: "full_access",
    permissions: { canViewProposal: true, canViewDocuments: true, canViewVideos: true, canViewMessages: true, canViewMeetings: true, canViewQuestionnaire: true, canInviteMembers: true, canManageAccess: false },
    invitedBy: "user-staff-1",
    invitedByName: "Hamish Nicklin",
    joinedAt: daysAgo(14),
    lastActiveAt: hoursAgo(2),
  },
];

export const mockActivityFeed: ActivityFeedItem[] = [
  { id: "activity-1", type: "view", title: "Proposal viewed", description: "Sarah Mitchell viewed the proposal", timestamp: hoursAgo(2), actor: { name: "Sarah Mitchell", email: "sarah@whitmorelaw.co.uk", avatarUrl: null }, resourceLink: "/hub/hub-1/proposal" },
  { id: "activity-2", type: "download", title: "Document downloaded", description: "Pricing Breakdown was downloaded", timestamp: hoursAgo(5), actor: { name: "Sarah Mitchell", email: "sarah@whitmorelaw.co.uk", avatarUrl: null }, resourceLink: "/hub/hub-1/documents" },
  { id: "activity-3", type: "message", title: "Message sent", description: "New message in 'Proposal Questions' thread", timestamp: hoursAgo(8), actor: { name: "Sarah Mitchell", email: "sarah@whitmorelaw.co.uk", avatarUrl: null }, resourceLink: "/hub/hub-1/messages" },
];
