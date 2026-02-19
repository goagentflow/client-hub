/**
 * Activity and engagement tracking types
 *
 * Events use a strict enum to prevent typos and enable reliable analytics.
 * All events are hub-scoped.
 *
 * LogEventRequest is a discriminated union tying eventType to its exact metadata.
 */

import type { EntityId, ISODateString, ResourceRef } from "./common";

// Event type enum - strict typing for analytics
export enum EventType {
  HUB_VIEWED = "hub.viewed",
  PROPOSAL_VIEWED = "proposal.viewed",
  PROPOSAL_SLIDE_TIME = "proposal.slide_time",
  VIDEO_WATCHED = "video.watched",
  VIDEO_COMPLETED = "video.completed",
  DOCUMENT_VIEWED = "document.viewed",
  DOCUMENT_DOWNLOADED = "document.downloaded",
  MEETING_JOINED = "meeting.joined",
  MESSAGE_SENT = "message.sent",
  MESSAGE_READ = "message.read",
  QUESTIONNAIRE_STARTED = "questionnaire.started",
  QUESTIONNAIRE_COMPLETED = "questionnaire.completed",
  SHARE_SENT = "share.sent",
  SHARE_ACCEPTED = "share.accepted",
  // Phase 2: Leadership events (not hub-scoped)
  LEADERSHIP_ACCESSED = "leadership.accessed",
}

// Activity event entity (stored/returned from API)
export interface ActivityEvent {
  id: EntityId;
  eventType: EventType;
  hubId: EntityId;
  userId: EntityId;
  userName: string;
  userEmail: string;
  timestamp: ISODateString;
  metadata: EventMetadata;
}

// Discriminated union for log event requests (hub-scoped) - compiler enforces correct metadata
export type LogEventRequest =
  | { eventType: EventType.HUB_VIEWED; metadata: HubViewedMetadata }
  | { eventType: EventType.PROPOSAL_VIEWED; metadata: ProposalViewedMetadata }
  | { eventType: EventType.PROPOSAL_SLIDE_TIME; metadata: ProposalSlideTimeMetadata }
  | { eventType: EventType.VIDEO_WATCHED; metadata: VideoWatchedMetadata }
  | { eventType: EventType.VIDEO_COMPLETED; metadata: VideoCompletedMetadata }
  | { eventType: EventType.DOCUMENT_VIEWED; metadata: DocumentViewedMetadata }
  | { eventType: EventType.DOCUMENT_DOWNLOADED; metadata: DocumentDownloadedMetadata }
  | { eventType: EventType.MEETING_JOINED; metadata: MeetingJoinedMetadata }
  | { eventType: EventType.MESSAGE_SENT; metadata: MessageSentMetadata }
  | { eventType: EventType.MESSAGE_READ; metadata: MessageReadMetadata }
  | { eventType: EventType.QUESTIONNAIRE_STARTED; metadata: QuestionnaireStartedMetadata }
  | { eventType: EventType.QUESTIONNAIRE_COMPLETED; metadata: QuestionnaireCompletedMetadata }
  | { eventType: EventType.SHARE_SENT; metadata: ShareSentMetadata }
  | { eventType: EventType.SHARE_ACCEPTED; metadata: ShareAcceptedMetadata };

// Leadership event requests (not hub-scoped)
export type LeadershipLogEventRequest = {
  eventType: EventType.LEADERSHIP_ACCESSED;
  metadata: LeadershipAccessedMetadata;
};

// Event metadata union type (for ActivityEvent.metadata)
export type EventMetadata =
  | HubViewedMetadata
  | ProposalViewedMetadata
  | ProposalSlideTimeMetadata
  | VideoWatchedMetadata
  | VideoCompletedMetadata
  | DocumentViewedMetadata
  | DocumentDownloadedMetadata
  | MeetingJoinedMetadata
  | MessageSentMetadata
  | MessageReadMetadata
  | QuestionnaireStartedMetadata
  | QuestionnaireCompletedMetadata
  | ShareSentMetadata
  | ShareAcceptedMetadata
  | LeadershipAccessedMetadata;

// Individual metadata types
export interface HubViewedMetadata {
  section: string;
}

export interface ProposalViewedMetadata {
  proposalId: EntityId;
  slideNum: number;
}

export interface ProposalSlideTimeMetadata {
  proposalId: EntityId;
  slideNum: number;
  seconds: number;
}

export interface VideoWatchedMetadata {
  videoId: EntityId;
  watchTime: number; // seconds
  percentComplete: number;
}

export interface VideoCompletedMetadata {
  videoId: EntityId;
}

export interface DocumentViewedMetadata {
  documentId: EntityId;
}

export interface DocumentDownloadedMetadata {
  documentId: EntityId;
}

export interface MeetingJoinedMetadata {
  meetingId: EntityId;
}

export interface MessageSentMetadata {
  threadId: EntityId;
}

export interface MessageReadMetadata {
  threadId: EntityId;
  messageId: EntityId;
}

export interface QuestionnaireStartedMetadata {
  questionnaireId: EntityId;
}

export interface QuestionnaireCompletedMetadata {
  questionnaireId: EntityId;
}

export interface ShareSentMetadata {
  recipientEmail: string;
  resource: ResourceRef;
}

export interface ShareAcceptedMetadata {
  inviteId: EntityId;
}

// Phase 2: Leadership view access (categorical only, no PII)
export interface LeadershipAccessedMetadata {
  view: "overview" | "all" | "at-risk" | "expansion";
}

// Leadership event display DTO (hub-free, for global events)
export interface LeadershipEvent {
  id: EntityId;
  eventType: EventType;
  userId: EntityId;
  userName: string;
  userEmail: string;
  timestamp: ISODateString;
  metadata: LeadershipAccessedMetadata;
}

// Activity feed item (for display)
export interface ActivityFeedItem {
  id: EntityId;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: ISODateString;
  actor: {
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  resourceLink: string | null;
}

// Activity types for feed display
export type ActivityType =
  | "view"
  | "download"
  | "upload"
  | "comment"
  | "message"
  | "meeting"
  | "invite"
  | "join";
