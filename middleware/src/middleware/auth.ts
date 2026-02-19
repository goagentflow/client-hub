/**
 * Auth middleware
 *
 * DEMO_MODE=true: reads X-Dev-User-Email header, derives role server-side.
 * DEMO_MODE=false: validates Bearer JWT via MSAL (not yet implemented).
 */

import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { UserContext } from '../types/api.js';

const PORTAL_ISSUER = 'agentflow';
const PORTAL_AUDIENCE = 'agentflow-portal';
const portalSecret = new TextEncoder().encode(env.PORTAL_TOKEN_SECRET);

// Extend Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: UserContext;
    }
  }
}

// Demo user mapping — role is derived server-side, never from client headers
const DEMO_USERS: Record<string, UserContext> = {
  'hamish@goagentflow.com': {
    userId: 'user-staff-1',
    tenantId: 'tenant-agentflow',
    email: 'hamish@goagentflow.com',
    name: 'Hamish Nicklin',
    isStaff: true,
  },
  'sarah@whitmorelaw.co.uk': {
    userId: 'user-client-1',
    tenantId: 'tenant-whitmore',
    email: 'sarah@whitmorelaw.co.uk',
    name: 'Sarah Mitchell',
    isStaff: false,
  },
  'alex@meridiandigital.co': {
    userId: 'user-client-2',
    tenantId: 'tenant-meridian',
    email: 'alex@meridiandigital.co',
    name: 'Alex Chen',
    isStaff: false,
  },
};

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Check for Bearer token (portal JWT)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, portalSecret, {
        issuer: PORTAL_ISSUER,
        audience: PORTAL_AUDIENCE,
      });
      // Manual assertion: sub must be a string (hub UUID) and type must be 'portal'
      if (payload.type === 'portal' && typeof payload.sub === 'string') {
        req.user = {
          userId: `portal-${payload.sub}`,
          email: '',
          name: 'Portal User',
          tenantId: `portal-${payload.sub}`,
          isStaff: false,
          portalHubId: payload.sub,
        };
        next();
        return;
      }
      // Not a portal token (wrong type/missing sub) — fall through
    } catch {
      // Invalid/expired/bad-signature token — fall through to demo header check
    }
  }

  if (env.DEMO_MODE) {
    return handleDemoAuth(req, res, next);
  }
  return handleJwtAuth(req, res, next);
}

function handleDemoAuth(req: Request, res: Response, next: NextFunction): void {
  const email = req.headers['x-dev-user-email'] as string | undefined;

  if (!email) {
    res.status(401).json({
      code: 'UNAUTHENTICATED',
      message: 'Missing X-Dev-User-Email header',
      correlationId: req.correlationId,
    });
    return;
  }

  const user = DEMO_USERS[email.toLowerCase()];
  if (!user) {
    logger.warn({ email }, 'Unknown demo user');
    res.status(401).json({
      code: 'UNAUTHENTICATED',
      message: `Unknown demo user: ${email}`,
      correlationId: req.correlationId,
    });
    return;
  }

  req.user = user;
  next();
}

function handleJwtAuth(req: Request, res: Response, _next: NextFunction): void {
  // TODO: Implement MSAL JWT validation when DEMO_MODE=false
  res.status(501).json({
    code: 'NOT_IMPLEMENTED',
    message: 'JWT authentication is not yet available. Set DEMO_MODE=true.',
    correlationId: req.correlationId,
  });
}
