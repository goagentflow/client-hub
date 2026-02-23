/**
 * Hub Prisma → DTO mappers
 *
 * Prisma returns camelCase fields matching the schema.
 * These mappers select only the fields needed for API responses
 * and exclude sensitive data (password_hash).
 */

import type { Hub } from '@prisma/client';

export interface HubDTO {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  status: string;
  hubType: string;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
  clientsInvited: number;
  lastVisit: string | null;
  clientDomain: string | null;
  accessMethod: string;
  convertedAt?: string;
  convertedBy?: string;
}

export function mapHub(hub: Hub): HubDTO {
  return {
    id: hub.id,
    companyName: hub.companyName,
    contactName: hub.contactName,
    contactEmail: hub.contactEmail,
    status: hub.status,
    hubType: hub.hubType,
    createdAt: hub.createdAt.toISOString(),
    updatedAt: hub.updatedAt.toISOString(),
    lastActivity: hub.lastActivity.toISOString(),
    clientsInvited: hub.clientsInvited,
    lastVisit: hub.lastVisit?.toISOString() ?? null,
    clientDomain: hub.clientDomain ?? null,
    accessMethod: hub.accessMethod,
    ...(hub.convertedAt ? { convertedAt: hub.convertedAt.toISOString() } : {}),
    ...(hub.convertedBy ? { convertedBy: hub.convertedBy } : {}),
  };
}

export interface PortalConfigDTO {
  hubId: string;
  isPublished: boolean;
  welcomeHeadline: string;
  welcomeMessage: string;
  heroContentType: string;
  heroContentId: string | null;
  sections: {
    showProposal: boolean;
    showVideos: boolean;
    showDocuments: boolean;
    showMessages: boolean;
    showMeetings: boolean;
    showQuestionnaire: boolean;
  };
}

export function mapPortalConfig(hub: Hub): PortalConfigDTO {
  return {
    hubId: hub.id,
    isPublished: hub.isPublished,
    welcomeHeadline: hub.welcomeHeadline || '',
    welcomeMessage: hub.welcomeMessage || '',
    heroContentType: hub.heroContentType || 'none',
    heroContentId: hub.heroContentId ?? null,
    sections: {
      showProposal: hub.showProposal,
      showVideos: hub.showVideos,
      showDocuments: hub.showDocuments,
      showMessages: hub.showMessages,
      showMeetings: hub.showMeetings,
      showQuestionnaire: hub.showQuestionnaire,
    },
  };
}
