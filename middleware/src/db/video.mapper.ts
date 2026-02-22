/**
 * Video Prisma → DTO mapper
 *
 * Accepts Prisma HubVideo (camelCase, Date objects).
 * Returns VideoDTO matching the existing API contract.
 */

import type { HubVideo } from '@prisma/client';

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

export function mapVideo(video: HubVideo): VideoDTO {
  return {
    id: video.id,
    hubId: video.hubId,
    ...(video.projectId ? { projectId: video.projectId } : {}),
    title: video.title,
    description: video.description ?? null,
    sourceType: video.sourceType,
    sourceUrl: video.sourceUrl,
    thumbnailUrl: video.thumbnailUrl ?? null,
    duration: video.duration ?? null,
    visibility: video.visibility,
    uploadedAt: video.uploadedAt.toISOString(),
    uploadedBy: video.uploadedBy,
    uploadedByName: video.uploadedByName,
    views: video.views,
    avgWatchTime: video.avgWatchTime ?? null,
  };
}
