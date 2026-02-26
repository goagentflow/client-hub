import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, ChevronDown, Loader2, BarChart3 } from "lucide-react";
import { useHubs, useCurrentUser, useLogout } from "@/hooks";
import { hasAdminAccess } from "@/types";
import type { HubStatus, HubType } from "@/types";
import { CreateHubDialog } from "@/components/CreateHubDialog";
import { HubCard } from "@/components/HubCard";

const formatStatus = (status: HubStatus) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const HubList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<HubStatus | "all">("all");
  const [hubTypeTab, setHubTypeTab] = useState<HubType>("pitch");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Build filter string for hub query
  const filterParam = hubTypeTab === "pitch" ? "hubType:pitch" : "hubType:client";
  const { data: hubsData, isLoading, isError } = useHubs({ filter: filterParam });
  const { data: authData } = useCurrentUser();
  const { mutate: logout } = useLogout();

  const isAdmin = authData?.user ? hasAdminAccess(authData.user) : false;

  const user = authData?.user;
  const userInitials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  // Filter hubs based on search and status
  const filteredHubs = hubsData?.items.filter((hub) => {
    const matchesSearch =
      searchQuery === "" ||
      hub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hub.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || hub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <img
            src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg"
            alt="AgentFlow Logo"
            className="h-10 w-auto"
          />

          {/* Title */}
          <h1 className="text-lg font-semibold text-royal-blue hidden md:block">
            Hub List
          </h1>

          {/* Right side: Leadership link (admin) + User Menu */}
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2"
                onClick={() => navigate("/leadership")}
              >
                <BarChart3 className="h-4 w-4" />
                Leadership
              </Button>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-2">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-blue text-white text-sm font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-dark-grey hidden sm:inline">
                    {user?.displayName ?? "Loading..."}
                  </span>
                  <ChevronDown className="h-4 w-4 text-medium-grey" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white z-50">
                {isAdmin && (
                  <DropdownMenuItem
                    className="cursor-pointer sm:hidden"
                    onClick={() => navigate("/leadership")}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Leadership
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive"
                  onClick={() => logout()}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-royal-blue">
            Your Hubs
          </h2>
          <Button
            className="w-full md:w-auto"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Hub
          </Button>
        </div>

        {/* Hub Type Tabs */}
        <Tabs value={hubTypeTab} onValueChange={(v) => setHubTypeTab(v as HubType)} className="mb-6">
          <TabsList>
            <TabsTrigger value="pitch" className="gap-2">
              Pitch Hubs
            </TabsTrigger>
            <TabsTrigger value="client" className="gap-2">
              Client Hubs
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-medium-grey" />
            <Input
              placeholder="Search hubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white border-border focus:ring-gradient-blue focus:border-gradient-blue"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 px-6 bg-white border-border hover:bg-muted w-full sm:w-auto"
              >
                {statusFilter === "all" ? "All Hubs" : formatStatus(statusFilter)}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white z-50">
              <DropdownMenuItem className="cursor-pointer" onClick={() => setStatusFilter("all")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setStatusFilter("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setStatusFilter("won")}>
                Won
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setStatusFilter("lost")}>
                Lost
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gradient-blue" />
            <span className="ml-2 text-medium-grey">Loading hubs...</span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load hubs. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredHubs?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-medium-grey">
              {hubTypeTab === "pitch"
                ? "No pitch hubs found. Create one to get started!"
                : "No client hubs yet. Convert a won pitch hub to create your first client hub."}
            </p>
          </div>
        )}

        {/* Hub Cards Grid */}
        {!isLoading && !isError && filteredHubs && filteredHubs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHubs.map((hub) => (
              <HubCard key={hub.id} hub={hub} />
            ))}
          </div>
        )}
      </main>

      <CreateHubDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
};

export default HubList;
