/**
 * Public queries — unauthenticated hub lookups via direct Prisma.
 *
 * Public routes have no tenant context (no auth).
 * These functions use getPrisma() directly and only read
 * published hub metadata — no sensitive data exposure.
 */

import { getPrisma } from './prisma.js';
import { resolveHubId } from './hub-identifier.js';

/** Minimal hub info for portal-meta (published only) */
export async function findPublishedHub(hubIdentifier: string) {
  const hubId = await resolveHubId(hubIdentifier, { publishedOnly: true });
  if (!hubId) return null;

  return getPrisma().hub.findFirst({
    where: { id: hubId, isPublished: true },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      hubType: true,
      isPublished: true,
      welcomeHeadline: true,
      welcomeMessage: true,
      heroContentType: true,
      heroContentId: true,
      showProposal: true,
      showVideos: true,
      showDocuments: true,
      showMessages: true,
      showMeetings: true,
      showQuestionnaire: true,
    },
  });
}

/** Full hub lookup for verify-password (any publish state — checked by caller) */
export async function findHubForPasswordVerify(hubIdentifier: string) {
  const hubId = await resolveHubId(hubIdentifier);
  if (!hubId) return null;

  return getPrisma().hub.findFirst({
    where: { id: hubId },
    select: { id: true, passwordHash: true, isPublished: true },
  });
}
