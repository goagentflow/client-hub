/**
 * Portal routes — client-facing endpoints
 * All return PaginatedList<T> with visibility=client filter
 */

import { Router } from 'express';
import { mapVideo } from '../db/video.mapper.js';
import { mapDocument, mapProposal } from '../db/document.mapper.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { sendItem, sendList, send501 } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { queryStatusUpdates, mapStatusUpdateForPortal } from '../services/status-update-queries.js';
import type { Request, Response, NextFunction } from 'express';

export const portalRouter = Router({ mergeParams: true });

portalRouter.use(hubAccessMiddleware);

// GET /hubs/:hubId/portal/videos
portalRouter.get('/videos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);

    const [videos, totalItems] = await Promise.all([
      req.repo!.hubVideo.findMany({
        where: { hubId, visibility: 'client' },
        orderBy: { uploadedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      req.repo!.hubVideo.count({ where: { hubId, visibility: 'client' } }),
    ]);

    sendList(res, videos.map(mapVideo), {
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

    const where = { hubId, visibility: 'client', isProposal: false };

    const [docs, totalItems] = await Promise.all([
      req.repo!.hubDocument.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      req.repo!.hubDocument.count({ where }),
    ]);

    sendList(res, docs.map(mapDocument), {
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
    const doc = await req.repo!.hubDocument.findFirst({
      where: { hubId: req.params.hubId, isProposal: true, visibility: 'client' },
      orderBy: { uploadedAt: 'desc' },
    });

    sendItem(res, doc ? mapProposal(doc) : null);
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

// GET /hubs/:hubId/portal/status-updates
portalRouter.get('/status-updates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const result = await queryStatusUpdates(req.repo!, hubId, req.query as Record<string, unknown>);
    sendList(res, result.items.map(mapStatusUpdateForPortal), {
      page: result.page,
      pageSize: result.pageSize,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
});
