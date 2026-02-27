/**
 * ProjectStatusCard - Compact project status display for client hub overview
 *
 * Shows active projects with progress, current milestone, and derived status.
 * Uses projectStatus helper for On Track / At Risk / Delayed indicators.
 * Handles 403 gracefully by hiding the card (RBAC).
 */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useProjects } from "@/hooks";
import { ApiRequestError } from "@/services/api";
import {
  getProjectDisplayStatus,
  calculateProjectProgress,
  getCurrentMilestone,
  formatDaysUntil,
  type ProjectDisplayStatus,
} from "@/lib/projectStatus";
import type { Project } from "@/types";

interface ProjectStatusCardProps {
  hubId: string;
}

const MAX_PROJECTS_DISPLAY = 2;

// Status indicator styles and icons
const statusConfig: Record<
  ProjectDisplayStatus,
  { icon: typeof CheckCircle2; colorClass: string; bgClass: string }
> = {
  on_track: {
    icon: CheckCircle2,
    colorClass: "text-[hsl(var(--sage-green))]",
    bgClass: "bg-[hsl(var(--sage-green))]/10",
  },
  at_risk: {
    icon: Clock,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-100",
  },
  delayed: {
    icon: AlertTriangle,
    colorClass: "text-red-600",
    bgClass: "bg-red-100",
  },
};

function ProjectMiniCard({ project }: { project: Project }) {
  const statusResult = getProjectDisplayStatus(project);
  const progress = calculateProjectProgress(project.milestones);
  const currentMilestone = getCurrentMilestone(project.milestones);
  const config = statusConfig[statusResult.status];
  const StatusIcon = config.icon;

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      {/* Header: Name and Status */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-[hsl(var(--dark-grey))] truncate flex-1">
          {project.name}
        </h4>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.bgClass}`}
        >
          <StatusIcon className={`h-3 w-3 ${config.colorClass}`} aria-hidden="true" />
          <span className={config.colorClass}>{statusResult.label}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-[hsl(var(--medium-grey))]">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-[hsl(var(--medium-grey))]/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--bold-royal-blue))] rounded-full transition-all"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${project.name} progress`}
          />
        </div>
      </div>

      {/* Current milestone */}
      {currentMilestone && (
        <div className="text-xs text-[hsl(var(--medium-grey))]">
          <span className="font-medium text-[hsl(var(--dark-grey))]">
            Current:{" "}
          </span>
          {currentMilestone.name}
          <span className="ml-2 text-[hsl(var(--medium-grey))]">
            ({formatDaysUntil(currentMilestone.targetDate)})
          </span>
        </div>
      )}
    </div>
  );
}

export function ProjectStatusCard({ hubId }: ProjectStatusCardProps) {
  const { data, isLoading, error } = useProjects(hubId, {
    status: "active", // Only show active projects on overview
  });

  // Handle 403 gracefully - hide card entirely (RBAC)
  // Check if error is a 403 (client doesn't have access to projects)
  const is403Error = error instanceof ApiRequestError && error.status === 403;
  if (is403Error) {
    return null;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state (non-403)
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-[hsl(var(--medium-grey))]">
            <AlertTriangle className="h-5 w-5" />
            <span>Unable to load projects</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const projects = data?.items || [];
  const displayProjects = projects.slice(0, MAX_PROJECTS_DISPLAY);
  const hasMore = projects.length > MAX_PROJECTS_DISPLAY;

  // Empty state
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[hsl(var(--medium-grey))]/10">
              <FolderKanban className="h-6 w-6 text-[hsl(var(--medium-grey))]" />
            </div>
            <div>
              <h3 className="font-semibold text-[hsl(var(--dark-grey))]">
                No active projects yet
              </h3>
              <p className="text-sm text-[hsl(var(--medium-grey))]">
                Your team is setting this up. Active projects will appear here soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban
                className="h-5 w-5 text-[hsl(var(--bold-royal-blue))]"
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold text-[hsl(var(--dark-grey))]">
                Project Status
              </h3>
              {projects.length > 0 && (
                <span className="text-sm text-[hsl(var(--medium-grey))]">
                  ({projects.length} active)
                </span>
              )}
            </div>
          </div>

          {/* Project cards grid - responsive */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            role="list"
            aria-label="Active projects"
          >
            {displayProjects.map((project) => (
              <div key={project.id} role="listitem">
                <ProjectMiniCard project={project} />
              </div>
            ))}
          </div>

          {hasMore && (
            <p className="text-sm text-[hsl(var(--medium-grey))]">
              +{projects.length - MAX_PROJECTS_DISPLAY} more active project
              {projects.length - MAX_PROJECTS_DISPLAY === 1 ? "" : "s"}.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
