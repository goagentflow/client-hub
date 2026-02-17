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
import { useCurrentUser, useHub } from "@/hooks";
import { isFeatureLive } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PortalDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const { data: authData, isLoading, isFetching } = useCurrentUser();
  const { data: hub, isLoading: hubLoading } = useHub(hubId || "");

  // Password gate state — check sessionStorage for existing access
  const [passwordUnlocked, setPasswordUnlocked] = useState(
    () => hubId ? sessionStorage.getItem(`hub_access_${hubId}`) === "true" : false
  );

  const isLiveHub = isFeatureLive("hubs");

  // Verify user has access to this hub (mock/demo flow)
  const hubAccess = authData?.hubAccess?.find((h) => h.hubId === hubId);
  const hubName = hubAccess?.hubName || hub?.companyName || "Your AgentFlow Hub";
  const hubType = hub?.hubType || "pitch";

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

  // Live Supabase hub — use password gate instead of demo auth
  if (isLiveHub && hub) {
    if (!passwordUnlocked) {
      // For live hubs, show password gate (fetches hash from Supabase directly)
      return (
        <PasswordGateWrapper
          hubId={hubId}
          companyName={hub.companyName}
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
 * Uses Supabase RPC — the password hash never leaves the database.
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
    import("@/services/supabase-data").then(({ hubHasPassword }) => {
      hubHasPassword(hubId).then((result) => {
        if (!result) {
          // No password set — auto-unlock
          sessionStorage.setItem(`hub_access_${hubId}`, "true");
          onSuccess();
        }
        setHasPassword(result);
      });
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
