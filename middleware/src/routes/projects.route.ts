/**
 * Project routes — 8 endpoints, all backed by Supabase
 */

import { Router } from 'express';
import { supabase, mapProjectRow, mapMilestoneRow } from '../adapters/supabase.adapter.js';
import type { ProjectRow, MilestoneRow } from '../adapters/project.mapper.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, sendList, send204 } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { Errors } from '../middleware/error-handler.js';
import type { Request, Response, NextFunction } from 'express';

export const projectsRouter = Router({ mergeParams: true });

projectsRouter.use(hubAccessMiddleware);
projectsRouter.use(requireStaffAccess);

// Verify project belongs to the hub (prevents cross-hub milestone access)
async function verifyProjectOwnership(req: Request): Promise<void> {
  const projectId = req.params.projectId as string;
  const hubId = req.params.hubId as string;
  const { data } = await supabase.from('hub_project').select('id')
    .eq('id', projectId).eq('hub_id', hubId).single();
  if (!data) throw Errors.notFound('Project', projectId);
}

// GET /hubs/:hubId/projects
projectsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('hub_project')
      .select('*', { count: 'exact' })
      .eq('hub_id', hubId);

    if (req.query.status) query = query.eq('status', req.query.status);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    // Fetch milestones for these projects
    const projectIds = (data || []).map((p: Record<string, unknown>) => p.id);
    let milestones: Record<string, unknown>[] = [];
    if (projectIds.length > 0) {
      const { data: ms } = await supabase
        .from('hub_milestone')
        .select('*')
        .in('project_id', projectIds)
        .order('sort_order', { ascending: true });
      milestones = ms || [];
    }

    const totalItems = count || 0;
    sendList(
      res,
      (data || []).map((p: Record<string, unknown>) => mapProjectRow(p as unknown as ProjectRow, milestones as unknown as MilestoneRow[])),
      { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) }
    );
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/projects/:projectId
projectsRouter.get('/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: project, error } = await supabase
      .from('hub_project')
      .select('*')
      .eq('id', req.params.projectId)
      .eq('hub_id', req.params.hubId)
      .single();

    if (error || !project) throw Errors.notFound('Project', req.params.projectId);

    const { data: milestones } = await supabase
      .from('hub_milestone')
      .select('*')
      .eq('project_id', req.params.projectId)
      .order('sort_order', { ascending: true });

    sendItem(res, mapProjectRow(project as ProjectRow, (milestones || []) as MilestoneRow[]));
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/projects
projectsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, status, startDate, targetEndDate, lead } = req.body;
    if (!name) throw Errors.badRequest('name is required');

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('hub_project')
      .insert({
        hub_id: req.params.hubId,
        name,
        description: description || null,
        status: status || 'active',
        start_date: startDate || now,
        target_end_date: targetEndDate || null,
        lead: lead || null,
        lead_name: lead ? req.user.name : null,
        created_by: req.user.userId,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) throw error;
    sendItem(res, mapProjectRow(data as ProjectRow), 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/projects/:projectId
projectsRouter.patch('/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.startDate !== undefined) updates.start_date = req.body.startDate;
    if (req.body.targetEndDate !== undefined) updates.target_end_date = req.body.targetEndDate;
    if (req.body.lead !== undefined) updates.lead = req.body.lead;

    const { data, error } = await supabase
      .from('hub_project')
      .update(updates)
      .eq('id', req.params.projectId)
      .eq('hub_id', req.params.hubId)
      .select('*')
      .single();

    if (error || !data) throw Errors.notFound('Project', req.params.projectId);

    const { data: milestones } = await supabase
      .from('hub_milestone')
      .select('*')
      .eq('project_id', req.params.projectId)
      .order('sort_order', { ascending: true });

    sendItem(res, mapProjectRow(data as ProjectRow, (milestones || []) as MilestoneRow[]));
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/projects/:projectId (soft delete → cancelled)
projectsRouter.delete('/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error } = await supabase
      .from('hub_project')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', req.params.projectId)
      .eq('hub_id', req.params.hubId);

    if (error) throw error;
    send204(res);
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/projects/:projectId/milestones
projectsRouter.post('/:projectId/milestones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyProjectOwnership(req);
    const { name, description, targetDate } = req.body;
    if (!name) throw Errors.badRequest('name is required');

    // Get next sort order
    const { count } = await supabase
      .from('hub_milestone')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', req.params.projectId);

    const { data, error } = await supabase
      .from('hub_milestone')
      .insert({
        project_id: req.params.projectId,
        name,
        description: description || null,
        target_date: targetDate || null,
        status: 'not_started',
        sort_order: (count || 0),
      })
      .select('*')
      .single();

    if (error) throw error;
    sendItem(res, mapMilestoneRow(data as MilestoneRow), 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/projects/:projectId/milestones/:milestoneId
projectsRouter.patch('/:projectId/milestones/:milestoneId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyProjectOwnership(req);
    const updates: Record<string, unknown> = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.targetDate !== undefined) updates.target_date = req.body.targetDate;
    if (req.body.status !== undefined) {
      updates.status = req.body.status;
      if (req.body.status === 'completed') updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('hub_milestone')
      .update(updates)
      .eq('id', req.params.milestoneId)
      .eq('project_id', req.params.projectId)
      .select('*')
      .single();

    if (error || !data) throw Errors.notFound('Milestone', req.params.milestoneId);
    sendItem(res, mapMilestoneRow(data as MilestoneRow));
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/projects/:projectId/milestones/:milestoneId
projectsRouter.delete('/:projectId/milestones/:milestoneId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyProjectOwnership(req);
    const { error } = await supabase
      .from('hub_milestone')
      .delete()
      .eq('id', req.params.milestoneId)
      .eq('project_id', req.params.projectId);

    if (error) throw error;
    send204(res);
  } catch (err) {
    next(err);
  }
});
