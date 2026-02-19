/**
 * Project + Milestone row → DTO mappers
 */

export interface ProjectRow {
  id: string;
  hub_id: string;
  name: string;
  description?: string | null;
  status: string;
  start_date?: string | null;
  target_end_date?: string | null;
  lead?: string | null;
  lead_name?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MilestoneRow {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  target_date?: string | null;
  status: string;
  completed_at?: string | null;
  sort_order: number;
  created_at: string;
}

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

export function mapProjectRow(row: ProjectRow, milestones: MilestoneRow[] = []): ProjectDTO {
  return {
    id: row.id,
    hubId: row.hub_id,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    status: row.status,
    startDate: row.start_date || row.created_at,
    ...(row.target_end_date ? { targetEndDate: row.target_end_date } : {}),
    ...(row.lead ? { lead: row.lead } : {}),
    ...(row.lead_name ? { leadName: row.lead_name } : {}),
    milestones: milestones
      .filter((m) => m.project_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapMilestoneRow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

export function mapMilestoneRow(row: MilestoneRow): MilestoneDTO {
  return {
    id: row.id,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    targetDate: row.target_date || row.created_at,
    status: row.status,
    ...(row.completed_at ? { completedAt: row.completed_at } : {}),
  };
}
