/**
 * Hub access middleware
 *
 * Runs on all /hubs/:hubId/* routes.
 * Staff: can access all hubs.
 * Client: can only access hubs matching their domain.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { getPrisma } from '../db/prisma.js';
import { createTenantRepository } from '../db/tenant-repository.js';
import type { HubAccess } from '../types/api.js';
import { upsertClientMember, upsertStaffMember } from '../services/membership.service.js';

// Extend Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      hubAccess?: HubAccess;
    }
  }
}

export async function hubAccessMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const hubId = req.params.hubId as string | undefined;
  if (!hubId) {
    next();
    return;
  }

  const user = req.user;

  // Portal token user — can only access their bound hub, and only if still published.
  // Uses adminRepo (unscoped) because portal tenantId doesn't match the hub's real tenant.
  if (user.portalHubId) {
    if (user.portalHubId !== hubId) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Portal access denied', correlationId: req.correlationId });
      return;
    }
    const hub = await req.adminRepo!.hub.findFirst({
      where: { id: hubId },
      select: { isPublished: true, tenantId: true },
    });
    if (!hub) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'This hub is no longer available', correlationId: req.correlationId });
      return;
    }
    if (!hub.isPublished) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'This hub is no longer available', correlationId: req.correlationId });
      return;
    }
    // Re-scope tenant repository to the hub's actual tenant so downstream
    // route handlers can query hub data (videos, documents, etc.)
    req.user.tenantId = hub.tenantId;
    req.repo = createTenantRepository(getPrisma(), hub.tenantId);
    req.hubAccess = {
      hubId, canView: true, canEdit: false,
      canInvite: false, canViewInternal: false, accessLevel: 'view_only',
    };

    upsertClientMember({ hubMember: req.repo!.hubMember } as Parameters<typeof upsertClientMember>[0], {
      hubId,
      tenantId: hub.tenantId,
      email: user.email,
      displayName: user.name,
      source: 'system',
      lastActiveAt: new Date(),
    }).catch((err) => logger.warn({ err, hubId, email: user.email }, 'Failed to touch portal member activity'));

    next();
    return;
  }

  // Staff can access all hubs
  if (user.isStaff) {
    req.hubAccess = {
      hubId, canView: true, canEdit: true,
      canInvite: true, canViewInternal: true, accessLevel: 'full_access',
    };

    upsertStaffMember({ hubMember: req.repo!.hubMember } as Parameters<typeof upsertStaffMember>[0], {
      hubId,
      tenantId: user.tenantId,
      userId: user.userId,
      email: user.email,
      displayName: user.name,
      source: 'system',
      lastActiveAt: new Date(),
    }).catch((err) => logger.warn({ err, hubId, email: user.email }, 'Failed to upsert staff member activity'));

    next();
    return;
  }

  // Client users: check hub's clientDomain matches user email domain
  try {
    const hub = await req.repo!.hub.findFirst({
      where: { id: hubId },
      select: { id: true, clientDomain: true },
    });

    if (!hub) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: `Hub '${hubId}' not found`,
        correlationId: req.correlationId,
      });
      return;
    }

    const userDomain = user.email.split('@')[1];
    if (hub.clientDomain !== userDomain) {
      logger.warn({ hubId, userDomain, hubDomain: hub.clientDomain }, 'Hub access denied');
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have access to this hub',
        correlationId: req.correlationId,
      });
      return;
    }

    req.hubAccess = {
      hubId, canView: true, canEdit: false,
      canInvite: false, canViewInternal: false, accessLevel: 'view_only',
    };
    next();
  } catch (err) {
    next(err);
  }
}
