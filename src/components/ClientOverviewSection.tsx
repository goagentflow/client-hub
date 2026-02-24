import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Play, ChevronRight, MessageSquare } from "lucide-react";
import { useHubId } from "@/contexts/hub-context";
import {
  usePortalConfig,
  usePortalProposal,
  usePortalVideos,
  usePortalDocuments,
  usePortalMessages,
  usePortalMeetings,
  usePortalQuestionnaires,
  useHubActivity,
  useTrackEngagement,
  useCurrentUser,
  useHub,
} from "@/hooks";
import {
  WelcomeModal,
  HeroContent,
  QuickLinksGrid,
  RecentActivityCard,
} from "./client-overview";
import { ClientWelcomeModal } from "./client-onboarding";
import { ClientHubOverview } from "./client-hub-overview";

export function ClientOverviewSection() {
  const navigate = useNavigate();
  const hubId = useHubId();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Get user info for welcome message
  const { data: authData } = useCurrentUser();
  const { data: hub } = useHub(hubId);
  const userName = authData?.user?.displayName?.split(" ")[0] || "there";
  const companyName = authData?.hubAccess?.[0]?.hubName || "Your Project";

  // Determine hub type for modal selection
  const isClientHub = hub?.hubType === "client";

  // Data hooks
  const { data: config, isLoading: loadingConfig } = usePortalConfig(hubId);
  const { data: proposal, isLoading: loadingProposal } = usePortalProposal(hubId);
  const { data: videosData, isLoading: loadingVideos } = usePortalVideos(hubId);
  const { data: docsData, isLoading: loadingDocs } = usePortalDocuments(hubId);
  const { data: messagesData, isLoading: loadingMessages } = usePortalMessages(hubId);
  const { data: meetingsData, isLoading: loadingMeetings } = usePortalMeetings(hubId);
  const { data: questionnairesData } = usePortalQuestionnaires(hubId);
  const { data: activityData, isLoading: loadingActivity } = useHubActivity(hubId, { pageSize: 5 });

  // Engagement tracking
  const { trackHubViewed } = useTrackEngagement(hubId);

  useEffect(() => {
    trackHubViewed("portal-overview");
  }, [trackHubViewed]);

  // Show welcome modal on first visit for pitch hubs (check localStorage)
  // Client hubs use ClientWelcomeModal which manages its own state
  useEffect(() => {
    if (isClientHub) return; // Client hubs handle their own modal state
    const storageKey = `portal-welcome-${hubId}`;
    const hasSeenWelcome = localStorage.getItem(storageKey);
    if (!hasSeenWelcome && config) {
      setShowWelcomeModal(true);
    }
  }, [hubId, config, isClientHub]);

  const handleWelcomeClose = () => {
    const storageKey = `portal-welcome-${hubId}`;
    localStorage.setItem(storageKey, "true");
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

  // Client Hub: Use redesigned overview focused on decisions, projects, messages
  if (isClientHub) {
    return (
      <>
        <ClientWelcomeModal
          hubId={hubId}
          hubName={companyName}
          onDismiss={handleWelcomeClose}
        />
        <ClientHubOverview hubId={hubId} hubName={companyName} />
      </>
    );
  }

  // Pitch Hub: Original overview with proposal, videos, etc.
  // Calculate counts
  const videoCount = videosData?.items?.length || 0;
  const documentCount = docsData?.items?.length || 0;
  const unreadMessages = messagesData?.items?.filter((t) => !t.isRead)?.length || 0;
  const pendingQuestionnaires = questionnairesData?.items?.filter((q) => q.status !== "completed")?.length || 0;

  // Get next meeting
  const upcomingMeetings = meetingsData?.items?.filter(
    (m) => new Date(m.startTime) > new Date() && m.status !== "cancelled"
  ) || [];
  const nextMeeting = upcomingMeetings[0];
  const nextMeetingDate = nextMeeting
    ? new Date(nextMeeting.startTime).toLocaleDateString("en-GB", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : undefined;

  const activities = activityData?.items || [];

  // Pitch Hub render path (client hubs return early above)
  return (
    <div className="min-h-screen bg-[hsl(var(--warm-cream))]">
      {/* Welcome Modal for pitch hubs */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeClose}
        welcomeVideoUrl={config?.welcomeVideoUrl}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[hsl(var(--bold-royal-blue))]">
            Welcome, {userName}
          </h1>
          {config?.welcomeHeadline && (
            <p className="text-xl font-semibold text-[hsl(var(--dark-grey))]">
              {config.welcomeHeadline}
            </p>
          )}
          <p className="text-lg text-[hsl(var(--dark-grey))]">
            {config?.welcomeMessage || "Here's everything you need for your project"}
          </p>
          <p className="text-sm text-[hsl(var(--medium-grey))]">{companyName}</p>
        </div>

        {/* Hero Content Area */}
        <HeroContent
          heroType={config?.heroContentType || "video"}
          hasProposal={!!proposal}
          hasWelcomeVideo={!!config?.welcomeVideoUrl}
          proposalTitle={proposal?.fileName?.replace(/\.[^/.]+$/, "")}
          welcomeVideoUrl={config?.welcomeVideoUrl}
        />

        {/* Quick Links Section */}
        <QuickLinksGrid
          proposalCount={proposal ? 1 : 0}
          videoCount={videoCount}
          documentCount={documentCount}
          unreadMessages={unreadMessages}
          nextMeetingDate={nextMeetingDate}
          pendingQuestionnaires={pendingQuestionnaires}
        />

        {/* Getting Started Card */}
        <Card className="bg-muted/30 border-2 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[hsl(var(--gradient-blue))]/10">
                <Play className="h-6 w-6 text-[hsl(var(--gradient-blue))]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[hsl(var(--dark-grey))] mb-1">
                  Getting Started
                </h3>
                <p className="text-sm text-[hsl(var(--medium-grey))]">
                  New to the hub? Watch our 2-minute guide
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWelcomeModal(true)}
                className="text-[hsl(var(--gradient-blue))]"
              >
                Watch
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivityCard activities={activities} />

        {/* Next Steps CTA */}
        {proposal && (
          <Card className="border-l-4 border-l-[hsl(var(--soft-coral))] bg-[hsl(var(--soft-coral))]/5">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[hsl(var(--dark-grey))]">
                    Ready to move forward?
                  </h3>
                  <p className="text-[hsl(var(--medium-grey))]">
                    Review our proposal and let us know your thoughts
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => navigate(`/portal/${hubId}/proposal`)}
                    className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white"
                  >
                    View Proposal
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => navigate(`/portal/${hubId}/messages`)}
                    className="text-[hsl(var(--medium-grey))] p-0 h-auto"
                  >
                    Have questions? Send us a message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Help */}
        <div className="pt-8 pb-4 text-center space-y-4">
          <p className="text-sm text-[hsl(var(--medium-grey))]">
            Questions? We're here to help.
          </p>
          <Button
            variant="link"
            onClick={() => navigate(`/portal/${hubId}/messages`)}
            className="text-[hsl(var(--gradient-blue))]"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send a Message
          </Button>
        </div>
      </div>
    </div>
  );
}
