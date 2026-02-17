/**
 * Video service
 *
 * Operations for video upload, linking, and engagement tracking.
 */

import type {
  Video,
  AddVideoLinkRequest,
  UpdateVideoRequest,
  VideoEngagement,
  PaginatedList,
  PaginationParams,
  BulkVideoActionRequest,
  VideoFilterParams,
} from "@/types";
import { api, isMockApiEnabled, isFeatureLive, simulateDelay } from "./api";
import { mockVideos } from "./mock-data";
import { fetchVideos as supabaseFetchVideos, fetchPortalVideos as supabaseFetchPortalVideos } from "./supabase-data";

/**
 * Get videos for a hub
 */
export async function getVideos(
  hubId: string,
  params?: PaginationParams & VideoFilterParams
): Promise<PaginatedList<Video>> {
  if (isFeatureLive("videos")) {
    return supabaseFetchVideos(hubId);
  }

  if (isMockApiEnabled()) {
    await simulateDelay(300);

    let filtered = mockVideos.filter((v) => v.hubId === hubId);

    // Apply projectId filter
    if (params?.projectId) {
      if (params.projectId === "unassigned") {
        filtered = filtered.filter((v) => !v.projectId);
      } else {
        filtered = filtered.filter((v) => v.projectId === params.projectId);
      }
    }

    // Apply visibility filter
    if (params?.visibility) {
      filtered = filtered.filter((v) => v.visibility === params.visibility);
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;

    return {
      items: filtered,
      pagination: {
        page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    };
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
  if (params?.projectId) queryParams.projectId = params.projectId;
  if (params?.visibility) queryParams.visibility = params.visibility;

  return api.get<PaginatedList<Video>>(`/hubs/${hubId}/videos`, queryParams);
}

/**
 * Get single video by ID
 */
export async function getVideo(hubId: string, videoId: string): Promise<Video> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    const video = mockVideos.find((v) => v.id === videoId);
    if (!video) throw new Error("Video not found");
    return video;
  }

  return api.get<Video>(`/hubs/${hubId}/videos/${videoId}`);
}

/**
 * Upload a new video
 */
export async function uploadVideo(
  hubId: string,
  file: File,
  title: string,
  description?: string,
  visibility: "client" | "internal" = "client"
): Promise<Video> {
  if (isMockApiEnabled()) {
    await simulateDelay(2000); // Simulate upload time

    const newVideo: Video = {
      id: `video-${Date.now()}`,
      hubId,
      title,
      description: description || null,
      sourceType: "upload",
      sourceUrl: URL.createObjectURL(file),
      thumbnailUrl: null,
      duration: null,
      visibility,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "user-staff-1",
      uploadedByName: "Hamish Nicklin",
      views: 0,
      avgWatchTime: null,
    };

    mockVideos.push(newVideo);
    return newVideo;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  if (description) formData.append("description", description);
  formData.append("visibility", visibility);

  return api.upload<Video>(`/hubs/${hubId}/videos`, formData);
}

/**
 * Add a video link (YouTube, Vimeo, etc.)
 */
export async function addVideoLink(
  hubId: string,
  data: AddVideoLinkRequest
): Promise<Video> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);

    const newVideo: Video = {
      id: `video-${Date.now()}`,
      hubId,
      title: data.title,
      description: data.description || null,
      sourceType: "link",
      sourceUrl: data.url,
      thumbnailUrl: null,
      duration: null,
      visibility: data.visibility,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "user-staff-1",
      uploadedByName: "Hamish Nicklin",
      views: 0,
      avgWatchTime: null,
    };

    mockVideos.push(newVideo);
    return newVideo;
  }

  return api.post<Video>(`/hubs/${hubId}/videos/link`, data);
}

/**
 * Update video metadata
 */
export async function updateVideo(
  hubId: string,
  videoId: string,
  data: UpdateVideoRequest
): Promise<Video> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);

    const index = mockVideos.findIndex((v) => v.id === videoId);
    if (index === -1) throw new Error("Video not found");

    mockVideos[index] = { ...mockVideos[index], ...data };
    return mockVideos[index];
  }

  return api.patch<Video>(`/hubs/${hubId}/videos/${videoId}`, data);
}

/**
 * Delete video
 */
export async function deleteVideo(hubId: string, videoId: string): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const index = mockVideos.findIndex((v) => v.id === videoId);
    if (index !== -1) mockVideos.splice(index, 1);
    return;
  }

  return api.delete(`/hubs/${hubId}/videos/${videoId}`);
}

/**
 * Get video engagement analytics
 */
export async function getVideoEngagement(
  hubId: string,
  videoId: string
): Promise<VideoEngagement> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    return {
      videoId,
      totalViews: 8,
      uniqueViewers: 3,
      avgWatchTime: 165,
      completionRate: 85,
      viewHistory: [],
    };
  }

  return api.get<VideoEngagement>(`/hubs/${hubId}/videos/${videoId}/engagement`);
}

/**
 * Bulk actions on videos
 */
export async function bulkVideoAction(
  hubId: string,
  data: BulkVideoActionRequest
): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);

    if (data.action === "delete") {
      data.videoIds.forEach((id) => {
        const index = mockVideos.findIndex((v) => v.id === id);
        if (index !== -1) mockVideos.splice(index, 1);
      });
    } else if (data.action === "set_visibility" && data.visibility) {
      data.videoIds.forEach((id) => {
        const video = mockVideos.find((v) => v.id === id);
        if (video) video.visibility = data.visibility!;
      });
    }
    return;
  }

  return api.post(`/hubs/${hubId}/videos/bulk`, data);
}

/**
 * Get client-visible videos (portal view)
 */
export async function getPortalVideos(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<Video>> {
  if (isFeatureLive("videos")) {
    return supabaseFetchPortalVideos(hubId);
  }

  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const filtered = mockVideos.filter((v) => v.hubId === hubId && v.visibility === "client");

    return {
      items: filtered,
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: filtered.length,
        totalPages: 1,
      },
    };
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  return api.get<PaginatedList<Video>>(`/hubs/${hubId}/portal/videos`, queryParams);
}
