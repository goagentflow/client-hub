/**
 * Document routes — 8 endpoints (5 real, 3 x 501)
 */

import { Router } from 'express';
import { mapDocument } from '../db/document.mapper.js';
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { hubId, isProposal: false };

    if (req.query.visibility) where.visibility = String(req.query.visibility);
    if (req.query.category) where.category = String(req.query.category);
    if (req.query.projectId === 'unassigned') {
      where.projectId = null;
    } else if (req.query.projectId) {
      where.projectId = String(req.query.projectId);
    }
    if (req.query.search) {
      const sanitised = String(req.query.search).replace(/[^a-zA-Z0-9 '-]/g, '').trim();
      if (sanitised.length > 0) {
        where.OR = [
          { name: { contains: sanitised, mode: 'insensitive' } },
          { description: { contains: sanitised, mode: 'insensitive' } },
        ];
      }
    }

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

// GET /hubs/:hubId/documents/:docId
documentsRouter.get('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await req.repo!.hubDocument.findFirst({
      where: { id: req.params.docId, hubId: req.params.hubId, isProposal: false },
    });
    if (!doc) throw Errors.notFound('Document', req.params.docId);
    sendItem(res, mapDocument(doc));
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/documents/:docId
documentsRouter.patch('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.category !== undefined) data.category = req.body.category;
    if (req.body.visibility !== undefined) data.visibility = req.body.visibility;
    if (req.body.projectId !== undefined) data.projectId = req.body.projectId;

    // Verify doc exists and belongs to this hub before updating
    const existing = await req.repo!.hubDocument.findFirst({
      where: { id: req.params.docId, hubId: req.params.hubId, isProposal: false },
      select: { id: true },
    });
    if (!existing) throw Errors.notFound('Document', req.params.docId);

    const doc = await req.repo!.hubDocument.update({
      where: { id: req.params.docId },
      data,
    });

    sendItem(res, mapDocument(doc));
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/documents/:docId
documentsRouter.delete('/:docId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify doc exists and belongs to this hub before deleting
    const existing = await req.repo!.hubDocument.findFirst({
      where: { id: req.params.docId, hubId: req.params.hubId, isProposal: false },
      select: { id: true },
    });
    if (!existing) throw Errors.notFound('Document', req.params.docId);

    await req.repo!.hubDocument.delete({
      where: { id: req.params.docId },
    });

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

    const baseWhere = { id: { in: documentIds }, hubId: req.params.hubId, isProposal: false };
    let updated = 0;

    if (action === 'delete') {
      const result = await req.repo!.hubDocument.deleteMany({ where: baseWhere });
      updated = result.count;
    } else if (action === 'set_visibility' && visibility) {
      const result = await req.repo!.hubDocument.updateMany({ where: baseWhere, data: { visibility } });
      updated = result.count;
    } else if (action === 'set_category' && category) {
      const result = await req.repo!.hubDocument.updateMany({ where: baseWhere, data: { category } });
      updated = result.count;
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
