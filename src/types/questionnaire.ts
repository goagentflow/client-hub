/**
 * Questionnaire types - Microsoft Forms integration
 *
 * Note: Microsoft Forms API has limited response retrieval capabilities.
 * For v0.1, we link questionnaires by URL and track completion status.
 * Detailed response analytics are optional/best-effort.
 *
 * Uses explicit null for completedAt to match JSON payloads.
 */

import type { EntityId, ISODateString } from "./common";

// Questionnaire status (lowercase for consistency)
export type QuestionnaireStatus = "draft" | "active" | "closed";

// Questionnaire entity (linked Microsoft Form)
export interface Questionnaire {
  id: EntityId;
  hubId: EntityId;
  title: string;
  description: string | null;
  formUrl: string; // Microsoft Forms URL
  formId: string; // Microsoft Forms ID (extracted from URL)
  status: QuestionnaireStatus;
  createdAt: ISODateString;
  createdBy: EntityId;
  createdByName: string;
  responseCount: number;
  totalQuestions?: number;
  estimatedMinutes?: number;
  completions: QuestionnaireCompletion[];
}

// Completion tracking per user
// completedAt is null if not completed (explicit null, not optional)
export interface QuestionnaireCompletion {
  userId: EntityId;
  userName: string;
  userEmail: string;
  completedAt: ISODateString | null; // null if not completed
}

// Helper: derive isCompleted from completedAt
export function isQuestionnaireCompleted(completion: QuestionnaireCompletion): boolean {
  return completion.completedAt !== null;
}

// Link questionnaire request
export interface LinkQuestionnaireRequest {
  formUrl: string;
  title: string;
  description?: string;
}

// Update questionnaire request
export interface UpdateQuestionnaireRequest {
  title?: string;
  description?: string;
  status?: QuestionnaireStatus;
}

// Questionnaire response (optional - depends on Forms API capabilities)
export interface QuestionnaireResponse {
  id: EntityId;
  questionnaireId: EntityId;
  respondentId: EntityId | null;
  respondentName: string | null;
  respondentEmail: string | null;
  submittedAt: ISODateString;
  answers: QuestionnaireAnswer[];
}

// Individual answer (optional)
export interface QuestionnaireAnswer {
  questionId: string;
  questionText: string;
  answer: string | string[] | number;
}

// Response analytics (optional/best-effort)
export interface QuestionnaireAnalytics {
  questionnaireId: EntityId;
  totalResponses: number;
  completionRate: number;
  avgCompletionTime: number | null; // seconds, null if not available
  questionSummaries: QuestionSummary[] | null; // null if not available
}

// Per-question summary (optional)
export interface QuestionSummary {
  questionId: string;
  questionText: string;
  responseDistribution: Record<string, number> | null;
}
