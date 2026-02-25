/**
 * Message hooks
 *
 * React Query hooks for email thread operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  MessageThreadSummary,
  MessageThreadDetail,
  Message,
  SendMessageRequest,
  FeedMessage,
  SendFeedMessageRequest,
  MessageAudience,
  RequestMessageAccessRequest,
  RequestMessageAccessResponse,
  PaginatedList,
  PaginationParams,
  MessageFilterParams,
} from "@/types";
import {
  getMessageThreads,
  getMessageThread,
  sendMessage,
  updateTeamNotes,
  archiveThread,
  getPortalMessages,
  sendPortalMessage,
  getFeedMessages,
  sendFeedMessage,
  getPortalFeedMessages,
  sendPortalFeedMessage,
  getMessageAudience,
  requestPortalMessageAccess,
} from "@/services";
import { serializeParams } from "@/lib/query-keys";

// Query keys - use serialized params for stable cache keys
export const messageKeys = {
  all: ["messages"] as const,
  lists: () => [...messageKeys.all, "list"] as const,
  list: (hubId: string, params?: PaginationParams & MessageFilterParams) =>
    [...messageKeys.lists(), hubId, serializeParams(params)] as const,
  feedList: (hubId: string, params?: PaginationParams) =>
    [...messageKeys.all, "feed", hubId, serializeParams(params)] as const,
  detail: (hubId: string, threadId: string) => [...messageKeys.all, hubId, threadId] as const,
  portal: (hubId: string, params?: PaginationParams) => [...messageKeys.all, "portal", hubId, serializeParams(params)] as const,
  portalFeed: (hubId: string, params?: PaginationParams) => [...messageKeys.all, "portal-feed", hubId, serializeParams(params)] as const,
  audience: (hubId: string, portal?: boolean) => [...messageKeys.all, "audience", hubId, portal ? "portal" : "staff"] as const,
};

/**
 * Hook to get message threads for a hub
 */
export function useMessageThreads(hubId: string, params?: PaginationParams & MessageFilterParams) {
  return useQuery<PaginatedList<MessageThreadSummary>>({
    queryKey: messageKeys.list(hubId, params),
    queryFn: () => getMessageThreads(hubId, params),
    enabled: !!hubId,
  });
}

/**
 * Hook to get thread detail with messages
 */
export function useMessageThread(hubId: string, threadId: string) {
  return useQuery<MessageThreadDetail>({
    queryKey: messageKeys.detail(hubId, threadId),
    queryFn: () => getMessageThread(hubId, threadId),
    enabled: !!hubId && !!threadId,
  });
}

/**
 * Hook to get portal messages (client view)
 */
export function usePortalMessages(hubId: string, params?: PaginationParams) {
  return useQuery<PaginatedList<MessageThreadSummary>>({
    queryKey: messageKeys.portal(hubId, params),
    queryFn: () => getPortalMessages(hubId, params),
    enabled: !!hubId,
  });
}

/**
 * Hook to send a message
 */
export function useSendMessage(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<Message, Error, SendMessageRequest>({
    mutationFn: (data) => sendMessage(hubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    },
  });
}

/**
 * Hook to send portal message (client action)
 */
export function useSendPortalMessage(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<Message, Error, SendMessageRequest>({
    mutationFn: (data) => sendPortalMessage(hubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.portal(hubId) });
    },
  });
}

/**
 * Hook to update team notes on a thread
 */
export function useUpdateTeamNotes(hubId: string, threadId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (notes) => updateTeamNotes(hubId, threadId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.detail(hubId, threadId) });
    },
  });
}

/**
 * Hook to archive/unarchive thread
 */
export function useArchiveThread(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { threadId: string; archive: boolean }>({
    mutationFn: ({ threadId, archive }) => archiveThread(hubId, threadId, archive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    },
  });
}

/**
 * Hook to get non-threaded feed messages for staff view
 */
export function useFeedMessages(hubId: string, params?: PaginationParams) {
  return useQuery<PaginatedList<FeedMessage>>({
    queryKey: messageKeys.feedList(hubId, params),
    queryFn: () => getFeedMessages(hubId, params),
    enabled: !!hubId,
  });
}

/**
 * Hook to send non-threaded staff feed message
 */
export function useSendFeedMessage(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<FeedMessage, Error, SendFeedMessageRequest>({
    mutationFn: (data) => sendFeedMessage(hubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.feedList(hubId) });
      queryClient.invalidateQueries({ queryKey: messageKeys.portalFeed(hubId) });
    },
  });
}

/**
 * Hook to get non-threaded portal feed messages
 */
export function usePortalFeedMessages(hubId: string, params?: PaginationParams) {
  return useQuery<PaginatedList<FeedMessage>>({
    queryKey: messageKeys.portalFeed(hubId, params),
    queryFn: () => getPortalFeedMessages(hubId, params),
    enabled: !!hubId,
  });
}

/**
 * Hook to send non-threaded portal feed message
 */
export function useSendPortalFeedMessage(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<FeedMessage, Error, SendFeedMessageRequest>({
    mutationFn: (data) => sendPortalFeedMessage(hubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.portalFeed(hubId) });
      queryClient.invalidateQueries({ queryKey: messageKeys.feedList(hubId) });
    },
  });
}

/**
 * Hook to get current message audience visibility
 */
export function useMessageAudience(hubId: string, opts?: { portal?: boolean }) {
  return useQuery<MessageAudience>({
    queryKey: messageKeys.audience(hubId, opts?.portal),
    queryFn: () => getMessageAudience(hubId, opts),
    enabled: !!hubId,
  });
}

/**
 * Hook for portal users to request teammate access
 */
export function useRequestPortalMessageAccess(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<RequestMessageAccessResponse, Error, RequestMessageAccessRequest>({
    mutationFn: (data) => requestPortalMessageAccess(hubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.audience(hubId, true) });
    },
  });
}
