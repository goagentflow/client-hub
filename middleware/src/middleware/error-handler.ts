import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { logger } from '../utils/logger.js';

/**
 * Custom application error with code
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Common error factory functions
 */
export const Errors = {
  notFound: (resource: string, id?: string | string[]): AppError => {
    const idStr = Array.isArray(id) ? id[0] : id;
    return new AppError('NOT_FOUND', idStr ? `${resource} with ID '${idStr}' not found` : `${resource} not found`, 404, idStr ? {
      [`${resource.toLowerCase()}Id`]: idStr,
    } : undefined);
  },

  unauthorized: (message = 'Invalid or expired token'): AppError =>
    new AppError('UNAUTHENTICATED', message, 401),

  forbidden: (message = 'Access denied'): AppError => new AppError('FORBIDDEN', message, 403),

  badRequest: (message: string, details?: Record<string, unknown>): AppError =>
    new AppError('VALIDATION_ERROR', message, 400, details),

  tenantMismatch: (hubTenant: string, userTenant: string): AppError =>
    new AppError('FORBIDDEN', 'Hub does not belong to your tenant', 403, {
      hubTenant,
      userTenant,
    }),

  graphError: (message: string): AppError =>
    new AppError('INTERNAL_ERROR', message, 502),

  rateLimited: (): AppError => new AppError('RATE_LIMITED', 'Too many requests', 429),
};

/**
 * Global error handler middleware — flat error shape matching frontend ApiError
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const correlationId = req.correlationId || 'unknown';

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.warn({ correlationId, issues: err.issues }, 'Validation error');
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: { issues: err.issues },
      correlationId,
    });
    return;
  }

  // Handle Multer upload errors
  if (err instanceof multer.MulterError) {
    logger.warn({ correlationId, code: err.code, message: err.message }, 'Upload validation error');
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File exceeds 50 MB size limit'
      : err.message || 'Upload validation failed';

    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message,
      correlationId,
    });
    return;
  }

  // Handle application errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ correlationId, err }, 'Application error');
    } else {
      logger.warn({ correlationId, code: err.code, message: err.message }, 'Client error');
    }

    const body: Record<string, unknown> = {
      code: err.code,
      message: err.message,
      correlationId,
    };
    if (err.details !== undefined) {
      body.details = err.details;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // Handle unexpected errors
  logger.error({ correlationId, err }, 'Unexpected error');
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    correlationId,
  });
}
