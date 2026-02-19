/**
 * Admin guard middleware
 *
 * Used on /leadership/* and /hubs/:hubId/convert routes.
 * Returns 403 for non-staff users.
 */

import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isStaff) {
    res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Leadership views require admin permissions',
      correlationId: req.correlationId,
    });
    return;
  }
  next();
}
