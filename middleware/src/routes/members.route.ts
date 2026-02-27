/**
 * Member and invite routes.
 *
 * Members:
 * - GET /hubs/:hubId/members (live)
 * - PATCH /hubs/:hubId/members/:id (live)
 * - DELETE /hubs/:hubId/members/:id (live for client members)
 * - GET /hubs/:hubId/members/activity (placeholder)
 *
 * Invites:
 * - POST/GET/DELETE (live)
 */

import crypto from 'node:crypto';
import { URL } from 'node:url';
import { Router } from 'express';
import { z } from 'zod';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { getPrisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { sendPortalInvite } from '../services/email.service.js';
import {
  ACCESS_LEVELS,
  hydrateMembersFromPortalContacts,
  mapHubMember,
  revokeClientMember,
  upsertClientMember,
  upsertStaffMember,
} from '../services/membership.service.js';
import { revokePortalAccess } from '../services/access-revocation.service.js';
import { syncMemberActivityToCrm } from '../services/crm-sync.service.js';
import { logger } from '../utils/logger.js';
import { parsePagination } from '../utils/pagination.js';
import { sendItem, sendList, send204, send501 } from '../utils/response.js';
import type { Request, Response, NextFunction } from 'express';

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const INTERNAL_BYPASS_DOMAIN = 'goagentflow.com';

/** Fields returned to the frontend for invite responses */
const INVITE_SELECT = {
  id: true,
  hubId: true,
  email: true,
  accessLevel: true,
  message: true,
  invitedBy: true,
  invitedByName: true,
  invitedAt: true,
  expiresAt: true,
  status: true,
} as const;

const MEMBER_SELECT = {
  id: true,
  hubId: true,
  userId: true,
  email: true,
  displayName: true,
  role: true,
  accessLevel: true,
  invitedBy: true,
  invitedByName: true,
  joinedAt: true,
  lastActiveAt: true,
} as const;

const updateMemberSchema = z.object({
  accessLevel: z.enum(ACCESS_LEVELS),
});

const roleSchema = z.enum(['staff', 'client']);

async function findHubForTenant(hubId: string, tenantId: string) {
  return getPrisma().hub.findFirst({
    where: { id: hubId, tenantId },
    select: {
      id: true,
      tenantId: true,
      companyName: true,
      contactEmail: true,
      clientDomain: true,
      accessMethod: true,
    },
  });
}

// --- Members ---

export const membersRouter = Router({ mergeParams: true });

membersRouter.use(hubAccessMiddleware);
membersRouter.use(requireStaffAccess);

// GET /hubs/:hubId/members
membersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const { page, pageSize } = parsePagination(req.query);
    const hub = await req.repo!.hub.findFirst({
      where: { id: hubId },
      select: { id: true, tenantId: true, companyName: true },
    }) as { id: string; tenantId: string; companyName: string } | null;
    if (!hub) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Hub not found',
        correlationId: req.correlationId,
      });
      return;
    }

    // Backfill member rows from existing portal contacts to keep migration additive.
    await hydrateMembersFromPortalContacts(req.repo! as Parameters<typeof hydrateMembersFromPortalContacts>[0], {
      hubId,
      tenantId: req.user.tenantId,
    });

    const roleFilter = roleSchema.safeParse(req.query.role);

    const where: Record<string, unknown> = {
      hubId,
      tenantId: req.user.tenantId,
      status: 'active',
    };

    if (roleFilter.success) {
      where.role = roleFilter.data;
    }

    const [items, totalItems] = await Promise.all([
      req.repo!.hubMember.findMany({
        where,
        select: MEMBER_SELECT,
        orderBy: [{ role: 'asc' }, { joinedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      req.repo!.hubMember.count({ where }),
    ]);

    sendList(res, items.map(mapHubMember), {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

membersRouter.get('/activity', (_req: Request, res: Response) => send501(res, 'Member activity'));

// PATCH /hubs/:hubId/members/:id
membersRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
        correlationId: req.correlationId,
      });
      return;
    }

    const hubId = req.params.hubId as string;
    const memberId = req.params.id as string;
    const prisma = getPrisma();

    const member = await prisma.hubMember.findFirst({
      where: {
        id: memberId,
        hubId,
        tenantId: req.user.tenantId,
      },
      select: {
        ...MEMBER_SELECT,
        status: true,
      },
    });

    if (!member || member.status !== 'active') {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
        correlationId: req.correlationId,
      });
      return;
    }

    if (member.role === 'staff' && parsed.data.accessLevel !== 'full_access') {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Staff members always have full access',
        correlationId: req.correlationId,
      });
      return;
    }

    const updated = await prisma.hubMember.update({
      where: { id: memberId },
      data: {
        accessLevel: parsed.data.accessLevel,
        updatedAt: new Date(),
      },
      select: MEMBER_SELECT,
    });

    const hub = await findHubForTenant(hubId, req.user.tenantId);
    if (hub) {
      await syncMemberActivityToCrm(prisma, {
        hubId,
        tenantId: req.user.tenantId,
        companyName: hub.companyName,
        actorUserId: req.user.userId,
        activityType: 'status_changed',
        title: 'Hub member access updated',
        content: `${updated.email} access changed to ${updated.accessLevel}`,
        metadata: {
          memberEmail: updated.email,
          accessLevel: updated.accessLevel,
          role: updated.role,
        },
      });
    }

    sendItem(res, mapHubMember(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/members/:id
membersRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const memberId = req.params.id as string;
    const prisma = getPrisma();

    const member = await prisma.hubMember.findFirst({
      where: {
        id: memberId,
        hubId,
        tenantId: req.user.tenantId,
      },
      select: {
        id: true,
        hubId: true,
        tenantId: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!member || member.status !== 'active') {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Member not found',
        correlationId: req.correlationId,
      });
      return;
    }

    if (member.role !== 'client') {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Only client members can be removed from a hub',
        correlationId: req.correlationId,
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.hubMember.update({
        where: { id: member.id },
        data: {
          status: 'revoked',
          revokedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.portalContact.deleteMany({
        where: { hubId, email: member.email },
      });

      await tx.hubInvite.updateMany({
        where: {
          hubId,
          tenantId: req.user.tenantId,
          email: member.email,
          status: { not: 'revoked' },
        },
        data: { status: 'revoked' },
      });

      await tx.portalVerification.deleteMany({
        where: { hubId, email: member.email },
      });

      await tx.portalDevice.deleteMany({
        where: { hubId, email: member.email },
      });

      await revokePortalAccess(tx, {
        hubId,
        tenantId: req.user.tenantId,
        email: member.email,
        reason: 'member_removed',
        revokedBy: req.user.userId,
      });
    });

    const hub = await findHubForTenant(hubId, req.user.tenantId);
    if (hub) {
      await syncMemberActivityToCrm(prisma, {
        hubId,
        tenantId: req.user.tenantId,
        companyName: hub.companyName,
        actorUserId: req.user.userId,
        activityType: 'status_changed',
        title: 'Hub member removed',
        content: `${member.email} was removed from hub access`,
        metadata: { memberEmail: member.email, role: member.role },
      });
    }

    send204(res);
  } catch (err) {
    next(err);
  }
});

// --- Invites ---

const inviteBodySchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  name: z.string().trim().max(120).optional(),
  accessLevel: z.enum(ACCESS_LEVELS),
  message: z.string().max(500).trim().optional(),
});

export const invitesRouter = Router({ mergeParams: true });
invitesRouter.use(hubAccessMiddleware);
invitesRouter.use(requireStaffAccess);

/** POST / — Create or re-invite */
invitesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Production email guard
    if (env.NODE_ENV === 'production' && !env.RESEND_API_KEY) {
      res.status(500).json({
        code: 'EMAIL_NOT_CONFIGURED',
        message: 'Email service is not configured',
        correlationId: req.correlationId,
      });
      return;
    }

    // Validate input
    const parsed = inviteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
        correlationId: req.correlationId,
      });
      return;
    }

    const { email, name, accessLevel, message } = parsed.data;
    const hubId = req.params.hubId as string;
    const prisma = getPrisma();

    // Lookup hub with tenant check
    const hub = await findHubForTenant(hubId, req.user.tenantId);

    if (!hub) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Hub not found',
        correlationId: req.correlationId,
      });
      return;
    }

    // Access method guard
    if (hub.accessMethod !== 'email') {
      res.status(400).json({
        code: 'INVALID_ACCESS_METHOD',
        message: 'Invites are only available for email-gated hubs',
        correlationId: req.correlationId,
      });
      return;
    }

    // Domain validation
    if (!hub.clientDomain) {
      res.status(400).json({
        code: 'NO_CLIENT_DOMAIN',
        message: 'Hub has no client domain configured',
        correlationId: req.correlationId,
      });
      return;
    }

    const emailDomain = email.split('@')[1];
    const hubDomain = hub.clientDomain.trim().toLowerCase();
    if (emailDomain !== hubDomain && emailDomain !== INTERNAL_BYPASS_DOMAIN) {
      res.status(400).json({
        code: 'DOMAIN_MISMATCH',
        message: `Email domain must match ${hubDomain}`,
        correlationId: req.correlationId,
      });
      return;
    }

    const [existingContact, existingMember] = await Promise.all([
      prisma.portalContact.findFirst({
        where: { hubId, tenantId: req.user.tenantId, email },
        select: { name: true },
      }) as Promise<{ name: string | null } | null>,
      prisma.hubMember.findFirst({
        where: {
          hubId,
          tenantId: req.user.tenantId,
          email,
          role: 'client',
        },
        select: { displayName: true },
      }) as Promise<{ displayName: string | null } | null>,
    ]);

    const inviteeName = (name || '').trim()
      || (existingContact?.name || '').trim()
      || (existingMember?.displayName || '').trim();

    if (!inviteeName) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Client name is required for first-time invites',
        correlationId: req.correlationId,
      });
      return;
    }

    // Interactive transaction
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);
    let isNewInvite = true;

    const invite = await prisma.$transaction(async (tx) => {
      let inv;

      try {
        inv = await tx.hubInvite.create({
          data: {
            hubId,
            tenantId: req.user.tenantId,
            email,
            accessLevel,
            message: message || null,
            invitedBy: req.user.userId,
            invitedByName: req.user.name,
            expiresAt,
          },
          select: INVITE_SELECT,
        });
      } catch (err: unknown) {
        // P2002 = unique constraint violation → re-invite
        if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
          isNewInvite = false;
          inv = await tx.hubInvite.update({
            where: { hubId_email: { hubId, email } },
            data: {
              status: 'pending',
              token: crypto.randomUUID(),
              expiresAt,
              message: message || null,
              invitedBy: req.user.userId,
              invitedByName: req.user.name,
              invitedAt: new Date(),
              accessLevel,
            },
            select: INVITE_SELECT,
          });
        } else {
          throw err;
        }
      }

      // Idempotent portal contact add
      await tx.portalContact.upsert({
        where: { hubId_email: { hubId, email } },
        create: {
          hubId,
          tenantId: req.user.tenantId,
          email,
          name: inviteeName,
          addedBy: req.user.userId,
        },
        update: {
          ...(name || !existingContact?.name ? { name: inviteeName } : {}),
        },
      });

      await upsertClientMember(tx, {
        hubId,
        tenantId: req.user.tenantId,
        email,
        displayName: inviteeName,
        accessLevel,
        invitedBy: req.user.userId,
        invitedByName: req.user.name,
        source: 'invite',
      });

      await upsertStaffMember(tx, {
        hubId,
        tenantId: req.user.tenantId,
        userId: req.user.userId,
        email: req.user.email,
        displayName: req.user.name,
        source: 'staff_manual',
        lastActiveAt: new Date(),
      });

      // Increment clientsInvited only for new invites
      if (isNewInvite) {
        await tx.hub.update({
          where: { id: hubId },
          data: { clientsInvited: { increment: 1 } },
        });
      }

      return inv;
    });

    await syncMemberActivityToCrm(prisma, {
      hubId,
      tenantId: req.user.tenantId,
      companyName: hub.companyName,
      actorUserId: req.user.userId,
      activityType: 'team_invited',
      title: 'Client teammate invited',
      content: `${email} invited to hub`,
      metadata: {
        memberEmail: email,
        accessLevel,
        source: 'invite',
      },
    });

    // Fire-and-forget email
    const portalUrl = new URL('/clienthub/portal/' + hubId, env.CORS_ORIGIN).toString();
    sendPortalInvite(email, hub.companyName, req.user.name, portalUrl, message).catch((err) =>
      logger.error({ err, email, hubId }, 'Failed to send invite email'),
    );

    sendItem(res, invite, 201);
  } catch (err) {
    next(err);
  }
});

/** GET / — List pending invites */
invitesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const prisma = getPrisma();

    const [invites, activeClientMembers] = await Promise.all([
      prisma.hubInvite.findMany({
        where: {
          hubId,
          tenantId: req.user.tenantId,
          status: 'pending',
          expiresAt: { gt: new Date() },
        },
        orderBy: { invitedAt: 'desc' },
        select: INVITE_SELECT,
      }),
      prisma.hubMember.findMany({
        where: {
          hubId,
          tenantId: req.user.tenantId,
          role: 'client',
          status: 'active',
        },
        select: { email: true },
      }),
    ]);

    const activeEmails = new Set(
      activeClientMembers.map((member) => member.email.trim().toLowerCase()),
    );
    const visibleInvites = invites.filter((invite) =>
      !activeEmails.has(invite.email.trim().toLowerCase()),
    );

    res.json(visibleInvites);
  } catch (err) {
    next(err);
  }
});

/** DELETE /:id — Revoke invite with cascade */
invitesRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const hubId = req.params.hubId as string;
    const prisma = getPrisma();

    // Hub-scoped + tenant-isolated lookup
    const invite = await prisma.hubInvite.findFirst({
      where: { id, hubId, tenantId: req.user.tenantId },
      select: { id: true, hubId: true, email: true },
    });

    if (!invite) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Invite not found',
        correlationId: req.correlationId,
      });
      return;
    }

    // Transaction: revoke + cascade delete + immediate token revocation
    await prisma.$transaction(async (tx) => {
      await tx.hubInvite.update({
        where: { id },
        data: { status: 'revoked' },
      });

      await tx.portalContact.deleteMany({
        where: { hubId: invite.hubId, email: invite.email },
      });

      await tx.portalVerification.deleteMany({
        where: { hubId: invite.hubId, email: invite.email },
      });

      await tx.portalDevice.deleteMany({
        where: { hubId: invite.hubId, email: invite.email },
      });

      await revokeClientMember(tx, {
        hubId: invite.hubId,
        email: invite.email,
      });

      await revokePortalAccess(tx, {
        hubId: invite.hubId,
        tenantId: req.user.tenantId,
        email: invite.email,
        reason: 'invite_revoked',
        revokedBy: req.user.userId,
      });
    });

    const hub = await findHubForTenant(hubId, req.user.tenantId);
    if (hub) {
      await syncMemberActivityToCrm(prisma, {
        hubId,
        tenantId: req.user.tenantId,
        companyName: hub.companyName,
        actorUserId: req.user.userId,
        activityType: 'status_changed',
        title: 'Invite revoked',
        content: `${invite.email} invite revoked and access removed`,
        metadata: { memberEmail: invite.email, source: 'invite_revoke' },
      });
    }

    send204(res);
  } catch (err) {
    next(err);
  }
});

// --- Share link (still 501) ---

export const shareLinkRouter = Router({ mergeParams: true });
shareLinkRouter.use(hubAccessMiddleware);
shareLinkRouter.use(requireStaffAccess);
shareLinkRouter.post('/', (_req: Request, res: Response) => send501(res, 'Share link'));
