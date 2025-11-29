/**
 * Hub types - core entity for pitch and client management
 *
 * Phase 2: Added hubType discriminator for pitch vs client hub differentiation
 */

import type { EntityId, ISODateString } from "./common";

// Hub type discriminator (Phase 2)
export type HubType = "pitch" | "client";

// Hub status (lowercase for consistency)
export type HubStatus = "draft" | "active" | "won" | "lost";

// Hub entity
export interface Hub {
  id: EntityId;
  companyName: string;
  contactName: string;
  contactEmail: string;
  status: HubStatus;
  hubType: HubType; // Phase 2: "pitch" for new business, "client" for converted
  createdAt: ISODateString;
  updatedAt: ISODateString;
  lastActivity: ISODateString;
  clientsInvited: number;
  lastVisit: ISODateString | null;
  clientDomain: string; // For domain-restricted sharing
  // Phase 2: Conversion audit fields (only set when hubType === "client")
  convertedAt?: ISODateString;
  convertedBy?: EntityId;
}

// Type guards for hub type discrimination
export function isPitchHub(hub: Hub): boolean {
  return hub.hubType === "pitch";
}

export function isClientHub(hub: Hub): boolean {
  return hub.hubType === "client";
}

// Hub creation request
export interface CreateHubRequest {
  companyName: string;
  contactName: string;
  contactEmail: string;
  clientDomain?: string; // Extracted from contactEmail if not provided
}

// Hub update request
export interface UpdateHubRequest {
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  status?: HubStatus;
}

// Hub overview data (staff view dashboard)
export interface HubOverview {
  hub: Hub;
  alerts: HubAlert[];
  internalNotes: string;
  engagementStats: EngagementStats;
}

// Alert/action item for hub
export interface HubAlert {
  id: EntityId;
  type: AlertType;
  title: string;
  description: string;
  createdAt: ISODateString;
  isRead: boolean;
}

export type AlertType =
  | "proposal_viewed"
  | "document_uploaded"
  | "message_received"
  | "meeting_requested"
  | "questionnaire_completed"
  | "member_joined";

// Engagement statistics summary
export interface EngagementStats {
  totalViews: number;
  uniqueVisitors: number;
  avgTimeSpent: number; // seconds
  lastVisit: ISODateString | null;
  proposalViews: number;
  documentDownloads: number;
  videoWatchTime: number; // seconds
}

// Portal configuration (staff editable)
export interface PortalConfig {
  hubId: EntityId;
  isPublished: boolean;
  welcomeHeadline: string;
  welcomeMessage: string;
  heroContentType: HeroContentType;
  heroContentId: EntityId | null; // Video ID or Proposal ID
  sections: PortalSectionConfig;
}

export type HeroContentType = "video" | "proposal" | "none";

// Toggle visibility of portal sections
export interface PortalSectionConfig {
  showProposal: boolean;
  showVideos: boolean;
  showDocuments: boolean;
  showMessages: boolean;
  showMeetings: boolean;
  showQuestionnaire: boolean;
}

// Portal config update request
export interface UpdatePortalConfigRequest {
  welcomeHeadline?: string;
  welcomeMessage?: string;
  heroContentType?: HeroContentType;
  heroContentId?: EntityId | null;
  sections?: Partial<PortalSectionConfig>;
}
