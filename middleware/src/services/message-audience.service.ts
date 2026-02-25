/**
 * Message audience helpers.
 *
 * Builds a normalized view of who can currently read hub messages.
 */

import { getPrisma } from '../db/prisma.js';
import type { TenantRepository } from '../db/tenant-repository.js';
import { Errors } from '../middleware/error-handler.js';
import { upsertStaffMember } from './membership.service.js';
import { logger } from '../utils/logger.js';

type HubAccessMethod = 'email' | 'password' | 'open';

export interface MessageAudienceContact {
  email: string;
  name: string | null;
  source: 'portal_contact' | 'hub_contact';
}

export interface MessageAudienceStaffReader {
  email: string;
  name: string | null;
}

export interface MessageAudience {
  hubId: string;
  companyName: string;
  accessMethod: HubAccessMethod;
  staffAudience: {
    scope: 'staff_role_global';
    label: string;
    note: string;
    knownReaders: MessageAudienceStaffReader[];
    totalKnownReaders: number;
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

function normaliseName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

const inviteStaffBackfillDone = new Set<string>();

async function backfillStaffMembersFromLegacyInvites(
  repo: TenantRepository,
  hubId: string,
): Promise<void> {
  const key = `${repo.tenantId}:${hubId}`;
  if (inviteStaffBackfillDone.has(key)) return;
  inviteStaffBackfillDone.add(key);

  try {
    const prisma = getPrisma() as {
      hubInvite?: { findMany?: CallableFunction };
      hubMember?: { findMany?: CallableFunction };
      hubEvent?: { findMany?: CallableFunction };
    };
    if (
      typeof prisma.hubInvite?.findMany !== 'function'
      || typeof prisma.hubMember?.findMany !== 'function'
    ) {
      return;
    }

    const [inviteActors, tenantStaffMembers, tenantEvents, existingHubStaff] = await Promise.all([
      prisma.hubInvite.findMany({
        where: {
          hubId,
          tenantId: repo.tenantId,
          invitedBy: { not: null },
        },
        select: { invitedBy: true, invitedByName: true, invitedAt: true },
        orderBy: { invitedAt: 'desc' },
        take: 250,
      }) as Promise<Array<{ invitedBy: string | null; invitedByName: string | null; invitedAt: Date }>>,
      prisma.hubMember.findMany({
        where: {
          tenantId: repo.tenantId,
          role: 'staff',
          status: 'active',
          userId: { not: null },
        },
        select: { userId: true, email: true, displayName: true, joinedAt: true },
        orderBy: { joinedAt: 'desc' },
        take: 1000,
      }) as Promise<Array<{ userId: string | null; email: string; displayName: string | null; joinedAt: Date }>>,
      typeof prisma.hubEvent?.findMany === 'function'
        ? prisma.hubEvent.findMany({
          where: {
            tenantId: repo.tenantId,
            userId: { not: null },
            userEmail: { not: null },
          },
          select: { userId: true, userEmail: true, userName: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        }) as Promise<Array<{ userId: string | null; userEmail: string | null; userName: string | null; createdAt: Date }>>
        : Promise.resolve([]),
      repo.hubMember.findMany({
        where: { hubId, role: 'staff', status: 'active' },
        select: { email: true },
        take: 500,
      }) as Promise<Array<{ email: string }>>,
    ]);

    const existingEmails = new Set(
      existingHubStaff.map((row) => normaliseEmail(row.email)).filter(Boolean),
    );

    const userIdToProfile = new Map<string, { email: string; displayName: string | null }>();

    for (const row of tenantStaffMembers) {
      const userId = (row.userId || '').trim();
      const email = normaliseEmail(row.email);
      if (!userId || !email || userIdToProfile.has(userId)) continue;
      userIdToProfile.set(userId, {
        email,
        displayName: normaliseName(row.displayName),
      });
    }

    for (const row of tenantEvents) {
      const userId = (row.userId || '').trim();
      const email = normaliseEmail(row.userEmail);
      if (!userId || !email || userIdToProfile.has(userId)) continue;
      userIdToProfile.set(userId, {
        email,
        displayName: normaliseName(row.userName),
      });
    }

    for (const actor of inviteActors) {
      const userId = (actor.invitedBy || '').trim();
      if (!userId) continue;

      const profile = userIdToProfile.get(userId);
      if (!profile) continue;

      const email = normaliseEmail(profile.email);
      if (!email || existingEmails.has(email)) continue;

      await upsertStaffMember({ hubMember: repo.hubMember } as Parameters<typeof upsertStaffMember>[0], {
        hubId,
        tenantId: repo.tenantId,
        userId,
        email,
        displayName: normaliseName(actor.invitedByName) || profile.displayName || null,
        source: 'staff_manual',
      });

      existingEmails.add(email);
    }
  } catch (err) {
    logger.warn(
      { err, hubId, tenantId: repo.tenantId },
      'Failed to backfill legacy invite staff members for message audience',
    );
  }
}

export async function getMessageAudience(repo: TenantRepository, hubId: string): Promise<MessageAudience> {
  const hub = await repo.hub.findFirst({
    where: { id: hubId },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      contactEmail: true,
      accessMethod: true,
    },
  }) as {
    id: string;
    companyName: string;
    contactName: string | null;
    contactEmail: string | null;
    accessMethod: string | null;
  } | null;

  if (!hub) {
    throw Errors.notFound('Hub', hubId);
  }

  await backfillStaffMembersFromLegacyInvites(repo, hubId);

  const [contacts, clientMembers, staffMembers, staffMessages, staffEvents] = await Promise.all([
    repo.portalContact.findMany({
      where: { hubId },
      select: { email: true, name: true },
      orderBy: { email: 'asc' },
    }) as Promise<Array<{ email: string; name: string | null }>>,
    repo.hubMember.findMany({
      where: { hubId, role: 'client', status: 'active' },
      select: { email: true, displayName: true },
      orderBy: { joinedAt: 'desc' },
      take: 200,
    }) as Promise<Array<{ email: string; displayName: string | null }>>,
    repo.hubMember.findMany({
      where: { hubId, role: 'staff', status: 'active' },
      select: { email: true, displayName: true },
      orderBy: { joinedAt: 'desc' },
      take: 200,
    }) as Promise<Array<{ email: string; displayName: string | null }>>,
    repo.hubMessage.findMany({
      where: { hubId, senderType: 'staff' },
      select: { senderEmail: true, senderName: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }) as Promise<Array<{ senderEmail: string; senderName: string | null }>>,
    repo.hubEvent.findMany({
      where: { hubId, userEmail: { not: null } },
      select: { userId: true, userEmail: true, userName: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }) as Promise<Array<{ userId: string | null; userEmail: string | null; userName: string | null }>>,
  ]);

  const clientNameByEmail = new Map<string, string>();
  for (const member of clientMembers) {
    const email = normaliseEmail(member.email);
    const name = normaliseName(member.displayName);
    if (email && name && !clientNameByEmail.has(email)) {
      clientNameByEmail.set(email, name);
    }
  }

  const deduped = new Map<string, MessageAudienceContact>();
  for (const contact of contacts) {
    const email = normaliseEmail(contact.email);
    if (!email || deduped.has(email)) continue;
    deduped.set(email, {
      email,
      name: normaliseName(contact.name) || clientNameByEmail.get(email) || null,
      source: 'portal_contact',
    });
  }

  const hubContactEmail = normaliseEmail(hub.contactEmail);
  if (hubContactEmail && !deduped.has(hubContactEmail)) {
    deduped.set(hubContactEmail, {
      email: hubContactEmail,
      name: normaliseName(hub.contactName) || clientNameByEmail.get(hubContactEmail) || null,
      source: 'hub_contact',
    });
  } else if (hubContactEmail && deduped.has(hubContactEmail)) {
    const existing = deduped.get(hubContactEmail)!;
    if (!existing.name) {
      existing.name = normaliseName(hub.contactName) || clientNameByEmail.get(hubContactEmail) || null;
    }
  }

  const knownReaders = Array.from(deduped.values()).sort((a, b) => a.email.localeCompare(b.email));
  const staffDeduped = new Map<string, MessageAudienceStaffReader>();

  const upsertStaffReader = (emailRaw: unknown, nameRaw: unknown): void => {
    const email = normaliseEmail(emailRaw);
    if (!email) return;
    const name = normaliseName(nameRaw);
    const existing = staffDeduped.get(email);
    if (!existing) {
      staffDeduped.set(email, { email, name });
      return;
    }
    if (!existing.name && name) {
      existing.name = name;
    }
  };

  for (const member of staffMembers) {
    upsertStaffReader(member.email, member.displayName);
  }
  for (const msg of staffMessages) {
    upsertStaffReader(msg.senderEmail, msg.senderName);
  }
  for (const event of staffEvents) {
    const userId = (event.userId || '').toLowerCase();
    if (userId.startsWith('portal-')) continue;
    upsertStaffReader(event.userEmail, event.userName);
  }

  const staffKnownReaders = Array.from(staffDeduped.values()).sort((a, b) => a.email.localeCompare(b.email));
  const accessMethod = normaliseAccessMethod(hub.accessMethod);

  return {
    hubId: hub.id,
    companyName: hub.companyName,
    accessMethod,
    staffAudience: {
      scope: 'staff_role_global',
      label: 'Agent Flow staff',
      note: 'All Agent Flow staff can read this message feed.',
      knownReaders: staffKnownReaders,
      totalKnownReaders: staffKnownReaders.length,
    },
    clientAudience: {
      knownReaders,
      totalKnownReaders: knownReaders.length,
      isExact: accessMethod === 'email',
      note: clientAudienceNote(accessMethod),
    },
  };
}
