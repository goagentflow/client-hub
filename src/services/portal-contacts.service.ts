/**
 * Portal contacts service
 *
 * Staff-only API calls for managing portal email contacts and access method.
 */

import { api, isMockApiEnabled, simulateDelay } from "./api";

export interface PortalContact {
  id: string;
  email: string;
  name: string | null;
  addedBy: string;
  createdAt: string;
}

export type AccessMethod = "password" | "email" | "open";

const MOCK_DEFAULT_CONTACTS: PortalContact[] = [
  {
    id: "contact-1",
    email: "sarah@whitmorelaw.co.uk",
    name: "Sarah Mitchell",
    addedBy: "hamish@goagentflow.com",
    createdAt: "2026-02-15T09:00:00Z",
  },
];

const mockContactsByHub = new Map<string, PortalContact[]>();
const mockAccessMethodByHub = new Map<string, AccessMethod>();

function getMockContacts(hubId: string): PortalContact[] {
  const existing = mockContactsByHub.get(hubId);
  if (existing) return existing;

  const seeded = hubId === "hub-1" ? [...MOCK_DEFAULT_CONTACTS] : [];
  mockContactsByHub.set(hubId, seeded);
  return seeded;
}

function getMockAccessMethod(hubId: string): AccessMethod {
  return mockAccessMethodByHub.get(hubId) ?? "email";
}

export async function getPortalContacts(hubId: string): Promise<PortalContact[]> {
  if (isMockApiEnabled()) {
    await simulateDelay(120);
    return [...getMockContacts(hubId)];
  }

  const result = await api.get<{ data: PortalContact[] }>(`/hubs/${hubId}/portal-contacts`);
  return result.data;
}

export async function addPortalContact(
  hubId: string,
  contact: { email: string; name?: string },
): Promise<PortalContact> {
  if (isMockApiEnabled()) {
    await simulateDelay(140);
    const contacts = getMockContacts(hubId);
    const created: PortalContact = {
      id: `contact-${Date.now()}`,
      email: contact.email.toLowerCase().trim(),
      name: contact.name?.trim() || null,
      addedBy: "hamish@goagentflow.com",
      createdAt: new Date().toISOString(),
    };
    contacts.push(created);
    mockContactsByHub.set(hubId, contacts);
    return created;
  }

  const result = await api.post<{ data: PortalContact }>(`/hubs/${hubId}/portal-contacts`, contact);
  return result.data;
}

export async function removePortalContact(hubId: string, contactId: string): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(120);
    const contacts = getMockContacts(hubId).filter((contact) => contact.id !== contactId);
    mockContactsByHub.set(hubId, contacts);
    return;
  }

  await api.delete(`/hubs/${hubId}/portal-contacts/${contactId}`);
}

export async function getAccessMethod(hubId: string): Promise<AccessMethod> {
  if (isMockApiEnabled()) {
    await simulateDelay(90);
    return getMockAccessMethod(hubId);
  }

  const result = await api.get<{ data: { method: AccessMethod } }>(`/hubs/${hubId}/access-method`);
  return result.data.method;
}

export async function updateAccessMethod(hubId: string, method: AccessMethod): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(120);
    mockAccessMethodByHub.set(hubId, method);
    return;
  }

  await api.patch(`/hubs/${hubId}/access-method`, { method });
}
