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
    select: { id: true, tenantId: true, companyName: true, accessMethod: true, isPublished: true },
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
  magicTokenHash?: string,
) {
  return getPrisma().portalVerification.upsert({
    where: { hubId_email: { hubId, email } },
    create: { hubId, email, codeHash, magicTokenHash: magicTokenHash ?? null, expiresAt, attempts: 0 },
    update: { codeHash, magicTokenHash: magicTokenHash ?? null, expiresAt, used: false, attempts: 0 },
  });
}

/** Find unexpired, unused verification by magic token hash */
export async function findVerificationByMagicToken(hubId: string, magicTokenHash: string) {
  return getPrisma().portalVerification.findFirst({
    where: {
      hubId,
      magicTokenHash,
      used: false,
      expiresAt: { gt: new Date() },
    },
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

interface VerificationConsumeMatch {
  id: string;
  codeHash?: string;
  magicTokenHash?: string;
}

/**
 * Atomically consume a verification record only if the verified secret still matches.
 * Returns the number of rows updated (0 = already consumed, rotated, or expired).
 */
export async function consumeVerification(match: VerificationConsumeMatch) {
  const { id, codeHash, magicTokenHash } = match;
  const result = await getPrisma().portalVerification.updateMany({
    where: {
      id,
      used: false,
      expiresAt: { gt: new Date() },
      ...(codeHash ? { codeHash } : {}),
      ...(magicTokenHash ? { magicTokenHash } : {}),
    },
    data: { used: true },
  });
  return result.count;
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

/** Remove expired verification/device artifacts */
export async function pruneExpiredPortalAuthArtifacts(now: Date = new Date()) {
  const prisma = getPrisma();
  const [verificationResult, deviceResult] = await prisma.$transaction([
    prisma.portalVerification.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
    prisma.portalDevice.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
  ]);

  return {
    verificationsDeleted: verificationResult.count,
    devicesDeleted: deviceResult.count,
  };
}
