/**
 * Hub hooks
 *
 * React Query hooks for hub operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  getHubs,
  getHub,
  createHub,
  updateHub,
  getHubOverview,
  updateHubNotes,
  getHubActivity,
  getPortalConfig,
  updatePortalConfig,
  publishPortal,
  unpublishPortal,
  deleteHub,
  convertToClientHub,
  type ConvertHubRequest,
  type ConvertHubResponse,
} from "@/services";
import { serializeParams } from "@/lib/query-keys";

// Query keys - use serialized params for stable cache keys
export const hubKeys = {
  all: ["hubs"] as const,
  lists: () => [...hubKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...hubKeys.lists(), serializeParams(params)] as const,
  details: () => [...hubKeys.all, "detail"] as const,
  detail: (id: string) => [...hubKeys.details(), id] as const,
  overview: (id: string) => [...hubKeys.detail(id), "overview"] as const,
  activity: (id: string, params?: PaginationParams) => [...hubKeys.detail(id), "activity", serializeParams(params)] as const,
  portalConfig: (id: string) => [...hubKeys.detail(id), "portal-config"] as const,
};

/**
 * Hook to get paginated hub list
 */
export function useHubs(params?: PaginationParams) {
  return useQuery<PaginatedList<Hub>>({
    queryKey: hubKeys.list(params),
    queryFn: () => getHubs(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get single hub
 */
export function useHub(hubId: string) {
  return useQuery<Hub>({
    queryKey: hubKeys.detail(hubId),
    queryFn: () => getHub(hubId),
    enabled: !!hubId,
  });
}

/**
 * Hook to get hub overview (dashboard data)
 */
export function useHubOverview(hubId: string) {
  return useQuery<HubOverview>({
    queryKey: hubKeys.overview(hubId),
    queryFn: () => getHubOverview(hubId),
    enabled: !!hubId,
  });
}

/**
 * Hook to get hub activity feed
 */
export function useHubActivity(hubId: string, params?: PaginationParams) {
  return useQuery<PaginatedList<ActivityFeedItem>>({
    queryKey: hubKeys.activity(hubId, params),
    queryFn: () => getHubActivity(hubId, params),
    enabled: !!hubId,
  });
}

/**
 * Hook to get portal configuration
 */
export function usePortalConfig(hubId: string) {
  return useQuery<PortalConfig>({
    queryKey: hubKeys.portalConfig(hubId),
    queryFn: () => getPortalConfig(hubId),
    enabled: !!hubId,
  });
}

/**
 * Hook to create a new hub
 */
export function useCreateHub() {
  const queryClient = useQueryClient();

  return useMutation<Hub, Error, CreateHubRequest>({
    mutationFn: createHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubKeys.lists() });
    },
  });
}

/**
 * Hook to update hub
 */
export function useUpdateHub(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<Hub, Error, UpdateHubRequest>({
    mutationFn: (data) => updateHub(hubId, data),
    onSuccess: (hub) => {
      queryClient.setQueryData(hubKeys.detail(hubId), hub);
      queryClient.invalidateQueries({ queryKey: hubKeys.lists() });
    },
  });
}

/**
 * Hook to update hub internal notes
 */
export function useUpdateHubNotes(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (notes) => updateHubNotes(hubId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hubKeys.overview(hubId) });
    },
  });
}

/**
 * Hook to update portal configuration
 */
export function useUpdatePortalConfig(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<PortalConfig, Error, UpdatePortalConfigRequest>({
    mutationFn: (data) => updatePortalConfig(hubId, data),
    onSuccess: (config) => {
      queryClient.setQueryData(hubKeys.portalConfig(hubId), config);
    },
  });
}

/**
 * Hook to publish portal
 */
export function usePublishPortal(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<PortalConfig, Error>({
    mutationFn: () => publishPortal(hubId),
    onSuccess: (config) => {
      queryClient.setQueryData(hubKeys.portalConfig(hubId), config);
    },
  });
}

/**
 * Hook to unpublish portal
 */
export function useUnpublishPortal(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<PortalConfig, Error>({
    mutationFn: () => unpublishPortal(hubId),
    onSuccess: (config) => {
      queryClient.setQueryData(hubKeys.portalConfig(hubId), config);
    },
  });
}

/**
 * Hook to delete a hub
 */
export function useDeleteHub() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (hubId) => deleteHub(hubId),
    onSuccess: (_data, hubId) => {
      queryClient.removeQueries({ queryKey: hubKeys.detail(hubId) });
      queryClient.removeQueries({ queryKey: hubKeys.portalConfig(hubId) });
      queryClient.removeQueries({ queryKey: hubKeys.overview(hubId) });
      queryClient.invalidateQueries({ queryKey: hubKeys.lists() });
    },
  });
}

/**
 * Hook to convert pitch hub to client hub
 * Atomic, idempotent operation with optional first project creation
 */
export function useConvertToClientHub(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<ConvertHubResponse, Error, ConvertHubRequest | undefined>({
    mutationFn: (data) => convertToClientHub(hubId, data),
    onSuccess: ({ hub }) => {
      // Update hub detail cache
      queryClient.setQueryData(hubKeys.detail(hubId), hub);
      // Invalidate lists to reflect type change
      queryClient.invalidateQueries({ queryKey: hubKeys.lists() });
      // Invalidate overview for updated state
      queryClient.invalidateQueries({ queryKey: hubKeys.overview(hubId) });
    },
  });
}
