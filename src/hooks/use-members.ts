/**
 * Member hooks
 *
 * React Query hooks for member management operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  HubMember,
  HubInvite,
  CreateInviteRequest,
  UpdateMemberAccessRequest,
  ShareLink,
  CreateShareLinkRequest,
  AcceptInviteResponse,
  MemberActivity,
  PaginatedList,
  PaginationParams,
  AccessLevel,
} from "@/types";
import {
  getMembers,
  getInvites,
  createInvite,
  revokeInvite,
  updateMemberAccess,
  removeMember,
  createShareLink,
  acceptInvite,
  getMemberActivity,
  getPortalMembers,
  inviteColleague,
} from "@/services";

// Query keys
export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (hubId: string) => [...memberKeys.lists(), hubId] as const,
  invites: (hubId: string) => [...memberKeys.all, "invites", hubId] as const,
  activity: (hubId: string) => [...memberKeys.all, "activity", hubId] as const,
  portal: (hubId: string) => [...memberKeys.all, "portal", hubId] as const,
};

/**
 * Hook to get members of a hub
 */
export function useMembers(hubId: string, params?: PaginationParams) {
  return useQuery<PaginatedList<HubMember>>({
    queryKey: memberKeys.list(hubId),
    queryFn: () => getMembers(hubId, params),
    enabled: !!hubId,
    retry: false,
  });
}

/**
 * Hook to get pending invites
 */
export function useInvites(hubId: string) {
  return useQuery<HubInvite[]>({
    queryKey: memberKeys.invites(hubId),
    queryFn: () => getInvites(hubId),
    enabled: !!hubId,
  });
}

/**
 * Hook to get member activity
 */
export function useMemberActivity(hubId: string, params?: PaginationParams) {
  return useQuery<PaginatedList<MemberActivity>>({
    queryKey: memberKeys.activity(hubId),
    queryFn: () => getMemberActivity(hubId, params),
    enabled: !!hubId,
  });
}

/**
 * Hook to get portal members (client view)
 */
export function usePortalMembers(hubId: string) {
  return useQuery<PaginatedList<HubMember>>({
    queryKey: memberKeys.portal(hubId),
    queryFn: () => getPortalMembers(hubId),
    enabled: !!hubId,
  });
}

/**
 * Hook to create an invite
 */
export function useCreateInvite(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<HubInvite, Error, CreateInviteRequest>({
    mutationFn: (data) => createInvite(hubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.invites(hubId) });
    },
  });
}

/**
 * Hook to revoke an invite
 */
export function useRevokeInvite(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (inviteId) => revokeInvite(hubId, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.invites(hubId) });
    },
  });
}

/**
 * Hook to update member access
 */
export function useUpdateMemberAccess(hubId: string, memberId: string) {
  const queryClient = useQueryClient();

  return useMutation<HubMember, Error, UpdateMemberAccessRequest>({
    mutationFn: (data) => updateMemberAccess(hubId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(hubId) });
    },
  });
}

/**
 * Hook to remove member
 */
export function useRemoveMember(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (memberId) => removeMember(hubId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(hubId) });
    },
  });
}

/**
 * Hook to create share link
 */
export function useCreateShareLink(hubId: string) {
  return useMutation<ShareLink, Error, CreateShareLinkRequest>({
    mutationFn: (data) => createShareLink(hubId, data),
  });
}

/**
 * Hook to accept invite
 */
export function useAcceptInvite() {
  return useMutation<AcceptInviteResponse, Error, string>({
    mutationFn: acceptInvite,
  });
}

/**
 * Hook to invite colleague (client portal)
 */
export function useInviteColleague(hubId: string) {
  const queryClient = useQueryClient();

  return useMutation<HubInvite, Error, { email: string; accessLevel: AccessLevel }>({
    mutationFn: ({ email, accessLevel }) => inviteColleague(hubId, email, accessLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.portal(hubId) });
    },
  });
}
