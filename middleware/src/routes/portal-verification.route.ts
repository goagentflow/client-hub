/**
 * Portal email verification — public endpoints, no auth required.
 *
 * Endpoints:
 *   GET  /public/hubs/:hubId/access-method  — which gate to show
 *   POST /public/hubs/:hubId/request-code   — send 6-digit code
 *   POST /public/hubs/:hubId/verify-code    — validate code, issue JWT + device token
 *   POST /public/hubs/:hubId/verify-device  — validate device token, issue JWT
 */

import { Router } from 'express';
import { SignJWT } from 'jose';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { emailDomainForLogs } from '../utils/email-log.js';
import { logger } from '../utils/logger.js';
import { getPrisma } from '../db/prisma.js';
import { sendVerificationCode } from '../services/email.service.js';
import { upsertClientMember } from '../services/membership.service.js';
import {
  findHubAccessMethod,
  findPortalContact,
  upsertVerification,
  findActiveVerification,
  incrementAttempts,
  markVerificationUsed,
  createDeviceRecord,
  findValidDevice,
  pruneExpiredPortalAuthArtifacts,
} from '../db/portal-verification-queries.js';
import type { Request, Response, NextFunction } from 'express';

export const portalVerificationRouter = Router();

const ISSUER = 'agentflow';
const AUDIENCE = 'agentflow-portal';
const secret = new TextEncoder().encode(env.PORTAL_TOKEN_SECRET);
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const DEVICE_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const MAX_CODE_ATTEMPTS = 5;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const requestCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

const verifyCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  code: z.string().regex(/^\d{6}$/),
});

const verifyDeviceSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  deviceToken: z.string().regex(/^[a-f0-9]{64}$/i),
});

let lastCleanupAt = 0;
let cleanupInFlight: Promise<void> | null = null;

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function maybeRunPortalAuthCleanup(): void {
  const now = Date.now();
  if (cleanupInFlight) return;
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;

  cleanupInFlight = pruneExpiredPortalAuthArtifacts()
    .then(({ verificationsDeleted, devicesDeleted }) => {
      if (verificationsDeleted > 0 || devicesDeleted > 0) {
        logger.info({ verificationsDeleted, devicesDeleted }, 'Pruned expired portal auth artifacts');
      }
      lastCleanupAt = Date.now();
    })
    .catch((err) => {
      logger.warn({ err }, 'Failed to prune expired portal auth artifacts');
    })
    .finally(() => {
      cleanupInFlight = null;
    });
}

// Rate limiters
const generalLimit = rateLimit({
  windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many requests' },
});

const codeRequestLimit = rateLimit({
  windowMs: 60_000, max: 3, standardHeaders: true, legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.ip || 'unknown'}:${req.params.hubId}`,
  message: { code: 'RATE_LIMITED', message: 'Too many code requests' },
});

const emailCooldownLimit = rateLimit({
  windowMs: 60_000, max: 1, standardHeaders: true, legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => {
    const parsed = requestCodeSchema.safeParse(req.body);
    const email = parsed.success ? parsed.data.email : 'invalid';
    return `${req.params.hubId}:${email}`;
  },
  message: { code: 'RATE_LIMITED', message: 'Please wait before requesting another code' },
});

const verifyLimit = rateLimit({
  windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.ip || 'unknown'}:${req.params.hubId}`,
  message: { code: 'RATE_LIMITED', message: 'Too many attempts' },
});

async function issuePortalToken(
  hubId: string,
  email?: string,
  name?: string,
): Promise<string> {
  const builder = new SignJWT({ type: 'portal', email, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(hubId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('24h');
  return builder.sign(secret);
}

async function recordPortalLoginEvent(params: {
  hubId: string;
  tenantId: string | null | undefined;
  email: string;
  name: string | null;
  method: 'code' | 'device';
}): Promise<void> {
  const { hubId, tenantId, email, name, method } = params;
  if (!tenantId) return;

  try {
    await getPrisma().hubEvent.create({
      data: {
        hubId,
        tenantId,
        eventType: 'portal.login',
        userEmail: email,
        userName: name,
        metadata: { method },
      },
    });
  } catch (err) {
    logger.warn({ err, hubId, emailDomain: emailDomainForLogs(email) }, 'Failed to record portal login event');
  }
}

// GET /public/hubs/:hubId/access-method
portalVerificationRouter.get(
  '/hubs/:hubId/access-method',
  generalLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hubId = req.params.hubId as string;
      const hub = await findHubAccessMethod(hubId);
      if (!hub) {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Hub not found' });
        return;
      }
      res.json({ data: { method: hub.accessMethod } });
    } catch (err) { next(err); }
  },
);

// POST /public/hubs/:hubId/request-code
portalVerificationRouter.post(
  '/hubs/:hubId/request-code',
  codeRequestLimit,
  emailCooldownLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      maybeRunPortalAuthCleanup();

      const hubId = req.params.hubId as string;
      const parsedRequest = requestCodeSchema.safeParse(req.body);
      if (!parsedRequest.success) {
        res.status(400).json({ code: 'BAD_REQUEST', message: 'Email is required' });
        return;
      }
      const email = parsedRequest.data.email;

      // Production guard: email mode requires Resend config
      if (env.NODE_ENV === 'production' && !env.RESEND_API_KEY) {
        res.status(500).json({ code: 'EMAIL_NOT_CONFIGURED', message: 'Email service not configured' });
        return;
      }

      // Look up contact and hub (always, regardless of match — uniform work)
      const contact = await findPortalContact(hubId, email);
      const hub = await findHubAccessMethod(hubId);

      // Generate code regardless of match (uniform work)
      const code = String(randomInt(100000, 999999));
      const codeHash = sha256(code);
      const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

      // Only send if hub exists, is email-gated, and contact is authorised
      if (contact && hub && hub.accessMethod === 'email') {
        await upsertVerification(hubId, email, codeHash, expiresAt);
        sendVerificationCode(email, code, hub.companyName)
          .catch(err => logger.error(
            { err, hubId, emailDomain: emailDomainForLogs(email) },
            'Failed to send verification email',
          ));
      }

      // Always return sent: true (enumeration prevention)
      res.json({ data: { sent: true } });
    } catch (err) { next(err); }
  },
);

// POST /public/hubs/:hubId/verify-code
portalVerificationRouter.post(
  '/hubs/:hubId/verify-code',
  verifyLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      maybeRunPortalAuthCleanup();

      const hubId = req.params.hubId as string;
      const parsedRequest = verifyCodeSchema.safeParse(req.body);
      if (!parsedRequest.success) {
        res.json({ data: { valid: false } });
        return;
      }
      const { email, code } = parsedRequest.data;

      // Enforce email access method — reject if hub switched away
      const hub = await findHubAccessMethod(hubId);
      if (!hub || hub.accessMethod !== 'email') {
        res.json({ data: { valid: false } });
        return;
      }

      const verification = await findActiveVerification(hubId, email);

      // No verification, expired, used, or locked out
      if (!verification || verification.used || verification.expiresAt < new Date()
          || verification.attempts >= MAX_CODE_ATTEMPTS) {
        res.json({ data: { valid: false } });
        return;
      }

      // Timing-safe code comparison
      const suppliedHash = sha256(code);
      const storedBuf = Buffer.from(verification.codeHash);
      const suppliedBuf = Buffer.from(suppliedHash);
      const match = storedBuf.length === suppliedBuf.length
        && timingSafeEqual(storedBuf, suppliedBuf);

      if (!match) {
        await incrementAttempts(verification.id);
        res.json({ data: { valid: false } });
        return;
      }

      // Success — verify contact still exists before issuing token
      const contact = await findPortalContact(hubId, email);
      if (!contact) {
        res.json({ data: { valid: false } });
        return;
      }

      await markVerificationUsed(verification.id);
      const token = await issuePortalToken(hubId, email, contact.name || undefined);

      // Generate device token for remember-me
      const deviceTokenRaw = randomBytes(32).toString('hex');
      const deviceTokenHash = sha256(deviceTokenRaw);
      const deviceExpiresAt = new Date(Date.now() + DEVICE_EXPIRY_MS);
      await createDeviceRecord(hubId, email, deviceTokenHash, deviceExpiresAt);

      if (hub.tenantId) {
        await upsertClientMember(getPrisma() as Parameters<typeof upsertClientMember>[0], {
          hubId,
          tenantId: hub.tenantId,
          email,
          displayName: contact.name || null,
          source: 'system',
          lastActiveAt: new Date(),
        });
      }

      await recordPortalLoginEvent({
        hubId,
        tenantId: hub.tenantId,
        email,
        name: contact.name || null,
        method: 'code',
      });

      res.json({ data: { valid: true, token, deviceToken: deviceTokenRaw } });
    } catch (err) { next(err); }
  },
);

// POST /public/hubs/:hubId/verify-device
portalVerificationRouter.post(
  '/hubs/:hubId/verify-device',
  verifyLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      maybeRunPortalAuthCleanup();

      const hubId = req.params.hubId as string;
      const parsedRequest = verifyDeviceSchema.safeParse(req.body);
      if (!parsedRequest.success) {
        res.json({ data: { valid: false } });
        return;
      }
      const { email, deviceToken } = parsedRequest.data;

      // Enforce email access method — reject if hub switched away
      const hub = await findHubAccessMethod(hubId);
      if (!hub || hub.accessMethod !== 'email') {
        res.json({ data: { valid: false } });
        return;
      }

      const tokenHash = sha256(deviceToken);
      const device = await findValidDevice(hubId, email, tokenHash);

      if (!device) {
        res.json({ data: { valid: false } });
        return;
      }

      // Verify contact still exists (staff may have revoked)
      const contact = await findPortalContact(hubId, email);
      if (!contact) {
        res.json({ data: { valid: false } });
        return;
      }

      const token = await issuePortalToken(hubId, email, contact.name || undefined);
      if (hub.tenantId) {
        await upsertClientMember(getPrisma() as Parameters<typeof upsertClientMember>[0], {
          hubId,
          tenantId: hub.tenantId,
          email,
          displayName: contact.name || null,
          source: 'system',
          lastActiveAt: new Date(),
        });
      }

      await recordPortalLoginEvent({
        hubId,
        tenantId: hub.tenantId,
        email,
        name: contact.name || null,
        method: 'device',
      });

      res.json({ data: { valid: true, token } });
    } catch (err) { next(err); }
  },
);
