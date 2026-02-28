/**
 * Portal routes — client-facing endpoints
 * All return PaginatedList<T> with visibility=client filter
 */

import { Router } from 'express';
import { URL } from 'node:url';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { mapVideo } from '../db/video.mapper.js';
import { mapProposal, mapDocumentForPortal } from '../db/document.mapper.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { createDownloadUrl, DEFAULT_SIGNED_URL_EXPIRY } from '../services/storage.service.js';
import { sendClientReplyNotification, sendPortalAccessRequestNotification } from '../services/email.service.js';
import { hydrateMembersFromPortalContacts, listActiveStaffEmails, mapHubMember, upsertClientMember } from '../services/membership.service.js';
import { sendItem, sendList, send501 } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { queryStatusUpdates, mapStatusUpdateForPortal } from '../services/status-update-queries.js';
import { queryMessages, mapMessageForPortal } from '../services/message-queries.js';
import { getMessageAudience } from '../services/message-audience.service.js';
import { logger } from '../utils/logger.js';
import { emailDomainForLogs } from '../utils/email-log.js';
import { Errors } from '../middleware/error-handler.js';
import { env } from '../config/env.js';
import { resolveDisplayName } from '../utils/person-name.js';
import type { Request, Response, NextFunction } from 'express';

export const portalRouter = Router({ mergeParams: true });

portalRouter.use(hubAccessMiddleware);

const MAX_MESSAGE_LENGTH = 10000;
const PREVIEW_LENGTH = 200;
const INTERNAL_BYPASS_DOMAIN = 'goagentflow.com';

const portalPostLimiter = rateLimit({
  windowMs: 60_000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.user.portalHubId || req.params.hubId}:${(req.user.email || '').toLowerCase()}`,
  message: { code: 'RATE_LIMITED', message: 'Too many messages, please try again shortly' },
});

const portalAccessRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.user.portalHubId || req.params.hubId}:${(req.user.email || '').toLowerCase()}`,
  message: { code: 'RATE_LIMITED', message: 'Too many access requests, please try again later' },
});

const accessRequestSchema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  name: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
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

async function notifyStaffOnPortalMessage(
  repo: Request['repo'],
  hubId: string,
  tenantId: string,
  senderName: string,
  body: string,
  companyName: string,
): Promise<void> {
  if (!repo) return;

  const recipients = await listActiveStaffEmails(repo as Parameters<typeof listActiveStaffEmails>[0], {
    hubId,
    tenantId,
  });
  if (recipients.length === 0) {
    logger.warn({ hubId }, 'No staff notification recipients for portal message');
    return;
  }

  const hubUrl = new URL(`/clienthub/hub/${hubId}/messages`, env.CORS_ORIGIN).toString();
  const preview = previewFromBody(body);

  await Promise.allSettled(
    recipients.map((staffEmail) =>
      sendClientReplyNotification(staffEmail, senderName, companyName, preview, hubUrl),
    ),
  );
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
portalRouter.get('/messages/audience', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const audience = await getMessageAudience(req.repo!, hubId);
    sendItem(res, audience);
  } catch (err) {
    next(err);
  }
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

// POST /hubs/:hubId/portal/messages/request-access
portalRouter.post('/messages/request-access', portalAccessRequestLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user.portalHubId) {
      throw Errors.forbidden('Portal token required');
    }

    const requesterEmail = req.user.email?.trim().toLowerCase();
    if (!requesterEmail) {
      throw Errors.forbidden('Access request requires a verified email session');
    }

    const parsed = accessRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw Errors.badRequest(parsed.error.issues.map((i) => i.message).join(', '));
    }

    const hubId = req.params.hubId as string;
    const requestedEmail = parsed.data.email;

    const hub = await req.repo!.hub.findFirst({
      where: { id: hubId },
      select: { companyName: true, clientDomain: true },
    }) as {
      companyName: string;
      clientDomain: string | null;
    } | null;
    if (!hub) throw Errors.notFound('Hub', hubId);

    if (hub.clientDomain) {
      const requestedDomain = requestedEmail.split('@')[1]?.toLowerCase();
      const hubDomain = hub.clientDomain.trim().toLowerCase();
      if (requestedDomain !== hubDomain && requestedDomain !== INTERNAL_BYPASS_DOMAIN) {
        throw Errors.badRequest(`Requested email domain must match ${hubDomain}`);
      }
    }

    const existing = await req.repo!.portalContact.findFirst({
      where: { hubId, email: requestedEmail },
      select: { id: true },
    }) as { id: string } | null;
    if (existing) {
      sendItem(res, {
        requested: false,
        alreadyHasAccess: true,
        email: requestedEmail,
        message: 'This teammate already has hub access.',
      });
      return;
    }

    const staffRecipients = await listActiveStaffEmails(req.repo!, {
      hubId,
      tenantId: req.user.tenantId,
    });
    if (staffRecipients.length === 0) {
      throw Errors.badRequest('No staff notification recipients are configured for this hub yet');
    }

    const requesterName = resolveDisplayName(req.user.name, requesterEmail);
    const hubUrl = new URL(`/clienthub/hub/${hubId}/members`, env.CORS_ORIGIN).toString();

    await Promise.allSettled(
      staffRecipients.map((staffEmail) =>
        sendPortalAccessRequestNotification(staffEmail, {
          requesterName,
          requesterEmail,
          requestedEmail,
          hubName: hub.companyName,
          hubUrl,
          ...(parsed.data.note ? { requestNote: parsed.data.note } : {}),
        }),
      ),
    );

    sendItem(res, {
      requested: true,
      alreadyHasAccess: false,
      email: requestedEmail,
      message: 'Access request sent to Agent Flow staff.',
    }, 201);
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
    const senderName = resolveDisplayName(req.user.name, senderEmail);
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

    upsertClientMember({ hubMember: req.repo!.hubMember } as Parameters<typeof upsertClientMember>[0], {
      hubId,
      tenantId: req.user.tenantId,
      email: senderEmail,
      displayName: senderName,
      source: 'message',
      lastActiveAt: new Date(),
    }).catch((err) => logger.error(
      { err, hubId, senderEmailDomain: emailDomainForLogs(senderEmail) },
      'Failed to upsert member activity from portal message',
    ));

    const hub = await req.repo!.hub.findFirst({
      where: { id: hubId },
      select: { companyName: true },
    });

    if (hub) {
      notifyStaffOnPortalMessage(
        req.repo,
        hubId,
        req.user.tenantId,
        senderName,
        body,
        hub.companyName,
      ).catch((err) => logger.error({ err, hubId }, 'Failed to send staff client-reply notifications'));
    } else {
      logger.warn({ hubId }, 'Hub not found while preparing staff client-reply notifications');
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

// GET /hubs/:hubId/portal/members
portalRouter.get('/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user.portalHubId) {
      throw Errors.forbidden('Portal token required');
    }

    const hubId = req.params.hubId as string;
    const { page, pageSize } = parsePagination(req.query);

    await hydrateMembersFromPortalContacts(req.repo! as Parameters<typeof hydrateMembersFromPortalContacts>[0], {
      hubId,
      tenantId: req.user.tenantId,
    });

    const where = {
      hubId,
      tenantId: req.user.tenantId,
      role: 'client',
      status: 'active',
    };

    const [members, totalItems] = await Promise.all([
      req.repo!.hubMember.findMany({
        where,
        select: {
          id: true,
          hubId: true,
          userId: true,
          email: true,
          displayName: true,
          role: true,
          accessLevel: true,
          invitedBy: true,
          invitedByName: true,
          joinedAt: true,
          lastActiveAt: true,
        },
        orderBy: [{ joinedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      req.repo!.hubMember.count({ where }),
    ]);

    sendList(res, members.map(mapHubMember), {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    });
  } catch (err) {
    next(err);
  }
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
