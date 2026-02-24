/**
 * Status Update routes — staff-only endpoints for fortnightly status updates.
 * Append-only: POST to create, GET to list. No PUT/PATCH/DELETE.
 */

import { Router } from 'express';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, sendList } from '../utils/response.js';
import { Errors } from '../middleware/error-handler.js';
import { queryStatusUpdates } from '../services/status-update-queries.js';
import type { Request, Response, NextFunction } from 'express';

export const statusUpdatesRouter = Router({ mergeParams: true });

statusUpdatesRouter.use(hubAccessMiddleware);
statusUpdatesRouter.use(requireStaffAccess);

const VALID_ON_TRACK = ['on_track', 'at_risk', 'off_track'] as const;
const MAX_PERIOD_LENGTH = 200;
const MAX_FIELD_LENGTH = 5000;

/** Type-guard: returns trimmed string or throws 400 */
function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw Errors.badRequest(`${field} is required and must be a non-empty string`);
  }
  return value.trim();
}

// POST /hubs/:hubId/status-updates
statusUpdatesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period: rawPeriod, completed: rawCompleted, inProgress: rawInProgress, nextPeriod: rawNextPeriod, neededFromClient: rawNeeded, onTrack: rawOnTrack } = req.body;

    // Validate required fields — type-safe (returns 400 for non-strings)
    const period = requireString(rawPeriod, 'period');
    const completed = requireString(rawCompleted, 'completed');
    const inProgress = requireString(rawInProgress, 'inProgress');
    const nextPeriod = requireString(rawNextPeriod, 'nextPeriod');
    const onTrack = requireString(rawOnTrack, 'onTrack');

    // Optional field — must be string if provided
    let neededFromClient: string | null = null;
    if (rawNeeded !== undefined && rawNeeded !== null) {
      if (typeof rawNeeded !== 'string') throw Errors.badRequest('neededFromClient must be a string');
      neededFromClient = rawNeeded.trim() || null;
    }

    // Length limits
    if (period.length > MAX_PERIOD_LENGTH) throw Errors.badRequest(`period must be ${MAX_PERIOD_LENGTH} characters or fewer`);
    if (completed.length > MAX_FIELD_LENGTH) throw Errors.badRequest(`completed must be ${MAX_FIELD_LENGTH} characters or fewer`);
    if (inProgress.length > MAX_FIELD_LENGTH) throw Errors.badRequest(`inProgress must be ${MAX_FIELD_LENGTH} characters or fewer`);
    if (nextPeriod.length > MAX_FIELD_LENGTH) throw Errors.badRequest(`nextPeriod must be ${MAX_FIELD_LENGTH} characters or fewer`);
    if (neededFromClient && neededFromClient.length > MAX_FIELD_LENGTH) {
      throw Errors.badRequest(`neededFromClient must be ${MAX_FIELD_LENGTH} characters or fewer`);
    }

    // Strict onTrack validation
    if (!(VALID_ON_TRACK as readonly string[]).includes(onTrack)) {
      throw Errors.badRequest(`onTrack must be one of: ${VALID_ON_TRACK.join(', ')}`);
    }

    // Derive createdBy from auth context — reject if neither name nor email available
    const createdBy = req.user?.name || req.user?.email;
    if (!createdBy) {
      throw Errors.badRequest('Unable to determine user identity for createdBy');
    }

    const record = await req.repo!.hubStatusUpdate.create({
      data: {
        hubId: req.params.hubId,
        period,
        completed,
        inProgress,
        nextPeriod,
        neededFromClient,
        onTrack,
        createdBy,
        createdSource: 'staff_ui',
      },
    });

    sendItem(res, record, 201);
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/status-updates
statusUpdatesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId as string;
    const result = await queryStatusUpdates(req.repo!, hubId, req.query as Record<string, unknown>);
    sendList(res, result.items, {
      page: result.page,
      pageSize: result.pageSize,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
});
