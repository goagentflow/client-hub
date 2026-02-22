/**
 * Inject repository middleware.
 *
 * Creates a TenantRepository from req.user.tenantId and attaches it
 * to req.repo. Runs after auth middleware, before route handlers.
 * Only active when DATA_BACKEND=azure_pg.
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { getPrisma } from '../db/prisma.js';
import { createTenantRepository, type TenantRepository } from '../db/tenant-repository.js';

// Extend Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      repo?: TenantRepository;
    }
  }
}

export function injectRepository(req: Request, res: Response, next: NextFunction): void {
  if (env.DATA_BACKEND !== 'azure_pg') {
    next();
    return;
  }

  if (!req.user?.tenantId) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Missing tenant context for database access',
      correlationId: req.correlationId,
    });
    return;
  }

  req.repo = createTenantRepository(getPrisma(), req.user.tenantId);
  next();
}
