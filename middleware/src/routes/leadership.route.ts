/**
 * Leadership routes — 5 endpoints (2 real, 3 x 501)
 * All admin-guarded. Uses adminRepo for cross-tenant queries.
 */

import { Router } from 'express';
import { requireAdmin } from '../middleware/require-admin.js';
import { sendItem, send501 } from '../utils/response.js';
import type { Request, Response, NextFunction } from 'express';

export const leadershipRouter = Router();

leadershipRouter.use(requireAdmin);

// GET /leadership/portfolio
leadershipRouter.get('/portfolio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await req.adminRepo!.hub.findMany({
      where: { hubType: 'client' },
      select: { id: true, hubType: true, status: true, lastActivity: true },
    });

    const now = new Date().toISOString();

    sendItem(res, {
      totalClients: clients.length,
      atRiskCount: 0,
      expansionReadyCount: 0,
      avgHealthScore: 0,
      dataStaleTimestamp: now,
      lastCalculatedAt: now,
      lastRefreshedAt: now,
    });
  } catch (err) {
    next(err);
  }
});

// GET /leadership/clients
leadershipRouter.get('/clients', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubs = await req.adminRepo!.hub.findMany({
      where: { hubType: 'client' },
      select: { id: true, companyName: true, lastActivity: true },
      orderBy: { lastActivity: 'desc' },
    });

    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clients = hubs.map((hub: any) => ({
      hubId: hub.id,
      name: hub.companyName,
      healthScore: 0,
      healthStatus: 'stable' as const,
      expansionPotential: null,
      lastActivity: hub.lastActivity?.toISOString() || now,
    }));

    sendItem(res, {
      clients,
      dataStaleTimestamp: now,
      lastCalculatedAt: now,
      lastRefreshedAt: now,
    });
  } catch (err) {
    next(err);
  }
});

// GET /leadership/at-risk — 501
leadershipRouter.get('/at-risk', (_req: Request, res: Response) => {
  send501(res, 'At-risk clients');
});

// GET /leadership/expansion — 501
leadershipRouter.get('/expansion', (_req: Request, res: Response) => {
  send501(res, 'Expansion opportunities');
});

// POST /leadership/refresh — 501
leadershipRouter.post('/refresh', (_req: Request, res: Response) => {
  send501(res, 'Portfolio data refresh');
});
