/**
 * Document routes — 8 endpoints (5 real, 3 x 501)
 */

import { Router } from 'express';
import { supabase, mapDocumentRow } from '../adapters/supabase.adapter.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, sendList, send204, send501 } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { Errors } from '../middleware/error-handler.js';
import type { Request, Response, NextFunction } from 'express';

export const documentsRouter = Router({ mergeParams: true });

documentsRouter.use(hubAccessMiddleware);
documentsRouter.use(requireStaffAccess);

// GET /hubs/:hubId/documents
documentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('hub_document')
      .select('*', { count: 'exact' })
      .eq('hub_id', hubId)
      .eq('is_proposal', false);

    if (req.query.visibility) query = query.eq('visibility', req.query.visibility);
    if (req.query.category) query = query.eq('category', req.query.category);
    if (req.query.projectId === 'unassigned') {
      query = query.is('project_id', null);
    } else if (req.query.projectId) {
      query = query.eq('project_id', req.query.projectId);
    }
    if (req.query.search) {
      // Whitelist: allow only alphanumeric, spaces, hyphens, and apostrophes
      const sanitised = String(req.query.search).replace(/[^a-zA-Z0-9 '\-]/g, '').trim();
      if (sanitised.length > 0) {
        query = query.or(`name.ilike.%${sanitised}%,description.ilike.%${sanitised}%`);
      }
    }

    const { data, count, error } = await query
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

// GET /hubs/:hubId/documents/:docId
documentsRouter.get('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('hub_document')
      .select('*')
      .eq('id', req.params.docId)
      .eq('hub_id', req.params.hubId)
      .eq('is_proposal', false)
      .single();

    if (error || !data) throw Errors.notFound('Document', req.params.docId);
    sendItem(res, mapDocumentRow(data));
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/documents/:docId
documentsRouter.patch('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates: Record<string, unknown> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.visibility !== undefined) updates.visibility = req.body.visibility;
    if (req.body.projectId !== undefined) updates.project_id = req.body.projectId;

    const { data, error } = await supabase
      .from('hub_document')
      .update(updates)
      .eq('id', req.params.docId)
      .eq('hub_id', req.params.hubId)
      .eq('is_proposal', false)
      .select('*')
      .single();

    if (error || !data) throw Errors.notFound('Document', req.params.docId);
    sendItem(res, mapDocumentRow(data));
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/documents/:docId
documentsRouter.delete('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('hub_document')
      .delete()
      .eq('id', req.params.docId)
      .eq('hub_id', req.params.hubId)
      .eq('is_proposal', false);

    if (error) throw error;
    send204(res);
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/documents/:docId/engagement — 501
documentsRouter.get('/:docId/engagement', (_req: Request, res: Response) => {
  send501(res, 'Document engagement analytics');
});

// POST /hubs/:hubId/documents/bulk
documentsRouter.post('/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentIds, action, visibility, category } = req.body;
    if (!documentIds?.length || !action) throw Errors.badRequest('documentIds and action are required');

    let updated = 0;
    if (action === 'delete') {
      const { count } = await supabase
        .from('hub_document')
        .delete()
        .in('id', documentIds)
        .eq('hub_id', req.params.hubId)
        .eq('is_proposal', false);
      updated = count || 0;
    } else if (action === 'set_visibility' && visibility) {
      const { count } = await supabase
        .from('hub_document')
        .update({ visibility })
        .in('id', documentIds)
        .eq('hub_id', req.params.hubId)
        .eq('is_proposal', false);
      updated = count || 0;
    } else if (action === 'set_category' && category) {
      const { count } = await supabase
        .from('hub_document')
        .update({ category })
        .in('id', documentIds)
        .eq('hub_id', req.params.hubId)
        .eq('is_proposal', false);
      updated = count || 0;
    }

    sendItem(res, { updated });
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/documents (upload) — 501
documentsRouter.post('/', (_req: Request, res: Response) => {
  send501(res, 'Document file upload');
});
