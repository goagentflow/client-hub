import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useHubId } from "@/contexts/hub-context";
import {
  FileText,
  Video,
  Folder,
  Mail,
  Calendar,
  ClipboardList,
} from "lucide-react";

interface QuickLink {
  id: string;
  icon: typeof FileText;
  title: string;
  description: string;
  accent: string;
  badge?: number;
  hasContent: boolean;
  route: string;
}

interface QuickLinksGridProps {
  proposalCount: number;
  videoCount: number;
  documentCount: number;
  messageCount: number;
  nextMeetingDate?: string;
  pendingQuestionnaires: number;
}

export function QuickLinksGrid({
  proposalCount,
  videoCount,
  documentCount,
  messageCount,
  nextMeetingDate,
  pendingQuestionnaires,
}: QuickLinksGridProps) {
  const navigate = useNavigate();
  const hubId = useHubId();

  const quickLinks: QuickLink[] = [
    {
      id: "proposal",
      icon: FileText,
      title: "Proposal",
      description: proposalCount > 0 ? "View our proposal" : "No proposal yet",
      accent: "gradient-blue",
      hasContent: proposalCount > 0,
      route: `/portal/${hubId}/proposal`,
    },
    {
      id: "videos",
      icon: Video,
      title: "Videos",
      description: `${videoCount} video${videoCount !== 1 ? "s" : ""}`,
      accent: "rich-violet",
      hasContent: videoCount > 0,
      route: `/portal/${hubId}/videos`,
    },
    {
      id: "documents",
      icon: Folder,
      title: "Documents",
      description: `${documentCount} file${documentCount !== 1 ? "s" : ""} shared`,
      accent: "sage-green",
      hasContent: documentCount > 0,
      route: `/portal/${hubId}/documents`,
    },
    {
      id: "messages",
      icon: Mail,
      title: "Messages",
      description: messageCount > 0 ? `${messageCount} message${messageCount !== 1 ? "s" : ""}` : "No messages yet",
      accent: "gradient-blue",
      badge: messageCount > 0 ? messageCount : undefined,
      hasContent: true,
      route: `/portal/${hubId}/messages`,
    },
    {
      id: "meetings",
      icon: Calendar,
      title: "Meetings",
      description: nextMeetingDate || "No upcoming meetings",
      accent: "soft-coral",
      hasContent: true,
      route: `/portal/${hubId}/meetings`,
    },
    {
      id: "questionnaire",
      icon: ClipboardList,
      title: "Questionnaire",
      description: pendingQuestionnaires > 0
        ? `${pendingQuestionnaires} to complete`
        : "All complete",
      accent: "gradient-purple",
      hasContent: pendingQuestionnaires > 0,
      route: `/portal/${hubId}/questionnaire`,
    },
  ];

  const visibleLinks = quickLinks.filter((link) => link.hasContent);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[hsl(var(--dark-grey))]">Your Hub</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Card
              key={link.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(link.route)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-lg bg-[hsl(var(--${link.accent}))]/10`}>
                    <Icon className={`h-6 w-6 text-[hsl(var(--${link.accent}))]`} />
                  </div>
                  {link.badge && (
                    <Badge className="bg-[hsl(var(--soft-coral))] text-white">
                      {link.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-[hsl(var(--dark-grey))] mb-1 group-hover:text-[hsl(var(--gradient-blue))] transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-[hsl(var(--medium-grey))]">
                  {link.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
