/**
 * Event routes — 3 endpoints, backed by TenantRepository (Prisma)
 */

import { Router } from 'express';
import { mapEvent, mapLeadershipEvent } from '../db/event.mapper.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, sendList } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { Errors } from '../middleware/error-handler.js';
import type { Request, Response, NextFunction } from 'express';

export const eventsRouter = Router({ mergeParams: true });

eventsRouter.use(hubAccessMiddleware);

// Canonical allowlist — portal users can only POST these event types
export const PORTAL_ALLOWED_EVENTS = [
  'hub.viewed', 'proposal.viewed', 'proposal.slide_time',
  'video.watched', 'video.completed',
  'document.viewed', 'document.downloaded',
  'questionnaire.started', 'questionnaire.completed',
] as const;

// POST /hubs/:hubId/events — create event (portal users restricted to allowlist)
eventsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventType, metadata } = req.body;
    if (!eventType) throw Errors.badRequest('eventType is required');

    // Portal users can only write allowed engagement event types
    if (req.user.portalHubId && !PORTAL_ALLOWED_EVENTS.includes(eventType)) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Event type not allowed for portal users',
        correlationId: req.correlationId,
      });
      return;
    }

    const event = await req.repo!.hubEvent.create({
      data: {
        hubId: req.params.hubId,
        eventType,
        userId: req.user.userId,
        userEmail: req.user.email,
        userName: req.user.name,
        metadata: metadata || {},
      },
    });

    sendItem(res, mapEvent(event), 201);
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/events — list events (staff-only)
eventsRouter.get('/', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);

    const [events, totalItems] = await Promise.all([
      req.repo!.hubEvent.findMany({
        where: { hubId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      req.repo!.hubEvent.count({ where: { hubId } }),
    ]);

    sendList(res, events.map(mapEvent), {
      page, pageSize, totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// Leadership events router (separate, admin-guarded)
export const leadershipEventsRouter = Router();

// POST /leadership/events — create leadership event (admin only)
leadershipEventsRouter.post('/', requireAdmin, requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventType, hubId, metadata } = req.body;
    if (!eventType) throw Errors.badRequest('eventType is required');

    const event = await req.repo!.hubEvent.create({
      data: {
        hubId: hubId || null,
        eventType,
        userId: req.user.userId,
        userEmail: req.user.email,
        userName: req.user.name,
        metadata: metadata || {},
      },
    });

    sendItem(res, mapLeadershipEvent(event), 201);
  } catch (err) {
    next(err);
  }
});
