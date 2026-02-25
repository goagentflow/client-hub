import { useEffect } from "react";
import { useHubId } from "@/contexts/hub-context";
import { MessageFeed } from "./MessageFeed";
import { MessageAudienceCard } from "./MessageAudienceCard";
import {
  useCurrentUser,
  useFeedMessages,
  useMessageAudience,
  useSendFeedMessage,
  useTrackEngagement,
  useToast,
} from "@/hooks";

export function StaffMessageFeed() {
  const hubId = useHubId();
  const { toast } = useToast();

  const { data: authData } = useCurrentUser();
  const { data, isLoading, error } = useFeedMessages(hubId);
  const { data: audience, isLoading: isAudienceLoading, error: audienceError } = useMessageAudience(hubId);
  const { mutate: sendMessage, isPending: isSending } = useSendFeedMessage(hubId);
  const { trackHubViewed } = useTrackEngagement(hubId);

  useEffect(() => {
    trackHubViewed("messages");
  }, [trackHubViewed]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">Messages</h1>
        <p className="text-sm text-[hsl(var(--medium-grey))]">
          Communicate with your client directly in the hub.
        </p>
      </div>

      <MessageAudienceCard
        audience={audience}
        isLoading={isAudienceLoading}
        errorMessage={audienceError ? "Unable to load message audience" : undefined}
      />

      <MessageFeed
        messages={data?.items || []}
        currentUserEmail={authData?.user?.email}
        isLoading={isLoading}
        isSending={isSending}
        errorMessage={error ? "Unable to load messages" : undefined}
        emptyTitle="No messages yet"
        emptyDescription="Start the conversation with your client."
        onSend={(body) =>
          sendMessage(
            { body },
            {
              onSuccess: () => {
                toast({ title: "Message sent" });
              },
              onError: (err) => {
                toast({
                  title: "Could not send message",
                  description: err.message,
                  variant: "destructive",
                });
              },
            },
          )
        }
      />
    </div>
  );
}
