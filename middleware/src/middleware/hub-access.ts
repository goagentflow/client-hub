/**
 * Hub access middleware
 *
 * Runs on all /hubs/:hubId/* routes.
 * Staff: can access all hubs.
 * Client: can only access hubs matching their domain.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../adapters/supabase.adapter.js';
import { logger } from '../utils/logger.js';
import type { HubAccess } from '../types/api.js';

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

  // Portal token user — can only access their bound hub, and only if still published
  if (user.portalHubId) {
    if (user.portalHubId !== hubId) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Portal access denied', correlationId: req.correlationId });
      return;
    }
    // Check hub is still published (immediate lockout on unpublish)
    const { data: hub, error: hubError } = await supabase.from('hub').select('is_published')
      .eq('id', hubId).single();
    if (hubError) {
      logger.error({ err: hubError, hubId }, 'Failed to check hub published status');
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unable to verify hub access', correlationId: req.correlationId });
      return;
    }
    if (!hub?.is_published) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'This hub is no longer available', correlationId: req.correlationId });
      return;
    }
    req.hubAccess = {
      hubId, canView: true, canEdit: false,
      canInvite: false, canViewInternal: false, accessLevel: 'view_only',
    };
    next();
    return;
  }

  // Staff can access all hubs
  if (user.isStaff) {
    req.hubAccess = {
      hubId,
      canView: true,
      canEdit: true,
      canInvite: true,
      canViewInternal: true,
      accessLevel: 'full_access',
    };
    next();
    return;
  }

  // Client users: check hub's clientDomain matches user email domain
  try {
    const { data: hub, error } = await supabase
      .from('hub')
      .select('id, client_domain')
      .eq('id', hubId)
      .single();

    if (error || !hub) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: `Hub '${hubId}' not found`,
        correlationId: req.correlationId,
      });
      return;
    }

    const userDomain = user.email.split('@')[1];
    if (hub.client_domain !== userDomain) {
      logger.warn({ hubId, userDomain, hubDomain: hub.client_domain }, 'Hub access denied');
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You do not have access to this hub',
        correlationId: req.correlationId,
      });
      return;
    }

    req.hubAccess = {
      hubId,
      canView: true,
      canEdit: false,
      canInvite: false,
      canViewInternal: false,
      accessLevel: 'view_only',
    };
    next();
  } catch (err) {
    next(err);
  }
}
