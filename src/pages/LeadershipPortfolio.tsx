/**
 * Leadership Portfolio Page - Admin-only portfolio management view
 *
 * Features:
 * - Portfolio overview metrics
 * - All clients grid with sorting
 * - At-risk clients tab
 * - Expansion candidates tab
 * - Stale data warnings with refresh
 *
 * Requires: staff role + admin permissions (403 if unauthorized)
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, AlertCircle, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useCurrentUser,
  useLogout,
  usePortfolioOverview,
  usePortfolioClients,
  useAtRiskClients,
  useExpansionCandidates,
  useRefreshPortfolioMetrics,
  useTrackLeadershipView,
} from "@/hooks";
import type { PortfolioFilterParams } from "@/types";
import {
  PortfolioOverviewCard,
  ClientsGrid,
  PortfolioFilters,
  StaleDataWarning,
} from "@/components/leadership";

const LeadershipPortfolio = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState<PortfolioFilterParams>({
    sortBy: "health",
    order: "desc",
  });

  const { data: authData } = useCurrentUser();
  const { mutate: logout } = useLogout();

  // Portfolio data hooks
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = usePortfolioOverview();

  const {
    data: clientsData,
    isLoading: clientsLoading,
    error: clientsError,
  } = usePortfolioClients(filters);

  const {
    data: atRiskData,
    isLoading: atRiskLoading,
  } = useAtRiskClients();

  const {
    data: expansionData,
    isLoading: expansionLoading,
  } = useExpansionCandidates();

  const refreshMetrics = useRefreshPortfolioMetrics();

  // Analytics tracking
  const { trackLeadershipAccessed } = useTrackLeadershipView();
  const hasTrackedMount = useRef(false);

  // Track page access on mount
  useEffect(() => {
    if (!hasTrackedMount.current) {
      trackLeadershipAccessed("overview");
      hasTrackedMount.current = true;
    }
  }, [trackLeadershipAccessed]);

  // Track tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    trackLeadershipAccessed(value as "all" | "at-risk" | "expansion");
  };

  const user = authData?.user;
  const userInitials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  // Check for 403 Forbidden error
  const isForbidden =
    (overviewError as { status?: number })?.status === 403 ||
    (clientsError as { status?: number })?.status === 403;

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--soft-coral))]/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[hsl(var(--soft-coral))]" />
          </div>
          <h1 className="text-2xl font-bold text-[hsl(var(--dark-grey))] mb-2">
            Access Denied
          </h1>
          <p className="text-[hsl(var(--medium-grey))] mb-4">
            Leadership views require admin permissions. Contact your administrator
            if you believe you should have access.
          </p>
          <Button variant="link" onClick={() => navigate("/hubs")}>
            Return to Hub List
          </Button>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    refreshMetrics.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <img
            src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg"
            alt="AgentFlow Logo"
            className="h-10 w-auto cursor-pointer"
            onClick={() => navigate("/hubs")}
          />

          {/* Title */}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[hsl(var(--bold-royal-blue))]">
              Leadership Portfolio
            </h1>
            <Badge className="bg-[hsl(var(--sage-green))] text-white">
              Admin
            </Badge>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-2">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[hsl(var(--gradient-blue))] text-white text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-[hsl(var(--dark-grey))] hidden sm:inline">
                  {user?.displayName ?? "Loading..."}
                </span>
                <ChevronDown className="h-4 w-4 text-[hsl(var(--medium-grey))]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white z-50">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate("/hubs")}
              >
                Hub List
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-destructive"
                onClick={() => logout()}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--bold-royal-blue))] mb-2">
            Client Portfolio
          </h2>
          <p className="text-[hsl(var(--medium-grey))]">
            Overview of all client relationships, health scores, and expansion opportunities.
          </p>
        </div>

        {/* Stale Data Warning */}
        {overview && (
          <div className="mb-6">
            <StaleDataWarning
              dataStaleTimestamp={overview.dataStaleTimestamp}
              onRefresh={handleRefresh}
              isRefreshing={refreshMetrics.isPending}
            />
          </div>
        )}

        {/* Overview Cards */}
        {overviewLoading ? (
          <Skeleton className="h-24 mb-8" />
        ) : overviewError ? (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load portfolio overview. Please try again.
            </AlertDescription>
          </Alert>
        ) : overview ? (
          <div className="mb-8">
            <PortfolioOverviewCard overview={overview} />
          </div>
        ) : null}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                All Clients
                {clientsData && (
                  <Badge variant="secondary">{clientsData.clients.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="at-risk" className="gap-2">
                At Risk
                {atRiskData && atRiskData.clients.length > 0 && (
                  <Badge variant="destructive">{atRiskData.clients.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="expansion" className="gap-2">
                Expansion
                {expansionData && expansionData.clients.length > 0 && (
                  <Badge className="bg-[hsl(var(--sage-green))]">
                    {expansionData.clients.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {activeTab === "all" && (
              <PortfolioFilters filters={filters} onChange={setFilters} />
            )}
          </div>

          {/* All Clients Tab */}
          <TabsContent value="all">
            <ClientsGrid
              clients={clientsData?.clients || []}
              isLoading={clientsLoading}
              emptyMessage="No clients yet"
              emptyDescription="Client hubs will appear here after prospects are converted."
            />
          </TabsContent>

          {/* At Risk Tab */}
          <TabsContent value="at-risk">
            <ClientsGrid
              clients={atRiskData?.clients || []}
              isLoading={atRiskLoading}
              emptyMessage="No at-risk clients"
              emptyDescription="Great news! All your clients have healthy relationship scores."
            />
          </TabsContent>

          {/* Expansion Tab */}
          <TabsContent value="expansion">
            <ClientsGrid
              clients={expansionData?.clients || []}
              isLoading={expansionLoading}
              emptyMessage="No expansion opportunities"
              emptyDescription="Expansion opportunities will appear as they're detected from client communications."
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LeadershipPortfolio;
