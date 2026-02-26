import { Clock, User, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ActivityFeedItem } from "@/types";

interface ActivityListProps {
  activities: ActivityFeedItem[];
  clientDomain: string;
  onViewAll: () => void;
}

const formatTimeAgo = (isoDate: string) => {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

export function ActivityList({ activities, clientDomain, onViewAll }: ActivityListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[hsl(var(--bold-royal-blue))]">
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-[hsl(var(--medium-grey))]">No recent activity</p>
          ) : (
            activities.map((activity) => {
              const isClientAction = activity.actor?.email?.includes(clientDomain);
              return (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 pb-4 border-b last:border-b-0 ${
                    isClientAction ? "bg-[hsl(var(--gradient-blue))]/5 -mx-4 px-4 py-2" : ""
                  }`}
                >
                  {isClientAction ? (
                    <User className="w-5 h-5 text-[hsl(var(--gradient-blue))] mt-1" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--sage-green))] mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-[hsl(var(--dark-grey))]">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-[hsl(var(--medium-grey))]" />
                      <span className="text-xs text-[hsl(var(--medium-grey))]">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <Button variant="link" size="sm" className="mt-4 h-auto px-0 text-sm" onClick={onViewAll}>
          View all
        </Button>
      </CardContent>
    </Card>
  );
}
