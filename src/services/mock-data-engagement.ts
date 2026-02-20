/**
 * Mock data for engagement: Messages, Meetings, Questionnaires, Members
 */

import type {
  MessageThreadSummary,
  Meeting,
  Questionnaire,
  HubMember,
} from "@/types";

// Date helpers
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

export const mockMessageThreads: MessageThreadSummary[] = [
  // Pitch Hub (hub-1) messages
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

  // Client Hub (hub-3 - Meridian Digital) messages
  {
    id: "thread-meridian-1",
    hubId: "hub-3",
    subject: "Re: Homepage Hero Concepts",
    participants: [
      { email: "alex@meridiandigital.co", name: "Alex Torres", isClient: true },
      { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isClient: false },
    ],
    lastMessageAt: hoursAgo(4),
    lastMessagePreview: "Love Option B! Quick question about the animation timing...",
    messageCount: 8,
    isRead: false,
    isArchived: false,
    hasTeamNotes: true,
  },
  {
    id: "thread-meridian-2",
    hubId: "hub-3",
    subject: "Weekly Status Update - Nov 25",
    participants: [
      { email: "alex@meridiandigital.co", name: "Alex Torres", isClient: true },
      { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isClient: false },
    ],
    lastMessageAt: daysAgo(2),
    lastMessagePreview: "Thanks for the update. The progress on the design system looks great...",
    messageCount: 4,
    isRead: true,
    isArchived: false,
    hasTeamNotes: false,
  },
  {
    id: "thread-meridian-3",
    hubId: "hub-3",
    subject: "Q1 Campaign Brief Feedback",
    participants: [
      { email: "alex@meridiandigital.co", name: "Alex Torres", isClient: true },
      { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isClient: false },
    ],
    lastMessageAt: daysAgo(5),
    lastMessagePreview: "I've reviewed the campaign brief and have a few thoughts on the target audience...",
    messageCount: 6,
    isRead: true,
    isArchived: false,
    hasTeamNotes: true,
  },
  {
    id: "thread-meridian-4",
    hubId: "hub-3",
    subject: "Invoice Query - October",
    participants: [
      { email: "alex@meridiandigital.co", name: "Alex Torres", isClient: true },
      { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isClient: false },
    ],
    lastMessageAt: daysAgo(12),
    lastMessagePreview: "All sorted now, thanks for clarifying the line items.",
    messageCount: 3,
    isRead: true,
    isArchived: false,
    hasTeamNotes: false,
  },
];

export const mockMeetings: Meeting[] = [
  // ============================================================================
  // Pitch Hub (hub-1) meetings
  // ============================================================================

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
      duration: 3420,
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

  // ============================================================================
  // Client Hub (hub-3 - Meridian Digital) meetings
  // ============================================================================

  // Past meeting 1: Contract Signing / Onboarding Kick-off
  {
    id: "meeting-meridian-1",
    hubId: "hub-3",
    title: "Contract Signing & Onboarding Kick-off",
    description: "MSA signing ceremony and project onboarding session",
    startTime: daysAgo(45),
    endTime: new Date(new Date(daysAgo(45)).getTime() + 90 * 60 * 1000).toISOString(),
    status: "completed",
    organizer: { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isOrganizer: true, isClient: false, responseStatus: "accepted" },
    attendees: [
      { email: "alex@meridiandigital.co", name: "Alex Torres", isOrganizer: false, isClient: true, responseStatus: "accepted" },
    ],
    joinUrl: null,
    agenda: "1. Contract review & signing\n2. Project overview\n3. Team introductions\n4. Communication & collaboration tools\n5. Timeline walkthrough\n6. Q&A",
    teamNotes: "Alex is excited to get started. Primary contact for all decisions. Prefers Slack for quick questions, email for formal approvals. Decision timeline: typically 2-3 days for minor items, up to a week for budget-related decisions.",
    recording: {
      id: "recording-meridian-1",
      recordingUrl: "https://storage.agentflow.com/recordings/meeting-meridian-1.mp4",
      duration: 5400,
      recordedAt: daysAgo(45),
    },
    transcript: {
      id: "transcript-meridian-1",
      content: "Full transcript of the onboarding kick-off...",
      segments: [
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 0, endTime: 60, text: "Alex, thanks so much for choosing to work with us. Really excited about this partnership. Before we dive in, I just need to get the MSA signed and we can officially kick things off." },
        { speakerName: "Alex Torres", speakerEmail: "alex@meridiandigital.co", startTime: 61, endTime: 120, text: "Absolutely, I've reviewed everything and it all looks good. Just walked through it with our legal team yesterday. Ready to sign." },
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 121, endTime: 200, text: "Perfect. Now that's done, let me introduce you to the hub. This is where everything lives - documents, messages, meetings, project updates. You'll have full visibility into progress at all times." },
        { speakerName: "Alex Torres", speakerEmail: "alex@meridiandigital.co", startTime: 201, endTime: 260, text: "This is really slick. I love that I can see everything in one place. The old agency we worked with had stuff scattered across email, Dropbox, random Google Docs..." },
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 261, endTime: 340, text: "That's exactly what we're solving. Everything stays organised and searchable. Now let me walk you through the two projects we're kicking off - the website redesign and the Q1 marketing campaign." },
      ],
    },
    aiSummary: "## Meeting Summary\n\n**Attendees:** Hamish Nicklin (AgentFlow), Alex Torres (Meridian Digital)\n\n### Key Outcomes\n- MSA successfully signed and executed\n- Alex onboarded to the client hub\n- Reviewed both projects: Website Redesign & Q1 Campaign\n\n### Communication Preferences\n- Slack for quick questions and updates\n- Email for formal approvals and sign-offs\n- Weekly status calls every Monday at 2pm\n\n### Decision Timeline\n- Minor decisions: 2-3 days\n- Budget-related: up to 1 week\n- Alex is primary decision maker\n\n### Action Items\n1. **Hamish:** Upload brand guidelines to hub\n2. **Hamish:** Schedule discovery workshops\n3. **Alex:** Provide access to existing analytics\n4. **Alex:** Share competitor examples for reference\n\n### Next Steps\nDiscovery workshop scheduled for next week to dive deep into website requirements.",
  },

  // Past meeting 2: Discovery Workshop
  {
    id: "meeting-meridian-2",
    hubId: "hub-3",
    title: "Website Redesign - Discovery Workshop",
    description: "Deep dive into requirements, user personas, and competitive analysis",
    startTime: daysAgo(42),
    endTime: new Date(new Date(daysAgo(42)).getTime() + 120 * 60 * 1000).toISOString(),
    status: "completed",
    organizer: { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isOrganizer: true, isClient: false, responseStatus: "accepted" },
    attendees: [
      { email: "alex@meridiandigital.co", name: "Alex Torres", isOrganizer: false, isClient: true, responseStatus: "accepted" },
    ],
    joinUrl: null,
    agenda: "1. Current site pain points\n2. User personas & journeys\n3. Competitive analysis review\n4. Key feature prioritisation\n5. Technical requirements\n6. Success metrics definition",
    teamNotes: "Main pain points: slow load times, poor mobile experience, outdated design. Key audiences: enterprise buyers (60%), SMB (30%), developers (10%). Success metric: 40% improvement in lead generation. Tech stack: React preferred, needs CMS for marketing team.",
    recording: {
      id: "recording-meridian-2",
      recordingUrl: "https://storage.agentflow.com/recordings/meeting-meridian-2.mp4",
      duration: 7200,
      recordedAt: daysAgo(42),
    },
    transcript: {
      id: "transcript-meridian-2",
      content: "Full transcript of discovery workshop...",
      segments: [
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 0, endTime: 45, text: "Let's start by understanding what's not working with the current site. What are the biggest pain points you're hearing from your team and customers?" },
        { speakerName: "Alex Torres", speakerEmail: "alex@meridiandigital.co", startTime: 46, endTime: 120, text: "Honestly, the biggest issue is speed. Our analytics show we're losing people before the page even loads. Mobile is even worse - we're seeing 70% bounce rate on mobile devices." },
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 121, endTime: 180, text: "That's significant. We'll definitely prioritise performance. What about the design and content - any feedback there?" },
        { speakerName: "Alex Torres", speakerEmail: "alex@meridiandigital.co", startTime: 181, endTime: 260, text: "The design feels dated. We rebranded 18 months ago but the website still has the old look. And navigation is confusing - customers tell us they can't find pricing or case studies easily." },
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 261, endTime: 340, text: "Got it. Let's map out the user journeys for your three main audiences. Can you tell me more about enterprise buyers versus SMB - how do their needs differ?" },
      ],
    },
    aiSummary: "## Discovery Workshop Summary\n\n**Attendees:** Hamish Nicklin (AgentFlow), Alex Torres (Meridian Digital)\n**Duration:** 2 hours\n\n### Current Site Issues\n- **Performance:** Slow load times, 70% mobile bounce rate\n- **Design:** Outdated, doesn't reflect 18-month-old rebrand\n- **Navigation:** Users struggle to find pricing & case studies\n- **Mobile:** Poor responsive experience\n\n### Target Audiences\n1. **Enterprise buyers (60%)** - Need security info, case studies, ROI calculators\n2. **SMB (30%)** - Price-sensitive, want quick self-serve signup\n3. **Developers (10%)** - Looking for API docs, technical specs\n\n### Key Requirements\n- React-based frontend\n- Headless CMS for marketing team\n- Performance budget: <3s load time\n- Accessibility: WCAG 2.1 AA compliance\n\n### Success Metrics\n- 40% improvement in lead generation\n- Sub-3-second page load\n- Reduce mobile bounce rate by 50%\n\n### Competitive Insights\n- Reviewed 5 competitors\n- Meridian's differentiator: white-glove service\n- Opportunity: Interactive pricing calculator\n\n### Next Steps\n1. Create user journey maps\n2. Develop wireframes for key pages\n3. Technical architecture proposal",
  },

  // Past meeting 3: Design System Review
  {
    id: "meeting-meridian-3",
    hubId: "hub-3",
    title: "Design System & Component Review",
    description: "Review and approval of the design system components",
    startTime: daysAgo(21),
    endTime: new Date(new Date(daysAgo(21)).getTime() + 60 * 60 * 1000).toISOString(),
    status: "completed",
    organizer: { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isOrganizer: true, isClient: false, responseStatus: "accepted" },
    attendees: [
      { email: "alex@meridiandigital.co", name: "Alex Torres", isOrganizer: false, isClient: true, responseStatus: "accepted" },
    ],
    joinUrl: null,
    agenda: "1. Design system overview\n2. Component library walkthrough\n3. Typography & colour palette\n4. Responsive behaviour demo\n5. Feedback & refinements\n6. Sign-off for development",
    teamNotes: "Alex approved the design system with minor tweaks to button colours. Requested more prominent CTAs. Signed off for development phase.",
    recording: {
      id: "recording-meridian-3",
      recordingUrl: "https://storage.agentflow.com/recordings/meeting-meridian-3.mp4",
      duration: 3600,
      recordedAt: daysAgo(21),
    },
    transcript: {
      id: "transcript-meridian-3",
      content: "Full transcript of design system review...",
      segments: [
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 0, endTime: 50, text: "Today I want to walk you through the design system we've built. This ensures consistency across every page and makes future updates much easier." },
        { speakerName: "Alex Torres", speakerEmail: "alex@meridiandigital.co", startTime: 51, endTime: 100, text: "This looks really comprehensive. I love how you've documented everything. Our internal team will find this super useful for creating marketing materials that match." },
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 101, endTime: 160, text: "Exactly. Let me show you the button components. We have primary, secondary, and ghost variants, each with hover and disabled states." },
        { speakerName: "Alex Torres", speakerEmail: "alex@meridiandigital.co", startTime: 161, endTime: 220, text: "Can we make the primary buttons a bit more vibrant? They feel slightly muted compared to our brand guidelines." },
      ],
    },
    aiSummary: "## Design System Review Summary\n\n**Attendees:** Hamish Nicklin (AgentFlow), Alex Torres (Meridian Digital)\n\n### Components Reviewed\n- Typography scale (8 sizes)\n- Colour palette (primary, secondary, neutral, semantic)\n- Button variants (primary, secondary, ghost)\n- Form elements (inputs, selects, checkboxes)\n- Card components\n- Navigation patterns\n\n### Feedback & Changes Requested\n1. **Button colours:** Make primary buttons more vibrant (increase saturation by 10%)\n2. **CTAs:** Larger, more prominent call-to-action buttons\n3. **Typography:** Approved as-is\n4. **Spacing:** Approved the 4px grid system\n\n### Approval Status\n✅ Design system approved for development with noted tweaks\n\n### Next Steps\n1. Apply button colour adjustments\n2. Begin development phase\n3. Schedule weekly check-ins during build",
  },

  // Past meeting 4: Weekly Status (most recent)
  {
    id: "meeting-meridian-4",
    hubId: "hub-3",
    title: "Weekly Status Call - Nov 25",
    description: "Regular weekly check-in on project progress",
    startTime: daysAgo(5),
    endTime: new Date(new Date(daysAgo(5)).getTime() + 30 * 60 * 1000).toISOString(),
    status: "completed",
    organizer: { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isOrganizer: true, isClient: false, responseStatus: "accepted" },
    attendees: [
      { email: "alex@meridiandigital.co", name: "Alex Torres", isOrganizer: false, isClient: true, responseStatus: "accepted" },
    ],
    joinUrl: null,
    agenda: "1. Progress update\n2. Homepage hero review\n3. Blockers & risks\n4. Next week priorities\n5. Q1 Campaign update",
    teamNotes: "Development on track. Alex needs to approve homepage hero by end of week. Q1 Campaign creative development starting next week.",
    recording: {
      id: "recording-meridian-4",
      recordingUrl: "https://storage.agentflow.com/recordings/meeting-meridian-4.mp4",
      duration: 1800,
      recordedAt: daysAgo(5),
    },
    transcript: {
      id: "transcript-meridian-4",
      content: "Full transcript of weekly status call...",
      segments: [
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 0, endTime: 40, text: "Good afternoon Alex. Quick status update - we're on track with development. The core pages are built and we're working on the interactive elements now." },
        { speakerName: "Alex Torres", speakerEmail: "alex@meridiandigital.co", startTime: 41, endTime: 80, text: "That's great to hear. I've been playing with the staging site and it's looking really good. Much faster than the current site!" },
        { speakerName: "Hamish Nicklin", speakerEmail: "hamish@goagentflow.com", startTime: 81, endTime: 140, text: "Glad you noticed! We've optimised the images and implemented lazy loading. Now, the main thing we need from you is approval on the homepage hero designs. I've uploaded three options to the hub." },
        { speakerName: "Alex Torres", speakerEmail: "alex@meridiandigital.co", startTime: 141, endTime: 200, text: "Yes, I saw those. I'm leaning towards Option B but want to run it by our CMO. Can I get back to you by Friday?" },
      ],
    },
    aiSummary: "## Weekly Status Summary - Nov 25\n\n**Attendees:** Hamish Nicklin (AgentFlow), Alex Torres (Meridian Digital)\n**Duration:** 30 minutes\n\n### Website Redesign Progress\n- **Status:** On track (65% complete)\n- **Completed this week:** Core page templates, responsive layouts\n- **In progress:** Interactive elements, animations\n- **Staging site:** Live and performing well\n\n### Blockers\n⚠️ **Homepage hero approval needed by Friday**\n- Three options uploaded to hub\n- Alex leaning towards Option B\n- Needs CMO sign-off\n\n### Q1 Campaign Update\n- Creative development starting next week\n- Messaging framework approved\n- Budget allocation decision pending\n\n### Action Items\n1. **Alex:** Approve homepage hero by Friday\n2. **Alex:** Confirm budget allocation for paid media\n3. **Hamish:** Continue development sprint\n4. **Hamish:** Prep campaign creative brief\n\n### Next Meeting\nMonday Dec 2 at 2pm",
  },

  // Future meeting: Next weekly sync
  {
    id: "meeting-meridian-5",
    hubId: "hub-3",
    title: "Weekly Status Call - Dec 2",
    description: "Regular weekly check-in on project progress",
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    status: "scheduled",
    organizer: { email: "hamish@goagentflow.com", name: "Hamish Nicklin", isOrganizer: true, isClient: false, responseStatus: "accepted" },
    attendees: [
      { email: "alex@meridiandigital.co", name: "Alex Torres", isOrganizer: false, isClient: true, responseStatus: "accepted" },
    ],
    joinUrl: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_meridian_weekly",
    agenda: "1. Homepage hero decision follow-up\n2. Development progress\n3. Q1 Campaign creative review\n4. Next week priorities",
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
    totalQuestions: 8,
    estimatedMinutes: 5,
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
