import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, AlertTriangle } from "lucide-react";
import type { FeedMessage } from "@/types";
import { cn } from "@/lib/utils";

const MAX_MESSAGE_LENGTH = 10000;

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

interface MessageFeedProps {
  messages: FeedMessage[];
  currentUserEmail?: string;
  isLoading?: boolean;
  isSending?: boolean;
  errorMessage?: string;
  onSend: (body: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  sendButtonLabel?: string;
  inputPlaceholder?: string;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function MessageFeed({
  messages,
  currentUserEmail,
  isLoading = false,
  isSending = false,
  errorMessage,
  onSend,
  emptyTitle = "No messages yet",
  emptyDescription = "Start the conversation.",
  sendButtonLabel = "Send",
  inputPlaceholder = "Write a message...",
}: MessageFeedProps) {
  const [draft, setDraft] = useState("");
  const currentEmail = normalizeEmail(currentUserEmail);

  const orderedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  );

  const trimmed = draft.trim();
  const remaining = MAX_MESSAGE_LENGTH - draft.length;
  const isOverLimit = remaining < 0;
  const canSend = !!trimmed && !isOverLimit && !isSending;

  const handleSend = () => {
    if (!canSend) return;
    onSend(trimmed);
    setDraft("");
  };

  if (isLoading) {
    return (
      <div data-testid="message-feed-loading" className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card>
        <CardContent data-testid="message-feed-error" className="p-6 flex items-center gap-3 text-[hsl(var(--dark-grey))]">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p>{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="message-feed" className="h-full flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col">
        <ScrollArea data-testid="message-list" className="flex-1 min-h-[320px] p-4">
          {orderedMessages.length === 0 ? (
            <div data-testid="message-feed-empty" className="h-full min-h-[220px] flex items-center justify-center">
              <div className="text-center space-y-2 text-[hsl(var(--medium-grey))]">
                <MessageSquare className="h-10 w-10 mx-auto" />
                <p className="font-medium text-[hsl(var(--dark-grey))]">{emptyTitle}</p>
                <p className="text-sm">{emptyDescription}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orderedMessages.map((message) => {
                const senderEmail = normalizeEmail(message.senderEmail);
                const mine = !!currentEmail && !!senderEmail && senderEmail === currentEmail;
                const senderName =
                  typeof message.senderName === "string" && message.senderName.trim().length > 0
                    ? message.senderName
                    : "Unknown";
                const body =
                  typeof message.body === "string" && message.body.length > 0
                    ? message.body
                    : "";
                return (
                  <div
                    key={message.id}
                    data-testid="message-item"
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-4 py-3",
                        mine
                          ? "bg-[hsl(var(--gradient-blue))] text-white"
                          : "bg-white border border-border/70 text-[hsl(var(--dark-grey))]",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs font-medium", mine ? "text-white/90" : "text-[hsl(var(--dark-grey))]")}>
                          {senderName}
                        </span>
                        <span className={cn("text-xs", mine ? "text-white/70" : "text-[hsl(var(--medium-grey))]")}>
                          {formatTimestamp(message.createdAt)}
                        </span>
                      </div>
                      <p className={cn("text-sm whitespace-pre-wrap", mine ? "text-white" : "text-[hsl(var(--dark-grey))]")}>
                        {body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4 space-y-2">
          <Textarea
            data-testid="message-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={inputPlaceholder}
            rows={3}
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <div className="flex items-center justify-between">
            <p
              className={cn(
                "text-xs",
                isOverLimit ? "text-destructive" : "text-[hsl(var(--medium-grey))]",
              )}
            >
              {remaining} characters remaining
            </p>
            <Button
              data-testid="message-send-button"
              onClick={handleSend}
              disabled={!canSend}
              className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
            >
              {isSending ? "Sending..." : sendButtonLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
