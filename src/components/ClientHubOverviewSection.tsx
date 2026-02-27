/**
 * Client Hub Overview Section - Modified overview for client hubs
 *
 * Shows:
 * - Client hub badge and status
 * - Quick stats grid (projects, activity, client documents)
 * - Recent activity preview
 */

import { FolderKanban, Activity, ChevronRight, UserPlus, ClipboardList, FileText, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuickStatCard } from "./overview/QuickStatCard";
import {
  useProjects,
  useHubActivity,
  useDocuments,
} from "@/hooks";
import type { Hub } from "@/types";

interface ClientHubOverviewSectionProps {
  hub: Hub;
  onNavigateToProjects?: () => void;
  onNavigateToActivity?: () => void;
  onNavigateToDocuments?: () => void;
  onManageClientAccess?: () => void;
  onInviteClient?: () => void;
  onAddStatusUpdate?: () => void;
}

export function ClientHubOverviewSection({
  hub,
  onNavigateToProjects,
  onNavigateToActivity,
  onNavigateToDocuments,
  onManageClientAccess,
  onInviteClient,
  onAddStatusUpdate,
}: ClientHubOverviewSectionProps) {
  const { data: projectsData, isLoading: projectsLoading } = useProjects(hub.id);
  const { data: clientDocsData, isLoading: docsLoading } = useDocuments(hub.id, { visibility: "client" });
  const { data: activityData, isLoading: activityLoading } = useHubActivity(hub.id, {
    page: 1,
    pageSize: 5,
  });

  const projects = projectsData?.items ?? [];
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const recentActivity = activityData?.items ?? [];
  const clientDocCount = clientDocsData?.pagination?.totalItems ?? 0;

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
            onClick={onManageClientAccess}
            variant="outline"
            className="border-[hsl(var(--dark-grey))]/30 text-[hsl(var(--dark-grey))]"
          >
            <Shield className="w-4 h-4 mr-2" />
            Manage Client Access
          </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <p className="text-sm font-medium text-[hsl(var(--dark-grey))]">
                      {item.title}
                    </p>
                    <p className="text-sm text-[hsl(var(--medium-grey))]">
                      {item.description || "Activity recorded"}
                    </p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">
                      {item.actor?.name ? `By ${item.actor.name} · ` : ""}
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
