import {
  Home,
  FileText,
  Play,
  Folder,
  Mail,
  Globe,
  FolderKanban,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useHubId } from "@/contexts/hub-context";
import { useHub } from "@/hooks";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

// Navigation for pitch hubs (prospecting stage) - max 7 items
const pitchNavItems = [
  { title: "Overview", path: "overview", icon: Home },
  { title: "Client Portal", path: "client-portal", icon: Globe },
  { title: "Proposal", path: "proposal", icon: FileText },
  { title: "Video Links", path: "videos", icon: Play },
  { title: "Documents", path: "documents", icon: Folder },
  { title: "Messages", path: "messages", icon: Mail },
];

// Navigation for client hubs (active client relationship) - max 7 items
// Order: only live sections shown in the staff UI.
const clientNavItems = [
  { title: "Overview", path: "overview", icon: Home },
  { title: "Client Portal", path: "client-portal", icon: Globe },
  { title: "Projects", path: "projects", icon: FolderKanban },
  { title: "Documents", path: "documents", icon: Folder },
  { title: "Messages", path: "messages", icon: Mail },
];

export function HubSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const hubId = useHubId();
  const currentPath = location.pathname;
  const { data: hub } = useHub(hubId);

  // Select navigation items based on hub type
  const navItems = hub?.hubType === "client" ? clientNavItems : pitchNavItems;

  return (
    <Sidebar className="border-r border-border/50 pt-16" collapsible="icon">
      <SidebarContent className="bg-[hsl(var(--deep-navy))]">
        <div className="p-4">
          <img
            src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg"
            alt="AgentFlow"
            className={state === "collapsed" ? "h-8 w-8" : "h-10"}
          />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const url = `/hub/${hubId}/${item.path}`;
                const isActive = currentPath.startsWith(url) ||
                  (item.path === "overview" && currentPath === `/hub/${hubId}`);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        text-white hover:bg-[hsl(var(--gradient-purple))] transition-colors
                        ${isActive ? 'border-l-4 border-[hsl(var(--soft-coral))] bg-[hsl(var(--gradient-purple))]' : ''}
                      `}
                    >
                      <NavLink to={url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
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
