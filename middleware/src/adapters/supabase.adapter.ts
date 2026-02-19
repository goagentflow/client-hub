/**
 * Supabase Demo Adapter
 *
 * TEMPORARY: This adapter is for demo/development only.
 * In production, all data flows through SharePoint + OBO per ARCHITECTURE_V3_FINAL.md.
 *
 * Uses a lazy Proxy so the Supabase client is only constructed on first use.
 * This prevents startup crashes when DEMO_MODE=false (Supabase env vars missing).
 * Mappers live in separate files per entity to stay under 300 lines.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Lazy singleton — only constructed when first database operation is called
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    if (!env.DEMO_MODE) {
      throw new Error('Supabase adapter is not available when DEMO_MODE=false. Use SharePoint adapter.');
    }
    _client = createClient(
      env.SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _client;
}

// Proxy defers createClient until first property access (e.g. supabase.from('hub'))
// All existing imports of `supabase` continue to work unchanged.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

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
