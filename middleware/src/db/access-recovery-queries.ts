/**
 * Access recovery queries — unauthenticated lookup by client email.
 *
 * Reads published hubs linked via portal_contact. This powers
 * `/api/v1/public/access/*` recovery flows.
 */

import { getPrisma } from './prisma.js';

export interface AccessRecoveryHubRow {
  hubId: string;
  companyName: string;
  hubType: string;
  updatedAt: Date;
  lastActivity: Date;
}

/**
 * Find published hubs a client email can access via portal contacts.
 * Email must be normalized (trim + lowercase) by caller.
 */
export async function findAccessRecoveryHubsByEmail(email: string): Promise<AccessRecoveryHubRow[]> {
  const rows = await getPrisma().portalContact.findMany({
    where: {
      email,
      hub: { is: { isPublished: true } },
    },
    select: {
      hub: {
        select: {
          id: true,
          companyName: true,
          hubType: true,
          updatedAt: true,
          lastActivity: true,
        },
      },
    },
  });

  return rows
    .filter((row) => !!row.hub)
    .map((row) => ({
      hubId: row.hub.id,
      companyName: row.hub.companyName,
      hubType: row.hub.hubType,
      updatedAt: row.hub.updatedAt,
      lastActivity: row.hub.lastActivity,
    }));
}

