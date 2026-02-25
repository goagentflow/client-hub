/**
 * Document + Proposal Prisma → DTO mappers
 *
 * Accepts Prisma HubDocument (camelCase, Date objects).
 * Returns DocumentDTO / ProposalDTO matching the existing API contract.
 */

import type { HubDocument } from '@prisma/client';

export interface DocumentDTO {
  id: string;
  hubId: string;
  projectId?: string;
  name: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  visibility: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
  downloadUrl: string;
  embedUrl: string | null;
  views: number;
  downloads: number;
  versions: never[];
}

export function mapDocument(doc: HubDocument): DocumentDTO {
  return {
    id: doc.id,
    hubId: doc.hubId,
    ...(doc.projectId ? { projectId: doc.projectId } : {}),
    name: doc.name,
    description: doc.description ?? null,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    category: doc.category,
    visibility: doc.visibility,
    uploadedAt: doc.uploadedAt.toISOString(),
    uploadedBy: doc.uploadedBy,
    uploadedByName: doc.uploadedByName,
    downloadUrl: `/api/v1/hubs/${doc.hubId}/documents/${doc.id}/download`,
    embedUrl: doc.embedUrl ?? null,
    views: doc.views,
    downloads: doc.downloads,
    versions: [],
  };
}

/** Portal-aware mapper — download URL points at the portal download endpoint. */
export function mapDocumentForPortal(doc: HubDocument): DocumentDTO {
  return {
    ...mapDocument(doc),
    downloadUrl: `/api/v1/hubs/${doc.hubId}/portal/documents/${doc.id}/download`,
  };
}

export interface ProposalDTO {
  id: string;
  hubId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  totalSlides: number;
  embedUrl: string;
  downloadUrl: string | null;
  thumbnailUrl: string | null;
  settings: {
    isClientVisible: boolean;
    isDownloadEnabled: boolean;
  };
  versions: never[];
}

/** Guard: rewrite supabase:// refs to middleware download endpoint, pass through http(s). */
function safeDownloadUrl(doc: HubDocument, options?: { portal?: boolean }): string {
  if (doc.downloadUrl.startsWith('supabase://')) {
    if (options?.portal) {
      return `/api/v1/hubs/${doc.hubId}/portal/documents/${doc.id}/download`;
    }
    return `/api/v1/hubs/${doc.hubId}/documents/${doc.id}/download`;
  }
  return doc.downloadUrl;
}

export function mapProposal(doc: HubDocument, options?: { portal?: boolean }): ProposalDTO {
  const dlUrl = safeDownloadUrl(doc, options);
  return {
    id: doc.id,
    hubId: doc.hubId,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    uploadedAt: doc.uploadedAt.toISOString(),
    uploadedBy: doc.uploadedBy,
    totalSlides: 0,
    embedUrl: doc.embedUrl || dlUrl,
    downloadUrl: doc.visibility === 'client' ? dlUrl : null,
    thumbnailUrl: null,
    settings: {
      isClientVisible: doc.visibility === 'client',
      isDownloadEnabled: doc.visibility === 'client',
    },
    versions: [],
  };
}
