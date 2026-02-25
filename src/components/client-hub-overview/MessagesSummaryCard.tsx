import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Mail, MessageSquare, ChevronRight, AlertTriangle } from "lucide-react";
import { useCurrentUser, usePortalFeedMessages } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPortalMessageLastRead } from "@/lib/portal-message-read";

interface MessagesSummaryCardProps {
  hubId: string;
}

function toTimestamp(value: string): number {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function MessagesSummaryCard({ hubId }: MessagesSummaryCardProps) {
  const { data: authData } = useCurrentUser();
  const { data, isLoading, error } = usePortalFeedMessages(hubId, { pageSize: 200 });

  const messages = data?.items ?? [];
  const totalMessages = data?.pagination?.totalItems ?? messages.length;
  const lastRead = getPortalMessageLastRead(hubId, authData?.user?.email);
  const lastReadTs = lastRead ? toTimestamp(lastRead) : 0;

  const unreadCount = messages.filter(
    (message) =>
      message.senderType === "staff" &&
      toTimestamp(message.createdAt) > lastReadTs,
  ).length;

  const latestMessage = messages[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-[hsl(var(--dark-grey))] flex items-center gap-2">
          <Mail className="h-4 w-4 text-[hsl(var(--bold-royal-blue))]" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-[hsl(var(--medium-grey))]">Loading messages…</p>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))]">
            <AlertTriangle className="h-4 w-4" />
            Unable to load messages
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--bold-royal-blue))]">
                  {totalMessages}
                </p>
                <p className="text-sm text-[hsl(var(--medium-grey))]">
                  {totalMessages === 1 ? "message" : "messages"}
                </p>
              </div>
              <Badge
                variant={unreadCount > 0 ? "default" : "outline"}
                className={
                  unreadCount > 0
                    ? "bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]"
                    : ""
                }
              >
                {unreadCount} unread
              </Badge>
            </div>

            {latestMessage ? (
              <div className="rounded-md border border-border/60 p-3">
                <p className="text-xs font-medium text-[hsl(var(--dark-grey))]">
                  Latest from {latestMessage.senderName}
                </p>
                <p className="mt-1 text-xs text-[hsl(var(--medium-grey))] line-clamp-2">
                  {latestMessage.body}
                </p>
                <p className="mt-1 text-xs text-[hsl(var(--medium-grey))]">
                  {formatRelative(latestMessage.createdAt)}
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-border/60 p-3 text-sm text-[hsl(var(--medium-grey))] flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                No messages yet
              </div>
            )}
          </>
        )}

        <Button variant="ghost" size="sm" className="w-full text-[hsl(var(--bold-royal-blue))]" asChild>
          <Link to={`/portal/${hubId}/messages`}>
            Open messages
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

