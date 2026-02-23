/**
 * Portal contacts — staff-only CRUD for managing allowed portal emails.
 *
 * Endpoints:
 *   GET    /hubs/:hubId/portal-contacts     — list contacts
 *   POST   /hubs/:hubId/portal-contacts     — add contact
 *   DELETE /hubs/:hubId/portal-contacts/:id — remove contact + cascade revoke
 *   GET    /hubs/:hubId/access-method       — get current access method
 *   PATCH  /hubs/:hubId/access-method       — set hub access method
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { send204 } from '../utils/response.js';
import { getPrisma } from '../db/prisma.js';
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
async function verifyTenant(req: Request, res: Response): Promise<string | null> {
  const hubId = req.params.hubId as string;
  const hub = await getPrisma().hub.findFirst({
    where: { id: hubId },
    select: { tenantId: true },
  });
  if (!hub) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Hub not found' });
    return null;
  }
  if (hub.tenantId !== req.user.tenantId) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Hub does not belong to your tenant' });
    return null;
  }
  return hubId;
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
      const hubId = await verifyTenant(req, res);
      if (!hubId) return;
      const contacts = await getPrisma().portalContact.findMany({
        where: { hubId },
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
      const hubId = await verifyTenant(req, res);
      if (!hubId) return;
      const parsed = addContactSchema.parse(req.body);

      const contact = await getPrisma().portalContact.create({
        data: {
          hubId,
          tenantId: req.user.tenantId,
          email: parsed.email,
          name: parsed.name ?? null,
          addedBy: req.user.userId,
        },
        select: { id: true, email: true, name: true, addedBy: true, createdAt: true },
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

// DELETE /hubs/:hubId/portal-contacts/:id — transactional cascade
portalContactsRouter.delete(
  '/:id',
  requireStaffAccess,
  hubAccessMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hubId = await verifyTenant(req, res);
      if (!hubId) return;
      const id = req.params.id as string;

      const contact = await getPrisma().portalContact.findUnique({ where: { id } });
      if (!contact || contact.hubId !== hubId) {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Contact not found' });
        return;
      }

      await getPrisma().$transaction([
        getPrisma().portalContact.delete({ where: { id } }),
        getPrisma().portalDevice.deleteMany({ where: { hubId, email: contact.email } }),
        getPrisma().portalVerification.deleteMany({ where: { hubId, email: contact.email } }),
      ]);

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
      const hubId = await verifyTenant(req, res);
      if (!hubId) return;
      const hub = await getPrisma().hub.findFirst({
        where: { id: hubId },
        select: { accessMethod: true },
      });
      if (!hub) {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Hub not found' });
        return;
      }
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
      const hubId = await verifyTenant(req, res);
      if (!hubId) return;
      const parsed = accessMethodSchema.parse(req.body);

      // Build update payload — clear passwordHash when switching to open
      const data: Record<string, unknown> = { accessMethod: parsed.method };
      if (parsed.method === 'open') {
        data.passwordHash = null;
      }

      await getPrisma().hub.update({
        where: { id: hubId },
        data,
      });

      // Switching away from email → revoke all email-related artifacts
      if (parsed.method !== 'email') {
        await Promise.all([
          getPrisma().portalDevice.deleteMany({ where: { hubId } }),
          getPrisma().portalVerification.deleteMany({ where: { hubId } }),
        ]);
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
