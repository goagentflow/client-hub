/**
 * Hub routes — 10 endpoints, all backed by Supabase
 */

import { Router } from 'express';
import { supabase, mapHubRow, mapPortalConfig } from '../adapters/supabase.adapter.js';
import { HUB_SELECT } from '../adapters/hub-columns.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, sendList } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { Errors } from '../middleware/error-handler.js';
import type { Request, Response, NextFunction } from 'express';

export const hubsRouter = Router();

// GET /hubs — paginated list with search/filter/sort (staff-only)
hubsRouter.get('/', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const offset = (page - 1) * pageSize;

    let query = supabase.from('hub').select(HUB_SELECT, { count: 'exact' });

    // Search by company name
    if (req.query.search) {
      const sanitised = String(req.query.search).replace(/[^a-zA-Z0-9 '\-]/g, '').trim();
      if (sanitised.length > 0) query = query.ilike('company_name', `%${sanitised}%`);
    }

    // Parse filter param (current frontend sends "hubType:pitch" or "hubType:client")
    let hubTypeFilter: string | undefined;
    let statusFilter: string | undefined;
    if (req.query.filter) {
      const filterStr = String(req.query.filter);
      const [key, val] = filterStr.split(':');
      if (key === 'hubType') hubTypeFilter = val;
      if (key === 'status') statusFilter = val;
    }

    // Discrete params override filter string (new style)
    const VALID_HUB_TYPES = ['pitch', 'client'];
    const hubType = String(req.query.hubType || hubTypeFilter || '');
    if (VALID_HUB_TYPES.includes(hubType)) {
      query = query.eq('hub_type', hubType);
    }

    const VALID_STATUSES = ['draft', 'active', 'won', 'lost'];
    const status = String(req.query.status || statusFilter || '');
    if (VALID_STATUSES.includes(status)) {
      query = query.eq('status', status);
    }

    // Whitelist sort fields
    const VALID_SORTS = ['updated_at', 'created_at', 'company_name', 'status'];
    const sortField = VALID_SORTS.includes(String(req.query.sortBy || ''))
      ? String(req.query.sortBy) : 'updated_at';
    query = query.order(sortField, { ascending: req.query.sortOrder === 'asc' });

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const totalItems = count || 0;
    const items = (data || []).map(mapHubRow);
    sendList(res, items, { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) });
  } catch (err) {
    next(err);
  }
});

// All routes below need hub access check
hubsRouter.use('/:hubId', hubAccessMiddleware);

// GET /hubs/:hubId — single hub (staff-only)
hubsRouter.get('/:hubId', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('hub')
      .select(HUB_SELECT)
      .eq('id', req.params.hubId)
      .single();

    if (error || !data) throw Errors.notFound('Hub', req.params.hubId);

    sendItem(res, mapHubRow(data));
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

    const now = new Date().toISOString();
    const domain = clientDomain || contactEmail.split('@')[1];

    const { data, error } = await supabase
      .from('hub')
      .insert({
        company_name: companyName,
        contact_name: contactName,
        contact_email: contactEmail,
        status: 'draft',
        hub_type: 'pitch',
        client_domain: domain,
        created_at: now,
        updated_at: now,
        last_activity: now,
        clients_invited: 0,
      })
      .select(HUB_SELECT)
      .single();

    if (error) throw error;

    sendItem(res, mapHubRow(data), 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId — update hub (staff-only)
hubsRouter.patch('/:hubId', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (req.body.companyName !== undefined) updates.company_name = req.body.companyName;
    if (req.body.contactName !== undefined) updates.contact_name = req.body.contactName;
    if (req.body.contactEmail !== undefined) updates.contact_email = req.body.contactEmail;
    if (req.body.status !== undefined) updates.status = req.body.status;

    const { data, error } = await supabase
      .from('hub')
      .update(updates)
      .eq('id', req.params.hubId)
      .select(HUB_SELECT)
      .single();

    if (error || !data) throw Errors.notFound('Hub', req.params.hubId);

    sendItem(res, mapHubRow(data));
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/overview — aggregate stats (staff-only)
hubsRouter.get('/:hubId/overview', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;

    const { data: hub, error: hubErr } = await supabase
      .from('hub')
      .select(HUB_SELECT)
      .eq('id', hubId)
      .single();

    if (hubErr || !hub) throw Errors.notFound('Hub', hubId);

    // Count videos and documents
    const [videoCount, docCount] = await Promise.all([
      supabase.from('hub_video').select('id', { count: 'exact', head: true }).eq('hub_id', hubId),
      supabase.from('hub_document').select('id', { count: 'exact', head: true }).eq('hub_id', hubId),
    ]);

    sendItem(res, {
      hub: mapHubRow(hub),
      alerts: [],
      internalNotes: hub.internal_notes || '',
      engagementStats: {
        totalViews: 0,
        uniqueVisitors: 0,
        avgTimeSpent: 0,
        lastVisit: hub.last_visit,
        proposalViews: 0,
        documentDownloads: docCount.count || 0,
        videoWatchTime: videoCount.count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/notes — update internal notes (staff-only)
hubsRouter.patch('/:hubId/notes', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes } = req.body;

    const { error } = await supabase
      .from('hub')
      .update({ internal_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', req.params.hubId);

    if (error) throw error;

    sendItem(res, { notes });
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/activity — activity feed (staff-only)
hubsRouter.get('/:hubId/activity', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);
    const offset = (page - 1) * pageSize;

    const { count } = await supabase
      .from('hub_event')
      .select('id', { count: 'exact', head: true })
      .eq('hub_id', hubId);

    const totalItems = count || 0;

    const { data, error } = await supabase
      .from('hub_event')
      .select('*')
      .eq('hub_id', hubId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    // Map to ActivityFeedItem shape
    const items = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      type: 'view',
      title: String(row.event_type || ''),
      description: '',
      timestamp: row.created_at,
      actor: row.user_name
        ? { name: row.user_name, email: row.user_email || '', avatarUrl: null }
        : null,
      resourceLink: null,
    }));

    sendList(res, items, {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// Portal config (GET, PATCH) are in portal-config.route.ts

// POST /hubs/:hubId/publish — publish portal (staff-only)
hubsRouter.post('/:hubId/publish', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('hub')
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .eq('id', req.params.hubId)
      .select(HUB_SELECT)
      .single();

    if (error || !data) throw Errors.notFound('Hub', req.params.hubId);

    sendItem(res, mapPortalConfig(data));
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/portal-preview — staff preview of portal-meta (no is_published filter)
hubsRouter.get('/:hubId/portal-preview', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('hub')
      .select('id, company_name, hub_type, is_published')
      .eq('id', req.params.hubId)
      .single();

    if (error || !data) throw Errors.notFound('Hub', req.params.hubId);

    sendItem(res, {
      id: data.id,
      companyName: data.company_name,
      hubType: data.hub_type,
      isPublished: data.is_published,
    });
  } catch (err) {
    next(err);
  }
});
