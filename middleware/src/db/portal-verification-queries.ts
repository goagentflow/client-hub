/**
 * Portal verification queries — unauthenticated, direct Prisma.
 *
 * Used by portal-verification.route.ts for email-verified access.
 * All email values must be pre-normalised (lowercase + trim) by callers.
 */

import { getPrisma } from './prisma.js';

/** Get hub access method and basic info (published only) */
export async function findHubAccessMethod(hubId: string) {
  return getPrisma().hub.findFirst({
    where: { id: hubId, isPublished: true },
    select: { id: true, companyName: true, accessMethod: true, isPublished: true },
  });
}

/** Check if an email is an authorised portal contact for a hub */
export async function findPortalContact(hubId: string, email: string) {
  return getPrisma().portalContact.findUnique({
    where: { hubId_email: { hubId, email } },
  });
}

/** Atomic upsert — one active code per hub+email */
export async function upsertVerification(
  hubId: string,
  email: string,
  codeHash: string,
  expiresAt: Date,
) {
  return getPrisma().portalVerification.upsert({
    where: { hubId_email: { hubId, email } },
    create: { hubId, email, codeHash, expiresAt, attempts: 0 },
    update: { codeHash, expiresAt, used: false, attempts: 0 },
  });
}

/** Find unexpired, unused verification for code checking */
export async function findActiveVerification(hubId: string, email: string) {
  return getPrisma().portalVerification.findUnique({
    where: { hubId_email: { hubId, email } },
  });
}

/** Increment attempt counter */
export async function incrementAttempts(id: string) {
  return getPrisma().portalVerification.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });
}

/** Mark verification as used */
export async function markVerificationUsed(id: string) {
  return getPrisma().portalVerification.update({
    where: { id },
    data: { used: true },
  });
}

/** Create a device token record */
export async function createDeviceRecord(
  hubId: string,
  email: string,
  deviceTokenHash: string,
  expiresAt: Date,
) {
  return getPrisma().portalDevice.create({
    data: { hubId, email, deviceTokenHash, expiresAt },
  });
}

/** Find a valid (unexpired) device token */
export async function findValidDevice(
  hubId: string,
  email: string,
  deviceTokenHash: string,
) {
  return getPrisma().portalDevice.findFirst({
    where: {
      hubId,
      email,
      deviceTokenHash,
      expiresAt: { gt: new Date() },
    },
  });
}
