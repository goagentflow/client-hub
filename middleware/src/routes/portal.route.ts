/**
 * Portal routes — client-facing endpoints
 * All return PaginatedList<T> with visibility=client filter
 */

import { Router } from 'express';
import { URL } from 'node:url';
import rateLimit from 'express-rate-limit';
import { mapVideo } from '../db/video.mapper.js';
import { mapProposal, mapDocumentForPortal } from '../db/document.mapper.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { createDownloadUrl, DEFAULT_SIGNED_URL_EXPIRY } from '../services/storage.service.js';
import { sendClientReplyNotification } from '../services/email.service.js';
import { sendItem, sendList, send501 } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { queryStatusUpdates, mapStatusUpdateForPortal } from '../services/status-update-queries.js';
import { queryMessages, mapMessageForPortal } from '../services/message-queries.js';
import { logger } from '../utils/logger.js';
import { Errors } from '../middleware/error-handler.js';
import { env } from '../config/env.js';
import type { Request, Response, NextFunction } from 'express';

export const portalRouter = Router({ mergeParams: true });

portalRouter.use(hubAccessMiddleware);

const MAX_MESSAGE_LENGTH = 10000;
const PREVIEW_LENGTH = 200;

const portalPostLimiter = rateLimit({
  windowMs: 60_000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.user.portalHubId || req.params.hubId}:${(req.user.email || '').toLowerCase()}`,
  message: { code: 'RATE_LIMITED', message: 'Too many messages, please try again shortly' },
});

function validateMessageBody(value: unknown): string {
  if (typeof value !== 'string') throw Errors.badRequest('body must be a string');
  const trimmed = value.trim();
  if (!trimmed) throw Errors.badRequest('body is required');
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw Errors.badRequest(`body must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
  }
  return trimmed;
}

function extractMessageBody(payload: unknown): unknown {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return undefined;

  const body = (payload as Record<string, unknown>).body;
  if (typeof body === 'string') return body;

  const bodyHtml = (payload as Record<string, unknown>).bodyHtml;
  if (typeof bodyHtml === 'string') {
    // Backward compatibility for older clients that still send bodyHtml.
    return bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return body;
}

function previewFromBody(body: string): string {
  return body.replace(/\s+/g, ' ').trim().slice(0, PREVIEW_LENGTH);
}

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

    sendList(res, docs.map(mapDocumentForPortal), {
      page, pageSize, totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/portal/documents/:docId/download
portalRouter.get('/documents/:docId/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await req.repo!.hubDocument.findFirst({
      where: {
        id: req.params.docId,
        hubId: req.params.hubId,
        visibility: 'client',
        isProposal: false,
      },
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

// GET /hubs/:hubId/portal/documents/:docId/preview
portalRouter.get('/documents/:docId/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await req.repo!.hubDocument.findFirst({
      where: {
        id: req.params.docId,
        hubId: req.params.hubId,
        visibility: 'client',
        isProposal: false,
      },
      select: { id: true, downloadUrl: true },
    });
    if (!doc) throw Errors.notFound('Document', req.params.docId);

    const signedUrl = await createDownloadUrl(doc.downloadUrl);
    const expiresAt = new Date(Date.now() + DEFAULT_SIGNED_URL_EXPIRY * 1000).toISOString();

    res.json({ url: signedUrl, expiresAt });
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

    sendItem(res, doc ? mapProposal(doc, { portal: true }) : null);
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/portal/proposal/comment — 501
portalRouter.post('/proposal/comment', (_req: Request, res: Response) => {
  send501(res, 'Proposal comments');
});

// GET /hubs/:hubId/portal/messages
portalRouter.get('/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await queryMessages(req.repo!, req.params.hubId as string, req.query as Record<string, unknown>);
    sendList(res, result.items.map(mapMessageForPortal), {
      page: result.page,
      pageSize: result.pageSize,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/portal/messages
portalRouter.post('/messages', portalPostLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user.portalHubId) {
      throw Errors.forbidden('Portal token required');
    }

    const senderEmail = req.user.email?.trim().toLowerCase();
    if (!senderEmail) {
      throw Errors.forbidden('Posting requires a verified email session');
    }
    const senderName = req.user.name?.trim() || senderEmail.split('@')[0] || 'Portal User';
    const body = validateMessageBody(extractMessageBody(req.body));
    const hubId = req.params.hubId as string;

    const created = await req.repo!.hubMessage.create({
      data: {
        hubId,
        senderType: 'portal_client',
        senderEmail,
        senderName,
        body,
      },
    }) as {
      id: string;
      hubId: string;
      senderType: string;
      senderEmail: string;
      senderName: string;
      body: string;
      createdAt: Date;
    };

    req.repo!.hub.update({
      where: { id: hubId },
      data: { lastActivity: new Date() },
    }).catch((err: unknown) => logger.error({ err, hubId }, 'Failed to update hub lastActivity after portal message'));

    const hub = await req.repo!.hub.findFirst({
      where: { id: hubId },
      select: { contactEmail: true, companyName: true },
    });
    const staffEmail = hub?.contactEmail?.trim().toLowerCase();
    if (staffEmail) {
      const hubUrl = new URL(`/clienthub/hub/${hubId}/messages`, env.CORS_ORIGIN).toString();
      sendClientReplyNotification(
        staffEmail,
        senderName,
        hub.companyName,
        previewFromBody(body),
        hubUrl,
      ).catch((err) => logger.error({ err, hubId, staffEmail }, 'Failed to send staff client-reply notification'));
    } else {
      logger.warn({ hubId }, 'Hub contactEmail missing; cannot send client reply notification');
    }

    sendItem(res, {
      id: created.id,
      hubId: created.hubId,
      senderType: created.senderType,
      senderEmail: created.senderEmail,
      senderName: created.senderName,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
    }, 201);
  } catch (err) {
    next(err);
  }
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
