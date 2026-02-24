/**
 * Status Update hooks
 *
 * React Query hooks for fortnightly status updates.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  StatusUpdate,
  CreateStatusUpdateRequest,
  PaginatedList,
  PaginationParams,
} from "@/types";
import {
  getStatusUpdates,
  getPortalStatusUpdates,
  createStatusUpdate,
} from "@/services";
import { serializeParams } from "@/lib/query-keys";

export const statusUpdateKeys = {
  all: ["status-updates"] as const,
  lists: () => [...statusUpdateKeys.all, "list"] as const,
  list: (hubId: string, params?: PaginationParams) =>
    [...statusUpdateKeys.lists(), hubId, serializeParams(params)] as const,
  portal: (hubId: string, params?: PaginationParams) =>
    [...statusUpdateKeys.all, "portal", hubId, serializeParams(params)] as const,
};

/**
 * Hook to get status updates (staff)
 */
export function useStatusUpdates(hubId: string, params?: PaginationParams) {
  return useQuery<PaginatedList<StatusUpdate>>({
    queryKey: statusUpdateKeys.list(hubId, params),
    queryFn: () => getStatusUpdates(hubId, params),
    enabled: !!hubId,
  });
}

/**
 * Hook to get status updates (portal)
 */
export function usePortalStatusUpdates(hubId: string, params?: PaginationParams) {
  return useQuery<PaginatedList<StatusUpdate>>({
    queryKey: statusUpdateKeys.portal(hubId, params),
    queryFn: () => getPortalStatusUpdates(hubId, params),
    enabled: !!hubId,
  });
}

/**
 * Hook to create a status update (staff only)
 */
export function useCreateStatusUpdate(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<StatusUpdate, Error, CreateStatusUpdateRequest>({
    mutationFn: (data) => createStatusUpdate(hubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusUpdateKeys.all });
    },
  });
}
