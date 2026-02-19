import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { ClientHubLayout } from "@/components/ClientHubLayout";
import { ClientOverviewSection } from "@/components/ClientOverviewSection";
import { ClientProposalSection } from "@/components/ClientProposalSection";
import { ClientVideosSection } from "@/components/ClientVideosSection";
import { ClientDocumentsSection } from "@/components/ClientDocumentsSection";
import { ClientMessagesSection } from "@/components/ClientMessagesSection";
import { ClientMeetingsSection } from "@/components/ClientMeetingsSection";
import { ClientQuestionnaireSection } from "@/components/ClientQuestionnaireSection";
import { ClientPeopleSection } from "@/components/ClientPeopleSection";
// Phase 5: Client-facing components
import { ClientInstantAnswers } from "@/components/client-instant-answers";
import { ClientDecisionQueue } from "@/components/client-decision-queue";
import { ClientPerformance } from "@/components/client-performance";
import { ClientHistory } from "@/components/client-history";
import { PasswordGate } from "@/components/PasswordGate";
import { HubProvider } from "@/contexts/hub-context";
import { useCurrentUser } from "@/hooks";
import { isMockApiEnabled, api } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PortalDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const { data: authData, isLoading } = useCurrentUser();
  const isStaff = authData?.user?.role === "staff";

  // Portal meta: staff uses portal-preview (no published filter), clients use public endpoint
  const { data: hubMeta, isLoading: hubLoading } = useQuery({
    queryKey: ["portal-meta", hubId, isStaff],
    queryFn: async () => {
      if (!hubId) return null;
      const endpoint = isStaff
        ? `/hubs/${hubId}/portal-preview`
        : `/public/hubs/${hubId}/portal-meta`;
      const result = await api.get<{ data: { id: string; companyName: string; hubType: string; isPublished: boolean } }>(endpoint);
      return result.data;
    },
    enabled: !!hubId && !isMockApiEnabled(),
  });

  // Password gate state — check sessionStorage for existing access
  const [passwordUnlocked, setPasswordUnlocked] = useState(
    () => hubId ? sessionStorage.getItem(`hub_access_${hubId}`) === "true" : false
  );

  const isLiveHub = !isMockApiEnabled();

  // Verify user has access to this hub (mock/demo flow)
  const hubAccess = authData?.hubAccess?.find((h) => h.hubId === hubId);
  const hubName = hubAccess?.hubName || hubMeta?.companyName || "Your AgentFlow Hub";
  const hubType = hubMeta?.hubType || "pitch";

  // Show loading state while data is being fetched
  if (hubLoading || (isLoading && !isLiveHub)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  // No hubId in URL
  if (!hubId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
            <h2 className="text-xl font-semibold text-[hsl(var(--dark-grey))]">Invalid Portal Link</h2>
            <p className="text-[hsl(var(--medium-grey))]">
              This link doesn't include a valid hub ID. Please use the link provided in your invitation email.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Live hub not found or unpublished — show "unavailable" (not login redirect)
  if (isLiveHub && !hubLoading && !hubMeta) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
            <h2 className="text-xl font-semibold text-[hsl(var(--dark-grey))]">Hub Unavailable</h2>
            <p className="text-[hsl(var(--medium-grey))]">
              This hub is not available. It may have been unpublished or the link may be incorrect.
              Please contact the person who shared this link with you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Live Supabase hub — use password gate instead of demo auth
  if (isLiveHub && hubMeta) {
    if (!passwordUnlocked) {
      // For live hubs, show password gate (fetches hash from Supabase directly)
      return (
        <PasswordGateWrapper
          hubId={hubId}
          companyName={hubMeta.companyName}
          onSuccess={() => setPasswordUnlocked(true)}
        />
      );
    }

    // Password unlocked or no password — show the portal
    return (
      <HubProvider hubId={hubId}>
        <ClientHubLayout hubName={hubName} hubType={hubType} viewMode="client">
          <Routes>
            <Route path="overview" element={<ClientOverviewSection />} />
            <Route path="documents" element={<ClientDocumentsSection />} />
            <Route path="messages" element={<ClientMessagesSection />} />
            <Route path="proposal" element={<ClientProposalSection />} />
            <Route path="videos" element={<ClientVideosSection />} />
            <Route path="meetings" element={<ClientMeetingsSection />} />
            <Route path="questionnaire" element={<ClientQuestionnaireSection />} />
            <Route path="people" element={<ClientPeopleSection />} />
            <Route path="instant-answers" element={<ClientInstantAnswers hubId={hubId} />} />
            <Route path="decisions" element={<ClientDecisionQueue hubId={hubId} />} />
            <Route path="performance" element={<ClientPerformance hubId={hubId} />} />
            <Route path="history" element={<ClientHistory hubId={hubId} />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
          </Routes>
        </ClientHubLayout>
      </HubProvider>
    );
  }

  // Demo/mock flow — require demo login
  if (!authData) {
    return <Navigate to="/login" replace />;
  }

  // User doesn't have access to this hub (demo flow)
  if (!hubAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold text-[hsl(var(--dark-grey))]">Access Denied</h2>
            <p className="text-[hsl(var(--medium-grey))]">
              You don't have permission to view this hub. If you believe this is an error, please contact the person who
              shared this link with you.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <HubProvider hubId={hubId}>
      <ClientHubLayout hubName={hubName} hubType={hubType} viewMode="client">
        <Routes>
          {/* Shared routes */}
          <Route path="overview" element={<ClientOverviewSection />} />
          <Route path="documents" element={<ClientDocumentsSection />} />
          <Route path="messages" element={<ClientMessagesSection />} />

          {/* Pitch hub routes */}
          <Route path="proposal" element={<ClientProposalSection />} />
          <Route path="videos" element={<ClientVideosSection />} />
          <Route path="meetings" element={<ClientMeetingsSection />} />
          <Route path="questionnaire" element={<ClientQuestionnaireSection />} />
          <Route path="people" element={<ClientPeopleSection />} />

          {/* Phase 5: Client hub routes */}
          <Route path="instant-answers" element={<ClientInstantAnswers hubId={hubId} />} />
          <Route path="decisions" element={<ClientDecisionQueue hubId={hubId} />} />
          <Route path="performance" element={<ClientPerformance hubId={hubId} />} />
          <Route path="history" element={<ClientHistory hubId={hubId} />} />

          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </ClientHubLayout>
    </HubProvider>
  );
};

/**
 * Wrapper that checks if a hub has a password and shows the gate if so.
 * Uses middleware API — attempts verify-password with empty hash to detect
 * no-password hubs and auto-issue a portal token.
 */
function PasswordGateWrapper({
  hubId,
  companyName,
  onSuccess,
}: {
  hubId: string;
  companyName: string;
  onSuccess: () => void;
}) {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    // Try verify with empty hash — if hub has no password, token is issued immediately
    api.post<{ data: { valid: boolean; token?: string } }>(
      `/public/hubs/${hubId}/verify-password`,
      { passwordHash: '' }
    ).then((result) => {
      if (result.data.valid && result.data.token) {
        // No password — auto-unlock with issued token
        sessionStorage.setItem(`portal_token_${hubId}`, result.data.token);
        sessionStorage.setItem(`hub_access_${hubId}`, "true");
        onSuccess();
        setHasPassword(false);
      } else {
        // Hub has a password — show gate
        setHasPassword(true);
      }
    }).catch(() => {
      // On error, assume password required
      setHasPassword(true);
    });
  }, [hubId, onSuccess]);

  if (hasPassword === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  if (!hasPassword) return null;

  return (
    <PasswordGate
      hubId={hubId}
      companyName={companyName}
      onSuccess={onSuccess}
    />
  );
}

export default PortalDetail;
