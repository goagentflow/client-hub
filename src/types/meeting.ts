/**
 * Meeting types - calendar integration via Microsoft Graph
 *
 * Note: Recordings and transcripts require Teams Premium licensing.
 * The middleware returns null gracefully if unavailable.
 * Types use explicit null unions to match actual JSON payloads.
 */

import type { EntityId, ISODateString } from "./common";

// Meeting status (lowercase for consistency)
export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

// Meeting entity
export interface Meeting {
  id: EntityId;
  hubId: EntityId;
  projectId?: EntityId; // Phase 2: Optional project association
  title: string;
  description: string | null;
  startTime: ISODateString;
  endTime: ISODateString;
  status: MeetingStatus;
  organizer: MeetingParticipant;
  attendees: MeetingParticipant[];
  joinUrl: string | null; // Teams meeting link
  agenda: string | null;
  teamNotes: string | null; // Internal notes stored in backend
  recording: MeetingRecording | null; // null if unavailable/no license
  transcript: MeetingTranscript | null; // null if unavailable/no license
  aiSummary: string | null; // Generated from transcript if available
}

// Meeting participant
export interface MeetingParticipant {
  email: string;
  name: string;
  isOrganizer: boolean;
  isClient: boolean;
  responseStatus: ResponseStatus;
}

export type ResponseStatus = "accepted" | "tentative" | "declined" | "none";

// Meeting recording (requires Teams Premium)
export interface MeetingRecording {
  id: EntityId;
  recordingUrl: string; // Presigned URL
  duration: number; // seconds
  recordedAt: ISODateString;
}

// Meeting transcript (requires Teams Premium)
export interface MeetingTranscript {
  id: EntityId;
  content: string; // Plain text transcript
  segments: TranscriptSegment[];
}

// Transcript segment with speaker attribution
export interface TranscriptSegment {
  speakerName: string;
  speakerEmail: string | null;
  startTime: number; // seconds from start
  endTime: number;
  text: string;
}

// Schedule meeting request
export interface ScheduleMeetingRequest {
  title: string;
  description?: string;
  startTime: ISODateString;
  endTime: ISODateString;
  attendeeEmails: string[];
  agenda?: string;
}

// Update meeting request
export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  startTime?: ISODateString;
  endTime?: ISODateString;
  attendeeEmails?: string[];
  agenda?: string;
}

// Update meeting notes request
export interface UpdateMeetingNotesRequest {
  notes: string;
}

// Meeting filter params
export interface MeetingFilterParams {
  status?: MeetingStatus;
  fromDate?: ISODateString;
  toDate?: ISODateString;
  projectId?: EntityId | "unassigned"; // Phase 2: Filter by project
}

// Update meeting project assignment (Phase 2)
export interface UpdateMeetingProjectRequest {
  projectId?: EntityId | null; // Assign to project (null to unassign)
}
