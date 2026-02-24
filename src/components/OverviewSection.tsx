import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useHubId } from "@/contexts/hub-context";
import {
  useHubOverview,
  useHubActivity,
  useUpdateHubNotes,
  useTrackEngagement,
  useCreateInvite,
  useUploadVideo,
  useUploadDocument,
  useSendMessage,
  useScheduleMeeting,
  useLinkQuestionnaire,
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
import { UploadVideoDialog } from "./videos/UploadVideoDialog";
import { UploadDocumentDialog } from "./documents/UploadDocumentDialog";
import { ComposeDialog } from "./messages/ComposeDialog";
import { ScheduleMeetingDialog } from "./meetings/ScheduleMeetingDialog";
import { AddQuestionnaireDialog } from "./questionnaire/AddQuestionnaireDialog";
import { ClientHubOverviewSection } from "./ClientHubOverviewSection";

export function OverviewSection() {
  const hubId = useHubId();
  const navigate = useNavigate();

  // Dialog open states
  const [inviteOpen, setInviteOpen] = useState(false);
  const [uploadVideoOpen, setUploadVideoOpen] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);

  // Data hooks
  const { data: overview, isLoading, isError } = useHubOverview(hubId);
  const { data: activityData } = useHubActivity(hubId, { pageSize: 6 });
  const { mutate: updateNotes, isPending: isSavingNotes } = useUpdateHubNotes(hubId);
  const { trackHubViewed } = useTrackEngagement(hubId);

  // Mutation hooks for dialogs
  const { mutate: createInvite, isPending: isInviting } = useCreateInvite(hubId);
  const { mutate: uploadVideo, isPending: isUploadingVideo } = useUploadVideo(hubId);
  const { mutate: uploadDocument, isPending: isUploadingDoc } = useUploadDocument(hubId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(hubId);
  const { mutate: scheduleMeeting, isPending: isScheduling } = useScheduleMeeting(hubId);
  const { mutate: linkQuestionnaire, isPending: isLinking } = useLinkQuestionnaire(hubId);
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
      case "upload-video":
        setUploadVideoOpen(true);
        break;
      case "upload-document":
        setUploadDocOpen(true);
        break;
      case "send-message":
        setComposeOpen(true);
        break;
      case "schedule-meeting":
        setScheduleOpen(true);
        break;
      case "create-questionnaire":
        setQuestionnaireOpen(true);
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

  // Navigation handlers for client hub overview
  const handleNavigateToProjects = () => navigate(`/hub/${hubId}/projects`);
  const handleNavigateToDecisions = () => navigate(`/hub/${hubId}/decisions`);
  const handleNavigateToHealth = () => navigate(`/hub/${hubId}/intelligence`);

  // Render client hub overview if this is a client hub
  if (hub.hubType === "client") {
    return (
      <div className="min-h-screen bg-[hsl(var(--warm-cream))]">
        <HubHeader hub={hub} onSettings={handleSettings} />
        <ClientHubOverviewSection
          hub={hub}
          onNavigateToProjects={handleNavigateToProjects}
          onNavigateToDecisions={handleNavigateToDecisions}
          onNavigateToHealth={handleNavigateToHealth}
          onNavigateToActivity={handleViewAllActivity}
        />
      </div>
    );
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

      <UploadVideoDialog
        isOpen={uploadVideoOpen}
        onClose={() => setUploadVideoOpen(false)}
        onUpload={(data) => {
          uploadVideo(data, { onSuccess: () => setUploadVideoOpen(false) });
        }}
        isUploading={isUploadingVideo}
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

      <ScheduleMeetingDialog
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSchedule={(data) => {
          scheduleMeeting(data, { onSuccess: () => setScheduleOpen(false) });
        }}
        isScheduling={isScheduling}
        clientEmail={hub.contactEmail}
        clientName={hub.contactName}
      />

      <AddQuestionnaireDialog
        isOpen={questionnaireOpen}
        onClose={() => setQuestionnaireOpen(false)}
        onAdd={(data) => {
          linkQuestionnaire(data, { onSuccess: () => setQuestionnaireOpen(false) });
        }}
        isAdding={isLinking}
      />
    </div>
  );
}
