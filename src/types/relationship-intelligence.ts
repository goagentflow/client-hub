/**
 * Relationship Intelligence types - health scoring and expansion detection
 *
 * Phase 2: Relationship Health (Strong/Stable/At Risk), Expansion Radar,
 * and shared Evidence type with PII handling
 */

import type { EntityId, ISODateString } from "./common";

// ============================================================================
// Evidence (shared across features, with PII handling)
// ============================================================================

export type EvidenceSource = "email" | "meeting_transcript" | "document" | "chat";

/**
 * Evidence excerpt with PII handling
 *
 * IMPORTANT: Server MUST sanitize all excerpts:
 * - sourceLink: NEVER include for client-facing responses
 * - excerpt: HTML-sanitized, PII-scrubbed text
 * - redacted: true if content was modified for privacy
 */
export interface Evidence {
  id: EntityId;
  source: EvidenceSource;
  sourceLink?: string; // Staff-only - NEVER sent to clients
  excerpt: string; // HTML-sanitized, PII-scrubbed, max 500 chars
  redacted: boolean; // true if excerpt was modified for privacy
  date: ISODateString;
}

// ============================================================================
// Relationship Health
// ============================================================================

export type HealthStatus = "strong" | "stable" | "at_risk";
export type HealthTrend = "improving" | "stable" | "declining";

export type HealthDriverType =
  | "email_sentiment"
  | "response_time"
  | "meeting_attendance"
  | "engagement_level"
  | "escalation_frequency"
  | "project_delivery"
  | "invoice_status";

export interface HealthDriver {
  type: HealthDriverType;
  weight: number; // 0-1, how much this contributes to score
  excerpt?: string; // Optional supporting evidence
  timestamp: ISODateString;
}

export interface RelationshipHealth {
  hubId: EntityId;
  score: number; // 0-100
  status: HealthStatus;
  trend: HealthTrend;
  drivers: HealthDriver[];
  lastCalculatedAt: ISODateString;
  lastRefreshedAt: ISODateString; // When source data was fetched
}

// ============================================================================
// Expansion Radar
// ============================================================================

export type ExpansionStatus = "open" | "in_progress" | "won" | "lost";
export type ExpansionConfidence = "high" | "medium" | "low";

export interface ExpansionOpportunity {
  id: EntityId;
  hubId: EntityId;
  title: string;
  description?: string;
  confidence: ExpansionConfidence;
  status: ExpansionStatus;
  evidence: Evidence[];
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  updatedBy?: EntityId;
}

export interface UpdateExpansionRequest {
  status?: ExpansionStatus;
  notes?: string;
}

export interface ExpansionOpportunitiesResponse {
  opportunities: ExpansionOpportunity[];
  lastCalculatedAt: ISODateString;
}

// ============================================================================
// Leadership Portfolio
// ============================================================================

export interface PortfolioOverview {
  totalClients: number;
  atRiskCount: number;
  expansionReadyCount: number;
  avgHealthScore: number;
  dataStaleTimestamp: ISODateString;
  lastCalculatedAt: ISODateString;
  lastRefreshedAt: ISODateString;
}

export interface PortfolioClient {
  hubId: EntityId;
  name: string;
  healthScore: number;
  healthStatus: HealthStatus;
  expansionPotential: ExpansionConfidence | null;
  lastActivity: ISODateString;
}

export interface PortfolioClientsResponse {
  clients: PortfolioClient[];
  dataStaleTimestamp: ISODateString;
  lastCalculatedAt: ISODateString;
  lastRefreshedAt: ISODateString;
}

export interface PortfolioFilterParams {
  sortBy?: "health" | "expansion" | "name" | "lastActivity";
  order?: "asc" | "desc";
}
