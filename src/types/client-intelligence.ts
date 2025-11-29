/**
 * Client Intelligence types - AI-powered features for client hubs
 *
 * Phase 2: Instant Answers, Decision Queue, Meeting Prep/Follow-up,
 * Performance Narratives, Institutional Memory, Risk Alerts
 *
 * All AI endpoints use async job pattern: POST creates job, GET polls for result
 */

import type { EntityId, ISODateString } from "./common";
import type { Evidence } from "./relationship-intelligence";

// ============================================================================
// Async Job Pattern (shared across AI features)
// ============================================================================

export type AsyncJobStatus = "queued" | "ready" | "error";

// Base async job response fields
export interface AsyncJobBase {
  status: AsyncJobStatus;
  createdAt: ISODateString;
  expiresAt: ISODateString; // Job TTL (default: createdAt + 1 hour)
  pollIntervalHint: number; // Suggested poll interval in ms (default: 2000)
  completedAt?: ISODateString;
  error?: string; // Only if status="error"
}

// ============================================================================
// Instant Answers
// ============================================================================

export interface InstantAnswerRequest {
  question: string;
}

export interface InstantAnswerJob extends AsyncJobBase {
  id: EntityId;
  hubId: EntityId;
  question: string;
  answer?: string;
  source?: string;
  confidence?: ConfidenceLevel;
  evidence?: Evidence[]; // PII-scrubbed excerpts
}

export type ConfidenceLevel = "high" | "medium" | "low";

// ============================================================================
// Decision Queue
// ============================================================================

export type DecisionStatus = "open" | "in_review" | "approved" | "declined";

// Related resource reference
export interface DecisionRelatedResource {
  type: "message" | "document" | "meeting";
  id: EntityId;
}

// Decision item entity
export interface DecisionItem {
  id: EntityId;
  hubId: EntityId;
  title: string;
  description?: string;
  dueDate?: ISODateString;
  requestedBy: EntityId;
  requestedByName: string;
  assignee?: EntityId;
  assigneeName?: string;
  status: DecisionStatus;
  relatedResource?: DecisionRelatedResource;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  updatedBy?: EntityId;
}

// Decision transition audit record
export interface DecisionTransition {
  id: EntityId;
  decisionId: EntityId;
  fromStatus: DecisionStatus;
  toStatus: DecisionStatus;
  reason?: string;
  comment?: string;
  changedBy: EntityId;
  changedByName: string;
  changedAt: ISODateString;
}

// Create decision request
export interface CreateDecisionRequest {
  title: string;
  description?: string;
  dueDate?: ISODateString;
  assignee?: EntityId;
  relatedResource?: DecisionRelatedResource;
}

// Update decision request (state transition)
export interface UpdateDecisionRequest {
  status: DecisionStatus;
  reason?: string;
  comment?: string;
}

// Valid decision transitions
export const VALID_DECISION_TRANSITIONS: Record<DecisionStatus, DecisionStatus[]> = {
  open: ["in_review", "approved", "declined"],
  in_review: ["approved", "declined", "open"],
  approved: [], // Terminal state
  declined: [], // Terminal state
};

export function isValidDecisionTransition(
  from: DecisionStatus,
  to: DecisionStatus
): boolean {
  return VALID_DECISION_TRANSITIONS[from].includes(to);
}

// ============================================================================
// Meeting Prep & Follow-up
// ============================================================================

export interface MeetingPrep extends AsyncJobBase {
  meetingId: EntityId;
  summary?: string;
  sinceLastMeeting?: string[];
  decisionsNeeded?: string[];
  generatedAt?: ISODateString;
}

export interface MeetingFollowUp extends AsyncJobBase {
  meetingId: EntityId;
  summary?: string;
  agreedActions?: string[];
  decisions?: string[];
  generatedAt?: ISODateString;
}

// ============================================================================
// Performance Narratives
// ============================================================================

export interface PerformanceNarrative extends AsyncJobBase {
  id: EntityId;
  hubId: EntityId;
  projectId?: EntityId;
  period: string; // e.g., "Q4 2025", "November 2025"
  summaries?: string[];
  recommendations?: string[];
  generatedAt?: ISODateString;
}

export interface GeneratePerformanceRequest {
  projectId?: EntityId;
  period?: string;
}

// ============================================================================
// Institutional Memory (History)
// ============================================================================

export type HistoryEventType =
  | "message"
  | "meeting"
  | "document"
  | "decision"
  | "milestone"
  | "conversion";

export type EventSignificance = "high" | "medium" | "low";

export interface InstitutionalMemoryEvent {
  id: EntityId;
  hubId: EntityId;
  type: HistoryEventType;
  date: ISODateString;
  title: string;
  description: string;
  significance: EventSignificance;
  relatedResourceId?: EntityId;
}

export interface HistoryFilterParams {
  type?: HistoryEventType;
  fromDate?: ISODateString;
  toDate?: ISODateString;
}

// ============================================================================
// Risk Alerts
// ============================================================================

export type RiskAlertType =
  | "response_delay"
  | "engagement_drop"
  | "scope_creep"
  | "budget_concern"
  | "timeline_risk"
  | "relationship_cooling";

export type RiskSeverity = "high" | "medium" | "low";

export interface RiskAlert {
  id: EntityId;
  hubId: EntityId;
  type: RiskAlertType;
  severity: RiskSeverity;
  title: string;
  description: string;
  driver: string; // What triggered this alert
  recommendation: string;
  createdAt: ISODateString;
  acknowledgedAt?: ISODateString;
  acknowledgedBy?: EntityId;
}

export interface AcknowledgeAlertRequest {
  comment?: string;
}

export interface AcknowledgeAlertResponse {
  alert: RiskAlert;
  audit: {
    acknowledgedBy: EntityId;
    acknowledgedAt: ISODateString;
    comment?: string;
  };
}
