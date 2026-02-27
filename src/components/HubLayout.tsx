import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HubSidebar } from "./HubSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser, useLogout, useHub } from "@/hooks";
import { useHubId } from "@/contexts/hub-context";

interface HubLayoutProps {
  children: React.ReactNode;
  viewMode?: "internal" | "client";
}

export function HubLayout({
  children,
  viewMode = "internal"
}: HubLayoutProps) {
  const navigate = useNavigate();
  const hubId = useHubId();
  const { data: hub } = useHub(hubId);
  const { data: authData } = useCurrentUser();
  const { mutate: logout } = useLogout();

  // Build hub name from fetched data
  const hubName = hub ? `${hub.companyName} Hub` : "Loading...";

  const user = authData?.user;
  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const handleSignOut = () => {
    logout();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" aria-label="Toggle sidebar navigation" />
            <img
              src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg"
              alt="AgentFlow"
              className="h-8 cursor-pointer hidden md:block"
              onClick={() => navigate("/hubs")}
            />
          </div>
          
          <h1 className="text-lg md:text-xl font-semibold text-[hsl(var(--bold-royal-blue))] absolute left-1/2 transform -translate-x-1/2">
            {hubName}
          </h1>
          
          <div className="flex items-center gap-3">
            <Badge 
              className={`
                ${viewMode === "internal" 
                  ? "bg-[hsl(var(--deep-navy))] text-white" 
                  : "bg-[hsl(var(--gradient-blue))] text-white"
                }
              `}
            >
              {viewMode === "internal" ? "Internal View" : "Client View"}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open user menu"
                  className="h-9 w-9 rounded-full p-0"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-[hsl(var(--gradient-blue))] text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
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
          <HubSidebar />
          
          {/* Main content */}
          <main className="flex-1 bg-[hsl(var(--warm-cream))] p-6 md:p-8 overflow-auto">
            {children}
            
            {/* Footer */}
            <footer className="mt-12 pt-6 border-t border-border/20">
              <p className="text-sm text-[hsl(var(--medium-grey))] text-center">
                © 2024 AgentFlow. All rights reserved.
              </p>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
