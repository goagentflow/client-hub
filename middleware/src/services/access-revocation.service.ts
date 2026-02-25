/**
 * Immediate portal-session revocation.
 *
 * Stores revocation checkpoints in hub_access_revocation and validates
 * portal JWT iat against the most recent checkpoint for:
 * - hub-wide scope (emailKey='*')
 * - email-specific scope
 */

import type { PrismaClient } from '@prisma/client';
import { getPrisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { normaliseEmail } from './membership.service.js';

export const HUB_WIDE_EMAIL_KEY = '*';
let revocationTableChecked = false;
let revocationTableAvailable = true;

type TxLike = {
  hubAccessRevocation: {
    upsert(args: Record<string, unknown>): Promise<unknown>;
  };
};

function isMissingRelationError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  return e.code === 'P2021' || (typeof e.message === 'string' && e.message.includes('does not exist'));
}

async function ensureRevocationTableAvailable(prisma: PrismaClient): Promise<boolean> {
  if (revocationTableChecked) return revocationTableAvailable;

  try {
    const queryRaw = (prisma as unknown as { $queryRawUnsafe?: CallableFunction }).$queryRawUnsafe;
    if (typeof queryRaw !== 'function') {
      revocationTableAvailable = false;
    } else {
      const rows = await queryRaw(
        "SELECT to_regclass('public.hub_access_revocation') IS NOT NULL AS ok",
      ) as Array<{ ok: boolean }>;
      revocationTableAvailable = !!rows[0]?.ok;
    }
  } catch {
    revocationTableAvailable = false;
  }

  revocationTableChecked = true;
  return revocationTableAvailable;
}

export function normaliseRevocationEmailKey(email?: string): string {
  const normalised = normaliseEmail(email);
  return normalised || HUB_WIDE_EMAIL_KEY;
}

export async function revokePortalAccess(
  tx: TxLike,
  args: {
    hubId: string;
    tenantId: string;
    email?: string;
    reason: string;
    revokedBy?: string;
    revokedAfter?: Date;
  },
): Promise<void> {
  const emailKey = normaliseRevocationEmailKey(args.email);
  const revokedAfter = args.revokedAfter || new Date(Math.floor(Date.now() / 1000) * 1000);

  await tx.hubAccessRevocation.upsert({
    where: { hubId_emailKey: { hubId: args.hubId, emailKey } },
    create: {
      hubId: args.hubId,
      tenantId: args.tenantId,
      emailKey,
      revokedAfter,
      reason: args.reason,
      revokedBy: args.revokedBy || null,
      updatedAt: new Date(),
    },
    update: {
      revokedAfter,
      reason: args.reason,
      revokedBy: args.revokedBy || null,
      updatedAt: new Date(),
    },
  });
}

export async function isPortalTokenRevoked(
  hubId: string,
  tokenEmail: string | undefined,
  issuedAtSeconds: number | undefined,
): Promise<boolean> {
  const prisma = getPrisma();
  const revocationModel = (prisma as unknown as { hubAccessRevocation?: { findMany?: CallableFunction } }).hubAccessRevocation;
  if (!revocationModel || typeof revocationModel.findMany !== 'function') {
    return false;
  }
  if (!await ensureRevocationTableAvailable(prisma)) {
    return false;
  }
  const email = normaliseEmail(tokenEmail);
  const iatSeconds = typeof issuedAtSeconds === 'number' ? issuedAtSeconds : 0;

  try {
    const rows = await revocationModel.findMany({
      where: {
        hubId,
        emailKey: { in: email ? [HUB_WIDE_EMAIL_KEY, email] : [HUB_WIDE_EMAIL_KEY] },
      },
      select: { emailKey: true, revokedAfter: true },
      orderBy: { revokedAfter: 'desc' },
      take: 2,
    });

    if (rows.length === 0) return false;

    for (const row of rows) {
      const revokedAtSeconds = Math.floor(row.revokedAfter.getTime() / 1000);
      if (iatSeconds < revokedAtSeconds) {
        logger.info({ hubId, emailKey: row.emailKey }, 'Portal token rejected due to revocation checkpoint');
        return true;
      }
    }

    return false;
  } catch (err) {
    if (isMissingRelationError(err)) {
      // Keep auth path resilient during staged rollout before SQL migration lands.
      logger.warn({ hubId }, 'hub_access_revocation table missing; skipping portal revocation check');
      return false;
    }
    throw err;
  }
}

export async function revokePortalAccessBestEffort(
  prisma: PrismaClient,
  args: {
    hubId: string;
    tenantId: string;
    email?: string;
    reason: string;
    revokedBy?: string;
  },
): Promise<void> {
  try {
    await revokePortalAccess(prisma as unknown as TxLike, args);
  } catch (err) {
    if (isMissingRelationError(err)) {
      logger.warn({ hubId: args.hubId }, 'hub_access_revocation table missing; skipped revoke write');
      return;
    }
    throw err;
  }
}
