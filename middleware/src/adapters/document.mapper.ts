/**
 * Document + Proposal row → DTO mappers
 */

export interface DocumentRow {
  id: string;
  hub_id: string;
  project_id?: string | null;
  name: string;
  description?: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  category: string;
  visibility: string;
  uploaded_at: string;
  uploaded_by: string;
  uploaded_by_name: string;
  download_url: string;
  embed_url?: string | null;
  views: number;
  downloads: number;
  is_proposal?: boolean;
}

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

export function mapDocumentRow(row: DocumentRow): DocumentDTO {
  return {
    id: row.id,
    hubId: row.hub_id,
    ...(row.project_id ? { projectId: row.project_id } : {}),
    name: row.name,
    description: row.description ?? null,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    category: row.category,
    visibility: row.visibility,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploaded_by_name,
    downloadUrl: row.download_url,
    embedUrl: row.embed_url ?? null,
    views: row.views,
    downloads: row.downloads,
    versions: [],
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

export function mapProposalRow(row: DocumentRow): ProposalDTO {
  return {
    id: row.id,
    hubId: row.hub_id,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
    totalSlides: 0,
    embedUrl: row.embed_url || row.download_url,
    downloadUrl: row.visibility === 'client' ? row.download_url : null,
    thumbnailUrl: null,
    settings: {
      isClientVisible: row.visibility === 'client',
      isDownloadEnabled: row.visibility === 'client',
    },
    versions: [],
  };
}
