/**
 * HubCard — card component for the hub list grid
 */

import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Hub, HubStatus } from "@/types";

const STATUS_COLORS: Record<HubStatus, string> = {
  active: "bg-sage-green text-white",
  won: "bg-gradient-blue text-white",
  lost: "bg-medium-grey text-white",
  draft: "bg-muted text-muted-foreground",
};

function formatLastActivity(date: string): string {
  const now = new Date();
  const activityDate = new Date(date);
  const diffDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

interface HubCardProps {
  hub: Hub;
}

export function HubCard({ hub }: HubCardProps) {
  const navigate = useNavigate();
  const statusLabel = hub.status.charAt(0).toUpperCase() + hub.status.slice(1);

  return (
    <Card
      className="p-6 bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
      onClick={() => navigate(`/hub/${hub.id}/overview`)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-bold text-dark-grey group-hover:text-royal-blue transition-colors">
            {hub.companyName}
          </h3>
          {hub.hubType === "client" && (
            <Badge
              variant="outline"
              className="border-[hsl(var(--rich-violet))] text-[hsl(var(--rich-violet))] text-xs flex-shrink-0"
            >
              Client
            </Badge>
          )}
        </div>

        <p className="text-medium-grey text-sm">{hub.contactName}</p>

        <Badge className={`${STATUS_COLORS[hub.status] || "bg-muted text-muted-foreground"} px-3 py-1 text-xs font-medium`}>
          {statusLabel}
        </Badge>

        <p className="text-medium-grey text-xs pt-2">
          Last activity: {formatLastActivity(hub.lastActivity)}
        </p>
      </div>
    </Card>
  );
}
