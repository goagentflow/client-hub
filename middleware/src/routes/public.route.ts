/**
 * Public routes — no auth required, rate-limited
 * Portal-meta, password verification, invite acceptance
 */

import { Router } from 'express';
import { SignJWT } from 'jose';
import { timingSafeEqual } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { supabase } from '../adapters/supabase.adapter.js';
import { env } from '../config/env.js';
import { send501 } from '../utils/response.js';
import type { Request, Response, NextFunction } from 'express';

export const publicRouter = Router();

const ISSUER = 'agentflow';
const AUDIENCE = 'agentflow-portal';
const secret = new TextEncoder().encode(env.PORTAL_TOKEN_SECRET);

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
  // Disable the IPv6 key generator validation — we handle our own composite key
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.ip || 'unknown'}:${req.params.hubId}`,
  message: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later' },
});

// GET /public/hubs/:hubId/portal-meta — basic hub info (published only)
publicRouter.get('/hubs/:hubId/portal-meta', generalLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('hub')
      .select('id, company_name, hub_type, is_published')
      .eq('id', req.params.hubId)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      // Generic 404 for non-existent OR unpublished (prevents enumeration)
      res.status(404).json({ code: 'NOT_FOUND', message: 'Hub not found' });
      return;
    }

    res.json({
      data: {
        id: data.id,
        companyName: data.company_name,
        hubType: data.hub_type,
        isPublished: data.is_published,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /public/hubs/:hubId/password-status — does hub have a password? (published only)
publicRouter.get('/hubs/:hubId/password-status', generalLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('hub')
      .select('password_hash')
      .eq('id', req.params.hubId)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      // Non-existent/unpublished — return false (no enumeration)
      res.json({ data: { hasPassword: false } });
      return;
    }

    res.json({ data: { hasPassword: !!data.password_hash } });
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

    const { data: hub, error } = await supabase
      .from('hub')
      .select('id, password_hash, is_published')
      .eq('id', hubId)
      .single();

    // Uniform failure: hub doesn't exist, is unpublished, or wrong password
    if (error || !hub || !hub.is_published) {
      res.json({ data: { valid: false } });
      return;
    }

    // No-password hub: empty hash or no hash means auto-issue token
    const hubHasNoPassword = !hub.password_hash;

    // Constant-time comparison to prevent timing attacks
    let passwordCorrect = false;
    if (!hubHasNoPassword && typeof passwordHash === 'string') {
      const stored = Buffer.from(hub.password_hash as string);
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

// POST /public/invites/:token/accept — 501 stub
publicRouter.post('/invites/:token/accept', (_req: Request, res: Response) => {
  send501(res, 'Invite acceptance');
});
