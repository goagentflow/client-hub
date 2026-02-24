/**
 * Status Update service
 *
 * Staff + portal API functions for fortnightly status updates.
 */

import type {
  StatusUpdate,
  CreateStatusUpdateRequest,
  PaginatedList,
  PaginationParams,
} from "@/types";
import { api, isMockApiEnabled, simulateDelay } from "./api";

// Mock data for development
const mockStatusUpdates: StatusUpdate[] = [
  {
    id: "su-1",
    hubId: "hub-1",
    period: "Week 3 (w/c 17 Feb)",
    completed: "Brand guidelines finalised\nWebsite wireframes approved",
    inProgress: "Homepage development\nContent strategy draft",
    nextPeriod: "Complete homepage build\nStart internal pages",
    neededFromClient: "Final logo files in SVG format",
    onTrack: "on_track",
    createdBy: "Hamish Nicklin",
    createdSource: "staff_ui",
    createdAt: "2025-02-17T10:00:00Z",
  },
  {
    id: "su-2",
    hubId: "hub-1",
    period: "Week 1 (w/c 3 Feb)",
    completed: "Project kickoff\nDiscovery workshop completed",
    inProgress: "Brand guidelines development\nWireframe concepts",
    nextPeriod: "Present wireframes\nFinalise brand direction",
    neededFromClient: "Access to existing brand assets",
    onTrack: "on_track",
    createdBy: "Hamish Nicklin",
    createdSource: "staff_ui",
    createdAt: "2025-02-03T10:00:00Z",
  },
];

/**
 * Get status updates for a hub (staff path)
 */
export async function getStatusUpdates(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<StatusUpdate>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const filtered = mockStatusUpdates.filter((s) => s.hubId === hubId);
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

  return api.get<PaginatedList<StatusUpdate>>(`/hubs/${hubId}/status-updates`, queryParams);
}

/**
 * Get status updates for a hub (portal path)
 */
export async function getPortalStatusUpdates(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<StatusUpdate>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const filtered = mockStatusUpdates.filter((s) => s.hubId === hubId);
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

  return api.get<PaginatedList<StatusUpdate>>(`/hubs/${hubId}/portal/status-updates`, queryParams);
}

/**
 * Create a status update (staff only)
 */
export async function createStatusUpdate(
  hubId: string,
  data: CreateStatusUpdateRequest
): Promise<StatusUpdate> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);
    const newUpdate: StatusUpdate = {
      id: `su-${Date.now()}`,
      hubId,
      period: data.period,
      completed: data.completed,
      inProgress: data.inProgress,
      nextPeriod: data.nextPeriod,
      neededFromClient: data.neededFromClient || null,
      onTrack: data.onTrack,
      createdBy: "Hamish Nicklin",
      createdSource: "staff_ui",
      createdAt: new Date().toISOString(),
    };
    mockStatusUpdates.unshift(newUpdate);
    return newUpdate;
  }

  return api.post<StatusUpdate>(`/hubs/${hubId}/status-updates`, data);
}
