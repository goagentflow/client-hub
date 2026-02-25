/**
 * Auth routes — user profile and session info
 */

import { Router, type Request, type Response } from 'express';
import { getPrisma } from '../db/prisma.js';
import { sendItem } from '../utils/response.js';

export const authRouter = Router();
let membershipTableChecked = false;
let membershipTableAvailable = true;

async function hasMembershipTable(): Promise<boolean> {
  if (membershipTableChecked) return membershipTableAvailable;

  try {
    const rows = await getPrisma().$queryRawUnsafe<Array<{ ok: boolean }>>(
      "SELECT to_regclass('public.hub_member') IS NOT NULL AS ok",
    );
    membershipTableAvailable = !!rows[0]?.ok;
  } catch {
    membershipTableAvailable = false;
  }

  membershipTableChecked = true;
  return membershipTableAvailable;
}

/**
 * GET /auth/me — returns current user profile + hub access list
 * Reads from req.user (populated by auth middleware)
 */
authRouter.get('/me', async (_req: Request, res: Response) => {
  const user = _req.user;
  const role = user.portalHubId ? 'client' : (user.isStaff ? 'staff' : 'client');
  const domain = user.email ? user.email.split('@')[1] || '' : '';

  // Staff get full permissions; clients get read-only
  const permissions = {
    isAdmin: user.isStaff,
    canConvertHubs: user.isStaff,
    canViewAllHubs: user.isStaff,
  };

  const hubAccess: Array<{ hubId: string; hubName: string; accessLevel: string; grantedAt: string }> = [];

  if (user.portalHubId) {
    const hub = await _req.adminRepo?.hub.findFirst({
      where: { id: user.portalHubId },
      select: { id: true, companyName: true },
    }) as { id: string; companyName: string } | null;
    if (hub) {
      hubAccess.push({
        hubId: hub.id,
        hubName: hub.companyName,
        accessLevel: 'view_only',
        grantedAt: new Date().toISOString(),
      });
    }
  } else if (user.email) {
    const membershipRole = user.isStaff ? 'staff' : 'client';
    try {
      if (!await hasMembershipTable()) {
        throw new Error('hub_member missing');
      }

      const members = await getPrisma().hubMember.findMany({
        where: {
          tenantId: user.tenantId,
          email: user.email.trim().toLowerCase(),
          role: membershipRole,
          status: 'active',
        },
        select: {
          hubId: true,
          accessLevel: true,
          joinedAt: true,
          hub: { select: { companyName: true } },
        },
        orderBy: { joinedAt: 'desc' },
        take: 50,
      });

      for (const member of members) {
        hubAccess.push({
          hubId: member.hubId,
          hubName: member.hub.companyName,
          accessLevel: member.accessLevel,
          grantedAt: member.joinedAt.toISOString(),
        });
      }
    } catch {
      // Membership table may be unavailable during rollout; auth response remains usable.
    }
  }

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
    hubAccess,
  });
});
