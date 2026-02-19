/**
 * Supabase data access layer
 *
 * Only covers hub, video, and document — everything else stays on mock data.
 *
 * SECURITY: All queries use explicit column selection — password_hash is
 * NEVER selected.
 */

import { supabase } from "@/lib/supabase";
import type { Hub, Video, Proposal, Document, CreateHubRequest, PaginatedList } from "@/types";
import {
  HUB_COLUMNS, VIDEO_COLUMNS, DOCUMENT_COLUMNS,
  mapHub, mapVideo, mapDocument, mapDocumentToProposal,
  type HubRow, type VideoRow, type DocumentRow,
} from "./supabase-mappers";

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

export async function fetchHubPortalConfig(hubId: string): Promise<{
  welcomeHeadline: string | null;
  welcomeMessage: string | null;
  isPublished: boolean;
}> {
  const { data, error } = await supabase
    .from("hub")
    .select("welcome_headline, welcome_message, is_published")
    .eq("id", hubId)
    .single();

  if (error) throw new Error(`Failed to fetch portal config: ${error.message}`);

  return {
    welcomeHeadline: data.welcome_headline,
    welcomeMessage: data.welcome_message,
    isPublished: data.is_published,
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
