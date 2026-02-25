/**
 * Document routes — 9 endpoints (7 real, 2 x 501)
 */

import crypto from 'node:crypto';
import { Router } from 'express';
import { mapDocument } from '../db/document.mapper.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { sendItem, sendList, send204, send501 } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { Errors } from '../middleware/error-handler.js';
import { uploadDocumentObject, createDownloadUrl, deleteDocumentObject, isSupabaseStorageRef } from '../services/storage.service.js';
import { logger } from '../utils/logger.js';
import type { Request, Response, NextFunction } from 'express';

export const documentsRouter = Router({ mergeParams: true });

documentsRouter.use(hubAccessMiddleware);
documentsRouter.use(requireStaffAccess);

const VALID_DOCUMENT_CATEGORIES = new Set([
  'proposal',
  'contract',
  'reference',
  'brief',
  'deliverable',
  'other',
]);
const VALID_VISIBILITY = new Set(['client', 'internal']);

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
    // Fetch doc first to capture storage ref for cleanup
    const existing = await req.repo!.hubDocument.findFirst({
      where: { id: req.params.docId, hubId: req.params.hubId, isProposal: false },
      select: { id: true, downloadUrl: true },
    });
    if (!existing) throw Errors.notFound('Document', req.params.docId);

    await req.repo!.hubDocument.delete({
      where: { id: req.params.docId },
    });

    // Clean up storage (fire-and-forget)
    if (isSupabaseStorageRef(existing.downloadUrl)) {
      deleteDocumentObject(existing.downloadUrl).catch((err) =>
        logger.error({ err }, 'Failed to delete file from storage'),
      );
    }

    send204(res);
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/documents/:docId/download
documentsRouter.get('/:docId/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await req.repo!.hubDocument.findFirst({
      where: { id: req.params.docId, hubId: req.params.hubId, isProposal: false },
      select: { id: true, downloadUrl: true, downloads: true },
    });
    if (!doc) throw Errors.notFound('Document', req.params.docId);

    const signedUrl = await createDownloadUrl(doc.downloadUrl);

    // Increment download counter (fire-and-forget)
    req.repo!.hubDocument.update({
      where: { id: doc.id },
      data: { downloads: { increment: 1 } },
    }).catch((err: unknown) => logger.error({ err }, 'Failed to increment download count'));

    res.json({ url: signedUrl });
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
      // Capture storage refs before deleting
      const docsToDelete = await req.repo!.hubDocument.findMany({
        where: baseWhere,
        select: { downloadUrl: true },
      });
      const result = await req.repo!.hubDocument.deleteMany({ where: baseWhere });
      updated = result.count;

      // Best-effort storage cleanup
      for (const doc of docsToDelete) {
        if (isSupabaseStorageRef(doc.downloadUrl)) {
          deleteDocumentObject(doc.downloadUrl).catch((err) =>
            logger.error({ err }, 'Failed to delete file from storage (bulk)'),
          );
        }
      }
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

// POST /hubs/:hubId/documents (upload)
documentsRouter.post('/', uploadMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw Errors.badRequest('No file provided');

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const category = typeof req.body.category === 'string' ? req.body.category : '';
    const visibility = typeof req.body.visibility === 'string' ? req.body.visibility : '';
    const descriptionRaw = req.body.description;

    if (!name || !category || !visibility) {
      throw Errors.badRequest('name, category, and visibility are required');
    }
    if (!VALID_DOCUMENT_CATEGORIES.has(category)) {
      throw Errors.badRequest(`category must be one of: ${Array.from(VALID_DOCUMENT_CATEGORIES).join(', ')}`);
    }
    if (!VALID_VISIBILITY.has(visibility)) {
      throw Errors.badRequest(`visibility must be one of: ${Array.from(VALID_VISIBILITY).join(', ')}`);
    }
    if (descriptionRaw !== undefined && descriptionRaw !== null && typeof descriptionRaw !== 'string') {
      throw Errors.badRequest('description must be a string');
    }
    const description = typeof descriptionRaw === 'string' ? (descriptionRaw.trim() || null) : null;

    const hubId = req.params.hubId as string;
    const tenantId = req.user!.tenantId;
    const docId = crypto.randomUUID();

    // Upload to Supabase Storage
    const storageRef = await uploadDocumentObject({
      tenantId,
      hubId,
      docId,
      fileName: req.file.originalname,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    // Create DB row — rollback storage on failure
    let doc;
    try {
      doc = await req.repo!.hubDocument.create({
        data: {
          id: docId,
          hubId,
          tenantId,
          name,
          description,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          category,
          visibility,
          uploadedBy: req.user!.userId,
          uploadedByName: req.user!.name,
          downloadUrl: storageRef,
        },
      });
    } catch (dbErr) {
      // Attempt to clean up the uploaded file
      deleteDocumentObject(storageRef).catch((err) =>
        logger.error({ err }, 'Failed to rollback storage after DB error'),
      );
      throw dbErr;
    }

    sendItem(res, mapDocument(doc), 201);
  } catch (err) {
    next(err);
  }
});
