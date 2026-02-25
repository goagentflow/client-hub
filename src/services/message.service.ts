/**
 * Message service
 *
 * Operations for email thread management via Microsoft Graph.
 * Messages are scoped to hubs using email category labels.
 */

import type {
  MessageThreadSummary,
  MessageThreadDetail,
  Message,
  SendMessageRequest,
  FeedMessage,
  SendFeedMessageRequest,
  MessageAudience,
  RequestMessageAccessRequest,
  RequestMessageAccessResponse,
  PaginatedList,
  PaginationParams,
  MessageFilterParams,
} from "@/types";
import { api, isMockApiEnabled, simulateDelay } from "./api";
import { mockMessageThreads } from "./mock-data";

// Mock messages for thread detail
const mockMessages: Message[] = [
  {
    id: "msg-1",
    threadId: "thread-1",
    from: { email: "sarah@whitmorelaw.co.uk", name: "Sarah Mitchell" },
    to: [{ email: "hamish@goagentflow.com", name: "Hamish Nicklin" }],
    cc: [],
    subject: "Re: Proposal Questions",
    bodyPreview: "Thanks for clarifying the timeline. One more question about...",
    bodyHtml: "<p>Thanks for clarifying the timeline. One more question about the implementation phase - what's the typical turnaround for the initial designs?</p>",
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    attachments: [],
  },
  {
    id: "msg-2",
    threadId: "thread-1",
    from: { email: "hamish@goagentflow.com", name: "Hamish Nicklin" },
    to: [{ email: "sarah@whitmorelaw.co.uk", name: "Sarah Mitchell" }],
    cc: [],
    subject: "Re: Proposal Questions",
    bodyPreview: "Great question! The timeline in the proposal assumes...",
    bodyHtml: "<p>Great question! The timeline in the proposal assumes a 2-week design phase with 2 rounds of revisions. We can adjust based on your needs.</p>",
    sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    attachments: [],
  },
];

// Mock feed messages for live feed endpoints
const mockFeedMessages: FeedMessage[] = [
  {
    id: "feed-1",
    hubId: "hub-1",
    senderType: "staff",
    senderEmail: "hamish@goagentflow.com",
    senderName: "Hamish Nicklin",
    body: "Hi Sarah, sharing the latest update on next steps for your onboarding.",
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: "feed-2",
    hubId: "hub-1",
    senderType: "portal_client",
    senderEmail: "sarah@whitmorelaw.co.uk",
    senderName: "Sarah Mitchell",
    body: "Thanks. Could you confirm expected turnaround on the first deliverable?",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

const mockAudience: MessageAudience = {
  hubId: "hub-1",
  companyName: "Test Co",
  accessMethod: "email",
  staffAudience: {
    scope: "staff_role_global",
    label: "Agent Flow staff",
    note: "All Agent Flow staff can read this message feed.",
  },
  clientAudience: {
    knownReaders: [
      { email: "sarah@whitmorelaw.co.uk", name: "Sarah Mitchell", source: "portal_contact" },
      { email: "alex@whitmorelaw.co.uk", name: "Alex Carter", source: "portal_contact" },
    ],
    totalKnownReaders: 2,
    isExact: true,
    note: "Only approved client contacts listed here can access and read this message feed.",
  },
};

function sortFeedNewestFirst(a: FeedMessage, b: FeedMessage): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function pageFeed(items: FeedMessage[], page = 1, pageSize = 20): FeedMessage[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function mapFeedToThreadSummary(item: FeedMessage): MessageThreadSummary {
  return {
    id: item.id,
    hubId: item.hubId,
    subject: `Message from ${item.senderName}`,
    participants: [
      {
        email: item.senderEmail,
        name: item.senderName,
        isClient: item.senderType === "portal_client",
      },
    ],
    lastMessageAt: item.createdAt,
    lastMessagePreview: item.body.slice(0, 120),
    messageCount: 1,
    isRead: true,
    isArchived: false,
    hasTeamNotes: false,
  };
}

function mapFeedToLegacyMessage(item: FeedMessage): Message {
  return {
    id: item.id,
    threadId: item.id,
    from: { email: item.senderEmail, name: item.senderName },
    to: [],
    cc: [],
    subject: `Message from ${item.senderName}`,
    bodyPreview: item.body.slice(0, 120),
    bodyHtml: `<p>${item.body}</p>`,
    sentAt: item.createdAt,
    isRead: true,
    attachments: [],
  };
}

/**
 * Get message threads for a hub
 */
export async function getMessageThreads(
  hubId: string,
  params?: PaginationParams & MessageFilterParams
): Promise<PaginatedList<MessageThreadSummary>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);

    let filtered = mockMessageThreads.filter((t) => t.hubId === hubId);

    // Apply projectId filter
    if (params?.projectId) {
      if (params.projectId === "unassigned") {
        filtered = filtered.filter((t) => !t.projectId);
      } else {
        filtered = filtered.filter((t) => t.projectId === params.projectId);
      }
    }

    if (params?.isArchived !== undefined) {
      filtered = filtered.filter((t) => t.isArchived === params.isArchived);
    }
    if (params?.isRead !== undefined) {
      filtered = filtered.filter((t) => t.isRead === params.isRead);
    }

    return {
      items: filtered,
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: filtered.length,
        totalPages: 1,
      },
    };
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.projectId) queryParams.projectId = params.projectId;
  if (params?.isArchived !== undefined) queryParams.isArchived = String(params.isArchived);
  if (params?.isRead !== undefined) queryParams.isRead = String(params.isRead);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  const feed = await api.get<PaginatedList<FeedMessage>>(`/hubs/${hubId}/messages`, queryParams);
  return {
    items: feed.items.map(mapFeedToThreadSummary),
    pagination: feed.pagination,
  };
}

/**
 * Get thread detail with messages
 */
export async function getMessageThread(
  hubId: string,
  threadId: string
): Promise<MessageThreadDetail> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);

    const summary = mockMessageThreads.find((t) => t.id === threadId);
    if (!summary) throw new Error("Thread not found");

    return {
      ...summary,
      teamNotes: "Follow up on pricing question. Decision expected by end of week.",
      messages: mockMessages.filter((m) => m.threadId === threadId),
    };
  }

  const feed = await getFeedMessages(hubId, { page: 1, pageSize: 100 });
  const item = feed.items.find((m) => m.id === threadId);
  if (!item) throw new Error("Thread not found");
  const summary = mapFeedToThreadSummary(item);
  return {
    ...summary,
    teamNotes: null,
    messages: [mapFeedToLegacyMessage(item)],
  };
}

/**
 * Send a new message or reply to thread
 */
export async function sendMessage(
  hubId: string,
  data: SendMessageRequest
): Promise<Message> {
  if (isMockApiEnabled()) {
    await simulateDelay(800);

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      threadId: data.threadId || `thread-${Date.now()}`,
      from: { email: "hamish@goagentflow.com", name: "Hamish Nicklin" },
      to: data.to.map((email) => ({ email, name: email.split("@")[0] })),
      cc: data.cc?.map((email) => ({ email, name: email.split("@")[0] })) || [],
      subject: data.subject,
      bodyPreview: data.bodyHtml.replace(/<[^>]*>/g, "").slice(0, 100),
      bodyHtml: data.bodyHtml,
      sentAt: new Date().toISOString(),
      isRead: true,
      attachments: [],
    };

    mockMessages.unshift(newMessage);
    return newMessage;
  }

  const created = await sendFeedMessage(hubId, { body: stripHtml(data.bodyHtml) });
  return mapFeedToLegacyMessage(created);
}

/**
 * Update team notes on a thread
 */
export async function updateTeamNotes(
  hubId: string,
  threadId: string,
  notes: string
): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    return;
  }

  return api.patch(`/hubs/${hubId}/messages/${threadId}/notes`, { notes });
}

/**
 * Archive/unarchive a thread
 */
export async function archiveThread(
  hubId: string,
  threadId: string,
  archive: boolean
): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    const thread = mockMessageThreads.find((t) => t.id === threadId);
    if (thread) thread.isArchived = archive;
    return;
  }

  return api.patch(`/hubs/${hubId}/messages/${threadId}`, { isArchived: archive });
}

/**
 * Get client-facing messages (portal view)
 */
export async function getPortalMessages(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<MessageThreadSummary>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const filtered = mockMessageThreads.filter((t) => t.hubId === hubId && !t.isArchived);

    return {
      items: filtered,
      pagination: { page: 1, pageSize: 20, totalItems: filtered.length, totalPages: 1 },
    };
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  const feed = await api.get<PaginatedList<FeedMessage>>(`/hubs/${hubId}/portal/messages`, queryParams);
  return {
    items: feed.items.map(mapFeedToThreadSummary),
    pagination: feed.pagination,
  };
}

/**
 * Send message from portal
 */
export async function sendPortalMessage(
  hubId: string,
  data: SendMessageRequest
): Promise<Message> {
  if (isMockApiEnabled()) {
    await simulateDelay(800);

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      threadId: data.threadId || `thread-${Date.now()}`,
      from: { email: "sarah@whitmorelaw.co.uk", name: "Sarah Mitchell" },
      to: data.to.map((email) => ({ email, name: email.split("@")[0] })),
      cc: [],
      subject: data.subject,
      bodyPreview: data.bodyHtml.replace(/<[^>]*>/g, "").slice(0, 100),
      bodyHtml: data.bodyHtml,
      sentAt: new Date().toISOString(),
      isRead: true,
      attachments: [],
    };

    return newMessage;
  }

  const created = await sendPortalFeedMessage(hubId, { body: stripHtml(data.bodyHtml) });
  return mapFeedToLegacyMessage(created);
}

/**
 * Get non-threaded message feed (staff view)
 */
export async function getFeedMessages(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<FeedMessage>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const filtered = mockFeedMessages
      .filter((m) => m.hubId === hubId)
      .sort(sortFeedNewestFirst);

    return {
      items: pageFeed(filtered, page, pageSize),
      pagination: {
        page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    };
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  return api.get<PaginatedList<FeedMessage>>(`/hubs/${hubId}/messages`, queryParams);
}

/**
 * Send non-threaded feed message (staff view)
 */
export async function sendFeedMessage(
  hubId: string,
  data: SendFeedMessageRequest
): Promise<FeedMessage> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);
    const newMessage: FeedMessage = {
      id: `feed-${Date.now()}`,
      hubId,
      senderType: "staff",
      senderEmail: "hamish@goagentflow.com",
      senderName: "Hamish Nicklin",
      body: data.body.trim(),
      createdAt: new Date().toISOString(),
    };
    mockFeedMessages.unshift(newMessage);
    return newMessage;
  }

  return api.post<FeedMessage>(`/hubs/${hubId}/messages`, data);
}

/**
 * Get non-threaded message feed (portal view)
 */
export async function getPortalFeedMessages(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<FeedMessage>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const filtered = mockFeedMessages
      .filter((m) => m.hubId === hubId)
      .sort(sortFeedNewestFirst);
    return {
      items: pageFeed(filtered, page, pageSize),
      pagination: {
        page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    };
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  return api.get<PaginatedList<FeedMessage>>(`/hubs/${hubId}/portal/messages`, queryParams);
}

/**
 * Send non-threaded feed message (portal view)
 */
export async function sendPortalFeedMessage(
  hubId: string,
  data: SendFeedMessageRequest
): Promise<FeedMessage> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);
    const newMessage: FeedMessage = {
      id: `feed-${Date.now()}`,
      hubId,
      senderType: "portal_client",
      senderEmail: "sarah@whitmorelaw.co.uk",
      senderName: "Sarah Mitchell",
      body: data.body.trim(),
      createdAt: new Date().toISOString(),
    };
    mockFeedMessages.unshift(newMessage);
    return newMessage;
  }

  return api.post<FeedMessage>(`/hubs/${hubId}/portal/messages`, data);
}

/**
 * Get visibility/audience for hub message feed
 */
export async function getMessageAudience(
  hubId: string,
  opts?: { portal?: boolean }
): Promise<MessageAudience> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    return { ...mockAudience, hubId };
  }

  const endpoint = opts?.portal
    ? `/hubs/${hubId}/portal/messages/audience`
    : `/hubs/${hubId}/messages/audience`;

  return api.get<MessageAudience>(endpoint);
}

/**
 * Portal: request access for an additional teammate
 */
export async function requestPortalMessageAccess(
  hubId: string,
  data: RequestMessageAccessRequest
): Promise<RequestMessageAccessResponse> {
  if (isMockApiEnabled()) {
    await simulateDelay(350);
    return {
      requested: true,
      alreadyHasAccess: false,
      email: data.email.trim().toLowerCase(),
      message: "Access request sent to Agent Flow staff.",
    };
  }

  return api.post<RequestMessageAccessResponse>(`/hubs/${hubId}/portal/messages/request-access`, data);
}
