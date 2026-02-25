import { useState, useEffect } from "react";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHubId } from "@/contexts/hub-context";
import {
  useMessageThreads,
  useMessageThread,
  useSendMessage,
  useUpdateTeamNotes,
  useArchiveThread,
  useCurrentUser,
  useTrackEngagement,
  useToast,
} from "@/hooks";
import { ThreadList, ThreadView, ComposeDialog } from "./messages";

export function MessagesSection() {
  const hubId = useHubId();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Auth
  const { data: authData } = useCurrentUser();
  const currentUserEmail = authData?.user?.email || "";

  // Hooks for data fetching
  const { data: threadsData, isLoading } = useMessageThreads(hubId);
  const { data: selectedThread } = useMessageThread(hubId, selectedThreadId || "");

  // Mutations
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(hubId);
  const { mutate: updateNotes } = useUpdateTeamNotes(hubId);
  const { mutate: archiveThread } = useArchiveThread(hubId);

  // Engagement tracking
  const { trackHubViewed } = useTrackEngagement(hubId);
  const { toast } = useToast();

  // Track messages section view on mount
  useEffect(() => {
    trackHubViewed("messages");
  }, [trackHubViewed]);

  const threads = threadsData?.items || [];
  const normalizedSearch = searchQuery.toLowerCase();

  // Filter threads by search
  const filteredThreads = threads.filter(
    (thread) =>
      (thread.subject || "").toLowerCase().includes(normalizedSearch) ||
      (thread.lastMessagePreview || "").toLowerCase().includes(normalizedSearch)
  );

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setShowMobileThread(true);
  };

  const handleSendNewMessage = (data: { to: string[]; subject: string; bodyHtml: string }) => {
    sendMessage(data, {
      onSuccess: () => setComposeOpen(false),
    });
  };

  const handleSendReply = (body: string) => {
    if (!selectedThreadId) return;
    sendMessage(
      {
        threadId: selectedThreadId,
        to: [],
        subject: "",
        bodyHtml: `<p>${body.replace(/\n/g, "</p><p>")}</p>`,
      },
      {
        onSuccess: () => {},
      }
    );
  };

  const handleUpdateNotes = (notes: string) => {
    if (!selectedThreadId) return;
    updateNotes({ threadId: selectedThreadId, notes });
  };

  const handleArchive = () => {
    if (!selectedThreadId) return;
    archiveThread({ threadId: selectedThreadId, archive: true });
    setSelectedThreadId(null);
    setShowMobileThread(false);
  };

  const handleMarkUnread = () => {
    toast({
      title: "Marked as unread",
      description: "This thread will appear as unread in your inbox",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">Messages</h1>
          <p className="text-sm text-[hsl(var(--medium-grey))] mt-1 flex items-center gap-2">
            Showing emails with client contacts
            <span className="text-xs">· Synced from Outlook</span>
          </p>
        </div>

        <Button
          onClick={() => setComposeOpen(true)}
          className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white"
        >
          Compose
        </Button>
      </div>

      {/* Two-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Thread List */}
        <div
          className={`w-full md:w-1/3 border-r border-border/50 ${
            showMobileThread ? "hidden md:block" : "block"
          }`}
        >
          <ThreadList
            threads={filteredThreads}
            selectedThreadId={selectedThreadId}
            onSelectThread={handleSelectThread}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Right Panel: Thread View */}
        <div className={`flex-1 ${!showMobileThread ? "hidden md:flex" : "flex"} flex-col`}>
          {selectedThread ? (
            <ThreadView
              thread={selectedThread}
              currentUserEmail={currentUserEmail}
              onBack={() => setShowMobileThread(false)}
              onArchive={handleArchive}
              onMarkUnread={handleMarkUnread}
              onUpdateNotes={handleUpdateNotes}
              onSendReply={handleSendReply}
              isSending={isSending}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-16 w-16 text-[hsl(var(--medium-grey))] mx-auto mb-4" />
                <p className="text-[hsl(var(--medium-grey))]">Select a conversation to view</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ComposeDialog
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={handleSendNewMessage}
        isSending={isSending}
      />
    </div>
  );
}
