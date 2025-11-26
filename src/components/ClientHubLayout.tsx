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
import { Home, FileText, Play, FolderOpen, MessageSquare, Calendar } from "lucide-react";

interface ClientHubLayoutProps {
  children: React.ReactNode;
  hubName?: string;
  viewMode?: "internal" | "client";
}

const clientNavItems = [
  { title: "Overview", url: "/portal/overview", icon: Home },
  { title: "Proposal", url: "/portal/proposal", icon: FileText },
  { title: "Videos", url: "/portal/videos", icon: Play, badge: "3" },
  { title: "Documents", url: "/portal/documents", icon: FolderOpen, badge: "5" },
  { title: "Messages", url: "/portal/messages", icon: MessageSquare, badge: "2" },
  { title: "Meetings", url: "/portal/meetings", icon: Calendar },
];

function ClientSidebar() {
  return (
    <Sidebar className="border-r bg-[hsl(var(--deep-navy))] pt-16" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {clientNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                      activeClassName="text-white bg-[hsl(var(--gradient-purple))]/30 border-l-4 border-[hsl(var(--soft-coral))]"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge className="bg-[hsl(var(--soft-coral))] text-white text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
  viewMode = "client"
}: ClientHubLayoutProps) {
  const userEmail = localStorage.getItem("userEmail") || "";
  const initials = userEmail.split('@')[0].substring(0, 2).toUpperCase();

  const handleSignOut = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    window.location.href = "/login";
  };

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
              onClick={() => window.location.href = '/portal/overview'}
            />
          </div>
          
          <h1 className="text-lg md:text-xl font-semibold text-[hsl(var(--bold-royal-blue))] absolute left-1/2 transform -translate-x-1/2">
            {hubName}
          </h1>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-[hsl(var(--gradient-blue))] text-white">
              Client View
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
                  {userEmail}
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
          <ClientSidebar />
          
          {/* Main content */}
          <main className="flex-1 bg-[hsl(var(--warm-cream))] p-6 md:p-8 overflow-auto">
            {children}
            
            {/* Footer */}
            <footer className="mt-12 pt-6 border-t border-border/20">
              <div className="text-center space-y-2">
                <p className="text-sm text-[hsl(var(--dark-grey))]">
                  Questions? We're here to help.
                </p>
                <a 
                  href="/portal/messages" 
                  className="text-sm text-[hsl(var(--bold-royal-blue))] hover:underline"
                >
                  Send a Message
                </a>
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
