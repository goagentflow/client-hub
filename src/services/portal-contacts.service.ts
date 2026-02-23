/**
 * Portal contacts service
 *
 * Staff-only API calls for managing portal email contacts and access method.
 */

import { api } from "./api";

export interface PortalContact {
  id: string;
  email: string;
  name: string | null;
  addedBy: string;
  createdAt: string;
}

export type AccessMethod = "password" | "email" | "open";

export async function getPortalContacts(hubId: string): Promise<PortalContact[]> {
  const result = await api.get<{ data: PortalContact[] }>(`/hubs/${hubId}/portal-contacts`);
  return result.data;
}

export async function addPortalContact(
  hubId: string,
  contact: { email: string; name?: string },
): Promise<PortalContact> {
  const result = await api.post<{ data: PortalContact }>(`/hubs/${hubId}/portal-contacts`, contact);
  return result.data;
}

export async function removePortalContact(hubId: string, contactId: string): Promise<void> {
  await api.delete(`/hubs/${hubId}/portal-contacts/${contactId}`);
}

export async function getAccessMethod(hubId: string): Promise<AccessMethod> {
  const result = await api.get<{ data: { method: AccessMethod } }>(`/hubs/${hubId}/access-method`);
  return result.data.method;
}

export async function updateAccessMethod(hubId: string, method: AccessMethod): Promise<void> {
  await api.patch(`/hubs/${hubId}/access-method`, { method });
}
