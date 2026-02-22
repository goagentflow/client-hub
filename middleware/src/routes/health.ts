import { Router, type IRouter } from 'express';
import type { Request, Response } from 'express';
import { getPrisma } from '../db/prisma.js';

export const healthRouter: IRouter = Router();

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: HealthCheck[];
}

/**
 * Health check endpoint - no auth required
 * GET /health
 */
healthRouter.get('/', async (_req: Request, res: Response) => {
  const checks: HealthCheck[] = [
    { name: 'server', status: 'pass' },
  ];

  // Database connectivity check
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    checks.push({ name: 'database', status: 'pass' });
  } catch {
    checks.push({ name: 'database', status: 'fail', message: 'Database unreachable' });
  }

  const allPassing = checks.every((c) => c.status === 'pass');

  const response: HealthResponse = {
    status: allPassing ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '0.1.0',
    checks,
  };

  res.status(allPassing ? 200 : 503).json(response);
});

/**
 * Readiness probe - for Cloud Run / K8s
 * GET /health/ready
 */
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

/**
 * Liveness probe - for Cloud Run / K8s
 * GET /health/live
 */
healthRouter.get('/live', (_req: Request, res: Response) => {
  res.json({ live: true });
});
