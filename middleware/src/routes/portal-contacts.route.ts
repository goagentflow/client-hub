/**
 * Portal contacts — staff-only CRUD for managing allowed portal emails.
 *
 * Endpoints:
 *   GET    /hubs/:hubId/portal-contacts     — list contacts
 *   POST   /hubs/:hubId/portal-contacts     — add contact
 *   DELETE /hubs/:hubId/portal-contacts/:id — remove contact + immediate revoke
 *   GET    /hubs/:hubId/access-method       — get current access method
 *   PATCH  /hubs/:hubId/access-method       — set hub access method
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { send204 } from '../utils/response.js';
import { getPrisma } from '../db/prisma.js';
import { upsertClientMember, revokeClientMember } from '../services/membership.service.js';
import { revokePortalAccess } from '../services/access-revocation.service.js';
import { syncMemberActivityToCrm } from '../services/crm-sync.service.js';
import type { Request, Response, NextFunction } from 'express';

export const portalContactsRouter = Router({ mergeParams: true });
export const accessMethodRouter = Router({ mergeParams: true });

const addContactSchema = z.object({
  email: z.string().email().transform(v => v.trim().toLowerCase()),
  name: z.string().optional(),
});

const accessMethodSchema = z.object({
  method: z.enum(['password', 'email', 'open']),
});

/** Verify hub exists and belongs to the staff user's tenant */
async function verifyHub(req: Request, res: Response): Promise<{
  id: string;
  tenantId: string;
  companyName: string;
  accessMethod: string;
} | null> {
  const hubId = req.params.hubId as string;
  const hub = await getPrisma().hub.findFirst({
    where: { id: hubId },
    select: {
      id: true,
      tenantId: true,
      companyName: true,
      accessMethod: true,
    },
  });
  if (!hub) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Hub not found' });
    return null;
  }
  if (hub.tenantId !== req.user.tenantId) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Hub does not belong to your tenant' });
    return null;
  }
  return hub;
}

/** Map Prisma unique constraint violation → 409 Conflict */
function isPrismaConflict(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002';
}

function isPrismaNotFound(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2025';
}

// GET /hubs/:hubId/portal-contacts
portalContactsRouter.get(
  '/',
  requireStaffAccess,
  hubAccessMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hub = await verifyHub(req, res);
      if (!hub) return;

      const contacts = await getPrisma().portalContact.findMany({
        where: { hubId: hub.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, addedBy: true, createdAt: true },
      });
      res.json({ data: contacts });
    } catch (err) { next(err); }
  },
);

// POST /hubs/:hubId/portal-contacts
portalContactsRouter.post(
  '/',
  requireStaffAccess,
  hubAccessMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hub = await verifyHub(req, res);
      if (!hub) return;
      const parsed = addContactSchema.parse(req.body);

      const prisma = getPrisma();
      const contact = await prisma.portalContact.create({
        data: {
          hubId: hub.id,
          tenantId: req.user.tenantId,
          email: parsed.email,
          name: parsed.name ?? null,
          addedBy: req.user.userId,
        },
        select: { id: true, email: true, name: true, addedBy: true, createdAt: true },
      });

      await upsertClientMember(prisma as Parameters<typeof upsertClientMember>[0], {
        hubId: hub.id,
        tenantId: req.user.tenantId,
        email: parsed.email,
        displayName: parsed.name || null,
        invitedBy: req.user.userId,
        invitedByName: req.user.name,
        source: 'portal_contact',
      });

      await syncMemberActivityToCrm(prisma, {
        hubId: hub.id,
        tenantId: req.user.tenantId,
        companyName: hub.companyName,
        actorUserId: req.user.userId,
        activityType: 'team_invited',
        title: 'Client contact added',
        content: `${parsed.email} granted portal access`,
        metadata: {
          memberEmail: parsed.email,
          source: 'portal_contact',
        },
      });

      res.status(201).json({ data: contact });
    } catch (err) {
      if (isPrismaConflict(err)) {
        res.status(409).json({ code: 'CONFLICT', message: 'Contact already exists for this hub' });
        return;
      }
      next(err);
    }
  },
);

// DELETE /hubs/:hubId/portal-contacts/:id — transactional cascade + immediate token revoke
portalContactsRouter.delete(
  '/:id',
  requireStaffAccess,
  hubAccessMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hub = await verifyHub(req, res);
      if (!hub) return;
      const id = req.params.id as string;

      const prisma = getPrisma();
      const contact = await prisma.portalContact.findUnique({ where: { id } });
      if (!contact || contact.hubId !== hub.id) {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Contact not found' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.portalContact.delete({ where: { id } });
        await tx.portalDevice.deleteMany({ where: { hubId: hub.id, email: contact.email } });
        await tx.portalVerification.deleteMany({ where: { hubId: hub.id, email: contact.email } });

        await revokeClientMember(tx, {
          hubId: hub.id,
          email: contact.email,
        });

        await revokePortalAccess(tx, {
          hubId: hub.id,
          tenantId: req.user.tenantId,
          email: contact.email,
          reason: 'portal_contact_removed',
          revokedBy: req.user.userId,
        });
      });

      await syncMemberActivityToCrm(prisma, {
        hubId: hub.id,
        tenantId: req.user.tenantId,
        companyName: hub.companyName,
        actorUserId: req.user.userId,
        activityType: 'status_changed',
        title: 'Client contact removed',
        content: `${contact.email} access revoked`,
        metadata: {
          memberEmail: contact.email,
          source: 'portal_contact_remove',
        },
      });

      send204(res);
    } catch (err) { next(err); }
  },
);

// GET /hubs/:hubId/access-method
accessMethodRouter.get(
  '/',
  requireStaffAccess,
  hubAccessMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hub = await verifyHub(req, res);
      if (!hub) return;
      res.json({ data: { method: hub.accessMethod } });
    } catch (err) { next(err); }
  },
);

// PATCH /hubs/:hubId/access-method
accessMethodRouter.patch(
  '/',
  requireStaffAccess,
  hubAccessMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hub = await verifyHub(req, res);
      if (!hub) return;
      const parsed = accessMethodSchema.parse(req.body);

      const prisma = getPrisma();

      // Build update payload — clear passwordHash when switching to open
      const data: Record<string, unknown> = { accessMethod: parsed.method };
      if (parsed.method === 'open') {
        data.passwordHash = null;
      }

      await prisma.hub.update({
        where: { id: hub.id },
        data,
      });

      // Switching away from email: revoke active email-auth artifacts + checkpoint all existing tokens.
      if (parsed.method !== 'email') {
        await Promise.all([
          prisma.portalDevice.deleteMany({ where: { hubId: hub.id } }),
          prisma.portalVerification.deleteMany({ where: { hubId: hub.id } }),
        ]);

        await revokePortalAccess(prisma as Parameters<typeof revokePortalAccess>[0], {
          hubId: hub.id,
          tenantId: req.user.tenantId,
          reason: `access_method_${parsed.method}`,
          revokedBy: req.user.userId,
        });
      }

      res.json({ data: { method: parsed.method } });
    } catch (err) {
      if (isPrismaNotFound(err)) {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Hub not found' });
        return;
      }
      next(err);
    }
  },
);
