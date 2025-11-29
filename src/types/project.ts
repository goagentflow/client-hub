/**
 * Project types - multiple workstreams per client hub
 *
 * Phase 2: Projects enable grouping of artifacts (documents, videos, messages, meetings)
 * and support filtering via projectId parameter on artifact endpoints.
 */

import type { EntityId, ISODateString } from "./common";

// Project status
export type ProjectStatus = "active" | "on_hold" | "completed" | "cancelled";

// Milestone status
export type MilestoneStatus = "pending" | "in_progress" | "completed" | "missed";

// Project entity
export interface Project {
  id: EntityId;
  hubId: EntityId;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate: ISODateString;
  targetEndDate?: ISODateString;
  lead?: EntityId; // User ID of project lead
  leadName?: string; // Denormalized for display
  milestones: ProjectMilestone[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  createdBy: EntityId;
}

// Project milestone
export interface ProjectMilestone {
  id: EntityId;
  name: string;
  description?: string;
  targetDate: ISODateString;
  status: MilestoneStatus;
  completedAt?: ISODateString;
}

// Create project request
export interface CreateProjectRequest {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: ISODateString;
  targetEndDate?: ISODateString;
  lead?: EntityId;
}

// Update project request
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: ISODateString;
  targetEndDate?: ISODateString;
  lead?: EntityId;
}

// Create milestone request
export interface CreateMilestoneRequest {
  name: string;
  description?: string;
  targetDate: ISODateString;
}

// Update milestone request
export interface UpdateMilestoneRequest {
  name?: string;
  description?: string;
  targetDate?: ISODateString;
  status?: MilestoneStatus;
}

// Project filter params
export interface ProjectFilterParams {
  status?: ProjectStatus;
}
