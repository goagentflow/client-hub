/**
 * Video row → DTO mapper
 */

export interface VideoRow {
  id: string;
  hub_id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  source_type: string;
  source_url: string;
  thumbnail_url?: string | null;
  duration?: number | null;
  visibility: string;
  uploaded_at: string;
  uploaded_by: string;
  uploaded_by_name: string;
  views: number;
  avg_watch_time?: number | null;
}

export interface VideoDTO {
  id: string;
  hubId: string;
  projectId?: string;
  title: string;
  description: string | null;
  sourceType: string;
  sourceUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  visibility: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
  views: number;
  avgWatchTime: number | null;
}

export function mapVideoRow(row: VideoRow): VideoDTO {
  return {
    id: row.id,
    hubId: row.hub_id,
    ...(row.project_id ? { projectId: row.project_id } : {}),
    title: row.title,
    description: row.description ?? null,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    thumbnailUrl: row.thumbnail_url ?? null,
    duration: row.duration ?? null,
    visibility: row.visibility,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploaded_by_name,
    views: row.views,
    avgWatchTime: row.avg_watch_time ?? null,
  };
}
