/**
 * Portal routes — client-facing endpoints
 * All return PaginatedList<T> with visibility=client filter
 */

import { Router } from 'express';
import { supabase, mapVideoRow, mapDocumentRow, mapProposalRow } from '../adapters/supabase.adapter.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { sendItem, sendList, send501 } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import type { Request, Response, NextFunction } from 'express';

export const portalRouter = Router({ mergeParams: true });

portalRouter.use(hubAccessMiddleware);

// GET /hubs/:hubId/portal/videos
portalRouter.get('/videos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);
    const offset = (page - 1) * pageSize;

    const { data, count, error } = await supabase
      .from('hub_video')
      .select('*', { count: 'exact' })
      .eq('hub_id', hubId)
      .eq('visibility', 'client')
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const totalItems = count || 0;
    sendList(res, (data || []).map(mapVideoRow), {
      page, pageSize, totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/portal/documents
portalRouter.get('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);
    const offset = (page - 1) * pageSize;

    const { data, count, error } = await supabase
      .from('hub_document')
      .select('*', { count: 'exact' })
      .eq('hub_id', hubId)
      .eq('visibility', 'client')
      .eq('is_proposal', false)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const totalItems = count || 0;
    sendList(res, (data || []).map(mapDocumentRow), {
      page, pageSize, totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/portal/proposal
portalRouter.get('/proposal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('hub_document')
      .select('*')
      .eq('hub_id', req.params.hubId)
      .eq('is_proposal', true)
      .eq('visibility', 'client')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    sendItem(res, data ? mapProposalRow(data) : null);
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/portal/proposal/comment — 501
portalRouter.post('/proposal/comment', (_req: Request, res: Response) => {
  send501(res, 'Proposal comments');
});

// GET /hubs/:hubId/portal/messages — 501
portalRouter.get('/messages', (_req: Request, res: Response) => {
  send501(res, 'Portal messages');
});

// POST /hubs/:hubId/portal/messages — 501
portalRouter.post('/messages', (_req: Request, res: Response) => {
  send501(res, 'Portal message sending');
});

// GET /hubs/:hubId/portal/meetings — 501
portalRouter.get('/meetings', (_req: Request, res: Response) => {
  send501(res, 'Portal meetings');
});

// GET /hubs/:hubId/portal/members — 501
portalRouter.get('/members', (_req: Request, res: Response) => {
  send501(res, 'Portal members');
});

// POST /hubs/:hubId/portal/invite — 501
portalRouter.post('/invite', (_req: Request, res: Response) => {
  send501(res, 'Portal invite');
});

// GET /hubs/:hubId/portal/questionnaires — 501
portalRouter.get('/questionnaires', (_req: Request, res: Response) => {
  send501(res, 'Portal questionnaires');
});
