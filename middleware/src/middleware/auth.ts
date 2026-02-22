/**
 * Auth middleware
 *
 * Bearer token flow:
 *   1. Try portal JWT (HS256, type=portal) → portal user context
 *   2. Try Azure AD JWT (RS256, JWKS) → staff/client user context
 *   3. Fall through to demo header (AUTH_MODE=demo only) or 401
 *
 * AUTH_MODE=demo: also accepts X-Dev-User-Email header for dev/test.
 * AUTH_MODE=azure_ad: requires real Azure AD JWT.
 */

import { Request, Response, NextFunction } from 'express';
import { jwtVerify, createRemoteJWKSet, createLocalJWKSet } from 'jose';
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

// JWKS resolver — overridable for testing via setJwksResolver()
let _jwksResolver: ReturnType<typeof createRemoteJWKSet> | ReturnType<typeof createLocalJWKSet> | null = null;

/** Test-only: inject a local JWKS resolver to avoid hitting Azure AD */
export function setJwksResolver(resolver: ReturnType<typeof createRemoteJWKSet> | ReturnType<typeof createLocalJWKSet>): void {
  _jwksResolver = resolver;
}

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!_jwksResolver) {
    const uri = env.AZURE_JWKS_URI
      || `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/discovery/v2.0/keys`;
    _jwksResolver = createRemoteJWKSet(new URL(uri));
  }
  return _jwksResolver as ReturnType<typeof createRemoteJWKSet>;
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
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    // 1. Try portal JWT (HS256)
    try {
      const { payload } = await jwtVerify(token, portalSecret, {
        issuer: PORTAL_ISSUER,
        audience: PORTAL_AUDIENCE,
      });
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
    } catch {
      // Not a portal token — try Azure AD
    }

    // 2. Try Azure AD JWT (RS256 via JWKS)
    const azureResult = await handleAzureJwt(token, req, res, next);
    if (azureResult) return; // Handled (success or error response sent)

    // Bearer token present but neither portal nor Azure AD accepted it — reject immediately.
    // Do NOT fall through to demo auth: a supplied token that fails validation is an error.
    res.status(401).json({
      code: 'UNAUTHENTICATED',
      message: 'Invalid or expired Bearer token',
      correlationId: req.correlationId,
    });
    return;
  }

  // 3. Demo mode fallback: X-Dev-User-Email header (only when no Bearer token provided)
  if (env.AUTH_MODE === 'demo') {
    return handleDemoAuth(req, res, next);
  }

  // No valid auth
  res.status(401).json({
    code: 'UNAUTHENTICATED',
    message: 'Missing or invalid authentication',
    correlationId: req.correlationId,
  });
}

/**
 * Validate Azure AD JWT. Returns true if handled (success or error sent).
 * Returns false if token is not a valid Azure AD JWT (fall through).
 */
async function handleAzureJwt(
  token: string, req: Request, res: Response, next: NextFunction
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: [
        `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/v2.0`,
        `https://sts.windows.net/${env.AZURE_TENANT_ID}/`,
      ],
      audience: [env.AZURE_CLIENT_ID, `api://${env.AZURE_CLIENT_ID}`],
    });

    const userId = payload.oid as string;
    const email = (payload.preferred_username || payload.upn || payload.email || '') as string;
    const name = (payload.name || email) as string;
    const tenantId = payload.tid as string;

    if (!userId || !tenantId) {
      res.status(401).json({
        code: 'UNAUTHENTICATED',
        message: 'Invalid token claims',
        correlationId: req.correlationId,
      });
      return true;
    }

    const roles = (payload.roles || []) as string[];
    const isStaff = roles.includes(env.STAFF_ROLE_NAME);

    req.user = { userId, email, name, tenantId, isStaff };
    next();
    return true;
  } catch (err: unknown) {
    const e = err as Record<string, unknown>;
    logger.debug({ errorCode: e.code, message: e.message }, 'Azure AD JWT validation failed');
    return false;
  }
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
