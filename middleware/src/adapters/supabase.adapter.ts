/**
 * Supabase Demo Adapter
 *
 * TEMPORARY: This adapter is for demo/development only.
 * In production, all data flows through SharePoint + OBO per ARCHITECTURE_V3_FINAL.md.
 *
 * Uses the service role key for server-side access (bypasses RLS).
 * Mappers live in separate files per entity to stay under 300 lines.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Singleton Supabase client (service role — server-side only)
export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Re-export all mappers for backward compatibility
export { mapHubRow, mapPortalConfig } from './hub.mapper.js';
export type { HubRow, HubDTO, PortalConfigDTO } from './hub.mapper.js';

export { mapVideoRow } from './video.mapper.js';
export type { VideoRow, VideoDTO } from './video.mapper.js';

export { mapDocumentRow, mapProposalRow } from './document.mapper.js';
export type { DocumentRow, DocumentDTO, ProposalDTO } from './document.mapper.js';

export { mapEventRow } from './event.mapper.js';
export type { EventRow, EventDTO } from './event.mapper.js';

export { mapProjectRow, mapMilestoneRow } from './project.mapper.js';
export type { ProjectRow, MilestoneRow, ProjectDTO, MilestoneDTO } from './project.mapper.js';
