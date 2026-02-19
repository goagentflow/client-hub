/**
 * Event row → DTO mapper
 */

export interface EventRow {
  id: string;
  hub_id: string | null;
  event_type: string;
  user_id?: string | null;
  user_email?: string | null;
  user_name?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

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

export function mapEventRow(row: EventRow): EventDTO {
  if (!row.hub_id) {
    throw new Error('mapEventRow requires hub_id — use mapLeadershipEventRow for global events');
  }
  return {
    id: row.id,
    eventType: row.event_type,
    hubId: row.hub_id,
    userId: row.user_id || '',
    userName: row.user_name || '',
    userEmail: row.user_email || '',
    timestamp: row.created_at,
    metadata: row.metadata || {},
  };
}

// Leadership events: hub-free DTO for global events
export interface LeadershipEventDTO {
  id: string;
  eventType: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export function mapLeadershipEventRow(row: EventRow): LeadershipEventDTO {
  return {
    id: row.id,
    eventType: row.event_type,
    userId: row.user_id || '',
    userName: row.user_name || '',
    userEmail: row.user_email || '',
    timestamp: row.created_at,
    metadata: row.metadata || {},
  };
}
