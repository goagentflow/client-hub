import { useState, useEffect } from "react";
import { Eye, Send, Copy, CheckCircle2, AlertCircle, Monitor, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useHubId } from "@/contexts/hub-context";
import {
  useHubOverview,
  usePortalConfig,
  useUpdatePortalConfig,
  usePublishPortal,
  useMembers,
  useInvites,
  useCreateInvite,
  useProposal,
  useQuestionnaires,
  useTrackEngagement,
} from "@/hooks";
import {
  WelcomeSection,
  PortalSectionsConfig,
  ClientAccessCard,
  PublishingChecklist,
  InviteClientDialog,
  PortalQuickStats,
  PortalContactsCard,
} from "./client-portal";
import type { HeroContentType, PortalSectionConfig, CreateInviteRequest } from "@/types";

export function ClientPortalSection() {
  const hubId = useHubId();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Data hooks
  const { data: overview, isLoading: loadingOverview } = useHubOverview(hubId);
  const { data: config, isLoading: loadingConfig } = usePortalConfig(hubId);
  const { data: membersData, isLoading: loadingMembers } = useMembers(hubId);
  const { data: invitesData } = useInvites(hubId);
  const { data: proposalData } = useProposal(hubId);
  const { data: questionnairesData } = useQuestionnaires(hubId);

  // Mutation hooks
  const { mutate: updateConfig } = useUpdatePortalConfig(hubId);
  const { mutate: publishPortal, isPending: isPublishing } = usePublishPortal(hubId);
  const { mutate: createInvite, isPending: isInviting } = useCreateInvite(hubId);

  // Engagement tracking
  const { trackHubViewed } = useTrackEngagement(hubId);

  useEffect(() => {
    trackHubViewed("client-portal");
  }, [trackHubViewed]);

  const isLoading = loadingOverview || loadingConfig || loadingMembers;
  const members = membersData?.items || [];
  const invites = invitesData || [];
  const hasProposal = !!proposalData;
  const hasQuestionnaire = (questionnairesData?.items || []).length > 0;
  const clientDomain = overview?.hub.clientDomain || "example.com";
  const portalUrl = `https://hub.agentflow.com/${overview?.hub.companyName?.toLowerCase().replace(/\s+/g, "") || "client"}`;

  const handleHeadlineChange = (value: string) => {
    updateConfig({ welcomeHeadline: value });
  };

  const handleMessageChange = (value: string) => {
    updateConfig({ welcomeMessage: value });
  };

  const handleHeroTypeChange = (value: HeroContentType) => {
    updateConfig({ heroContentType: value });
  };

  const handleSectionToggle = (key: keyof PortalSectionConfig) => {
    if (!config) return;
    updateConfig({
      sections: { ...config.sections, [key]: !config.sections[key] },
    });
  };

  const handleInvite = (data: CreateInviteRequest) => {
    createInvite(data, {
      onSuccess: () => setInviteDialogOpen(false),
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
  };

  const handlePublish = () => {
    publishPortal();
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  const isLive = config.isPublished;

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">Client Portal</h1>
            <Badge className={isLive ? "bg-[hsl(var(--sage-green))]" : "bg-amber-500"}>
              {isLive ? "Live" : "Draft"}
            </Badge>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(`/portal/${hubId}/overview`, "_blank")}
            >
              <Eye className="h-4 w-4" />
              Preview as Client
            </Button>
            <Button
              className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 gap-2"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              <Send className="h-4 w-4" />
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        {!isLive ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-900">
                This portal is not yet visible to clients. Invite clients and publish when ready.
              </p>
            </div>
            <Button variant="link" className="text-amber-900 font-semibold" onClick={handlePublish}>
              Publish Now
            </Button>
          </div>
        ) : (
          <div className="bg-[hsl(var(--sage-green))]/10 border border-[hsl(var(--sage-green))]/30 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--sage-green))]" />
              <p className="text-[hsl(var(--dark-grey))]">
                Portal is live. {members.filter((m) => m.role === "client").length} clients have access.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
                Copy link
              </Button>
              <Button variant="link" size="sm" onClick={() => setInviteDialogOpen(true)}>
                Manage access
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <WelcomeSection
              welcomeHeadline={config.welcomeHeadline}
              welcomeMessage={config.welcomeMessage}
              heroContentType={config.heroContentType}
              onHeadlineChange={handleHeadlineChange}
              onMessageChange={handleMessageChange}
              onHeroTypeChange={handleHeroTypeChange}
            />

            <PortalSectionsConfig sections={config.sections} onToggle={handleSectionToggle} />

            <ClientAccessCard
              members={members}
              invites={invites}
              portalUrl={portalUrl}
              onInviteClient={() => setInviteDialogOpen(true)}
              onCopyLink={handleCopyLink}
            />

            <Card>
              <CardContent className="pt-6">
                <Button
                  className="w-full bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 gap-2 h-12"
                  onClick={() => window.open(`/portal/${hubId}/overview`, "_blank")}
                >
                  <Monitor className="h-5 w-5" />
                  Preview Client Portal
                </Button>
                <p className="text-center text-sm text-[hsl(var(--medium-grey))] mt-2">
                  See exactly what clients will see when they log in
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <PublishingChecklist
              config={config}
              members={members}
              hasProposal={hasProposal}
              hasQuestionnaire={hasQuestionnaire}
            />

            <PortalContactsCard hubId={hubId} />

            {isLive && overview && <PortalQuickStats stats={overview.engagementStats} />}
          </div>
        </div>

        <InviteClientDialog
          isOpen={inviteDialogOpen}
          onClose={() => setInviteDialogOpen(false)}
          onInvite={handleInvite}
          isInviting={isInviting}
          clientDomain={clientDomain}
        />
      </div>
    </div>
  );
}
