import { useNavigate, useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavLink } from "./NavLink";
import {
  Home,
  FileText,
  Play,
  FolderOpen,
  MessageSquare,
  Calendar,
  ClipboardList,
  Users,
  Sparkles,
  ClipboardCheck,
  BarChart3,
  History,
} from "lucide-react";
import { useCurrentUser, useLogout } from "@/hooks";
import { useHubId } from "@/contexts/hub-context";
import type { LucideIcon } from "lucide-react";
import type { HubType } from "@/types";

interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

interface ClientHubLayoutProps {
  children: React.ReactNode;
  hubName?: string;
  hubType?: HubType;
  viewMode?: "internal" | "client";
}

// Max visible nav items
const MAX_CLIENT_NAV_ITEMS = 8;

// Pitch hub nav items (existing pitch functionality)
const pitchHubNavItems: NavItem[] = [
  { title: "Overview", path: "overview", icon: Home },
  { title: "Proposal", path: "proposal", icon: FileText },
  { title: "Videos", path: "videos", icon: Play },
  { title: "Documents", path: "documents", icon: FolderOpen },
  { title: "Meetings", path: "meetings", icon: Calendar },
  { title: "Questionnaire", path: "questionnaire", icon: ClipboardList },
];

// Client hub nav items — coming soon features flagged for subtle styling
const clientHubNavItems: NavItem[] = [
  { title: "Overview", path: "overview", icon: Home },
  { title: "Messages", path: "messages", icon: MessageSquare },
  { title: "Meetings", path: "meetings", icon: Calendar, comingSoon: true },
  { title: "Documents", path: "documents", icon: FolderOpen },
  { title: "Decisions", path: "decisions", icon: ClipboardCheck, comingSoon: true },
  { title: "Performance", path: "performance", icon: BarChart3, comingSoon: true },
  { title: "Instant Answers", path: "instant-answers", icon: Sparkles, comingSoon: true },
  { title: "History", path: "history", icon: History, comingSoon: true },
];

function ClientSidebar({ hubType = "pitch" }: { hubType?: HubType }) {
  const hubId = useHubId();
  const location = useLocation();

  // Select nav items based on hub type
  const navItems = hubType === "client" ? clientHubNavItems : pitchHubNavItems;

  // Enforce max nav items limit (silently truncate - validated at design time)
  const visibleNavItems = navItems.slice(0, MAX_CLIENT_NAV_ITEMS);

  return (
    <Sidebar className="border-r bg-[hsl(var(--deep-navy))] pt-16" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const url = `/portal/${hubId}/${item.path}`;
                const isActive = location.pathname.startsWith(url) ||
                  (item.path === "overview" && location.pathname === `/portal/${hubId}`);
                const isSoon = item.comingSoon === true;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={url}
                        className={`text-white/70 hover:text-white hover:bg-white/10 transition-colors ${
                          isActive ? "text-white bg-[hsl(var(--gradient-purple))]/30 border-l-4 border-[hsl(var(--soft-coral))]" : ""
                        } ${isSoon ? "opacity-60" : ""}`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1">{item.title}</span>
                        {isSoon && (
                          <span className="text-[10px] font-medium bg-white/15 text-white/70 px-1.5 py-0.5 rounded">
                            Soon
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function ClientHubLayout({
  children,
  hubName = "Your AgentFlow Hub",
  hubType = "pitch",
  viewMode = "client"
}: ClientHubLayoutProps) {
  const navigate = useNavigate();
  const hubId = useHubId();
  const { data: authData } = useCurrentUser();
  const { mutate: logout } = useLogout();

  const user = authData?.user;
  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const handleSignOut = () => {
    logout();
  };

  // Badge styling based on hub type (visual differentiation per spec Section 4.4)
  const badgeText = hubType === "client" ? "Client Hub" : "Client View";
  const badgeClass = hubType === "client"
    ? "bg-[hsl(var(--sage-green))] text-white"
    : "bg-[hsl(var(--gradient-blue))] text-white";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <img
              src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg"
              alt="AgentFlow"
              className="h-8 cursor-pointer hidden md:block"
              onClick={() => navigate(`/portal/${hubId}/overview`)}
            />
          </div>

          <h1 className="text-lg md:text-xl font-semibold text-[hsl(var(--bold-royal-blue))] absolute left-1/2 transform -translate-x-1/2">
            {hubName}
          </h1>

          <div className="flex items-center gap-3">
            <Badge className={badgeClass}>
              {badgeText}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarFallback className="bg-[hsl(var(--gradient-blue))] text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem className="text-[hsl(var(--medium-grey))] cursor-default">
                  {user?.email ?? "Loading..."}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main layout with sidebar */}
        <div className="flex flex-1 w-full">
          <ClientSidebar hubType={hubType} />
          
          {/* Main content */}
          <main className="flex-1 bg-[hsl(var(--warm-cream))] p-6 md:p-8 overflow-auto">
            {children}
            
            {/* Footer */}
            <footer className="mt-12 pt-6 border-t border-border/20">
              <div className="text-center space-y-2">
                <p className="text-sm text-[hsl(var(--dark-grey))]">
                  Questions? We're here to help.
                </p>
                <Link
                  to={`/portal/${hubId}/messages`}
                  className="text-sm text-[hsl(var(--bold-royal-blue))] hover:underline"
                >
                  Send a Message
                </Link>
                <div className="pt-4">
                  <img 
                    src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg" 
                    alt="AgentFlow" 
                    className="h-6 mx-auto opacity-50"
                  />
                </div>
                <p className="text-xs text-[hsl(var(--medium-grey))]">
                  © 2025 AgentFlow
                </p>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
