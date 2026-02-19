/**
 * Auth routes — user profile and session info
 */

import { Router, type Request, type Response } from 'express';
import { sendItem } from '../utils/response.js';

export const authRouter = Router();

/**
 * GET /auth/me — returns current user profile + hub access list
 * Reads from req.user (populated by auth middleware)
 */
authRouter.get('/me', (_req: Request, res: Response) => {
  const user = _req.user;
  const role = user.portalHubId ? 'client' : (user.isStaff ? 'staff' : 'client');
  const domain = user.email ? user.email.split('@')[1] || '' : '';

  // Staff get full permissions; clients get read-only
  const permissions = {
    isAdmin: user.isStaff,
    canConvertHubs: user.isStaff,
    canViewAllHubs: user.isStaff,
  };

  sendItem(res, {
    user: {
      id: user.userId,
      email: user.email,
      displayName: user.name,
      role,
      permissions,
      tenantId: user.tenantId,
      domain,
    },
    hubAccess: [], // Populated when hub membership table is built
  });
});
