/**
 * StatusUpdateCard — Client-facing fortnightly status update card.
 *
 * Shows latest update prominently with expandable history.
 * Fetches history via pagination (load-more pattern, accumulates pages).
 */

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { usePortalStatusUpdates } from "@/hooks";
import type { StatusUpdate, OnTrackStatus } from "@/types";

interface StatusUpdateCardProps {
  hubId: string;
}

const PAGE_SIZE = 20;

const onTrackConfig: Record<
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

function StatusBadge({ status }: { status: OnTrackStatus }) {
  const config = onTrackConfig[status];
  const Icon = config.icon;
  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.bgClass}`}
    >
      <Icon className={`h-3 w-3 ${config.colorClass}`} aria-hidden="true" />
      <span className={config.colorClass}>{config.label}</span>
    </div>
  );
}

function UpdateDetail({ update }: { update: StatusUpdate }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-[hsl(var(--dark-grey))]">{update.period}</h4>
        <StatusBadge status={update.onTrack} />
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-[hsl(var(--dark-grey))]">Completed: </span>
          <span className="text-[hsl(var(--medium-grey))] whitespace-pre-line">
            {update.completed}
          </span>
        </div>
        <div>
          <span className="font-medium text-[hsl(var(--dark-grey))]">In Progress: </span>
          <span className="text-[hsl(var(--medium-grey))] whitespace-pre-line">
            {update.inProgress}
          </span>
        </div>
        <div>
          <span className="font-medium text-[hsl(var(--dark-grey))]">Next 2 Weeks: </span>
          <span className="text-[hsl(var(--medium-grey))] whitespace-pre-line">
            {update.nextPeriod}
          </span>
        </div>
        {update.neededFromClient && (
          <div className="p-2 rounded bg-[hsl(var(--soft-coral))]/5 border border-[hsl(var(--soft-coral))]/20">
            <span className="font-medium text-[hsl(var(--soft-coral))]">
              Needed from you:{" "}
            </span>
            <span className="text-[hsl(var(--dark-grey))] whitespace-pre-line">
              {update.neededFromClient}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-[hsl(var(--medium-grey))]">
        {new Date(update.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

export function StatusUpdateCard({ hubId }: StatusUpdateCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [loadedPages, setLoadedPages] = useState<StatusUpdate[][]>([]);
  const [nextPage, setNextPage] = useState(2);

  // Always fetch page 1 for the latest update
  const { data, isLoading, error, isFetching } = usePortalStatusUpdates(hubId, {
    page: 1,
    pageSize: PAGE_SIZE,
  });

  // Reset accumulated state when hubId changes or base data refetches
  const latestId = data?.items?.[0]?.id;
  useEffect(() => {
    setLoadedPages([]);
    setNextPage(2);
    setShowHistory(false);
  }, [hubId, latestId]);

  const totalItems = data?.pagination?.totalItems ?? 0;
  const allPreviousFromPage1 = (data?.items || []).slice(1);
  const allLoadedPrevious = [
    ...allPreviousFromPage1,
    ...loadedPages.flat(),
  ];
  const totalLoaded = 1 + allLoadedPrevious.length; // latest + previous
  const hasMore = totalLoaded < totalItems;

  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const { getPortalStatusUpdates } = await import("@/services");
      const result = await getPortalStatusUpdates(hubId, { page: nextPage, pageSize: PAGE_SIZE });
      if (result.items.length > 0) {
        setLoadedPages((prev) => [...prev, result.items]);
      }
      setNextPage((p) => p + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [hubId, nextPage]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-[hsl(var(--medium-grey))]">
            <AlertTriangle className="h-5 w-5" />
            <span>Unable to load status updates</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const updates = data?.items || [];

  if (updates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[hsl(var(--medium-grey))]/10">
              <ClipboardList className="h-6 w-6 text-[hsl(var(--medium-grey))]" />
            </div>
            <div>
              <h3 className="font-semibold text-[hsl(var(--dark-grey))]">
                No status updates yet
              </h3>
              <p className="text-sm text-[hsl(var(--medium-grey))]">
                Status updates will appear here when available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latest = updates[0];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <ClipboardList
              className="h-5 w-5 text-[hsl(var(--bold-royal-blue))]"
              aria-hidden="true"
            />
            <h3 className="text-lg font-semibold text-[hsl(var(--dark-grey))]">
              Status Update
            </h3>
          </div>

          {/* Latest update */}
          <UpdateDetail update={latest} />

          {/* Previous updates */}
          {(allLoadedPrevious.length > 0 || hasMore) && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-[hsl(var(--bold-royal-blue))]"
                onClick={() => setShowHistory(!showHistory)}
                aria-label={showHistory ? "Hide previous updates" : "Show previous updates"}
              >
                {showHistory ? (
                  <>
                    Hide previous updates
                    <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    {totalItems - 1} previous update{totalItems - 1 !== 1 ? "s" : ""}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>

              {showHistory && (
                <div className="mt-3 space-y-4 pt-3 border-t">
                  {allLoadedPrevious.map((update) => (
                    <UpdateDetail key={update.id} update={update} />
                  ))}
                  {hasMore && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleLoadMore}
                      disabled={loadingMore || isFetching}
                      aria-label="Load more status updates"
                    >
                      {loadingMore ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Load more
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
