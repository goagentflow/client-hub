/**
 * Project routes — 8 endpoints, backed by TenantRepository (Prisma)
 */

import { Router } from 'express';
import { mapProject, mapMilestone } from '../db/project.mapper.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, sendList, send204 } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';
import { Errors } from '../middleware/error-handler.js';
import type { Request, Response, NextFunction } from 'express';

export const projectsRouter = Router({ mergeParams: true });

projectsRouter.use(hubAccessMiddleware);

// Verify project belongs to the hub (prevents cross-hub milestone access)
async function verifyProjectOwnership(req: Request): Promise<void> {
  const project = await req.repo!.hubProject.findFirst({
    where: { id: req.params.projectId, hubId: req.params.hubId },
    select: { id: true },
  });
  if (!project) throw Errors.notFound('Project', req.params.projectId);
}

// GET /hubs/:hubId/projects
projectsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const { page, pageSize } = parsePagination(req.query);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { hubId };
    if (req.query.status) where.status = String(req.query.status);

    const [projects, totalItems] = await Promise.all([
      req.repo!.hubProject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      req.repo!.hubProject.count({ where }),
    ]);

    // Fetch milestones for these projects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectIds = projects.map((p: any) => p.id);
    let milestones: unknown[] = [];
    if (projectIds.length > 0) {
      milestones = await req.repo!.hubMilestone.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { sortOrder: 'asc' },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendList(res, projects.map((p: any) => mapProject(p, milestones as any[])), {
      page, pageSize, totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/projects/:projectId
projectsRouter.get('/:projectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await req.repo!.hubProject.findFirst({
      where: { id: req.params.projectId, hubId: req.params.hubId },
    });
    if (!project) throw Errors.notFound('Project', req.params.projectId);

    const milestones = await req.repo!.hubMilestone.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { sortOrder: 'asc' },
    });

    sendItem(res, mapProject(project, milestones));
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/projects
projectsRouter.post('/', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, status, startDate, targetEndDate, lead } = req.body;
    if (!name) throw Errors.badRequest('name is required');

    const project = await req.repo!.hubProject.create({
      data: {
        hubId: req.params.hubId,
        name,
        description: description || null,
        status: status || 'active',
        startDate: startDate ? new Date(startDate) : new Date(),
        targetEndDate: targetEndDate ? new Date(targetEndDate) : null,
        lead: lead || null,
        leadName: lead ? req.user.name : null,
        createdBy: req.user.userId,
      },
    });

    sendItem(res, mapProject(project), 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/projects/:projectId
projectsRouter.patch('/:projectId', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.status !== undefined) data.status = req.body.status;
    if (req.body.startDate !== undefined) data.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    if (req.body.targetEndDate !== undefined) data.targetEndDate = req.body.targetEndDate ? new Date(req.body.targetEndDate) : null;
    if (req.body.lead !== undefined) data.lead = req.body.lead;

    // Verify project belongs to this hub before updating
    const existing = await req.repo!.hubProject.findFirst({
      where: { id: req.params.projectId, hubId: req.params.hubId },
      select: { id: true },
    });
    if (!existing) throw Errors.notFound('Project', req.params.projectId);

    const project = await req.repo!.hubProject.update({
      where: { id: req.params.projectId },
      data,
    });

    const milestones = await req.repo!.hubMilestone.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { sortOrder: 'asc' },
    });

    sendItem(res, mapProject(project, milestones));
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/projects/:projectId (soft delete → cancelled)
projectsRouter.delete('/:projectId', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await req.repo!.hubProject.findFirst({
      where: { id: req.params.projectId, hubId: req.params.hubId },
      select: { id: true },
    });
    if (!existing) throw Errors.notFound('Project', req.params.projectId);

    await req.repo!.hubProject.update({
      where: { id: req.params.projectId },
      data: { status: 'cancelled' },
    });

    send204(res);
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/projects/:projectId/milestones
projectsRouter.post('/:projectId/milestones', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyProjectOwnership(req);
    const { name, description, targetDate } = req.body;
    if (!name) throw Errors.badRequest('name is required');

    // Get next sort order
    const count = await req.repo!.hubMilestone.count({
      where: { projectId: req.params.projectId },
    });

    const milestone = await req.repo!.hubMilestone.create({
      data: {
        projectId: req.params.projectId,
        name,
        description: description || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: 'not_started',
        sortOrder: count,
      },
    });

    sendItem(res, mapMilestone(milestone), 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/projects/:projectId/milestones/:milestoneId
projectsRouter.patch('/:projectId/milestones/:milestoneId', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyProjectOwnership(req);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.targetDate !== undefined) data.targetDate = req.body.targetDate ? new Date(req.body.targetDate) : null;
    if (req.body.status !== undefined) {
      data.status = req.body.status;
      if (req.body.status === 'completed') data.completedAt = new Date();
    }

    // Verify milestone belongs to this project
    const existingMs = await req.repo!.hubMilestone.findFirst({
      where: { id: req.params.milestoneId, projectId: req.params.projectId },
      select: { id: true },
    });
    if (!existingMs) throw Errors.notFound('Milestone', req.params.milestoneId);

    const milestone = await req.repo!.hubMilestone.update({
      where: { id: req.params.milestoneId },
      data,
    });
    sendItem(res, mapMilestone(milestone));
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/projects/:projectId/milestones/:milestoneId
projectsRouter.delete('/:projectId/milestones/:milestoneId', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyProjectOwnership(req);
    // Verify milestone belongs to this project
    const existingMs = await req.repo!.hubMilestone.findFirst({
      where: { id: req.params.milestoneId, projectId: req.params.projectId },
      select: { id: true },
    });
    if (!existingMs) throw Errors.notFound('Milestone', req.params.milestoneId);

    await req.repo!.hubMilestone.delete({
      where: { id: req.params.milestoneId },
    });

    send204(res);
  } catch (err) {
    next(err);
  }
});
