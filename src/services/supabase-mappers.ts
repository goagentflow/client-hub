/**
 * Supabase row types and mappers
 *
 * Maps snake_case Supabase rows to camelCase TypeScript types.
 * Extracted from supabase-data.ts to keep files under 300 lines.
 */

import type { Hub, Video, Proposal, Document } from "@/types";

// ─── Explicit column lists (password_hash excluded) ──────────

export const HUB_COLUMNS = "id, org_id, company_name, contact_name, contact_email, client_domain, hub_type, status, welcome_headline, welcome_message, is_published, created_at, updated_at";

export const VIDEO_COLUMNS = "id, hub_id, title, description, source_type, source_url, thumbnail_url, duration, visibility, uploaded_at, uploaded_by_name, sort_order";

export const DOCUMENT_COLUMNS = "id, hub_id, name, description, file_name, file_size, mime_type, category, visibility, download_url, embed_url, is_proposal, uploaded_at, uploaded_by_name, sort_order";

// ─── Row types (snake_case from Supabase, no password_hash) ──

export interface HubRow {
  id: string;
  org_id: string | null;
  company_name: string;
  contact_name: string;
  contact_email: string;
  client_domain: string;
  hub_type: string;
  status: string;
  welcome_headline: string | null;
  welcome_message: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoRow {
  id: string;
  hub_id: string;
  title: string;
  description: string | null;
  source_type: string;
  source_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  visibility: string;
  uploaded_at: string;
  uploaded_by_name: string;
  sort_order: number;
}

export interface DocumentRow {
  id: string;
  hub_id: string;
  name: string;
  description: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  category: string;
  visibility: string;
  download_url: string | null;
  embed_url: string | null;
  is_proposal: boolean;
  uploaded_at: string;
  uploaded_by_name: string;
  sort_order: number;
}

// ─── Mappers ─────────────────────────────────────────────────

export function mapHub(row: HubRow): Hub {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    clientDomain: row.client_domain,
    hubType: row.hub_type as Hub["hubType"],
    status: row.status as Hub["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActivity: row.updated_at,
    clientsInvited: 0,
    lastVisit: null,
  };
}

export function mapVideo(row: VideoRow): Video {
  return {
    id: row.id,
    hubId: row.hub_id,
    title: row.title,
    description: row.description,
    sourceType: row.source_type as Video["sourceType"],
    sourceUrl: row.source_url,
    thumbnailUrl: row.thumbnail_url,
    duration: row.duration,
    visibility: row.visibility as Video["visibility"],
    uploadedAt: row.uploaded_at,
    uploadedBy: "system",
    uploadedByName: row.uploaded_by_name,
    views: 0,
    avgWatchTime: null,
  };
}

export function mapDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    hubId: row.hub_id,
    name: row.name,
    description: row.description,
    fileName: row.file_name,
    fileSize: row.file_size || 0,
    mimeType: row.mime_type || "application/octet-stream",
    category: row.category as Document["category"],
    visibility: row.visibility as Document["visibility"],
    uploadedAt: row.uploaded_at,
    uploadedBy: "system",
    uploadedByName: row.uploaded_by_name,
    downloadUrl: row.download_url,
    embedUrl: row.embed_url,
    views: 0,
    downloads: 0,
    versions: [],
  };
}

export function mapDocumentToProposal(row: DocumentRow): Proposal {
  return {
    id: row.id,
    hubId: row.hub_id,
    fileName: row.file_name,
    fileSize: row.file_size || 0,
    mimeType: row.mime_type || "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    uploadedAt: row.uploaded_at,
    uploadedBy: "system",
    totalSlides: 0,
    embedUrl: row.embed_url || "",
    downloadUrl: row.download_url || "",
    thumbnailUrl: null,
    settings: { isClientVisible: true, isDownloadEnabled: true },
    versions: [],
  };
}
