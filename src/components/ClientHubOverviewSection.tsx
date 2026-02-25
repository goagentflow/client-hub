/**
 * Client Hub Overview Section - Modified overview for client hubs
 *
 * Shows:
 * - Client hub badge and status
 * - Quick stats grid (decisions, projects, health, activity)
 * - Recent activity preview
 */

import { FolderKanban, Heart, Activity, ChevronRight, ClipboardCheck, UserPlus, ClipboardList, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickStatCard } from "./overview/QuickStatCard";
import {
  useProjects,
  useRelationshipHealth,
  useHubActivity,
  useDecisions,
  useDocuments,
} from "@/hooks";
import type { Hub, HealthStatus } from "@/types";

interface ClientHubOverviewSectionProps {
  hub: Hub;
  onNavigateToProjects?: () => void;
  onNavigateToDecisions?: () => void;
  onNavigateToHealth?: () => void;
  onNavigateToActivity?: () => void;
  onNavigateToDocuments?: () => void;
  onInviteClient?: () => void;
  onAddStatusUpdate?: () => void;
}

const healthStatusColors: Record<HealthStatus, { bg: string; text: string }> = {
  strong: { bg: "bg-[hsl(var(--sage-green))]/10", text: "text-[hsl(var(--sage-green))]" },
  stable: { bg: "bg-[hsl(var(--bold-royal-blue))]/10", text: "text-[hsl(var(--bold-royal-blue))]" },
  at_risk: { bg: "bg-[hsl(var(--soft-coral))]/10", text: "text-[hsl(var(--soft-coral))]" },
};

const healthStatusLabels: Record<HealthStatus, string> = {
  strong: "Strong",
  stable: "Stable",
  at_risk: "At Risk",
};

export function ClientHubOverviewSection({
  hub,
  onNavigateToProjects,
  onNavigateToDecisions,
  onNavigateToHealth,
  onNavigateToActivity,
  onNavigateToDocuments,
  onInviteClient,
  onAddStatusUpdate,
}: ClientHubOverviewSectionProps) {
  const { data: projectsData, isLoading: projectsLoading } = useProjects(hub.id);
  const { data: decisionsData, isLoading: decisionsLoading } = useDecisions(hub.id);
  const { data: health, isLoading: healthLoading } = useRelationshipHealth(hub.id);
  const { data: clientDocsData, isLoading: docsLoading } = useDocuments(hub.id, { visibility: "client" });
  const { data: activityData, isLoading: activityLoading } = useHubActivity(hub.id, {
    page: 1,
    pageSize: 5,
  });

  const projects = projectsData?.items ?? [];
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const recentActivity = activityData?.items ?? [];
  const clientDocCount = clientDocsData?.pagination?.totalItems ?? 0;

  const pendingDecisions = decisionsData?.items.filter(
    (d) => d.status === "open" || d.status === "in_review"
  ) ?? [];
  const overdueDecisions = pendingDecisions.filter((d) => {
    if (!d.dueDate) return false;
    return new Date(d.dueDate) < new Date();
  });

  return (
    <div className="space-y-6">
      {/* Client Hub Badge + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-[hsl(var(--rich-violet))] text-[hsl(var(--rich-violet))] px-3 py-1"
          >
            Client Hub
          </Badge>
          <span className="text-sm text-[hsl(var(--medium-grey))]">
            {hub.convertedAt
              ? `Converted ${new Date(hub.convertedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}`
              : `Created ${new Date(hub.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onAddStatusUpdate}
            variant="outline"
            className="border-[hsl(var(--bold-royal-blue))] text-[hsl(var(--bold-royal-blue))]"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Add Status Update
          </Button>
          <Button
            onClick={onInviteClient}
            className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Client
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <QuickStatCard
          icon={<ClipboardCheck className="w-4 h-4" />}
          title="Waiting on Client"
          isLoading={decisionsLoading}
          onClick={onNavigateToDecisions}
        >
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${
              overdueDecisions.length > 0
                ? "text-[hsl(var(--soft-coral))]"
                : "text-[hsl(var(--bold-royal-blue))]"
            }`}>
              {pendingDecisions.length}
            </span>
            <span className="text-sm text-[hsl(var(--medium-grey))]">
              {pendingDecisions.length === 1 ? "decision" : "decisions"}
            </span>
            {overdueDecisions.length > 0 && (
              <Badge variant="outline" className="text-xs bg-[hsl(var(--soft-coral))]/10 text-[hsl(var(--soft-coral))] border-0">
                {overdueDecisions.length} overdue
              </Badge>
            )}
          </div>
        </QuickStatCard>

        <QuickStatCard
          icon={<FolderKanban className="w-4 h-4" />}
          title="Projects"
          isLoading={projectsLoading}
          onClick={onNavigateToProjects}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[hsl(var(--bold-royal-blue))]">
              {activeProjects}
            </span>
            <span className="text-sm text-[hsl(var(--medium-grey))]">
              active of {projects.length}
            </span>
          </div>
        </QuickStatCard>

        <QuickStatCard
          icon={<Heart className="w-4 h-4" />}
          title="Relationship Health"
          isLoading={healthLoading}
          onClick={onNavigateToHealth}
          linkText="View details"
        >
          {health ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-[hsl(var(--bold-royal-blue))]">
                {health.score}
              </span>
              <Badge
                className={`${healthStatusColors[health.status].bg} ${healthStatusColors[health.status].text} border-0`}
              >
                {healthStatusLabels[health.status]}
              </Badge>
            </div>
          ) : (
            <span className="text-sm text-[hsl(var(--medium-grey))]">Calculating...</span>
          )}
        </QuickStatCard>

        <QuickStatCard
          icon={<Activity className="w-4 h-4" />}
          title="Recent Activity"
          isLoading={activityLoading}
          onClick={onNavigateToActivity}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[hsl(var(--bold-royal-blue))]">
              {activityData?.total ?? 0}
            </span>
            <span className="text-sm text-[hsl(var(--medium-grey))]">events</span>
          </div>
        </QuickStatCard>

        <QuickStatCard
          icon={<FileText className="w-4 h-4" />}
          title="Client Documents"
          isLoading={docsLoading}
          onClick={onNavigateToDocuments}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[hsl(var(--bold-royal-blue))]">
              {clientDocCount}
            </span>
            <span className="text-sm text-[hsl(var(--medium-grey))]">
              {clientDocCount === 1 ? "document" : "documents"}
            </span>
          </div>
        </QuickStatCard>
      </div>

      {/* Recent Activity Preview */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[hsl(var(--dark-grey))]">
              Latest Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                >
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--gradient-blue))] mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[hsl(var(--dark-grey))]">{item.description}</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">
                      {new Date(item.timestamp).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {recentActivity.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-[hsl(var(--bold-royal-blue))]"
                onClick={onNavigateToActivity}
              >
                View all activity
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
