import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, Calendar, ClipboardCheck, BarChart3, Sparkles, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientHubLayout } from "@/components/ClientHubLayout";
import { ClientOverviewSection } from "@/components/ClientOverviewSection";
import { ClientProposalSection } from "@/components/ClientProposalSection";
import { ClientVideosSection } from "@/components/ClientVideosSection";
import { ClientDocumentsSection } from "@/components/ClientDocumentsSection";
import { ClientQuestionnaireSection } from "@/components/ClientQuestionnaireSection";
import { ClientPeopleSection } from "@/components/ClientPeopleSection";
import { PasswordGate } from "@/components/PasswordGate";
import { ComingSoonPlaceholder } from "@/components/ui/ComingSoonPlaceholder";
import { EmailGate } from "@/components/EmailGate";
import { PortalMessageFeed } from "@/components/messages/PortalMessageFeed";
import { HubProvider } from "@/contexts/hub-context";
import { useCurrentUser } from "@/hooks";
import { isMockApiEnabled, api } from "@/services/api";
import { extractMagicVerifyToken, sanitizeSensitiveHash } from "@/lib/location-hash";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PortalMeta } from "@/types";

const PortalDetail = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { data: authData, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const isStaff = authData?.user?.role === "staff";
  const forcePublicPreview = searchParams.get("preview") === "client";
  const safeLocationHash = sanitizeSensitiveHash(location.hash);

  // Read magic link token from the fragment and scrub it before any later navigation.
  const [verifyToken] = useState(() => {
    const token = extractMagicVerifyToken(window.location.hash);
    if (token) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return token;
    }
    return null;
  });

  // Portal meta:
  // - normal staff mode: try staff preview endpoint first, then fallback to public endpoint
  // - forced client preview mode: always use public endpoint
  // - client mode: public endpoint
  type HubMetaBase = { id: string; companyName: string; hubType: string; isPublished: boolean };
  const { data: hubMeta, isLoading: hubLoading } = useQuery({
    queryKey: ["portal-meta", hubId, isStaff, forcePublicPreview],
    queryFn: async () => {
      if (!hubId) return null;
      const publicEndpoint = `/public/hubs/${hubId}/portal-meta`;

      if (!isStaff || forcePublicPreview) {
        const result = await api.get<{ data: HubMetaBase | PortalMeta }>(publicEndpoint);
        return result.data;
      }

      try {
        const result = await api.get<{ data: HubMetaBase | PortalMeta }>(`/hubs/${hubId}/portal-preview`);
        return result.data;
      } catch {
        const result = await api.get<{ data: HubMetaBase | PortalMeta }>(publicEndpoint);
        return result.data;
      }
    },
    enabled: !!hubId && !isMockApiEnabled() && !isLoading,
  });

  // Password gate state — check sessionStorage for existing access
  const [passwordUnlocked, setPasswordUnlocked] = useState(
    () => hubId ? sessionStorage.getItem(`hub_access_${hubId}`) === "true" : false
  );

  // Scrubbed magic-link token waits for an explicit user click before exchange.
  const [magicLinkPending, setMagicLinkPending] = useState(!!verifyToken);
  const [magicLinkVerifying, setMagicLinkVerifying] = useState(false);

  const handleVerifyMagicLink = async () => {
    if (!verifyToken || !hubId || magicLinkVerifying) return;

    setMagicLinkVerifying(true);
    try {
      const result = await api.post<{
        data: { valid: boolean; portalToken?: string; deviceToken?: string; email?: string };
      }>(`/public/hubs/${hubId}/verify-magic`, { token: verifyToken });

      if (result.data.valid && result.data.portalToken) {
        sessionStorage.setItem(`portal_token_${hubId}`, result.data.portalToken);
        sessionStorage.setItem(`hub_access_${hubId}`, "true");
        if (result.data.deviceToken && result.data.email) {
          localStorage.setItem(
            `device_token_${hubId}`,
            JSON.stringify({ email: result.data.email, token: result.data.deviceToken }),
          );
        }
        setPasswordUnlocked(true);
        setMagicLinkPending(false);
        return;
      }

      setMagicLinkPending(false);
      toast({
        title: "Sign-in link expired",
        description: "This sign-in link has expired or already been used. Please enter your email to get a new code.",
        variant: "destructive",
      });
    } catch {
      setMagicLinkPending(false);
      toast({
        title: "Sign-in link failed",
        description: "Something went wrong. Please enter your email to get a new code.",
        variant: "destructive",
      });
    } finally {
      setMagicLinkVerifying(false);
    }
  };

  const isLiveHub = !isMockApiEnabled();

  // Verify user has access to this hub (mock/demo flow)
  const hubAccess = authData?.hubAccess?.find((h) => h.hubId === hubId);
  const hubName = hubAccess?.hubName || hubMeta?.companyName || "Your AgentFlow Hub";
  const hubType = hubMeta?.hubType || "pitch";

  if (magicLinkPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 text-center space-y-5">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-[hsl(var(--dark-grey))]">{hubName}</h1>
              <p className="text-sm text-[hsl(var(--medium-grey))]">
                Continue to securely sign in to this hub.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => void handleVerifyMagicLink()}
              disabled={magicLinkVerifying}
            >
              {magicLinkVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing you in...
                </>
              ) : (
                "Continue Secure Sign-In"
              )}
            </Button>
            <p className="text-xs text-[hsl(var(--medium-grey))]">
              This extra click prevents email security scanners from consuming your one-time sign-in link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while auth or hub meta is being fetched
  if (hubLoading || isLoading) {
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

  // Legacy slug links resolve to a canonical hub ID via portal-meta.
  // Redirect once so all downstream API calls use the real hub ID.
  if (hubMeta && hubId !== hubMeta.id) {
    const marker = `/portal/${hubId}`;
    const markerIndex = location.pathname.indexOf(marker);
    const suffix = markerIndex >= 0 ? location.pathname.slice(markerIndex + marker.length) : "";
    return <Navigate to={`/portal/${hubMeta.id}${suffix}${location.search}${safeLocationHash}`} replace />;
  }

  // Live hub not found or unpublished — show "unavailable" (not login redirect)
  // Gate on auth settled too, since hubMeta query is disabled while auth is loading
  if (isLiveHub && !isLoading && !hubLoading && !hubMeta) {
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
        <AccessGateWrapper
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
            <Route path="overview" element={<ClientOverviewSection hubMeta={hubMeta} isStaff={!!isStaff} />} />
            <Route path="documents" element={<ClientDocumentsSection />} />
            <Route path="messages" element={<PortalMessageFeed />} />
            <Route path="proposal" element={<ClientProposalSection />} />
            <Route path="videos" element={<ClientVideosSection />} />
            <Route path="meetings" element={<ComingSoonPlaceholder icon={Calendar} title="Meetings" description="Your upcoming meetings and key milestones, all in one place." />} />
            <Route path="questionnaire" element={<ClientQuestionnaireSection />} />
            <Route path="people" element={<ClientPeopleSection />} />
            <Route path="instant-answers" element={<ComingSoonPlaceholder icon={Sparkles} title="Instant Answers" description="Ask questions about your account and get immediate answers." />} />
            <Route path="decisions" element={<ComingSoonPlaceholder icon={ClipboardCheck} title="Decision Queue" description="Pending decisions that need your input, all in one place." />} />
            <Route path="performance" element={<ComingSoonPlaceholder icon={BarChart3} title="Performance Insights" description="Campaign performance data and key metrics at a glance." />} />
            <Route path="history" element={<ComingSoonPlaceholder icon={History} title="History & Alerts" description="A complete timeline of activity and important notifications." />} />
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
          <Route path="overview" element={<ClientOverviewSection hubMeta={hubMeta} isStaff={!!isStaff} />} />
          <Route path="documents" element={<ClientDocumentsSection />} />
          <Route path="messages" element={<PortalMessageFeed />} />

          {/* Pitch hub routes */}
          <Route path="proposal" element={<ClientProposalSection />} />
          <Route path="videos" element={<ClientVideosSection />} />
          <Route path="meetings" element={<ComingSoonPlaceholder icon={Calendar} title="Meetings" description="Your upcoming meetings and key milestones, all in one place." />} />
          <Route path="questionnaire" element={<ClientQuestionnaireSection />} />
          <Route path="people" element={<ClientPeopleSection />} />

          {/* Coming soon: Client hub features */}
          <Route path="instant-answers" element={<ComingSoonPlaceholder icon={Sparkles} title="Instant Answers" description="Ask questions about your account and get immediate answers." />} />
          <Route path="decisions" element={<ComingSoonPlaceholder icon={ClipboardCheck} title="Decision Queue" description="Pending decisions that need your input, all in one place." />} />
          <Route path="performance" element={<ComingSoonPlaceholder icon={BarChart3} title="Performance Insights" description="Campaign performance data and key metrics at a glance." />} />
          <Route path="history" element={<ComingSoonPlaceholder icon={History} title="History & Alerts" description="A complete timeline of activity and important notifications." />} />

          <Route path="/" element={<Navigate to="overview" replace />} />
        </Routes>
      </ClientHubLayout>
    </HubProvider>
  );
};

/**
 * AccessGateWrapper — checks hub access method and shows the right gate.
 *
 * Flow:
 *   1. GET /access-method → { method: 'email' | 'password' | 'open' }
 *   2. email: try device token first, then show EmailGate
 *   3. password: try empty verify-password (no-password auto-unlock), then PasswordGate
 *   4. open: auto-unlock via verify-password with empty hash
 */
function AccessGateWrapper({
  hubId,
  companyName,
  onSuccess,
}: {
  hubId: string;
  companyName: string;
  onSuccess: () => void;
}) {
  const [gate, setGate] = useState<"loading" | "email" | "password" | null>("loading");

  useEffect(() => {
    (async () => {
      try {
        // Check access method
        const methodResult = await api.get<{ data: { method: string } }>(
          `/public/hubs/${hubId}/access-method`
        );
        const method = methodResult.data.method;

        if (method === "email") {
          // Try device token first (remember-me)
          const stored = localStorage.getItem(`device_token_${hubId}`);
          if (stored) {
            try {
              const { email, token } = JSON.parse(stored);
              const deviceResult = await api.post<{ data: { valid: boolean; token?: string } }>(
                `/public/hubs/${hubId}/verify-device`,
                { email, deviceToken: token }
              );
              if (deviceResult.data.valid && deviceResult.data.token) {
                sessionStorage.setItem(`portal_token_${hubId}`, deviceResult.data.token);
                sessionStorage.setItem(`hub_access_${hubId}`, "true");
                onSuccess();
                return;
              }
            } catch { /* device token invalid — fall through to email gate */ }
            localStorage.removeItem(`device_token_${hubId}`);
          }
          setGate("email");
          return;
        }

        // password or open — try empty verify-password (auto-unlock for open/no-password hubs)
        const pwResult = await api.post<{ data: { valid: boolean; token?: string } }>(
          `/public/hubs/${hubId}/verify-password`,
          { passwordHash: "" }
        );
        if (pwResult.data.valid && pwResult.data.token) {
          sessionStorage.setItem(`portal_token_${hubId}`, pwResult.data.token);
          sessionStorage.setItem(`hub_access_${hubId}`, "true");
          onSuccess();
          return;
        }

        // Has password — show password gate
        setGate("password");
      } catch {
        setGate("password");
      }
    })();
  }, [hubId, onSuccess]);

  if (gate === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  if (gate === "email") {
    return <EmailGate hubId={hubId} companyName={companyName} onSuccess={onSuccess} />;
  }

  if (gate === "password") {
    return <PasswordGate hubId={hubId} companyName={companyName} onSuccess={onSuccess} />;
  }

  return null;
}

export default PortalDetail;
