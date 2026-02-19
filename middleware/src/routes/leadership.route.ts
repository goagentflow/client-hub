/**
 * Leadership routes — 5 endpoints (2 real, 3 x 501)
 * All admin-guarded.
 */

import { Router } from 'express';
import { supabase } from '../adapters/supabase.adapter.js';
import { HUB_SELECT } from '../adapters/hub-columns.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { sendItem, send501 } from '../utils/response.js';
import type { Request, Response, NextFunction } from 'express';

export const leadershipRouter = Router();

leadershipRouter.use(requireAdmin);

// GET /leadership/portfolio
leadershipRouter.get('/portfolio', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Aggregate hub stats
    const { data: allHubs, error } = await supabase
      .from('hub')
      .select('id, hub_type, status, last_activity')
      .eq('hub_type', 'client');

    if (error) throw error;

    const clients = allHubs || [];
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
leadershipRouter.get('/clients', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('hub')
      .select(HUB_SELECT)
      .eq('hub_type', 'client')
      .order('last_activity', { ascending: false });

    if (error) throw error;

    const now = new Date().toISOString();
    const clients = (data || []).map((hub: Record<string, unknown>) => ({
      hubId: hub.id,
      name: hub.company_name,
      healthScore: 0,
      healthStatus: 'stable' as const,
      expansionPotential: null,
      lastActivity: hub.last_activity || now,
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
