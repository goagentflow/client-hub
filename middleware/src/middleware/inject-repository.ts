/**
 * Inject repository middleware.
 *
 * Creates a TenantRepository from req.user.tenantId and attaches it
 * to req.repo. Also creates an AdminRepository on req.adminRepo.
 * Runs after auth middleware, before route handlers.
 */

import { Request, Response, NextFunction } from 'express';
import { getPrisma } from '../db/prisma.js';
import { createTenantRepository, type TenantRepository } from '../db/tenant-repository.js';
import { createAdminRepository, type AdminRepository } from '../db/admin-repository.js';

// Extend Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      repo?: TenantRepository;
      adminRepo?: AdminRepository;
    }
  }
}

export function injectRepository(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.tenantId) {
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Missing tenant context for database access',
      correlationId: req.correlationId,
    });
    return;
  }

  const prisma = getPrisma();
  req.repo = createTenantRepository(prisma, req.user.tenantId);
  req.adminRepo = createAdminRepository(prisma, req.user.userId);
  next();
}
