/**
 * Supabase Storage service for document file upload/download/delete.
 *
 * Storage references stored in DB use the scheme:
 *   supabase://hub-documents/{tenantId}/{hubId}/{docId}/{safeFileName}
 *
 * Legacy external URLs (http/https) are passed through unchanged.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/error-handler.js';

const BUCKET = 'hub-documents';
const STORAGE_SCHEME = 'supabase://';
/** Signed URL expiry in seconds (15 minutes). Exported for route-level expiresAt calculation. */
export const DEFAULT_SIGNED_URL_EXPIRY = 900;

// ── Lazy client ──────────────────────────────────────────────

let _storageClient: SupabaseClient | null = null;

function getStorageClient(): SupabaseClient {
  if (!_storageClient) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new AppError(
        'STORAGE_NOT_CONFIGURED',
        'Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
        500,
      );
    }
    _storageClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _storageClient;
}

// ── Helpers ──────────────────────────────────────────────────

/** Sanitise a filename for safe use in object paths. */
function sanitiseFileName(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, '_')  // remove path separators + unsafe chars
    .replace(/[\x00-\x1f]/g, '')     // remove control chars
    .replace(/\s+/g, '_')            // spaces to underscores
    .slice(0, 200);                   // cap length
}

/** Check if a download_url value is a Supabase storage reference. */
export function isSupabaseStorageRef(value: string): boolean {
  return value.startsWith(STORAGE_SCHEME);
}

/** Extract the object path from a supabase:// reference. */
function parseStorageRef(ref: string): { bucket: string; path: string } {
  // supabase://hub-documents/tenantId/hubId/docId/file.pdf
  const withoutScheme = ref.slice(STORAGE_SCHEME.length);
  const slashIdx = withoutScheme.indexOf('/');
  if (slashIdx === -1) throw new Error(`Invalid storage ref: ${ref}`);
  return {
    bucket: withoutScheme.slice(0, slashIdx),
    path: withoutScheme.slice(slashIdx + 1),
  };
}

/** Build a supabase:// storage reference from components. */
function buildStorageRef(tenantId: string, hubId: string, docId: string, fileName: string): string {
  const safeName = sanitiseFileName(fileName);
  return `${STORAGE_SCHEME}${BUCKET}/${tenantId}/${hubId}/${docId}/${safeName}`;
}

// ── Public API ───────────────────────────────────────────────

/** Upload a file buffer to Supabase Storage. Returns the storage reference string. */
export async function uploadDocumentObject(input: {
  tenantId: string;
  hubId: string;
  docId: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<string> {
  const { tenantId, hubId, docId, fileName, buffer, mimeType } = input;
  const ref = buildStorageRef(tenantId, hubId, docId, fileName);
  const { path } = parseStorageRef(ref);

  const { error } = await getStorageClient()
    .storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    logger.error({ err: error, path }, 'Supabase Storage upload failed');
    throw new AppError('STORAGE_UPLOAD_FAILED', `Storage upload failed: ${error.message}`, 502);
  }

  return ref;
}

/**
 * Create a download URL from a storage reference or legacy URL.
 *
 * - supabase:// refs → signed URL with expiry
 * - http(s):// refs → returned as-is (passthrough for legacy external links)
 */
export async function createDownloadUrl(
  storageRef: string,
  expirySeconds: number = DEFAULT_SIGNED_URL_EXPIRY,
): Promise<string> {
  // Legacy external URL — passthrough
  if (storageRef.startsWith('http://') || storageRef.startsWith('https://')) {
    return storageRef;
  }

  if (!isSupabaseStorageRef(storageRef)) {
    throw new AppError('INTERNAL_ERROR', `Unsupported storage reference format: ${storageRef}`, 500);
  }

  const { path } = parseStorageRef(storageRef);

  const { data, error } = await getStorageClient()
    .storage
    .from(BUCKET)
    .createSignedUrl(path, expirySeconds);

  if (error || !data?.signedUrl) {
    logger.error({ err: error, path }, 'Failed to create signed URL');
    throw new AppError('STORAGE_SIGNED_URL_FAILED', 'Failed to generate download URL', 502);
  }

  return data.signedUrl;
}

/** Delete a file from Supabase Storage. Best-effort — logs errors but does not throw. */
export async function deleteDocumentObject(storageRef: string): Promise<void> {
  if (!isSupabaseStorageRef(storageRef)) {
    // Legacy URL or unknown — nothing to delete from storage
    return;
  }

  const { path } = parseStorageRef(storageRef);

  const { error } = await getStorageClient()
    .storage
    .from(BUCKET)
    .remove([path]);

  if (error) {
    logger.error({ err: error, path }, 'Failed to delete file from storage');
  }
}
