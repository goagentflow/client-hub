/**
 * Public routes — no auth required, rate-limited
 * Portal-meta, password verification, invite acceptance
 */

import { Router } from 'express';
import { SignJWT } from 'jose';
import { timingSafeEqual } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { findPublishedHub, findHubForPasswordVerify } from '../db/public-queries.js';
import { env } from '../config/env.js';
import { send501 } from '../utils/response.js';
import type { Request, Response, NextFunction } from 'express';

export const publicRouter = Router();

const ISSUER = 'agentflow';
const AUDIENCE = 'agentflow-portal';
const secret = new TextEncoder().encode(env.PORTAL_TOKEN_SECRET);
const PITCH_AUDIENCE = 'agentflow-pitch';
const pitchSecret = new TextEncoder().encode(env.PORTAL_TOKEN_SECRET);
const SLUG_PATTERN = /^[a-z0-9-]{3,80}$/;
const HASH_PATTERN = /^[a-f0-9]{6,64}$/i;

// Rate limiters
const generalLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
});

const passwordLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.ip || 'unknown'}:${req.params.hubId}`,
  message: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later' },
});

const pitchPasswordLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.ip || 'unknown'}:${req.params.slug || 'unknown'}:pitch`,
  message: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later' },
});

function parsePitchPasswordHashMap(raw: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!raw || !raw.trim()) return map;

  function addIfValid(key: string, value: string): void {
    if (!SLUG_PATTERN.test(key)) return;
    if (!HASH_PATTERN.test(value)) return;
    map.set(key, value.toLowerCase());
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          addIfValid(key, value);
        }
      }
      if (map.size > 0) {
        return map;
      }
    }
  } catch {
    // Fall through: support a deploy-safe key=value;key=value format.
  }

  for (const pair of raw.split(';')) {
    const [slug, hash] = pair.split('=');
    if (!slug || !hash) continue;
    addIfValid(slug.trim().toLowerCase(), hash.trim());
  }

  return map;
}

function legacySimpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(16);
}

const pitchPasswordHashes = parsePitchPasswordHashMap(env.PITCH_PASSWORD_HASH_MAP);

// GET /public/hubs/:hubId/portal-meta — basic hub info (published only)
publicRouter.get('/hubs/:hubId/portal-meta', generalLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const hub = await findPublishedHub(hubId);

    if (!hub) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Hub not found' });
      return;
    }

    res.json({
      data: {
        id: hub.id,
        companyName: hub.companyName,
        contactName: hub.contactName,
        hubType: hub.hubType,
        isPublished: hub.isPublished,
        welcomeHeadline: hub.welcomeHeadline ?? '',
        welcomeMessage: hub.welcomeMessage ?? '',
        heroContentType: hub.heroContentType ?? 'none',
        heroContentId: hub.heroContentId ?? null,
        sections: {
          showProposal: hub.showProposal ?? true,
          showVideos: hub.showVideos ?? true,
          showDocuments: hub.showDocuments ?? true,
          showMessages: hub.showMessages ?? true,
          showMeetings: hub.showMeetings ?? true,
          showQuestionnaire: hub.showQuestionnaire ?? true,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /public/hubs/:hubId/password-status — does hub have a password? (published only)
publicRouter.get('/hubs/:hubId/password-status', generalLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const hub = await findPublishedHub(hubId);

    if (!hub) {
      res.json({ data: { hasPassword: false } });
      return;
    }

    // findPublishedHub doesn't include passwordHash — use dedicated query
    const hubWithPw = await findHubForPasswordVerify(hubId);
    res.json({ data: { hasPassword: !!(hubWithPw?.passwordHash) } });
  } catch (err) {
    next(err);
  }
});

// POST /public/hubs/:hubId/verify-password — verify password + issue token
publicRouter.post('/hubs/:hubId/verify-password', passwordLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const { passwordHash } = req.body;

    // Small constant delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 100));

    const hub = await findHubForPasswordVerify(hubId);

    // Uniform failure: hub doesn't exist, is unpublished, or wrong password
    if (!hub || !hub.isPublished) {
      res.json({ data: { valid: false } });
      return;
    }

    // No-password hub: empty hash or no hash means auto-issue token
    const hubHasNoPassword = !hub.passwordHash;

    // Constant-time comparison to prevent timing attacks
    let passwordCorrect = false;
    if (!hubHasNoPassword && typeof passwordHash === 'string') {
      const stored = Buffer.from(hub.passwordHash as string);
      const supplied = Buffer.from(passwordHash);
      passwordCorrect = stored.length === supplied.length && timingSafeEqual(stored, supplied);
    }

    if (!hubHasNoPassword && !passwordCorrect) {
      res.json({ data: { valid: false } });
      return;
    }

    // Issue portal JWT
    const token = await new SignJWT({ type: 'portal' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(hubId)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    res.json({ data: { valid: true, token } });
  } catch (err) {
    next(err);
  }
});

// POST /public/pitch/:slug/verify-password — verify static pitch password (no UX change path)
publicRouter.post('/pitch/:slug/verify-password', pitchPasswordLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    await new Promise(resolve => setTimeout(resolve, 100));

    if (!SLUG_PATTERN.test(slug) || !password || password.length > 256) {
      res.json({ data: { valid: false } });
      return;
    }

    const expectedHash = pitchPasswordHashes.get(slug);
    if (!expectedHash) {
      res.json({ data: { valid: false } });
      return;
    }

    const suppliedHash = legacySimpleHash(password).toLowerCase();
    const stored = Buffer.from(expectedHash, 'utf8');
    const supplied = Buffer.from(suppliedHash, 'utf8');
    const valid = stored.length === supplied.length && timingSafeEqual(stored, supplied);

    if (!valid) {
      res.json({ data: { valid: false } });
      return;
    }

    const token = await new SignJWT({ type: 'pitch', slug })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(slug)
      .setIssuer(ISSUER)
      .setAudience(PITCH_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(pitchSecret);

    res.json({ data: { valid: true, token } });
  } catch (err) {
    next(err);
  }
});

// POST /public/invites/:token/accept — 501 stub
publicRouter.post('/invites/:token/accept', (_req: Request, res: Response) => {
  send501(res, 'Invite acceptance');
});
