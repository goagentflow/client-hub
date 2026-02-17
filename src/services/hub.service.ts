/**
 * Hub service
 *
 * Operations for hub list and hub management.
 * Note: Conversion operations are in hub-conversion.service.ts
 */

import type {
  Hub,
  CreateHubRequest,
  UpdateHubRequest,
  HubOverview,
  PortalConfig,
  UpdatePortalConfigRequest,
  PaginatedList,
  PaginationParams,
  ActivityFeedItem,
} from "@/types";
import { api, isMockApiEnabled, isFeatureLive, simulateDelay } from "./api";
import { mockHubs, mockHubOverview, mockPortalConfig, mockActivityFeed, mockActivityByHub } from "./mock-data";
import { fetchHubs as supabaseFetchHubs, fetchHub as supabaseFetchHub, createHubInSupabase } from "./supabase-data";
import { applyHubFilters } from "./hub-filters";

// Re-export conversion functions for backwards compatibility
export {
  convertToClientHub,
  rollbackConversion,
  type ConvertHubRequest,
  type ConvertHubResponse,
} from "./hub-conversion.service";

/**
 * Get paginated list of hubs
 */
export async function getHubs(params?: PaginationParams): Promise<PaginatedList<Hub>> {
  if (isFeatureLive("hubs")) {
    const result = await supabaseFetchHubs();
    return applyHubFilters(result.items, params);
  }

  if (isMockApiEnabled()) {
    await simulateDelay(300);
    return applyHubFilters(mockHubs, params);
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
  if (params?.sort) queryParams.sort = params.sort;
  if (params?.filter) queryParams.filter = params.filter;
  if (params?.search) queryParams.search = params.search;

  return api.get<PaginatedList<Hub>>("/hubs", queryParams);
}

/**
 * Get single hub by ID
 */
export async function getHub(hubId: string): Promise<Hub> {
  if (isFeatureLive("hubs")) {
    return supabaseFetchHub(hubId);
  }

  if (isMockApiEnabled()) {
    await simulateDelay(200);
    const hub = mockHubs.find((h) => h.id === hubId);
    if (!hub) throw new Error("Hub not found");
    return hub;
  }

  return api.get<Hub>(`/hubs/${hubId}`);
}

/**
 * Create a new hub
 */
export async function createHub(data: CreateHubRequest): Promise<Hub> {
  if (isFeatureLive("hubs")) {
    return createHubInSupabase(data);
  }

  if (isMockApiEnabled()) {
    await simulateDelay(500);

    const newHub: Hub = {
      id: `hub-${Date.now()}`,
      companyName: data.companyName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      status: "draft",
      hubType: "pitch", // New hubs start as pitch hubs
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      clientsInvited: 0,
      lastVisit: null,
      clientDomain: data.clientDomain || data.contactEmail.split("@")[1],
    };

    mockHubs.unshift(newHub);
    return newHub;
  }

  return api.post<Hub>("/hubs", data);
}

/**
 * Update hub details
 */
export async function updateHub(hubId: string, data: UpdateHubRequest): Promise<Hub> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);

    const index = mockHubs.findIndex((h) => h.id === hubId);
    if (index === -1) throw new Error("Hub not found");

    mockHubs[index] = { ...mockHubs[index], ...data, updatedAt: new Date().toISOString() };
    return mockHubs[index];
  }

  return api.patch<Hub>(`/hubs/${hubId}`, data);
}

/**
 * Get hub overview with alerts and stats
 * Note: Uses /overview endpoint to keep hub details and dashboard data distinct
 */
export async function getHubOverview(hubId: string): Promise<HubOverview> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    // Find the correct hub by ID
    const hub = mockHubs.find((h) => h.id === hubId);
    if (!hub) throw new Error("Hub not found");

    // Return overview with the correct hub
    return {
      ...mockHubOverview,
      hub,
    };
  }

  return api.get<HubOverview>(`/hubs/${hubId}/overview`);
}

/**
 * Update hub internal notes
 */
export async function updateHubNotes(hubId: string, notes: string): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    mockHubOverview.internalNotes = notes;
    return;
  }

  return api.patch(`/hubs/${hubId}/notes`, { notes });
}

/**
 * Get hub activity feed
 */
export async function getHubActivity(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<ActivityFeedItem>> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    // Use hub-specific activity or fall back to default
    const activity = mockActivityByHub[hubId] || mockActivityFeed;
    return {
      items: activity,
      pagination: { page: 1, pageSize: 20, totalItems: activity.length, totalPages: 1 },
    };
  }

  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = String(params.page);
  if (params?.pageSize) queryParams.pageSize = String(params.pageSize);

  return api.get<PaginatedList<ActivityFeedItem>>(`/hubs/${hubId}/activity`, queryParams);
}

/**
 * Get portal configuration
 */
export async function getPortalConfig(hubId: string): Promise<PortalConfig> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    return mockPortalConfig;
  }

  return api.get<PortalConfig>(`/hubs/${hubId}/portal-config`);
}

/**
 * Update portal configuration
 */
export async function updatePortalConfig(
  hubId: string,
  data: UpdatePortalConfigRequest
): Promise<PortalConfig> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    Object.assign(mockPortalConfig, data);
    return mockPortalConfig;
  }

  return api.patch<PortalConfig>(`/hubs/${hubId}/portal-config`, data);
}

/**
 * Publish portal (make live to clients)
 */
export async function publishPortal(hubId: string): Promise<PortalConfig> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);
    mockPortalConfig.isPublished = true;
    return mockPortalConfig;
  }

  return api.post<PortalConfig>(`/hubs/${hubId}/publish`);
}
