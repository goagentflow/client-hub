/**
 * Access recovery token queries.
 *
 * Stores one-time opaque recovery tokens as SHA-256 hashes.
 * Raw tokens are never persisted.
 */

import { createHash } from 'node:crypto';
import { getPrisma } from './prisma.js';

const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export type ConsumeAccessRecoveryTokenResult =
  | { status: 'valid'; email: string }
  | { status: 'expired_or_used' }
  | { status: 'invalid' };

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function isTokenFormatValid(rawToken: string): boolean {
  return TOKEN_PATTERN.test(rawToken);
}

export async function createAccessRecoveryToken(
  rawToken: string,
  email: string,
  expiresAt: Date,
): Promise<void> {
  if (!isTokenFormatValid(rawToken)) {
    throw new Error('Invalid access recovery token format');
  }

  const tokenHash = hashToken(rawToken);

  await getPrisma().$executeRaw`
    INSERT INTO access_recovery_token (token_hash, email, expires_at)
    VALUES (${tokenHash}, ${email}, ${expiresAt})
  `;
}

export async function consumeAccessRecoveryToken(
  rawToken: string,
): Promise<ConsumeAccessRecoveryTokenResult> {
  if (!isTokenFormatValid(rawToken)) {
    return { status: 'invalid' };
  }

  const tokenHash = hashToken(rawToken);

  // Atomic consume: only one request can mark token as used.
  const consumed = await getPrisma().$queryRaw<{ email: string }[]>`
    WITH consumed AS (
      UPDATE access_recovery_token
      SET used_at = now()
      WHERE token_hash = ${tokenHash}
        AND used_at IS NULL
        AND expires_at > now()
      RETURNING email
    )
    SELECT email FROM consumed
  `;

  const consumedToken = consumed[0];
  if (consumedToken) {
    return { status: 'valid', email: consumedToken.email };
  }

  const existing = await getPrisma().$queryRaw<{ expiresAt: Date; usedAt: Date | null }[]>`
    SELECT expires_at AS "expiresAt", used_at AS "usedAt"
    FROM access_recovery_token
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;

  if (existing.length === 0) {
    return { status: 'invalid' };
  }

  return { status: 'expired_or_used' };
}

export async function pruneAccessRecoveryTokens(
  retentionDays: number,
): Promise<number> {
  const safeDays = Number.isFinite(retentionDays) ? Math.max(1, Math.floor(retentionDays)) : 14;
  const cutoff = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

  const deleted = await getPrisma().$executeRaw`
    DELETE FROM access_recovery_token
    WHERE created_at < ${cutoff}
      AND (
        used_at IS NOT NULL
        OR expires_at < now()
      )
  `;

  return Number(deleted);
}
