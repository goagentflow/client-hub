/**
 * ProjectDetailView — Staff detail page for a single project.
 */

import { AlertTriangle, ArrowLeft, Calendar, Target, User } from "lucide-react";
import { useProject } from "@/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffStatusUpdateHistory } from "@/components/status-updates/StaffStatusUpdateHistory";
import type { Project, ProjectMilestone } from "@/types";

interface ProjectDetailViewProps {
  hubId: string;
  projectId: string;
  onBack: () => void;
}

const PROJECT_STATUS_LABELS: Record<Project["status"], string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PROJECT_STATUS_COLORS: Record<Project["status"], string> = {
  active: "bg-[hsl(var(--sage-green))] text-white",
  on_hold: "bg-[hsl(var(--gradient-purple))] text-white",
  completed: "bg-[hsl(var(--bold-royal-blue))] text-white",
  cancelled: "bg-[hsl(var(--medium-grey))] text-white",
};

const MILESTONE_STATUS_LABELS: Record<ProjectMilestone["status"], string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  missed: "Missed",
};

const MILESTONE_STATUS_COLORS: Record<ProjectMilestone["status"], string> = {
  not_started: "bg-[hsl(var(--medium-grey))]/20 text-[hsl(var(--dark-grey))]",
  in_progress: "bg-[hsl(var(--bold-royal-blue))]/10 text-[hsl(var(--bold-royal-blue))]",
  completed: "bg-[hsl(var(--sage-green))]/10 text-[hsl(var(--sage-green))]",
  missed: "bg-red-100 text-red-700",
};

function formatDate(value?: string): string {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProjectMetaCard({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-[hsl(var(--dark-grey))]">{project.name}</CardTitle>
            {project.description && (
              <p className="mt-1 text-sm text-[hsl(var(--medium-grey))]">{project.description}</p>
            )}
          </div>
          <Badge className={PROJECT_STATUS_COLORS[project.status]}>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4 text-sm text-[hsl(var(--medium-grey))]">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          Started {formatDate(project.startDate)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Target className="h-4 w-4" />
          Target {formatDate(project.targetEndDate)}
        </span>
        {project.leadName && (
          <span className="inline-flex items-center gap-1">
            <User className="h-4 w-4" />
            Lead {project.leadName}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

function MilestonesCard({ milestones }: { milestones: ProjectMilestone[] }) {
  if (milestones.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[hsl(var(--dark-grey))]">Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[hsl(var(--medium-grey))]">
            No milestones yet for this project.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-[hsl(var(--dark-grey))]">Milestones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="rounded-md border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-[hsl(var(--dark-grey))]">{milestone.name}</p>
                {milestone.description && (
                  <p className="mt-1 text-sm text-[hsl(var(--medium-grey))]">
                    {milestone.description}
                  </p>
                )}
              </div>
              <Badge className={MILESTONE_STATUS_COLORS[milestone.status]}>
                {MILESTONE_STATUS_LABELS[milestone.status]}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[hsl(var(--medium-grey))]">
              <span>Target: {formatDate(milestone.targetDate)}</span>
              {milestone.completedAt && <span>Completed: {formatDate(milestone.completedAt)}</span>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LoadingState({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="px-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to projects
      </Button>
      <Skeleton className="h-40" />
      <Skeleton className="h-48" />
    </div>
  );
}

function ErrorState({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="px-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to projects
      </Button>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-[hsl(var(--medium-grey))]">
            <AlertTriangle className="h-4 w-4" />
            <span>Project details could not be loaded.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectDetailView({ hubId, projectId, onBack }: ProjectDetailViewProps) {
  const { data: project, isLoading, error } = useProject(hubId, projectId);

  if (isLoading) {
    return <LoadingState onBack={onBack} />;
  }

  if (error || !project) {
    return <ErrorState onBack={onBack} />;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="px-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to projects
      </Button>
      <ProjectMetaCard project={project} />
      <MilestonesCard milestones={project.milestones} />
      <StaffStatusUpdateHistory hubId={hubId} />
    </div>
  );
}
