/**
 * PitchOverviewLayout — shared pitch hub overview markup used by both
 * StaffOverviewSection and PortalOverviewSection.
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ChevronRight, MessageSquare } from "lucide-react";
import { WelcomeModal } from "./WelcomeModal";
import { HeroContent } from "./HeroContent";
import { QuickLinksGrid } from "./QuickLinksGrid";
import { RecentActivityCard } from "./RecentActivityCard";
import type { ActivityFeedItem } from "@/types";

interface PitchOverviewLayoutProps {
  hubId: string;
  userName: string;
  companyName: string;
  welcomeHeadline?: string;
  welcomeMessage?: string;
  heroContentType?: string;
  hasProposal: boolean;
  proposalTitle?: string;
  welcomeVideoUrl?: string;
  videoCount: number;
  documentCount: number;
  messageCount: number;
  nextMeetingDate?: string;
  pendingQuestionnaires: number;
  activities?: ActivityFeedItem[];
  showWelcomeModal: boolean;
  onWelcomeOpen: () => void;
  onWelcomeClose: () => void;
}

export function PitchOverviewLayout({
  hubId,
  userName,
  companyName,
  welcomeHeadline,
  welcomeMessage,
  heroContentType,
  hasProposal,
  proposalTitle,
  welcomeVideoUrl,
  videoCount,
  documentCount,
  messageCount,
  nextMeetingDate,
  pendingQuestionnaires,
  activities,
  showWelcomeModal,
  onWelcomeOpen,
  onWelcomeClose,
}: PitchOverviewLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-cream))]">
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={onWelcomeClose}
        welcomeVideoUrl={welcomeVideoUrl}
      />

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[hsl(var(--bold-royal-blue))]">
            Welcome{userName ? `, ${userName}` : ""}
          </h1>
          {welcomeHeadline && (
            <p className="text-xl font-semibold text-[hsl(var(--dark-grey))]">
              {welcomeHeadline}
            </p>
          )}
          <p className="text-lg text-[hsl(var(--dark-grey))]">
            {welcomeMessage || "Here's everything you need for your project"}
          </p>
          <p className="text-sm text-[hsl(var(--medium-grey))]">{companyName}</p>
        </div>

        {/* Hero Content Area */}
        <HeroContent
          heroType={heroContentType || "video"}
          hasProposal={hasProposal}
          hasWelcomeVideo={!!welcomeVideoUrl}
          proposalTitle={proposalTitle}
          welcomeVideoUrl={welcomeVideoUrl}
        />

        {/* Quick Links Section */}
        <QuickLinksGrid
          proposalCount={hasProposal ? 1 : 0}
          videoCount={videoCount}
          documentCount={documentCount}
          messageCount={messageCount}
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
                onClick={onWelcomeOpen}
                className="text-[hsl(var(--gradient-blue))]"
              >
                Watch
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity (staff only — empty array hides the card for portal) */}
        {activities && activities.length > 0 && (
          <RecentActivityCard activities={activities} />
        )}

        {/* Next Steps CTA */}
        {hasProposal && (
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
