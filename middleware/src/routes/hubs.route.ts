/**
 * Hub routes — 10 endpoints, backed by TenantRepository (Prisma)
 */

import { Router } from 'express';
import { mapHub, mapPortalConfig } from '../db/hub.mapper.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, sendList } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { Errors } from '../middleware/error-handler.js';
import type { Request, Response, NextFunction } from 'express';

export const hubsRouter = Router();

/** Hub select fields — excludes passwordHash */
const HUB_SELECT = {
  id: true, tenantId: true, companyName: true, contactName: true,
  contactEmail: true, status: true, hubType: true, createdAt: true,
  updatedAt: true, lastActivity: true, clientsInvited: true, lastVisit: true,
  clientDomain: true, internalNotes: true, convertedAt: true, convertedBy: true,
  isPublished: true, welcomeHeadline: true, welcomeMessage: true,
  heroContentType: true, heroContentId: true, showProposal: true,
  showVideos: true, showDocuments: true, showMessages: true,
  showMeetings: true, showQuestionnaire: true,
};

// GET /hubs — paginated list with search/filter/sort (staff-only)
hubsRouter.get('/', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    // Search by company name
    if (req.query.search) {
      const sanitised = String(req.query.search).replace(/[^a-zA-Z0-9 '\-]/g, '').trim();
      if (sanitised.length > 0) where.companyName = { contains: sanitised, mode: 'insensitive' };
    }

    // Filter by hub type
    let hubTypeFilter: string | undefined;
    let statusFilter: string | undefined;
    if (req.query.filter) {
      const filterStr = String(req.query.filter);
      const [key, val] = filterStr.split(':');
      if (key === 'hubType') hubTypeFilter = val;
      if (key === 'status') statusFilter = val;
    }

    const VALID_HUB_TYPES = ['pitch', 'client'];
    const hubType = String(req.query.hubType || hubTypeFilter || '');
    if (VALID_HUB_TYPES.includes(hubType)) where.hubType = hubType;

    const VALID_STATUSES = ['draft', 'active', 'won', 'lost'];
    const status = String(req.query.status || statusFilter || '');
    if (VALID_STATUSES.includes(status)) where.status = status;

    // Sort
    const SORT_MAP: Record<string, string> = {
      updated_at: 'updatedAt', created_at: 'createdAt',
      company_name: 'companyName', status: 'status',
    };
    const rawSort = String(req.query.sortBy || 'updated_at');
    const sortField = SORT_MAP[rawSort] || 'updatedAt';
    const sortDir = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [items, totalItems] = await Promise.all([
      req.repo!.hub.findMany({
        where, select: HUB_SELECT,
        orderBy: { [sortField]: sortDir },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      req.repo!.hub.count({ where }),
    ]);

    sendList(res, items.map(mapHub), { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) });
  } catch (err) {
    next(err);
  }
});

// All routes below need hub access check
hubsRouter.use('/:hubId', hubAccessMiddleware);

// GET /hubs/:hubId — single hub (staff-only)
hubsRouter.get('/:hubId', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hub = await req.repo!.hub.findFirst({ where: { id: req.params.hubId }, select: HUB_SELECT });
    if (!hub) throw Errors.notFound('Hub', req.params.hubId);
    sendItem(res, mapHub(hub));
  } catch (err) {
    next(err);
  }
});

// POST /hubs — create hub (staff-only)
hubsRouter.post('/', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyName, contactName, contactEmail, clientDomain } = req.body;
    if (!companyName || !contactName || !contactEmail) {
      throw Errors.badRequest('companyName, contactName, and contactEmail are required');
    }

    const domain = clientDomain || contactEmail.split('@')[1];
    const hub = await req.repo!.hub.create({
      data: {
        companyName, contactName, contactEmail,
        status: 'draft', hubType: 'pitch', clientDomain: domain,
      },
      select: HUB_SELECT,
    });

    sendItem(res, mapHub(hub), 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId — update hub (staff-only)
hubsRouter.patch('/:hubId', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    if (req.body.companyName !== undefined) data.companyName = req.body.companyName;
    if (req.body.contactName !== undefined) data.contactName = req.body.contactName;
    if (req.body.contactEmail !== undefined) data.contactEmail = req.body.contactEmail;
    if (req.body.status !== undefined) data.status = req.body.status;

    const hub = await req.repo!.hub.update({
      where: { id: req.params.hubId }, data, select: HUB_SELECT,
    });
    if (!hub) throw Errors.notFound('Hub', req.params.hubId);
    sendItem(res, mapHub(hub));
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/overview — aggregate stats (staff-only)
hubsRouter.get('/:hubId/overview', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const hub = await req.repo!.hub.findFirst({ where: { id: hubId }, select: HUB_SELECT });
    if (!hub) throw Errors.notFound('Hub', hubId);

    const [videoCount, docCount] = await Promise.all([
      req.repo!.hubVideo.count({ where: { hubId } }),
      req.repo!.hubDocument.count({ where: { hubId } }),
    ]);

    sendItem(res, {
      hub: mapHub(hub),
      alerts: [],
      internalNotes: hub.internalNotes || '',
      engagementStats: {
        totalViews: 0, uniqueVisitors: 0, avgTimeSpent: 0,
        lastVisit: hub.lastVisit, proposalViews: 0,
        documentDownloads: docCount, videoWatchTime: videoCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/notes — update internal notes (staff-only)
hubsRouter.patch('/:hubId/notes', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await req.repo!.hub.update({
      where: { id: req.params.hubId },
      data: { internalNotes: req.body.notes },
    });
    sendItem(res, { notes: req.body.notes });
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/activity — activity feed (staff-only)
hubsRouter.get('/:hubId/activity', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);

    const [events, totalItems] = await Promise.all([
      req.repo!.hubEvent.findMany({
        where: { hubId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      req.repo!.hubEvent.count({ where: { hubId } }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = events.map((e: any) => ({
      id: e.id, type: 'view', title: String(e.eventType || ''),
      description: '', timestamp: e.createdAt,
      actor: e.userName ? { name: e.userName, email: e.userEmail || '', avatarUrl: null } : null,
      resourceLink: null,
    }));

    sendList(res, items, { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) });
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/publish — publish portal (staff-only)
hubsRouter.post('/:hubId/publish', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hub = await req.repo!.hub.update({
      where: { id: req.params.hubId },
      data: { isPublished: true }, select: HUB_SELECT,
    });
    if (!hub) throw Errors.notFound('Hub', req.params.hubId);
    sendItem(res, mapPortalConfig(hub));
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/portal-preview — staff preview of portal
hubsRouter.get('/:hubId/portal-preview', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hub = await req.repo!.hub.findFirst({
      where: { id: req.params.hubId },
      select: { id: true, companyName: true, hubType: true, isPublished: true },
    });
    if (!hub) throw Errors.notFound('Hub', req.params.hubId);
    sendItem(res, { id: hub.id, companyName: hub.companyName, hubType: hub.hubType, isPublished: hub.isPublished });
  } catch (err) {
    next(err);
  }
});
