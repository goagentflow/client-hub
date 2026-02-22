/**
 * Video routes — 9 endpoints (6 real, 3 x 501)
 */

import { Router } from 'express';
import { mapVideo } from '../db/video.mapper.js';
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { hubId };

    if (req.query.visibility) where.visibility = String(req.query.visibility);
    if (req.query.projectId === 'unassigned') {
      where.projectId = null;
    } else if (req.query.projectId) {
      where.projectId = String(req.query.projectId);
    }

    const [videos, totalItems] = await Promise.all([
      req.repo!.hubVideo.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      req.repo!.hubVideo.count({ where }),
    ]);

    sendList(res, videos.map(mapVideo), {
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
    const video = await req.repo!.hubVideo.findFirst({
      where: { id: req.params.videoId, hubId: req.params.hubId },
    });
    if (!video) throw Errors.notFound('Video', req.params.videoId);
    sendItem(res, mapVideo(video));
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/videos/link
videosRouter.post('/link', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, url, description, visibility } = req.body;
    if (!title || !url) throw Errors.badRequest('title and url are required');

    const video = await req.repo!.hubVideo.create({
      data: {
        hubId: req.params.hubId,
        title,
        sourceType: 'link',
        sourceUrl: url,
        description: description || null,
        visibility: visibility || 'client',
        uploadedBy: req.user.userId,
        uploadedByName: req.user.name,
        views: 0,
      },
    });

    sendItem(res, mapVideo(video), 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/videos/:videoId
videosRouter.patch('/:videoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.visibility !== undefined) data.visibility = req.body.visibility;
    if (req.body.projectId !== undefined) data.projectId = req.body.projectId;

    // Verify video exists and belongs to this hub before updating
    const existing = await req.repo!.hubVideo.findFirst({
      where: { id: req.params.videoId, hubId: req.params.hubId },
      select: { id: true },
    });
    if (!existing) throw Errors.notFound('Video', req.params.videoId);

    const video = await req.repo!.hubVideo.update({
      where: { id: req.params.videoId },
      data,
    });

    sendItem(res, mapVideo(video));
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/videos/:videoId
videosRouter.delete('/:videoId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await req.repo!.hubVideo.findFirst({
      where: { id: req.params.videoId, hubId: req.params.hubId },
      select: { id: true },
    });
    if (!existing) throw Errors.notFound('Video', req.params.videoId);

    await req.repo!.hubVideo.delete({
      where: { id: req.params.videoId },
    });

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

    const baseWhere = { id: { in: videoIds }, hubId: req.params.hubId };
    let updated = 0;

    if (action === 'delete') {
      const result = await req.repo!.hubVideo.deleteMany({ where: baseWhere });
      updated = result.count;
    } else if (action === 'set_visibility' && visibility) {
      const result = await req.repo!.hubVideo.updateMany({ where: baseWhere, data: { visibility } });
      updated = result.count;
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
