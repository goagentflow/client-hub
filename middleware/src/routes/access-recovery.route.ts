/**
 * Public access recovery routes.
 *
 * Endpoints:
 *   POST /public/access/request-link — send recovery email for client hubs
 *   GET  /public/access/items        — list hubs from one-time recovery token
 */

import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { findAccessRecoveryHubsByEmail, type AccessRecoveryHubRow } from '../db/access-recovery-queries.js';
import { createAccessRecoveryToken, consumeAccessRecoveryToken } from '../db/access-recovery-token-queries.js';
import { sendAccessRecoveryEmail } from '../services/email.service.js';
import { logger } from '../utils/logger.js';
import type { NextFunction, Request, Response } from 'express';

export const accessRecoveryRouter = Router();

const TOKEN_EXPIRY_MS = 20 * 60 * 1000; // 20 minutes
const ACTIVE_DAYS = 60;
const RECOMMENDED_DAYS = 14;

type ProductLabel = 'Client Hub' | 'Pitch Hub';

interface AccessItem {
  hubId: string;
  title: string;
  product: ProductLabel;
  url: string;
  updatedAt: string;
}

interface RankedAccessItem extends AccessItem {
  lastActivityAt: string;
}

interface GroupedAccessItems {
  recommended: (AccessItem & { reason: string }) | null;
  active: AccessItem[];
  past: AccessItem[];
}

const requestLinkSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

function emailDomain(email: string): string {
  const at = email.indexOf('@');
  return at > -1 ? email.slice(at + 1) : 'unknown';
}

function productForHubType(hubType: string): ProductLabel {
  return hubType === 'client' ? 'Client Hub' : 'Pitch Hub';
}

function productWeight(product: ProductLabel): number {
  return product === 'Client Hub' ? 2 : 1;
}

function toPortalUrl(hubId: string): string {
  return new URL(`/clienthub/portal/${hubId}`, env.CORS_ORIGIN).toString();
}

function toMyAccessUrl(token: string): string {
  const url = new URL('/my-access', env.CORS_ORIGIN);
  url.searchParams.set('token', token);
  return url.toString();
}

function toAccessItems(rows: AccessRecoveryHubRow[]): RankedAccessItem[] {
  return rows.map((row) => ({
    hubId: row.hubId,
    title: row.companyName,
    product: productForHubType(row.hubType),
    url: toPortalUrl(row.hubId),
    lastActivityAt: row.lastActivity.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

function stripRankFields(item: RankedAccessItem): AccessItem {
  return {
    hubId: item.hubId,
    title: item.title,
    product: item.product,
    url: item.url,
    updatedAt: item.updatedAt,
  };
}

function sortByPriority(items: RankedAccessItem[]): RankedAccessItem[] {
  return [...items].sort((a, b) => {
    const byActivity = new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    if (byActivity !== 0) return byActivity;

    const byProduct = productWeight(b.product) - productWeight(a.product);
    if (byProduct !== 0) return byProduct;

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function isActive(item: RankedAccessItem): boolean {
  const cutoff = Date.now() - ACTIVE_DAYS * 24 * 60 * 60 * 1000;
  return new Date(item.lastActivityAt).getTime() >= cutoff;
}

function isRecommendedCandidate(item: RankedAccessItem): boolean {
  const cutoff = Date.now() - RECOMMENDED_DAYS * 24 * 60 * 60 * 1000;
  return new Date(item.lastActivityAt).getTime() >= cutoff;
}

function groupAccessItems(items: RankedAccessItem[]): GroupedAccessItems {
  const sorted = sortByPriority(items);
  const active = sorted.filter(isActive);
  const past = sorted.filter((item) => !isActive(item));

  const recommendedRaw = active.find(isRecommendedCandidate) ?? active[0] ?? null;
  const recommended = recommendedRaw
    ? {
      ...stripRankFields(recommendedRaw),
      reason: 'Most recently active',
    }
    : null;

  const activeWithoutRecommended = recommendedRaw
    ? active.filter((item) => item.hubId !== recommendedRaw.hubId)
    : active;

  return {
    recommended,
    active: activeWithoutRecommended.map(stripRankFields),
    past: past.map(stripRankFields),
  };
}

function hasSingleActiveHub(groups: GroupedAccessItems): boolean {
  return groups.recommended !== null && groups.active.length === 0;
}

function activeHubCount(groups: GroupedAccessItems): number {
  return groups.active.length + (groups.recommended ? 1 : 0);
}

async function buildRecoveryDestination(email: string, groups: GroupedAccessItems): Promise<string> {
  if (hasSingleActiveHub(groups) && groups.recommended) {
    return groups.recommended.url;
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);
  await createAccessRecoveryToken(token, email, expiresAt);
  return toMyAccessUrl(token);
}

const requestLimit = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.ip || 'unknown'}:access-recovery`,
  message: { code: 'RATE_LIMITED', message: 'Too many requests. Give it a minute and try again.' },
});

const emailCooldownLimit = rateLimit({
  windowMs: 60_000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => {
    const parsed = requestLinkSchema.safeParse(req.body);
    const email = parsed.success ? parsed.data.email : 'invalid';
    return `access:${email}`;
  },
  message: { code: 'RATE_LIMITED', message: 'Too many requests. Give it a minute and try again.' },
});

const itemsLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.ip || 'unknown'}:access-items`,
  message: { code: 'RATE_LIMITED', message: 'Too many requests. Give it a minute and try again.' },
});

// POST /public/access/request-link
accessRecoveryRouter.post(
  '/access/request-link',
  requestLimit,
  emailCooldownLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = requestLinkSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ code: 'BAD_REQUEST', message: 'Valid email is required' });
        return;
      }

      const email = parsed.data.email;

      if (env.NODE_ENV === 'production' && !env.RESEND_API_KEY) {
        res.status(500).json({ code: 'EMAIL_NOT_CONFIGURED', message: 'Email service not configured' });
        return;
      }

      const rows = await findAccessRecoveryHubsByEmail(email);
      const items = toAccessItems(rows);
      const groups = groupAccessItems(items);

      if (items.length > 0) {
        const destination = await buildRecoveryDestination(email, groups);

        sendAccessRecoveryEmail(email, destination).catch((err) => {
          logger.error({ err, emailDomain: emailDomain(email) }, 'Failed to send access recovery email');
        });
      }

      logger.info({
        emailDomain: emailDomain(email),
        totalHubCount: items.length,
        activeHubCount: activeHubCount(groups),
      }, 'Access recovery link requested');

      // Non-enumerating response
      res.json({ data: { sent: true } });
    } catch (err) {
      next(err);
    }
  },
);

// GET /public/access/items?token=...
accessRecoveryRouter.get(
  '/access/items',
  itemsLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = String(req.query.token || '').trim();
      if (!token) {
        res.status(400).json({ code: 'BAD_REQUEST', message: 'Token is required' });
        return;
      }

      const consumed = await consumeAccessRecoveryToken(token);
      if (consumed.status !== 'valid') {
        if (consumed.status === 'expired_or_used') {
          res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'This link has expired' });
          return;
        }
        res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Invalid recovery token' });
        return;
      }

      const rows = await findAccessRecoveryHubsByEmail(consumed.email);
      const items = toAccessItems(rows);
      const groups = groupAccessItems(items);

      logger.info({
        emailDomain: emailDomain(consumed.email),
        totalHubCount: items.length,
      }, 'Access recovery items requested');

      res.json({ data: groups });
    } catch (err) {
      next(err);
    }
  },
);
