/**
 * Event routes — 3 endpoints, all backed by Supabase hub_event table
 */

import { Router } from 'express';
import { supabase, mapEventRow } from '../adapters/supabase.adapter.js';
import { mapLeadershipEventRow } from '../adapters/event.mapper.js';
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

    const { data, error } = await supabase
      .from('hub_event')
      .insert({
        hub_id: req.params.hubId,
        event_type: eventType,
        user_id: req.user.userId,
        user_email: req.user.email,
        user_name: req.user.name,
        metadata: metadata || {},
      })
      .select('*')
      .single();

    if (error) throw error;
    sendItem(res, mapEventRow(data), 201);
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/events — list events (staff-only)
eventsRouter.get('/', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);
    const offset = (page - 1) * pageSize;

    const { data, count, error } = await supabase
      .from('hub_event')
      .select('*', { count: 'exact' })
      .eq('hub_id', hubId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const totalItems = count || 0;
    sendList(res, (data || []).map(mapEventRow), {
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

    const { data, error } = await supabase
      .from('hub_event')
      .insert({
        hub_id: hubId || null,
        event_type: eventType,
        user_id: req.user.userId,
        user_email: req.user.email,
        user_name: req.user.name,
        metadata: metadata || {},
      })
      .select('*')
      .single();

    if (error) throw error;
    sendItem(res, mapLeadershipEventRow(data), 201);
  } catch (err) {
    next(err);
  }
});
