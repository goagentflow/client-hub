/**
 * Project + Milestone Prisma → DTO mappers
 *
 * Accepts Prisma HubProject / HubMilestone (camelCase, Date objects).
 * Returns ProjectDTO / MilestoneDTO matching the existing API contract.
 */

import type { HubProject, HubMilestone } from '@prisma/client';

export interface ProjectDTO {
  id: string;
  hubId: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  targetEndDate?: string;
  lead?: string;
  leadName?: string;
  milestones: MilestoneDTO[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface MilestoneDTO {
  id: string;
  name: string;
  description?: string;
  targetDate: string;
  status: string;
  completedAt?: string;
}

export function mapProject(project: HubProject, milestones: HubMilestone[] = []): ProjectDTO {
  return {
    id: project.id,
    hubId: project.hubId,
    name: project.name,
    ...(project.description ? { description: project.description } : {}),
    status: project.status,
    startDate: project.startDate?.toISOString() || project.createdAt.toISOString(),
    ...(project.targetEndDate ? { targetEndDate: project.targetEndDate.toISOString() } : {}),
    ...(project.lead ? { lead: project.lead } : {}),
    ...(project.leadName ? { leadName: project.leadName } : {}),
    milestones: milestones
      .filter((m) => m.projectId === project.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapMilestone),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    createdBy: project.createdBy,
  };
}

export function mapMilestone(ms: HubMilestone): MilestoneDTO {
  return {
    id: ms.id,
    name: ms.name,
    ...(ms.description ? { description: ms.description } : {}),
    targetDate: ms.targetDate?.toISOString() || ms.createdAt.toISOString(),
    status: ms.status,
    ...(ms.completedAt ? { completedAt: ms.completedAt.toISOString() } : {}),
  };
}
