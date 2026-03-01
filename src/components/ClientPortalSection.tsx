import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Send, Copy, CheckCircle2, AlertCircle, Monitor, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useHubId } from "@/contexts/hub-context";
import {
  useHubOverview,
  usePortalConfig,
  useUpdatePortalConfig,
  usePublishPortal,
  useUnpublishPortal,
  useDeleteHub,
  useMembers,
  useInvites,
  useCreateInvite,
  useRevokeInvite,
  useRemoveMember,
  useProposal,
  useQuestionnaires,
  useTrackEngagement,
  useToast,
} from "@/hooks";
import { copyTextToClipboard } from "@/lib/clipboard";
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
  const navigate = useNavigate();
  const hubId = useHubId();
  const { toast } = useToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  // Data hooks
  const { data: overview, isLoading: loadingOverview } = useHubOverview(hubId);
  const { data: config, isLoading: loadingConfig } = usePortalConfig(hubId);
  const { data: membersData } = useMembers(hubId);
  const { data: invitesData } = useInvites(hubId);
  const { data: proposalData } = useProposal(hubId);
  const { data: questionnairesData } = useQuestionnaires(hubId);

  // Mutation hooks
  const { mutate: updateConfig } = useUpdatePortalConfig(hubId);
  const { mutate: publishPortal, isPending: isPublishing } = usePublishPortal(hubId);
  const { mutate: unpublishPortal, isPending: isUnpublishing } = useUnpublishPortal(hubId);
  const { mutate: deleteHub, isPending: isDeletingHub } = useDeleteHub();
  const { mutate: createInvite, isPending: isInviting } = useCreateInvite(hubId);
  const { mutate: revokeInvite } = useRevokeInvite(hubId);
  const { mutate: removeMember } = useRemoveMember(hubId);

  // Engagement tracking
  const { trackHubViewed } = useTrackEngagement(hubId);

  useEffect(() => {
    trackHubViewed("client-portal");
  }, [trackHubViewed]);

  const isLoading = loadingOverview || loadingConfig;
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
    void copyTextToClipboard(portalUrl).then((copied) => {
      if (copied) {
        toast({ title: "Link copied", description: "Portal link copied to clipboard." });
        return;
      }

      toast({
        title: "Could not copy link",
        description: "Clipboard access is blocked in this browser context.",
        variant: "destructive",
      });
    });
  };

  const handlePublish = () => {
    publishPortal(undefined, {
      onSuccess: () => toast({ title: "Portal published" }),
      onError: (err) => toast({ title: "Could not publish portal", description: err.message, variant: "destructive" }),
    });
  };

  const handleUnpublish = () => {
    unpublishPortal(undefined, {
      onSuccess: () => {
        toast({ title: "Portal unpublished", description: "Clients are now locked out immediately." });
      },
      onError: (err) => {
        toast({ title: "Could not unpublish portal", description: err.message, variant: "destructive" });
      },
    });
  };

  const handleDeleteHub = () => {
    deleteHub(hubId, {
      onSuccess: () => {
        toast({ title: "Hub deleted" });
        navigate("/hubs");
      },
      onError: (err) => {
        toast({ title: "Could not delete hub", description: err.message, variant: "destructive" });
      },
    });
  };

  const handleRevokeInvite = (inviteId: string, email: string) => {
    setRevokingInviteId(inviteId);
    revokeInvite(inviteId, {
      onSuccess: () => {
        toast({
          title: "Invite revoked",
          description: `${email} no longer has pending access.`,
        });
      },
      onError: (err) => {
        toast({
          title: "Could not revoke invite",
          description: err.message,
          variant: "destructive",
        });
      },
      onSettled: () => setRevokingInviteId(null),
    });
  };

  const handleRemoveClient = (memberId: string, email: string) => {
    setRemovingMemberId(memberId);
    removeMember(memberId, {
      onSuccess: () => {
        toast({
          title: "Client access removed",
          description: `${email} has been removed from this hub.`,
        });
      },
      onError: (err) => {
        toast({
          title: "Could not remove client",
          description: err.message,
          variant: "destructive",
        });
      },
      onSettled: () => setRemovingMemberId(null),
    });
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
              onClick={() => window.open(`${import.meta.env.BASE_URL}portal/${hubId}/overview?preview=client`, "_blank")}
            >
              <Eye className="h-4 w-4" />
              Preview as Client
            </Button>
            {isLive ? (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleUnpublish}
                disabled={isUnpublishing}
              >
                <AlertCircle className="h-4 w-4" />
                {isUnpublishing ? "Unpublishing..." : "Unpublish"}
              </Button>
            ) : (
              <Button
                className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 gap-2"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                <Send className="h-4 w-4" />
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeletingHub}>
                  Delete Hub
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this hub?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the hub and associated portal data (messages, documents, contacts, and invite records).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteHub}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeletingHub ? "Deleting..." : "Delete hub"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              onRevokeInvite={handleRevokeInvite}
              onRemoveClient={handleRemoveClient}
              revokingInviteId={revokingInviteId}
              removingMemberId={removingMemberId}
            />

            <Card>
              <CardContent className="pt-6">
                <Button
                  className="w-full bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 gap-2 h-12"
                  onClick={() => window.open(`${import.meta.env.BASE_URL}portal/${hubId}/overview?preview=client`, "_blank")}
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
