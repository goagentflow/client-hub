/**
 * Public queries — unauthenticated hub lookups via direct Prisma.
 *
 * Public routes have no tenant context (no auth).
 * These functions use getPrisma() directly and only read
 * published hub metadata — no sensitive data exposure.
 */

import { getPrisma } from './prisma.js';

/** Minimal hub info for portal-meta (published only) */
export async function findPublishedHub(hubId: string) {
  return getPrisma().hub.findFirst({
    where: { id: hubId, isPublished: true },
    select: { id: true, companyName: true, hubType: true, isPublished: true },
  });
}

/** Full hub lookup for verify-password (any publish state — checked by caller) */
export async function findHubForPasswordVerify(hubId: string) {
  return getPrisma().hub.findFirst({
    where: { id: hubId },
    select: { id: true, passwordHash: true, isPublished: true },
  });
}
