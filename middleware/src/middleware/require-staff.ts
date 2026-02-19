/**
 * Staff access guard middleware
 *
 * Blocks portal/client users from staff-only endpoints.
 * Returns 403 for non-staff users.
 */

import { Request, Response, NextFunction } from 'express';

export function requireStaffAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isStaff) {
    res.status(403).json({
      code: 'FORBIDDEN',
      message: 'This endpoint requires staff access',
      correlationId: req.correlationId,
    });
    return;
  }
  next();
}
