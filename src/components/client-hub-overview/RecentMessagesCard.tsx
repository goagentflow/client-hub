/**
 * RecentMessagesCard - Shows latest feed messages for client hub overview.
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, ChevronRight, AlertTriangle, Inbox } from "lucide-react";
import { usePortalFeedMessages } from "@/hooks";
import type { FeedMessage } from "@/types";

interface RecentMessagesCardProps {
  hubId: string;
}

const MAX_MESSAGES_DISPLAY = 3;

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

function MessageItem({ message }: { message: FeedMessage }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/portal/${message.hubId}/messages`)}
      className="w-full text-left p-3 rounded-lg hover:bg-muted/70 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bold-royal-blue))] focus:ring-offset-2"
      aria-label={`${message.senderName}: ${truncate(message.body, 80)}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[hsl(var(--dark-grey))] truncate">
              {message.senderName}
            </p>
            <span className="text-xs text-[hsl(var(--medium-grey))] shrink-0">
              {formatRelativeTime(message.createdAt)}
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--medium-grey))] mt-0.5 truncate">
            {truncate(message.body, 64)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function RecentMessagesCard({ hubId }: RecentMessagesCardProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePortalFeedMessages(hubId, {
    pageSize: MAX_MESSAGES_DISPLAY,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-36" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
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
            <span>Unable to load messages</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const messages = data?.items || [];

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[hsl(var(--medium-grey))]/10">
              <Inbox className="h-6 w-6 text-[hsl(var(--medium-grey))]" />
            </div>
            <div>
              <h3 className="font-semibold text-[hsl(var(--dark-grey))]">No messages yet</h3>
              <p className="text-sm text-[hsl(var(--medium-grey))]">
                Messages will appear here once the conversation starts
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
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[hsl(var(--bold-royal-blue))]" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-[hsl(var(--dark-grey))]">Latest Messages</h3>
          </div>

          <div className="space-y-1" role="list" aria-label="Recent feed messages">
            {messages.map((message) => (
              <div key={message.id} role="listitem">
                <MessageItem message={message} />
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/portal/${hubId}/messages`)}
          >
            View All Messages
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
