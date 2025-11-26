import { Home, FileText, Play, Folder, Mail, Calendar, ClipboardList, Globe } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

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

const navItems = [
  { title: "Overview", url: "/hub/overview", icon: Home },
  { title: "Client Portal", url: "/hub/client-portal", icon: Globe },
  { title: "Proposal", url: "/hub/proposal", icon: FileText },
  { title: "Videos", url: "/hub/videos", icon: Play },
  { title: "Documents", url: "/hub/documents", icon: Folder },
  { title: "Messages", url: "/hub/messages", icon: Mail },
  { title: "Meetings", url: "/hub/meetings", icon: Calendar },
  { title: "Questionnaire", url: "/hub/questionnaire", icon: ClipboardList },
];

export function HubSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

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
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className={`
                        text-white hover:bg-[hsl(var(--gradient-purple))] transition-colors
                        ${isActive ? 'border-l-4 border-[hsl(var(--soft-coral))] bg-[hsl(var(--gradient-purple))]' : ''}
                      `}
                    >
                      <NavLink to={item.url}>
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
