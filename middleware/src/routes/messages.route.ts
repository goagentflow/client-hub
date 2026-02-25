/**
 * Message routes — staff message feed endpoints.
 * Thread endpoints remain 501 for future threading support.
 */

import { URL } from 'node:url';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, sendList, send501 } from '../utils/response.js';
import { Errors } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { queryMessages } from '../services/message-queries.js';
import { getMessageAudience } from '../services/message-audience.service.js';
import { sendNewMessageNotification } from '../services/email.service.js';
import type { Request, Response, NextFunction } from 'express';

const MAX_MESSAGE_LENGTH = 10000;
const PREVIEW_LENGTH = 200;

export const messagesRouter = Router({ mergeParams: true });

messagesRouter.use(hubAccessMiddleware);
messagesRouter.use(requireStaffAccess);

const staffPostLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => `${req.user.userId}:${req.params.hubId}`,
  message: { code: 'RATE_LIMITED', message: 'Too many messages, please try again shortly' },
});

function validateBody(value: unknown): string {
  if (typeof value !== 'string') {
    throw Errors.badRequest('body must be a string');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw Errors.badRequest('body is required');
  }
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

function messagePreview(body: string): string {
  return body.replace(/\s+/g, ' ').trim().slice(0, PREVIEW_LENGTH);
}

async function notifyPortalContacts(
  req: Request,
  hubId: string,
  senderName: string,
  body: string,
): Promise<void> {
  const hub = await req.repo!.hub.findFirst({
    where: { id: hubId },
    select: { companyName: true, contactEmail: true },
  });
  if (!hub) return;

  const contacts = await req.repo!.portalContact.findMany({
    where: { hubId },
    select: { email: true },
  }) as Array<{ email: string }>;

  const deduped = new Set<string>();
  for (const contact of contacts) {
    const email = contact.email?.trim().toLowerCase();
    if (email) deduped.add(email);
  }
  if (deduped.size === 0 && hub.contactEmail) {
    deduped.add(hub.contactEmail.trim().toLowerCase());
  }

  if (deduped.size === 0) {
    logger.warn({ hubId }, 'No recipient emails available for staff message notification');
    return;
  }

  const portalUrl = new URL(`/clienthub/portal/${hubId}/messages`, env.CORS_ORIGIN).toString();
  const preview = messagePreview(body);

  await Promise.allSettled(
    Array.from(deduped).map((email) =>
      sendNewMessageNotification(email, senderName, hub.companyName, preview, portalUrl),
    ),
  );
}

// GET /hubs/:hubId/messages
messagesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await queryMessages(req.repo!, req.params.hubId as string, req.query as Record<string, unknown>);
    sendList(res, result.mappedItems, {
      page: result.page,
      pageSize: result.pageSize,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/messages
messagesRouter.post('/', staffPostLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const body = validateBody(extractMessageBody(req.body));
    const senderEmail = req.user.email?.trim();
    const senderName = req.user.name?.trim() || senderEmail;

    if (!senderEmail || !senderName) {
      throw Errors.badRequest('Unable to determine sender identity');
    }

    const created = await req.repo!.hubMessage.create({
      data: {
        hubId,
        senderType: 'staff',
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

    // Update hub last activity without impacting message creation.
    req.repo!.hub.update({
      where: { id: hubId },
      data: { lastActivity: new Date() },
    }).catch((err: unknown) => logger.error({ err, hubId }, 'Failed to update hub lastActivity after message post'));

    // Fire-and-forget notification fan-out.
    notifyPortalContacts(req, hubId, senderName, body)
      .catch((err) => logger.error({ err, hubId }, 'Failed to send portal message notifications'));

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

// GET /hubs/:hubId/messages/audience
messagesRouter.get('/audience', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const audience = await getMessageAudience(req.repo!, hubId);
    sendItem(res, audience);
  } catch (err) {
    next(err);
  }
});

// Thread-based endpoints remain as future 501s.
messagesRouter.get('/:threadId', (_req: Request, res: Response) => send501(res, 'Message thread'));
messagesRouter.patch('/:threadId/notes', (_req: Request, res: Response) => send501(res, 'Thread notes'));
messagesRouter.patch('/:threadId', (_req: Request, res: Response) => send501(res, 'Update thread'));
