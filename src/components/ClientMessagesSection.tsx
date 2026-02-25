import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHubId } from "@/contexts/hub-context";
import { usePortalMessages, useMessageThread, useSendPortalMessage, useTrackEngagement, useCurrentUser } from "@/hooks";
import { cn } from "@/lib/utils";
import type { MessageThreadSummary } from "@/types";

export function ClientMessagesSection() {
  const hubId = useHubId();
  const { toast } = useToast();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showThreadList, setShowThreadList] = useState(true);

  // Data hooks
  const { data: messagesData, isLoading } = usePortalMessages(hubId);
  const { data: selectedThread } = useMessageThread(hubId, selectedThreadId || "");
  const { data: authData } = useCurrentUser();
  const { mutate: sendMessage, isPending: isSending } = useSendPortalMessage(hubId);

  // Engagement tracking
  const { trackHubViewed } = useTrackEngagement(hubId);

  useEffect(() => {
    trackHubViewed("portal-messages");
  }, [trackHubViewed]);

  const threads = messagesData?.items || [];
  const currentUserEmail = authData?.user?.email || "";

  // Auto-select first thread on load
  useEffect(() => {
    if (threads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedThread) return;
    sendMessage(
      { threadId: selectedThread.id, subject: selectedThread.subject, bodyHtml: `<p>${replyText}</p>`, to: [] },
      {
        onSuccess: () => {
          setReplyText("");
          toast({ title: "Message sent", description: "Your message has been sent" });
        },
      }
    );
  };

  const handleSendNewMessage = () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    sendMessage(
      { subject: newSubject, bodyHtml: `<p>${newMessage}</p>`, to: [] },
      {
        onSuccess: () => {
          setNewMessageOpen(false);
          setNewSubject("");
          setNewMessage("");
          toast({ title: "Message sent", description: "Your message has been sent to the AgentFlow team" });
        },
      }
    );
  };

  const handleThreadSelect = (thread: MessageThreadSummary) => {
    setSelectedThreadId(thread.id);
    setShowThreadList(false);
  };

  /**
   * Check if message is from client (current user's email matches sender)
   */
  const isClientMessage = (senderEmail?: string) => {
    const sender = typeof senderEmail === "string" ? senderEmail.toLowerCase() : "";
    const current = typeof currentUserEmail === "string" ? currentUserEmail.toLowerCase() : "";
    return !!sender && !!current && sender === current;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))] mb-2">Messages</h1>
        </div>
        <Button
          className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white"
          onClick={() => setNewMessageOpen(true)}
        >
          New Message
        </Button>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
        {/* Thread List */}
        <div className={cn("lg:col-span-1", !showThreadList && "hidden lg:block")}>
          <Card className="h-full">
            <CardContent className="p-0">
              <ScrollArea className="h-full">
                <div className="divide-y">
                  {threads.map((thread) => (
                    <div
                      key={thread.id}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                        !thread.isRead && "bg-blue-50/50",
                        selectedThreadId === thread.id && "border-l-4 border-[hsl(var(--gradient-blue))] bg-muted/50"
                      )}
                      onClick={() => handleThreadSelect(thread)}
                    >
                      <div className="flex items-start gap-3">
                        {!thread.isRead && <div className="w-2 h-2 rounded-full bg-[hsl(var(--gradient-blue))] mt-2 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm truncate", !thread.isRead && "font-semibold")}>{thread.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">{thread.lastMessagePreview}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {threads.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-3" />
                      <p>No messages yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Thread View */}
        <div className={cn("lg:col-span-2", showThreadList && "hidden lg:block")}>
          <Card className="h-full flex flex-col">
            {selectedThread ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setShowThreadList(true)}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-lg font-bold text-[hsl(var(--dark-grey))]">{selectedThread.subject}</h2>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedThread.messages.map((message) => {
                      const isFromClient = isClientMessage(message.from?.email);
                      return (
                        <div key={message.id} className={cn("flex", isFromClient ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg p-4",
                              isFromClient ? "bg-[hsl(var(--gradient-blue))] text-white" : "bg-white border"
                            )}
                          >
                            <p className={cn("text-sm", isFromClient ? "text-white" : "text-[hsl(var(--dark-grey))]")}>
                              {message.bodyPreview}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t bg-white">
                  <div className="space-y-3">
                    <Textarea placeholder="Write your reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} />
                    <div className="flex items-center justify-end">
                      <Button
                        className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || isSending}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isSending ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center space-y-3">
                  <Mail className="h-16 w-16 text-muted-foreground mx-auto" />
                  <p className="text-lg font-semibold text-[hsl(var(--dark-grey))]">Select a conversation</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New Message Modal */}
      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[hsl(var(--bold-royal-blue))]">New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-subject">Subject</Label>
              <Input id="new-subject" placeholder="Enter subject..." value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-message">Message</Label>
              <Textarea id="new-message" placeholder="Type your message..." rows={6} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
                onClick={handleSendNewMessage}
                disabled={!newSubject.trim() || !newMessage.trim() || isSending}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send"}
              </Button>
              <Button variant="ghost" onClick={() => setNewMessageOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
