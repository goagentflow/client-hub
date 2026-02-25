/**
 * Message types - email thread management via Microsoft Graph
 *
 * Messages are scoped to hubs using email category labels (AgentFlow-Hub:{hubId})
 * The middleware handles OBO flow to access Graph API
 *
 * Split into Summary (for list views) and Detail (with full messages) for performance.
 */

import type { EntityId, ISODateString } from "./common";

// Thread summary for list views (lighter payload)
export interface MessageThreadSummary {
  id: EntityId;
  hubId: EntityId;
  projectId?: EntityId; // Phase 2: Optional project association
  subject: string;
  participants: ThreadParticipant[];
  lastMessageAt: ISODateString;
  lastMessagePreview: string;
  messageCount: number;
  isRead: boolean;
  isArchived: boolean;
  hasTeamNotes: boolean;
  requiresDecision?: boolean; // Phase 2: Flag for Decision Queue source
}

// Full thread detail with messages
export interface MessageThreadDetail {
  id: EntityId;
  hubId: EntityId;
  projectId?: EntityId; // Phase 2: Optional project association
  subject: string;
  participants: ThreadParticipant[];
  lastMessageAt: ISODateString;
  lastMessagePreview: string;
  messageCount: number;
  isRead: boolean;
  isArchived: boolean;
  requiresDecision?: boolean; // Phase 2: Flag for Decision Queue source
  teamNotes: string | null; // Internal notes stored in backend, not Graph
  messages: Message[];
}

// Thread participant
export interface ThreadParticipant {
  email: string;
  name: string;
  isClient: boolean;
}

// Individual email message
export interface Message {
  id: EntityId;
  threadId: EntityId;
  from: MessageSender;
  to: MessageRecipient[];
  cc: MessageRecipient[];
  subject: string;
  bodyPreview: string;
  bodyHtml: string;
  sentAt: ISODateString;
  isRead: boolean;
  attachments: MessageAttachment[];
}

export interface MessageSender {
  email: string;
  name: string;
}

export interface MessageRecipient {
  email: string;
  name: string;
}

// Email attachment
export interface MessageAttachment {
  id: EntityId;
  name: string;
  contentType: string;
  size: number;
  downloadUrl: string;
}

// Send message request
export interface SendMessageRequest {
  threadId?: EntityId; // If replying to existing thread
  to: string[]; // Email addresses
  cc?: string[];
  subject: string;
  bodyHtml: string;
  attachments?: File[];
}

// Update team notes request
export interface UpdateTeamNotesRequest {
  threadId: EntityId;
  notes: string;
}

// Archive thread request
export interface ArchiveThreadRequest {
  threadId: EntityId;
  archive: boolean;
}

// Thread filter params
export interface MessageFilterParams {
  isArchived?: boolean;
  isRead?: boolean;
  projectId?: EntityId | "unassigned"; // Phase 2: Filter by project
  requiresDecision?: boolean; // Phase 2: Filter for Decision Queue sources
}

// Update thread request (Phase 2)
export interface UpdateThreadRequest {
  projectId?: EntityId | null; // Assign to project (null to unassign)
  requiresDecision?: boolean; // Flag for Decision Queue
}

// ---------------------------------------------------------------------------
// Message feed types (MVP live implementation)
// ---------------------------------------------------------------------------

export interface FeedMessage {
  id: EntityId;
  hubId: EntityId;
  senderType: "staff" | "portal_client";
  senderEmail: string;
  senderName: string;
  body: string;
  createdAt: ISODateString;
}

export interface SendFeedMessageRequest {
  body: string;
}

export type HubAccessMethod = "email" | "password" | "open";

export interface MessageAudienceContact {
  email: string;
  name: string | null;
  source: "portal_contact" | "hub_contact";
}

export interface MessageAudience {
  hubId: EntityId;
  companyName: string;
  accessMethod: HubAccessMethod;
  staffAudience: {
    scope: "staff_role_global";
    label: string;
    note: string;
  };
  clientAudience: {
    knownReaders: MessageAudienceContact[];
    totalKnownReaders: number;
    isExact: boolean;
    note: string;
  };
}

export interface RequestMessageAccessRequest {
  email: string;
  name?: string;
  note?: string;
}

export interface RequestMessageAccessResponse {
  requested: boolean;
  alreadyHasAccess: boolean;
  email: string;
  message: string;
}
