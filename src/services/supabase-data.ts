/**
 * Supabase data access layer
 *
 * Maps snake_case Supabase rows to camelCase TypeScript types.
 * Only covers hub, video, and document — everything else stays on mock data.
 *
 * SECURITY: All queries use explicit column selection — password_hash is
 * NEVER selected. Password verification uses the verify_hub_password RPC
 * so the hash never leaves the database.
 */

import { supabase } from "@/lib/supabase";
import type { Hub, Video, Proposal, Document, CreateHubRequest, PaginatedList } from "@/types";

// ─── Explicit column lists (password_hash excluded) ──────────

const HUB_COLUMNS = "id, org_id, company_name, contact_name, contact_email, client_domain, hub_type, status, welcome_headline, welcome_message, is_published, created_at, updated_at";

const VIDEO_COLUMNS = "id, hub_id, title, description, source_type, source_url, thumbnail_url, duration, visibility, uploaded_at, uploaded_by_name, sort_order";

const DOCUMENT_COLUMNS = "id, hub_id, name, description, file_name, file_size, mime_type, category, visibility, download_url, embed_url, is_proposal, uploaded_at, uploaded_by_name, sort_order";

// ─── Row types (snake_case from Supabase, no password_hash) ──

interface HubRow {
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

interface VideoRow {
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

interface DocumentRow {
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

// ─── RPC response type ───────────────────────────────────────

export interface PasswordVerifyResult {
  valid: boolean;
  reason?: string;
  contact_name?: string;
  contact_email?: string;
  client_domain?: string;
}

// ─── Mappers ─────────────────────────────────────────────────

function mapHub(row: HubRow): Hub {
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

function mapVideo(row: VideoRow): Video {
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

function mapDocument(row: DocumentRow): Document {
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

function mapDocumentToProposal(row: DocumentRow): Proposal {
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

// ─── Data access functions ───────────────────────────────────

export async function fetchHubs(): Promise<PaginatedList<Hub>> {
  const { data, error } = await supabase
    .from("hub")
    .select(HUB_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch hubs: ${error.message}`);

  const items = (data as HubRow[]).map(mapHub);
  return {
    items,
    pagination: {
      page: 1,
      pageSize: items.length,
      totalItems: items.length,
      totalPages: 1,
    },
  };
}

export async function fetchHub(hubId: string): Promise<Hub> {
  const { data, error } = await supabase
    .from("hub")
    .select(HUB_COLUMNS)
    .eq("id", hubId)
    .single();

  if (error) throw new Error(`Hub not found: ${error.message}`);
  return mapHub(data as HubRow);
}

/**
 * Verify a hub password server-side via Supabase RPC.
 * The password_hash never leaves the database.
 */
export async function verifyHubPassword(
  hubId: string,
  passwordHash: string
): Promise<PasswordVerifyResult> {
  const { data, error } = await supabase.rpc("verify_hub_password", {
    p_hub_id: hubId,
    p_password_hash: passwordHash,
  });

  if (error) throw new Error(`Password verification failed: ${error.message}`);
  return data as PasswordVerifyResult;
}

/**
 * Check whether a hub has a password set (without revealing the hash).
 * Returns true if the hub exists and has a password, false otherwise.
 */
export async function hubHasPassword(hubId: string): Promise<boolean> {
  // Use RPC with an empty hash — if the hub has no password, it returns valid: true.
  // If it has a password and the empty hash doesn't match, it returns valid: false.
  const result = await verifyHubPassword(hubId, "");
  // If valid with empty hash, there's no password. If invalid, there is one.
  return !result.valid && result.reason === "wrong_password";
}

export async function fetchVideos(hubId: string): Promise<PaginatedList<Video>> {
  const { data, error } = await supabase
    .from("hub_video")
    .select(VIDEO_COLUMNS)
    .eq("hub_id", hubId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch videos: ${error.message}`);

  const items = (data as VideoRow[]).map(mapVideo);
  return {
    items,
    pagination: { page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 },
  };
}

export async function fetchPortalVideos(hubId: string): Promise<PaginatedList<Video>> {
  const { data, error } = await supabase
    .from("hub_video")
    .select(VIDEO_COLUMNS)
    .eq("hub_id", hubId)
    .eq("visibility", "client")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch portal videos: ${error.message}`);

  const items = (data as VideoRow[]).map(mapVideo);
  return {
    items,
    pagination: { page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 },
  };
}

export async function fetchProposal(hubId: string): Promise<Proposal | null> {
  const { data, error } = await supabase
    .from("hub_document")
    .select(DOCUMENT_COLUMNS)
    .eq("hub_id", hubId)
    .eq("is_proposal", true)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch proposal: ${error.message}`);
  if (!data) return null;

  return mapDocumentToProposal(data as DocumentRow);
}

export async function fetchDocuments(hubId: string): Promise<PaginatedList<Document>> {
  const { data, error } = await supabase
    .from("hub_document")
    .select(DOCUMENT_COLUMNS)
    .eq("hub_id", hubId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch documents: ${error.message}`);

  const items = (data as DocumentRow[]).map(mapDocument);
  return {
    items,
    pagination: { page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 },
  };
}

export async function fetchPortalDocuments(hubId: string): Promise<PaginatedList<Document>> {
  const { data, error } = await supabase
    .from("hub_document")
    .select(DOCUMENT_COLUMNS)
    .eq("hub_id", hubId)
    .eq("visibility", "client")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch portal documents: ${error.message}`);

  const items = (data as DocumentRow[]).map(mapDocument);
  return {
    items,
    pagination: { page: 1, pageSize: items.length, totalItems: items.length, totalPages: 1 },
  };
}

export async function createHubInSupabase(
  data: CreateHubRequest & { passwordHash?: string; welcomeHeadline?: string; welcomeMessage?: string }
): Promise<Hub> {
  const { data: row, error } = await supabase
    .from("hub")
    .insert({
      company_name: data.companyName,
      contact_name: data.contactName,
      contact_email: data.contactEmail,
      client_domain: data.clientDomain || data.contactEmail.split("@")[1],
      password_hash: data.passwordHash || null,
      welcome_headline: data.welcomeHeadline || null,
      welcome_message: data.welcomeMessage || null,
      hub_type: "pitch",
      status: "draft",
      is_published: false,
    })
    .select(HUB_COLUMNS)
    .single();

  if (error) throw new Error(`Failed to create hub: ${error.message}`);
  return mapHub(row as HubRow);
}
