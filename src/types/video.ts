/**
 * Video types - upload, link, and engagement tracking
 */

import type { EntityId, ISODateString } from "./common";

// Video source type
export type VideoSourceType = "upload" | "link";

// Video visibility (lowercase for consistency)
export type VideoVisibility = "client" | "internal";

// Video entity
export interface Video {
  id: EntityId;
  hubId: EntityId;
  projectId?: EntityId; // Phase 2: Optional project association
  title: string;
  description: string | null;
  sourceType: VideoSourceType;
  sourceUrl: string; // Presigned URL for uploads, external URL for links
  thumbnailUrl: string | null;
  duration: number | null; // seconds
  visibility: VideoVisibility;
  uploadedAt: ISODateString;
  uploadedBy: EntityId;
  uploadedByName: string;
  views: number;
  avgWatchTime: number | null; // seconds
}

// Upload video request
export interface UploadVideoRequest {
  file: File;
  title: string;
  description?: string;
  visibility: VideoVisibility;
}

// Add video link request
export interface AddVideoLinkRequest {
  url: string;
  title: string;
  description?: string;
  visibility: VideoVisibility;
}

// Update video metadata
export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  visibility?: VideoVisibility;
  projectId?: EntityId | null; // Phase 2: Assign to project (null to unassign)
}

// Video filter params (Phase 2)
export interface VideoFilterParams {
  visibility?: VideoVisibility;
  projectId?: EntityId | "unassigned"; // Filter by project ("unassigned" for null projectId)
}

// Video engagement analytics
export interface VideoEngagement {
  videoId: EntityId;
  totalViews: number;
  uniqueViewers: number;
  avgWatchTime: number; // seconds
  completionRate: number; // percentage who watched to end
  viewHistory: VideoView[];
}

// Individual video view record
export interface VideoView {
  viewerId: EntityId;
  viewerName: string;
  viewerEmail: string;
  watchedAt: ISODateString;
  watchTime: number; // seconds
  percentComplete: number;
}

// Bulk action request
export interface BulkVideoActionRequest {
  videoIds: EntityId[];
  action: "delete" | "set_visibility";
  visibility?: VideoVisibility;
}
