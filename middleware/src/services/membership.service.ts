/**
 * Membership service helpers.
 *
 * Centralises:
 * - Member DTO mapping + permissions
 * - Safe email normalisation
 * - Upsert/touch/revoke helpers for hub_member records
 */

export const ACCESS_LEVELS = ['full_access', 'proposal_only', 'documents_only', 'view_only'] as const;
export type MemberAccessLevel = (typeof ACCESS_LEVELS)[number];

export interface HubMemberDTO {
  id: string;
  hubId: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: null;
  role: 'staff' | 'client';
  accessLevel: MemberAccessLevel;
  permissions: {
    canViewProposal: boolean;
    canViewDocuments: boolean;
    canViewVideos: boolean;
    canViewMessages: boolean;
    canViewMeetings: boolean;
    canViewQuestionnaire: boolean;
    canInviteMembers: boolean;
    canManageAccess: boolean;
  };
  invitedBy: string;
  invitedByName: string;
  joinedAt: string;
  lastActiveAt: string | null;
}

type HubMemberRow = {
  id: string;
  hubId: string;
  userId: string | null;
  email: string;
  displayName: string | null;
  role: string;
  accessLevel: string;
  invitedBy: string | null;
  invitedByName: string | null;
  joinedAt: Date;
  lastActiveAt: Date | null;
};

type TxLike = {
  hubMember: {
    upsert: CallableFunction;
    updateMany: CallableFunction;
    findMany?: CallableFunction;
  };
};

export function normaliseEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

export function accessPermissions(accessLevel: string): HubMemberDTO['permissions'] {
  switch (accessLevel) {
    case 'proposal_only':
      return {
        canViewProposal: true,
        canViewDocuments: false,
        canViewVideos: false,
        canViewMessages: false,
        canViewMeetings: false,
        canViewQuestionnaire: false,
        canInviteMembers: false,
        canManageAccess: false,
      };
    case 'documents_only':
      return {
        canViewProposal: false,
        canViewDocuments: true,
        canViewVideos: false,
        canViewMessages: false,
        canViewMeetings: false,
        canViewQuestionnaire: false,
        canInviteMembers: false,
        canManageAccess: false,
      };
    case 'view_only':
      return {
        canViewProposal: true,
        canViewDocuments: true,
        canViewVideos: true,
        canViewMessages: true,
        canViewMeetings: true,
        canViewQuestionnaire: true,
        canInviteMembers: false,
        canManageAccess: false,
      };
    case 'full_access':
    default:
      return {
        canViewProposal: true,
        canViewDocuments: true,
        canViewVideos: true,
        canViewMessages: true,
        canViewMeetings: true,
        canViewQuestionnaire: true,
        canInviteMembers: true,
        canManageAccess: true,
      };
  }
}

export function mapHubMember(row: HubMemberRow): HubMemberDTO {
  const email = normaliseEmail(row.email);
  const displayName = row.displayName?.trim() || email.split('@')[0] || 'Member';
  const accessLevel = ACCESS_LEVELS.includes(row.accessLevel as MemberAccessLevel)
    ? (row.accessLevel as MemberAccessLevel)
    : 'full_access';

  return {
    id: row.id,
    hubId: row.hubId,
    userId: row.userId || row.id,
    email,
    displayName,
    avatarUrl: null,
    role: row.role === 'staff' ? 'staff' : 'client',
    accessLevel,
    permissions: accessPermissions(accessLevel),
    invitedBy: row.invitedBy || 'system',
    invitedByName: row.invitedByName || 'Agent Flow',
    joinedAt: row.joinedAt.toISOString(),
    lastActiveAt: row.lastActiveAt ? row.lastActiveAt.toISOString() : null,
  };
}

export async function upsertClientMember(
  tx: TxLike,
  args: {
    hubId: string;
    tenantId: string;
    email: string;
    displayName?: string | null;
    accessLevel?: MemberAccessLevel;
    invitedBy?: string | null;
    invitedByName?: string | null;
    source?: 'portal_contact' | 'invite' | 'message' | 'staff_manual' | 'system';
    lastActiveAt?: Date;
  },
): Promise<void> {
  const email = normaliseEmail(args.email);
  if (!email) return;

  const now = new Date();
  await tx.hubMember.upsert({
    where: { hubId_email_role: { hubId: args.hubId, email, role: 'client' } },
    create: {
      hubId: args.hubId,
      tenantId: args.tenantId,
      email,
      displayName: args.displayName?.trim() || null,
      role: 'client',
      accessLevel: args.accessLevel || 'full_access',
      invitedBy: args.invitedBy || null,
      invitedByName: args.invitedByName || null,
      source: args.source || 'system',
      status: 'active',
      joinedAt: now,
      lastActiveAt: args.lastActiveAt || null,
      revokedAt: null,
      updatedAt: now,
    },
    update: {
      status: 'active',
      revokedAt: null,
      accessLevel: args.accessLevel || 'full_access',
      source: args.source || 'system',
      updatedAt: now,
      ...(args.displayName ? { displayName: args.displayName.trim() } : {}),
      ...(args.invitedBy ? { invitedBy: args.invitedBy } : {}),
      ...(args.invitedByName ? { invitedByName: args.invitedByName } : {}),
      ...(args.lastActiveAt ? { lastActiveAt: args.lastActiveAt } : {}),
    },
  });
}

export async function upsertStaffMember(
  tx: TxLike,
  args: {
    hubId: string;
    tenantId: string;
    userId?: string;
    email: string;
    displayName?: string | null;
    source?: 'staff_manual' | 'system' | 'message';
    lastActiveAt?: Date;
  },
): Promise<void> {
  const email = normaliseEmail(args.email);
  if (!email) return;

  const now = new Date();
  await tx.hubMember.upsert({
    where: { hubId_email_role: { hubId: args.hubId, email, role: 'staff' } },
    create: {
      hubId: args.hubId,
      tenantId: args.tenantId,
      userId: args.userId || null,
      email,
      displayName: args.displayName?.trim() || null,
      role: 'staff',
      accessLevel: 'full_access',
      invitedBy: args.userId || null,
      invitedByName: args.displayName?.trim() || null,
      source: args.source || 'system',
      status: 'active',
      joinedAt: now,
      lastActiveAt: args.lastActiveAt || now,
      revokedAt: null,
      updatedAt: now,
    },
    update: {
      status: 'active',
      revokedAt: null,
      accessLevel: 'full_access',
      source: args.source || 'system',
      updatedAt: now,
      ...(args.userId ? { userId: args.userId } : {}),
      ...(args.displayName ? { displayName: args.displayName.trim() } : {}),
      ...(args.lastActiveAt ? { lastActiveAt: args.lastActiveAt } : {}),
    },
  });
}

export async function revokeClientMember(
  tx: TxLike,
  args: { hubId: string; email: string },
): Promise<void> {
  const email = normaliseEmail(args.email);
  if (!email) return;

  const now = new Date();
  await tx.hubMember.updateMany({
    where: {
      hubId: args.hubId,
      email,
      role: 'client',
      status: 'active',
    },
    data: {
      status: 'revoked',
      revokedAt: now,
      updatedAt: now,
    },
  });
}

type HydrateDb = {
  portalContact: {
    findMany: CallableFunction;
  };
  hubMember: {
    upsert: CallableFunction;
  };
};

export async function hydrateMembersFromPortalContacts(
  db: HydrateDb,
  args: {
    hubId: string;
    tenantId: string;
  },
): Promise<void> {
  const contacts = await db.portalContact.findMany({
    where: { hubId: args.hubId, tenantId: args.tenantId },
    select: { email: true, name: true, addedBy: true, createdAt: true },
  });

  if (contacts.length === 0) return;

  for (const contact of contacts) {
    await upsertClientMember(db as unknown as Parameters<typeof upsertClientMember>[0], {
      hubId: args.hubId,
      tenantId: args.tenantId,
      email: contact.email,
      displayName: contact.name,
      invitedBy: contact.addedBy,
      source: 'portal_contact',
    });
  }
}

type StaffEmailDb = {
  hubMember: { findMany: CallableFunction };
  hubMessage: { findMany: CallableFunction };
  hubEvent?: { findMany: CallableFunction };
};

export async function listActiveStaffEmails(
  db: StaffEmailDb,
  args: { hubId: string; tenantId?: string; fallbackEmails?: string[] },
): Promise<string[]> {
  const memberWhere: Record<string, unknown> = {
    role: 'staff',
    status: 'active',
  };
  if (!args.tenantId) {
    memberWhere.hubId = args.hubId;
  }

  const messageWhere: Record<string, unknown> = {
    hubId: args.hubId,
    senderType: 'staff',
  };
  const eventWhere: Record<string, unknown> = {
    hubId: args.hubId,
    userEmail: { not: null },
    userId: { not: null },
  };

  const [rows, messageRows, eventRows] = await Promise.all([
    db.hubMember.findMany({
      where: memberWhere,
      select: { email: true },
      take: 200,
    }),
    db.hubMessage.findMany({
      where: messageWhere,
      select: { senderEmail: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.hubEvent?.findMany
      ? db.hubEvent.findMany({
        where: eventWhere,
        select: { userEmail: true, userId: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      : Promise.resolve([]),
  ]);

  const out = new Set<string>();
  for (const row of rows) {
    const email = normaliseEmail(row.email);
    if (email) out.add(email);
  }
  for (const row of messageRows) {
    const email = normaliseEmail(row.senderEmail);
    if (email) out.add(email);
  }
  for (const row of eventRows as Array<{ userEmail?: string | null; userId?: string | null }>) {
    const userId = (row.userId || '').toLowerCase();
    if (userId.startsWith('portal-')) continue;
    const email = normaliseEmail(row.userEmail);
    if (email) out.add(email);
  }

  for (const raw of args.fallbackEmails || []) {
    const email = normaliseEmail(raw);
    if (email) out.add(email);
  }

  return Array.from(out);
}
