/**
 * Event Prisma → DTO mapper
 *
 * Accepts Prisma HubEvent (camelCase, Date objects).
 * Returns EventDTO / LeadershipEventDTO matching the existing API contract.
 */

import type { HubEvent } from '@prisma/client';

export interface EventDTO {
  id: string;
  eventType: string;
  hubId: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export function mapEvent(event: HubEvent): EventDTO {
  if (!event.hubId) {
    throw new Error('mapEvent requires hubId — use mapLeadershipEvent for global events');
  }
  return {
    id: event.id,
    eventType: event.eventType,
    hubId: event.hubId,
    userId: event.userId || '',
    userName: event.userName || '',
    userEmail: event.userEmail || '',
    timestamp: event.createdAt.toISOString(),
    metadata: (event.metadata as Record<string, unknown>) || {},
  };
}

export interface LeadershipEventDTO {
  id: string;
  eventType: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export function mapLeadershipEvent(event: HubEvent): LeadershipEventDTO {
  return {
    id: event.id,
    eventType: event.eventType,
    userId: event.userId || '',
    userName: event.userName || '',
    userEmail: event.userEmail || '',
    timestamp: event.createdAt.toISOString(),
    metadata: (event.metadata as Record<string, unknown>) || {},
  };
}
