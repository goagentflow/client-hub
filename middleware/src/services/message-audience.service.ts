/**
 * Message audience helpers.
 *
 * Builds a normalized view of who can currently read hub messages.
 */

import type { TenantRepository } from '../db/tenant-repository.js';
import { Errors } from '../middleware/error-handler.js';

type HubAccessMethod = 'email' | 'password' | 'open';

export interface MessageAudienceContact {
  email: string;
  name: string | null;
  source: 'portal_contact' | 'hub_contact';
}

export interface MessageAudience {
  hubId: string;
  companyName: string;
  accessMethod: HubAccessMethod;
  staffAudience: {
    scope: 'staff_role_global';
    label: string;
    note: string;
  };
  clientAudience: {
    knownReaders: MessageAudienceContact[];
    totalKnownReaders: number;
    isExact: boolean;
    note: string;
  };
}

function normaliseAccessMethod(value: unknown): HubAccessMethod {
  if (value === 'email' || value === 'password' || value === 'open') {
    return value;
  }
  return 'password';
}

function normaliseEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function clientAudienceNote(method: HubAccessMethod): string {
  if (method === 'email') {
    return 'Only approved client contacts listed here can access and read this message feed.';
  }
  if (method === 'password') {
    return 'Access is password-based. Listed contacts are known client contacts, but anyone with the password can read messages.';
  }
  return 'Access is open link-based. Listed contacts are known client contacts, but anyone with the link can read messages.';
}

export async function getMessageAudience(repo: TenantRepository, hubId: string): Promise<MessageAudience> {
  const hub = await repo.hub.findFirst({
    where: { id: hubId },
    select: {
      id: true,
      companyName: true,
      contactEmail: true,
      accessMethod: true,
    },
  }) as {
    id: string;
    companyName: string;
    contactEmail: string | null;
    accessMethod: string | null;
  } | null;

  if (!hub) {
    throw Errors.notFound('Hub', hubId);
  }

  const contacts = await repo.portalContact.findMany({
    where: { hubId },
    select: { email: true, name: true },
    orderBy: { email: 'asc' },
  }) as Array<{ email: string; name: string | null }>;

  const deduped = new Map<string, MessageAudienceContact>();
  for (const contact of contacts) {
    const email = normaliseEmail(contact.email);
    if (!email || deduped.has(email)) continue;
    deduped.set(email, {
      email,
      name: contact.name?.trim() || null,
      source: 'portal_contact',
    });
  }

  const hubContactEmail = normaliseEmail(hub.contactEmail);
  if (hubContactEmail && !deduped.has(hubContactEmail)) {
    deduped.set(hubContactEmail, {
      email: hubContactEmail,
      name: null,
      source: 'hub_contact',
    });
  }

  const knownReaders = Array.from(deduped.values()).sort((a, b) => a.email.localeCompare(b.email));
  const accessMethod = normaliseAccessMethod(hub.accessMethod);

  return {
    hubId: hub.id,
    companyName: hub.companyName,
    accessMethod,
    staffAudience: {
      scope: 'staff_role_global',
      label: 'Agent Flow staff',
      note: 'All Agent Flow staff can read this message feed.',
    },
    clientAudience: {
      knownReaders,
      totalKnownReaders: knownReaders.length,
      isExact: accessMethod === 'email',
      note: clientAudienceNote(accessMethod),
    },
  };
}
