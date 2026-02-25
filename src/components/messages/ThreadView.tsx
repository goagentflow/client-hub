import { useState } from "react";
import DOMPurify from "dompurify";
import { Archive, ChevronLeft, EyeOff, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MessageThreadDetail } from "@/types";

interface ThreadViewProps {
  thread: MessageThreadDetail;
  currentUserEmail: string;
  onBack: () => void;
  onArchive: () => void;
  onMarkUnread: () => void;
  onUpdateNotes: (notes: string) => void;
  onSendReply: (body: string, attachments?: File[]) => void;
  isSending: boolean;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ThreadView({
  thread,
  currentUserEmail,
  onBack,
  onArchive,
  onMarkUnread,
  onUpdateNotes,
  onSendReply,
  isSending,
}: ThreadViewProps) {
  const [showNotesEdit, setShowNotesEdit] = useState(false);
  const [editedNotes, setEditedNotes] = useState(thread.teamNotes || "");
  const [replyBody, setReplyBody] = useState("");

  const handleSaveNotes = () => {
    onUpdateNotes(editedNotes);
    setShowNotesEdit(false);
  };

  const handleSendReply = () => {
    if (!replyBody.trim()) return;
    onSendReply(replyBody);
    setReplyBody("");
  };

  const senderName = thread.participants.find((p) => p.isClient)?.name || "Unknown";
  const lastMessage = thread.messages[thread.messages.length - 1];

  return (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden mb-2"
              onClick={onBack}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h2 className="text-xl font-semibold text-[hsl(var(--dark-grey))]">
              {thread.subject}
            </h2>
            <p className="text-sm text-[hsl(var(--medium-grey))] mt-1">
              {senderName} · {thread.messageCount} messages in thread
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={onArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button variant="ghost" size="sm" onClick={onMarkUnread}>
              Mark unread
            </Button>
          </div>
        </div>

        {/* Team Notes */}
        <Card className="mt-4 bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-[hsl(var(--medium-grey))]" />
                <h3 className="font-semibold text-sm">Team Notes</h3>
                <span className="text-xs text-[hsl(var(--medium-grey))]">(Not visible to client)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (showNotesEdit) {
                    handleSaveNotes();
                  } else {
                    setEditedNotes(thread.teamNotes || "");
                    setShowNotesEdit(true);
                  }
                }}
              >
                {showNotesEdit ? "Save" : "Edit"}
              </Button>
            </div>
            {showNotesEdit ? (
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Add internal notes about this thread..."
                className="text-sm"
              />
            ) : (
              <p className="text-sm text-[hsl(var(--medium-grey))] whitespace-pre-line">
                {thread.teamNotes || "No team notes yet. Click Edit to add notes."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl">
          {thread.messages.map((message) => {
            const senderEmail = typeof message.from?.email === "string" ? message.from.email : "";
            const currentEmail = typeof currentUserEmail === "string" ? currentUserEmail : "";
            const isYou =
              !!senderEmail &&
              !!currentEmail &&
              senderEmail.toLowerCase() === currentEmail.toLowerCase();
            const senderName =
              typeof message.from?.name === "string" && message.from.name.length > 0
                ? message.from.name
                : "Unknown";
            const senderInitial = senderName[0]?.toUpperCase() || "?";
            const attachments = Array.isArray(message.attachments) ? message.attachments : [];

            return (
              <div key={message.id} className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] ${isYou ? "text-right" : "text-left"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isYou && (
                      <>
                        <span className="text-xs text-[hsl(var(--medium-grey))]">
                          {new Date(message.sentAt).toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold">{senderName}</span>
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--gradient-blue))] flex items-center justify-center text-white text-sm font-medium">
                          {senderInitial}
                        </div>
                      </>
                    )}
                    {!isYou && (
                      <>
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--gradient-purple))] flex items-center justify-center text-white text-sm font-medium">
                          {senderInitial}
                        </div>
                        <span className="text-sm font-semibold">{senderName}</span>
                        <span className="text-xs text-[hsl(var(--medium-grey))]">
                          {new Date(message.sentAt).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                  <Card className={isYou ? "bg-[hsl(var(--gradient-blue))]/10" : ""}>
                    <CardContent className="p-4">
                      <div
                        className="text-sm text-[hsl(var(--dark-grey))] prose prose-sm"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.bodyHtml) }}
                      />
                      {attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="p-3 bg-background rounded border border-border/50 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4 text-[hsl(var(--medium-grey))]" />
                                <div>
                                  <p className="text-sm font-medium">{attachment.name}</p>
                                  <p className="text-xs text-[hsl(var(--medium-grey))]">
                                    {formatFileSize(attachment.size)}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={attachment.downloadUrl} download>
                                  Download
                                </a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Reply Composer */}
      <div className="p-6 border-t border-border/50">
        <div className="space-y-3">
          <Textarea
            placeholder="Write your reply..."
            className="min-h-[100px]"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-[hsl(var(--medium-grey))]">
                Sent via Outlook to {lastMessage?.from?.email ?? "client"}
              </p>
              <Button
                className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
                onClick={handleSendReply}
                disabled={!replyBody.trim() || isSending}
              >
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
