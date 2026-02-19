/**
 * Proposal routes — 7 endpoints (3 real, 4 x 501)
 * Proposals are stored as hub_document rows with is_proposal=true
 */

import { Router } from 'express';
import { supabase, mapProposalRow } from '../adapters/supabase.adapter.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, send204, send501 } from '../utils/response.js';
import type { Request, Response, NextFunction } from 'express';

export const proposalsRouter = Router({ mergeParams: true });

proposalsRouter.use(hubAccessMiddleware);
proposalsRouter.use(requireStaffAccess);

// GET /hubs/:hubId/proposal
proposalsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('hub_document')
      .select('*')
      .eq('hub_id', req.params.hubId)
      .eq('is_proposal', true)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    sendItem(res, data ? mapProposalRow(data) : null);
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/proposal
proposalsRouter.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('hub_document')
      .delete()
      .eq('hub_id', req.params.hubId)
      .eq('is_proposal', true);

    if (error) throw error;
    send204(res);
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/proposal/settings
proposalsRouter.patch('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates: Record<string, unknown> = {};
    if (req.body.isClientVisible !== undefined) {
      updates.visibility = req.body.isClientVisible ? 'client' : 'internal';
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('hub_document')
        .update(updates)
        .eq('hub_id', req.params.hubId)
        .eq('is_proposal', true);
    }

    // Return updated proposal
    const { data, error } = await supabase
      .from('hub_document')
      .select('*')
      .eq('hub_id', req.params.hubId)
      .eq('is_proposal', true)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    sendItem(res, data ? mapProposalRow(data) : null);
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/proposal/engagement — 501
proposalsRouter.get('/engagement', (_req: Request, res: Response) => {
  send501(res, 'Proposal engagement analytics');
});

// POST /hubs/:hubId/proposal (upload) — 501
proposalsRouter.post('/', (_req: Request, res: Response) => {
  send501(res, 'Proposal file upload');
});
