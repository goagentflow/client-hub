/**
 * StaffStatusUpdateHistory — Staff-facing status update timeline for a hub.
 */

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useStatusUpdates } from "@/hooks";
import { getStatusUpdates } from "@/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OnTrackStatus, StatusUpdate } from "@/types";

interface StaffStatusUpdateHistoryProps {
  hubId: string;
}

const PAGE_SIZE = 20;

const ON_TRACK_CONFIG: Record<
  OnTrackStatus,
  { icon: typeof CheckCircle2; label: string; colorClass: string; bgClass: string }
> = {
  on_track: {
    icon: CheckCircle2,
    label: "On Track",
    colorClass: "text-[hsl(var(--sage-green))]",
    bgClass: "bg-[hsl(var(--sage-green))]/10",
  },
  at_risk: {
    icon: AlertTriangle,
    label: "At Risk",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-100",
  },
  off_track: {
    icon: XCircle,
    label: "Off Track",
    colorClass: "text-red-600",
    bgClass: "bg-red-100",
  },
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function OnTrackBadge({ status }: { status: OnTrackStatus }) {
  const config = ON_TRACK_CONFIG[status];
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${config.bgClass}`}>
      <Icon className={`h-3 w-3 ${config.colorClass}`} aria-hidden="true" />
      <span className={config.colorClass}>{config.label}</span>
    </div>
  );
}

function StatusUpdateEntry({ update }: { update: StatusUpdate }) {
  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium text-[hsl(var(--dark-grey))]">{update.period}</h4>
        <OnTrackBadge status={update.onTrack} />
      </div>
      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium text-[hsl(var(--dark-grey))]">Completed: </span>
          <span className="whitespace-pre-line text-[hsl(var(--medium-grey))]">{update.completed}</span>
        </p>
        <p>
          <span className="font-medium text-[hsl(var(--dark-grey))]">In Progress: </span>
          <span className="whitespace-pre-line text-[hsl(var(--medium-grey))]">{update.inProgress}</span>
        </p>
        <p>
          <span className="font-medium text-[hsl(var(--dark-grey))]">Next 2 Weeks: </span>
          <span className="whitespace-pre-line text-[hsl(var(--medium-grey))]">{update.nextPeriod}</span>
        </p>
        {update.neededFromClient && (
          <p className="rounded border border-[hsl(var(--soft-coral))]/20 bg-[hsl(var(--soft-coral))]/5 p-2">
            <span className="font-medium text-[hsl(var(--soft-coral))]">Needed from client: </span>
            <span className="whitespace-pre-line text-[hsl(var(--dark-grey))]">
              {update.neededFromClient}
            </span>
          </p>
        )}
      </div>
      <p className="text-xs text-[hsl(var(--medium-grey))]">
        {formatDateTime(update.createdAt)} by {update.createdBy}
      </p>
    </div>
  );
}

function StatusUpdateLoading() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-[hsl(var(--dark-grey))]">Status updates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </CardContent>
    </Card>
  );
}

function StatusUpdateError() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-[hsl(var(--dark-grey))]">Status updates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-[hsl(var(--medium-grey))]">
          <AlertTriangle className="h-4 w-4" />
          <span>Unable to load status updates.</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StaffStatusUpdateHistory({ hubId }: StaffStatusUpdateHistoryProps) {
  const [loadedPages, setLoadedPages] = useState<StatusUpdate[][]>([]);
  const [nextPage, setNextPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { data, isLoading, error, isFetching } = useStatusUpdates(hubId, {
    page: 1,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    setLoadedPages([]);
    setNextPage(2);
    setLoadError(null);
  }, [hubId]);

  const firstPage = data?.items || [];
  const allUpdates = [...firstPage, ...loadedPages.flat()];
  const totalItems = data?.pagination?.totalItems ?? 0;
  const hasMore = allUpdates.length < totalItems;

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    setLoadError(null);
    try {
      const result = await getStatusUpdates(hubId, { page: nextPage, pageSize: PAGE_SIZE });
      if (result.items.length > 0) {
        setLoadedPages((prev) => [...prev, result.items]);
      }
      setNextPage((prev) => prev + 1);
    } catch (_err) {
      setLoadError("Unable to load older status updates.");
    } finally {
      setLoadingMore(false);
    }
  }, [hubId, nextPage]);

  if (isLoading) {
    return <StatusUpdateLoading />;
  }

  if (error) {
    return <StatusUpdateError />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-[hsl(var(--dark-grey))]">Status updates</CardTitle>
        <p className="text-sm text-[hsl(var(--medium-grey))]">
          Status updates are currently shared at hub level. This shows the full history visible to the client.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {allUpdates.length === 0 && (
          <p className="text-sm text-[hsl(var(--medium-grey))]">
            No status updates have been added yet.
          </p>
        )}
        {allUpdates.map((update) => (
          <StatusUpdateEntry key={update.id} update={update} />
        ))}
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        {hasMore && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleLoadMore}
            disabled={loadingMore || isFetching}
          >
            {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load older updates
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
