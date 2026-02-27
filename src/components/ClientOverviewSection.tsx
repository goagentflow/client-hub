import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useHubId } from "@/contexts/hub-context";
import {
  usePortalConfig,
  usePortalProposal,
  usePortalVideos,
  usePortalDocuments,
  usePortalFeedMessages,
  usePortalMeetings,
  usePortalQuestionnaires,
  useHubActivity,
  useTrackEngagement,
  useCurrentUser,
  useHub,
} from "@/hooks";
import { PitchOverviewLayout } from "./client-overview";
import { ClientHubOverview } from "./client-hub-overview";
import type { PortalMeta, PortalConfig, HeroContentType } from "@/types";

// Base type shared by both staff portal-preview and public portal-meta
type HubMetaBase = {
  id: string;
  companyName: string;
  contactName?: string;
  hubType: string;
  isPublished: boolean;
};

interface ClientOverviewSectionProps {
  hubMeta?: HubMetaBase | PortalMeta | null;
  isStaff?: boolean;
}

/**
 * Thin wrapper — dispatches to StaffOverviewSection or PortalOverviewSection
 * to avoid conditional hooks (React rules of hooks).
 */
export function ClientOverviewSection({ hubMeta, isStaff }: ClientOverviewSectionProps) {
  if (isStaff) {
    return <StaffOverviewSection />;
  }
  return <PortalOverviewSection hubMeta={hubMeta as PortalMeta | null | undefined} />;
}

// =============================================================================
// Shared helpers
// =============================================================================

function computeMeetingCounts(meetingsData: ReturnType<typeof usePortalMeetings>["data"]) {
  const upcomingMeetings = meetingsData?.items?.filter(
    (m) => new Date(m.startTime) > new Date() && m.status !== "cancelled"
  ) || [];
  const nextMeeting = upcomingMeetings[0];
  return nextMeeting
    ? new Date(nextMeeting.startTime).toLocaleDateString("en-GB", {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    : undefined;
}

// =============================================================================
// StaffOverviewSection — calls staff-only hooks
// =============================================================================

function StaffOverviewSection() {
  const hubId = useHubId();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { data: authData } = useCurrentUser();
  const { data: hub } = useHub(hubId);
  const userName = authData?.user?.displayName?.split(" ")[0] || "there";
  const companyName = authData?.hubAccess?.[0]?.hubName || "Your Project";
  const isClientHub = hub?.hubType === "client";

  const { data: config, isLoading: loadingConfig } = usePortalConfig(hubId);
  const { data: proposal, isLoading: loadingProposal } = usePortalProposal(hubId);
  const { data: videosData, isLoading: loadingVideos } = usePortalVideos(hubId);
  const { data: docsData, isLoading: loadingDocs } = usePortalDocuments(hubId);
  const { data: feedMessagesData, isLoading: loadingMessages } = usePortalFeedMessages(hubId);
  const { data: meetingsData, isLoading: loadingMeetings } = usePortalMeetings(hubId);
  const { data: questionnairesData } = usePortalQuestionnaires(hubId);
  const { data: activityData, isLoading: loadingActivity } = useHubActivity(hubId, { pageSize: 5 });

  const { trackHubViewed } = useTrackEngagement(hubId);

  useEffect(() => {
    trackHubViewed("portal-overview");
  }, [trackHubViewed]);

  useEffect(() => {
    if (isClientHub) return;
    const storageKey = `portal-welcome-${hubId}`;
    const hasSeenWelcome = localStorage.getItem(storageKey);
    if (!hasSeenWelcome && config) {
      setShowWelcomeModal(true);
    }
  }, [hubId, config, isClientHub]);

  const handleWelcomeClose = () => {
    localStorage.setItem(`portal-welcome-${hubId}`, "true");
    setShowWelcomeModal(false);
  };

  const isLoading = loadingConfig || loadingProposal || loadingVideos || loadingDocs || loadingMessages || loadingMeetings || loadingActivity;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  if (isClientHub) {
    return (
      <ClientHubOverview
        hubId={hubId}
        hubName={companyName}
        contactName={hub?.contactName}
        welcomeHeadline={config?.welcomeHeadline}
        welcomeMessage={config?.welcomeMessage}
      />
    );
  }

  return (
    <PitchOverviewLayout
      hubId={hubId}
      userName={userName}
      companyName={companyName}
      welcomeHeadline={config?.welcomeHeadline}
      welcomeMessage={config?.welcomeMessage}
      heroContentType={config?.heroContentType}
      hasProposal={!!proposal}
      proposalTitle={proposal?.fileName?.replace(/\.[^/.]+$/, "")}
      welcomeVideoUrl={config?.welcomeVideoUrl}
      videoCount={videosData?.items?.length || 0}
      documentCount={docsData?.items?.length || 0}
      messageCount={feedMessagesData?.items?.length || 0}
      nextMeetingDate={computeMeetingCounts(meetingsData)}
      pendingQuestionnaires={questionnairesData?.items?.filter((q) => q.status !== "completed")?.length || 0}
      activities={activityData?.items || []}
      showWelcomeModal={showWelcomeModal}
      onWelcomeOpen={() => setShowWelcomeModal(true)}
      onWelcomeClose={handleWelcomeClose}
    />
  );
}

// =============================================================================
// PortalOverviewSection — portal-safe only, no staff hooks
// =============================================================================

function PortalOverviewSection({ hubMeta }: { hubMeta?: PortalMeta | null }) {
  const hubId = useHubId();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const companyName = hubMeta?.companyName || "Your Project";
  const isClientHubType = hubMeta?.hubType === "client";

  const config: PortalConfig | null = hubMeta
    ? {
        hubId: hubMeta.id,
        isPublished: hubMeta.isPublished,
        welcomeHeadline: hubMeta.welcomeHeadline,
        welcomeMessage: hubMeta.welcomeMessage,
        heroContentType: hubMeta.heroContentType as HeroContentType,
        heroContentId: hubMeta.heroContentId,
        sections: hubMeta.sections,
      }
    : null;

  // Portal-safe data hooks only — NO useHub, usePortalConfig, useHubActivity
  const { data: proposal, isLoading: loadingProposal } = usePortalProposal(hubId);
  const { data: videosData, isLoading: loadingVideos } = usePortalVideos(hubId);
  const { data: docsData, isLoading: loadingDocs } = usePortalDocuments(hubId);
  const { data: feedMessagesData, isLoading: loadingMessages } = usePortalFeedMessages(hubId);
  const { data: meetingsData, isLoading: loadingMeetings } = usePortalMeetings(hubId);
  const { data: questionnairesData } = usePortalQuestionnaires(hubId);

  const { trackHubViewed } = useTrackEngagement(hubId);

  useEffect(() => {
    trackHubViewed("portal-overview");
  }, [trackHubViewed]);

  useEffect(() => {
    if (isClientHubType) return;
    const storageKey = `portal-welcome-${hubId}`;
    const hasSeenWelcome = localStorage.getItem(storageKey);
    if (!hasSeenWelcome && config) {
      setShowWelcomeModal(true);
    }
  }, [hubId, config, isClientHubType]);

  const handleWelcomeClose = () => {
    localStorage.setItem(`portal-welcome-${hubId}`, "true");
    setShowWelcomeModal(false);
  };

  const isLoading = loadingProposal || loadingVideos || loadingDocs || loadingMessages || loadingMeetings;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  if (isClientHubType) {
    return (
      <ClientHubOverview
        hubId={hubId}
        hubName={companyName}
        contactName={hubMeta?.contactName}
        welcomeHeadline={config?.welcomeHeadline}
        welcomeMessage={config?.welcomeMessage}
      />
    );
  }

  return (
    <PitchOverviewLayout
      hubId={hubId}
      userName=""
      companyName={companyName}
      welcomeHeadline={config?.welcomeHeadline}
      welcomeMessage={config?.welcomeMessage}
      heroContentType={config?.heroContentType}
      hasProposal={!!proposal}
      proposalTitle={proposal?.fileName?.replace(/\.[^/.]+$/, "")}
      videoCount={videosData?.items?.length || 0}
      documentCount={docsData?.items?.length || 0}
      messageCount={feedMessagesData?.items?.length || 0}
      nextMeetingDate={computeMeetingCounts(meetingsData)}
      pendingQuestionnaires={questionnairesData?.items?.filter((q) => q.status !== "completed")?.length || 0}
      showWelcomeModal={showWelcomeModal}
      onWelcomeOpen={() => setShowWelcomeModal(true)}
      onWelcomeClose={handleWelcomeClose}
    />
  );
}
