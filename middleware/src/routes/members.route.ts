/**
 * Member and invite routes
 * Members: 4 endpoints (still 501)
 * Invites: 3 endpoints (implemented — POST, GET, DELETE)
 * Share link: 1 endpoint (still 501)
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
import { logger } from '../utils/logger.js';
import { sendItem, send204, send501 } from '../utils/response.js';
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

// --- Members (still 501) ---

export const membersRouter = Router({ mergeParams: true });

membersRouter.use(hubAccessMiddleware);
membersRouter.use(requireStaffAccess);

membersRouter.get('/', (_req: Request, res: Response) => send501(res, 'Members'));
membersRouter.get('/activity', (_req: Request, res: Response) => send501(res, 'Member activity'));
membersRouter.patch('/:id', (_req: Request, res: Response) => send501(res, 'Update member'));
membersRouter.delete('/:id', (_req: Request, res: Response) => send501(res, 'Remove member'));

// --- Invites ---

const inviteBodySchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  accessLevel: z.enum(['full_access', 'proposal_only', 'documents_only', 'view_only']),
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

    const { email, accessLevel, message } = parsed.data;
    const hubId = req.params.hubId as string;
    const prisma = getPrisma();

    // Lookup hub with tenant check
    const hub = await prisma.hub.findFirst({
      where: { id: hubId },
      select: { id: true, tenantId: true, accessMethod: true, clientDomain: true, companyName: true },
    });

    if (!hub) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Hub not found',
        correlationId: req.correlationId,
      });
      return;
    }

    if (hub.tenantId !== req.user.tenantId) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Access denied',
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
          addedBy: req.user.userId,
        },
        update: {},
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

    const invites = await prisma.hubInvite.findMany({
      where: {
        hubId,
        tenantId: req.user.tenantId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      orderBy: { invitedAt: 'desc' },
      select: INVITE_SELECT,
    });

    res.json(invites);
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

    // Transaction: revoke + cascade delete
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
    });

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
