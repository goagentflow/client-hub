import { useEffect } from "react";
import { useHubId } from "@/contexts/hub-context";
import { MessageFeed } from "./MessageFeed";
import { MessageAudienceCard } from "./MessageAudienceCard";
import {
  useCurrentUser,
  useMessageAudience,
  usePortalFeedMessages,
  useRequestPortalMessageAccess,
  useSendPortalFeedMessage,
  useTrackEngagement,
  useToast,
} from "@/hooks";

export function PortalMessageFeed() {
  const hubId = useHubId();
  const { toast } = useToast();

  const { data: authData } = useCurrentUser();
  const { data, isLoading, error } = usePortalFeedMessages(hubId);
  const { data: audience, isLoading: isAudienceLoading, error: audienceError } = useMessageAudience(hubId, { portal: true });
  const { mutate: requestAccess, isPending: isRequestingAccess } = useRequestPortalMessageAccess(hubId);
  const { mutate: sendMessage, isPending: isSending } = useSendPortalFeedMessage(hubId);
  const { trackHubViewed } = useTrackEngagement(hubId);

  useEffect(() => {
    trackHubViewed("portal-messages");
  }, [trackHubViewed]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">Messages</h1>
        <p className="text-sm text-[hsl(var(--medium-grey))]">
          Ask questions and keep communication in one place.
        </p>
      </div>

      <MessageAudienceCard
        audience={audience}
        isLoading={isAudienceLoading}
        errorMessage={audienceError ? "Unable to load message audience" : undefined}
        showPortalRequestForm
        isRequesting={isRequestingAccess}
        onRequestAccess={(payload) =>
          requestAccess(payload, {
            onSuccess: (result) => {
              toast({
                title: result.requested ? "Access request sent" : "Already has access",
                description: result.message,
              });
            },
            onError: (err) => {
              toast({
                title: "Could not send access request",
                description: err.message,
                variant: "destructive",
              });
            },
          })
        }
      />

      <MessageFeed
        messages={data?.items || []}
        currentUserEmail={authData?.user?.email}
        isLoading={isLoading}
        isSending={isSending}
        errorMessage={error ? "Unable to load messages" : undefined}
        emptyTitle="No messages yet"
        emptyDescription="Start the conversation with Agent Flow staff."
        onSend={(body) =>
          sendMessage(
            { body },
            {
              onSuccess: () => {
                toast({ title: "Message sent" });
              },
              onError: (err) => {
                const description =
                  err.message.includes("verified email")
                    ? "Posting messages requires email-verified portal access."
                    : err.message;
                toast({
                  title: "Could not send message",
                  description,
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
