/**
 * Portal contacts hooks
 *
 * React Query hooks for staff portal contact management and access method.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPortalContacts,
  addPortalContact,
  removePortalContact,
  getAccessMethod,
  updateAccessMethod,
} from "@/services/portal-contacts.service";
import type { AccessMethod } from "@/services/portal-contacts.service";

export const portalContactKeys = {
  all: ["portal-contacts"] as const,
  list: (hubId: string) => [...portalContactKeys.all, hubId] as const,
  accessMethod: (hubId: string) => [...portalContactKeys.all, hubId, "access-method"] as const,
};

export function usePortalContacts(hubId: string) {
  return useQuery({
    queryKey: portalContactKeys.list(hubId),
    queryFn: () => getPortalContacts(hubId),
    enabled: !!hubId,
  });
}

export function useAccessMethod(hubId: string) {
  return useQuery({
    queryKey: portalContactKeys.accessMethod(hubId),
    queryFn: () => getAccessMethod(hubId),
    enabled: !!hubId,
  });
}

export function useAddPortalContact(hubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contact: { email: string; name?: string }) => addPortalContact(hubId, contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalContactKeys.list(hubId) });
    },
  });
}

export function useRemovePortalContact(hubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => removePortalContact(hubId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalContactKeys.list(hubId) });
    },
  });
}

export function useUpdateAccessMethod(hubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (method: AccessMethod) => updateAccessMethod(hubId, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalContactKeys.accessMethod(hubId) });
    },
  });
}
