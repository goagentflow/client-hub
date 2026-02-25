import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHubId } from "@/contexts/hub-context";
import {
  useHubOverview,
  useHubActivity,
  useUpdateHubNotes,
  useTrackEngagement,
  useCreateInvite,
  useAddVideoLink,
  useUploadDocument,
  useSendMessage,
  useToast,
} from "@/hooks";
import {
  HubHeader,
  StatusCards,
  QuickActions,
  ActivityList,
  AlertsList,
  InternalNotes,
  EngagementStatsCard,
} from "./overview";
import type { QuickActionType } from "./overview/QuickActions";
import { InviteClientDialog } from "./client-portal/InviteClientDialog";
import { AddLinkDialog } from "./videos/AddLinkDialog";
import { UploadDocumentDialog } from "./documents/UploadDocumentDialog";
import { ComposeDialog } from "./messages/ComposeDialog";
import { ClientHubOverviewPage } from "./ClientHubOverviewPage";
import { ConversionWizard } from "./conversion";

export function OverviewSection() {
  const hubId = useHubId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dialog open states
  const [conversionOpen, setConversionOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addVideoLinkOpen, setAddVideoLinkOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  // Data hooks
  const { data: overview, isLoading, isError } = useHubOverview(hubId);
  const { data: activityData } = useHubActivity(hubId, { pageSize: 6 });
  const { mutate: updateNotes, isPending: isSavingNotes } = useUpdateHubNotes(hubId);
  const { trackHubViewed } = useTrackEngagement(hubId);

  // Mutation hooks for dialogs
  const { mutate: createInvite, isPending: isInviting } = useCreateInvite(hubId);
  const { mutate: addVideoLink, isPending: isAddingVideoLink } = useAddVideoLink(hubId);
  const { mutate: uploadDocument, isPending: isUploadingDoc } = useUploadDocument(hubId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(hubId);
  const { toast } = useToast();

  // Track page view on mount
  useEffect(() => {
    trackHubViewed("overview");
  }, [trackHubViewed]);

  // Handle quick action clicks
  const handleQuickAction = (action: QuickActionType) => {
    switch (action) {
      case "invite-client":
        setInviteOpen(true);
        break;
      case "add-video-link":
        setAddVideoLinkOpen(true);
        break;
      case "upload-document":
        setUploadDocOpen(true);
        break;
      case "send-message":
        setComposeOpen(true);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Failed to load hub overview.</p>
      </div>
    );
  }

  const { hub, alerts, internalNotes, engagementStats } = overview;
  const activities = activityData?.items || [];

  const handleSaveNotes = (notes: string) => {
    updateNotes(notes);
  };

  const handleViewAllActivity = () => {
    navigate(`/hub/${hubId}/activity`);
  };

  const handleSettings = () => {
    toast({
      title: "Hub Settings",
      description: "Opening hub settings...",
    });
  };

  // Render client hub overview if this is a client hub
  if (hub.hubType === "client") {
    return <ClientHubOverviewPage hub={hub} hubId={hubId} onSettings={handleSettings} />;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-cream))]">
      <HubHeader hub={hub} onSettings={handleSettings} />
      <StatusCards hub={hub} engagementStats={engagementStats} />
      <QuickActions onAction={handleQuickAction} />

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityList
            activities={activities}
            clientDomain={hub.clientDomain}
            onViewAll={handleViewAllActivity}
          />
          <AlertsList alerts={alerts} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <InternalNotes
            notes={internalNotes}
            onSave={handleSaveNotes}
            isSaving={isSavingNotes}
          />
          <EngagementStatsCard stats={engagementStats} />
        </div>
      </div>

      {/* Convert to Client Hub banner — shown for won pitch hubs */}
      {hub.hubType === "pitch" && hub.status === "won" && (
        <div className="mb-8 rounded-lg border border-[hsl(var(--bold-royal-blue))]/20 bg-[hsl(var(--bold-royal-blue))]/5 p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-[hsl(var(--deep-navy))]">
              Ready to convert to a client hub?
            </p>
            <p className="text-sm text-[hsl(var(--medium-grey))]">
              Set up projects, health tracking, and client intelligence for {hub.companyName}.
            </p>
          </div>
          <Button
            onClick={() => setConversionOpen(true)}
            className="bg-[hsl(var(--bold-royal-blue))] hover:bg-[hsl(var(--bold-royal-blue))]/90 text-white"
          >
            Convert to Client Hub
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Preview as Client Link */}
      <div className="text-center">
        <button
          className="text-sm text-[hsl(var(--medium-grey))] hover:text-[hsl(var(--gradient-blue))] inline-flex items-center gap-2"
          onClick={() => window.open(`${import.meta.env.BASE_URL}portal/${hubId}/overview`, "_blank")}
        >
          See what {hub.contactName.split(" ")[0]} sees
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Conversion Wizard */}
      <ConversionWizard
        hubId={hubId}
        companyName={hub.companyName}
        open={conversionOpen}
        onOpenChange={setConversionOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["hubs"] });
          queryClient.invalidateQueries({ queryKey: ["hub-overview", hubId] });
        }}
      />

      {/* Quick Action Dialogs */}
      <InviteClientDialog
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(data) => {
          createInvite(data, { onSuccess: () => setInviteOpen(false) });
        }}
        isInviting={isInviting}
        clientDomain={hub.clientDomain}
      />

      <AddLinkDialog
        isOpen={addVideoLinkOpen}
        onClose={() => setAddVideoLinkOpen(false)}
        onAdd={(data) => {
          addVideoLink(data, { onSuccess: () => setAddVideoLinkOpen(false) });
        }}
        isAdding={isAddingVideoLink}
      />

      <UploadDocumentDialog
        isOpen={uploadDocOpen}
        onClose={() => setUploadDocOpen(false)}
        onUpload={(data) => {
          uploadDocument(data, { onSuccess: () => setUploadDocOpen(false) });
        }}
        isUploading={isUploadingDoc}
      />

      <ComposeDialog
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSend={(data) => {
          sendMessage(data, { onSuccess: () => setComposeOpen(false) });
        }}
        isSending={isSending}
        defaultRecipient={hub.contactEmail}
      />

    </div>
  );
}
