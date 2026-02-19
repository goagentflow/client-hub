/**
 * Video routes — 9 endpoints (6 real, 3 x 501)
 */

import { Router } from 'express';
import { supabase, mapVideoRow } from '../adapters/supabase.adapter.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, sendList, send204, send501 } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { Errors } from '../middleware/error-handler.js';
import type { Request, Response, NextFunction } from 'express';

export const videosRouter = Router({ mergeParams: true });

videosRouter.use(hubAccessMiddleware);
videosRouter.use(requireStaffAccess);

// GET /hubs/:hubId/videos
videosRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);
    const offset = (page - 1) * pageSize;

    let query = supabase.from('hub_video').select('*', { count: 'exact' }).eq('hub_id', hubId);

    if (req.query.visibility) query = query.eq('visibility', req.query.visibility);
    if (req.query.projectId === 'unassigned') {
      query = query.is('project_id', null);
    } else if (req.query.projectId) {
      query = query.eq('project_id', req.query.projectId);
    }

    const { data, count, error } = await query
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

// GET /hubs/:hubId/videos/:videoId
videosRouter.get('/:videoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('hub_video')
      .select('*')
      .eq('id', req.params.videoId)
      .eq('hub_id', req.params.hubId)
      .single();

    if (error || !data) throw Errors.notFound('Video', req.params.videoId);
    sendItem(res, mapVideoRow(data));
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/videos/link
videosRouter.post('/link', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, url, description, visibility } = req.body;
    if (!title || !url) throw Errors.badRequest('title and url are required');

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('hub_video')
      .insert({
        hub_id: req.params.hubId,
        title,
        source_type: 'link',
        source_url: url,
        description: description || null,
        visibility: visibility || 'client',
        uploaded_at: now,
        uploaded_by: req.user.userId,
        uploaded_by_name: req.user.name,
        views: 0,
      })
      .select('*')
      .single();

    if (error) throw error;
    sendItem(res, mapVideoRow(data), 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/videos/:videoId
videosRouter.patch('/:videoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates: Record<string, unknown> = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.visibility !== undefined) updates.visibility = req.body.visibility;
    if (req.body.projectId !== undefined) updates.project_id = req.body.projectId;

    const { data, error } = await supabase
      .from('hub_video')
      .update(updates)
      .eq('id', req.params.videoId)
      .eq('hub_id', req.params.hubId)
      .select('*')
      .single();

    if (error || !data) throw Errors.notFound('Video', req.params.videoId);
    sendItem(res, mapVideoRow(data));
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/videos/:videoId
videosRouter.delete('/:videoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('hub_video')
      .delete()
      .eq('id', req.params.videoId)
      .eq('hub_id', req.params.hubId);

    if (error) throw error;
    send204(res);
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/videos/:videoId/engagement — 501
videosRouter.get('/:videoId/engagement', (_req: Request, res: Response) => {
  send501(res, 'Video engagement analytics');
});

// POST /hubs/:hubId/videos/bulk
videosRouter.post('/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoIds, action, visibility } = req.body;
    if (!videoIds?.length || !action) throw Errors.badRequest('videoIds and action are required');

    let updated = 0;
    if (action === 'delete') {
      const { count } = await supabase
        .from('hub_video')
        .delete()
        .in('id', videoIds)
        .eq('hub_id', req.params.hubId);
      updated = count || 0;
    } else if (action === 'set_visibility' && visibility) {
      const { count } = await supabase
        .from('hub_video')
        .update({ visibility })
        .in('id', videoIds)
        .eq('hub_id', req.params.hubId);
      updated = count || 0;
    }

    sendItem(res, { updated });
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/videos (upload) — 501
videosRouter.post('/', (_req: Request, res: Response) => {
  send501(res, 'Video file upload');
});
