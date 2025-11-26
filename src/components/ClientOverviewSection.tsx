import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  FileText, 
  Video, 
  Folder, 
  Mail, 
  Calendar, 
  ClipboardList,
  Play,
  Clock,
  MessageSquare,
  ChevronRight
} from "lucide-react";

const quickLinks = [
  { 
    id: "proposal", 
    icon: FileText, 
    title: "Proposal", 
    description: "View our proposal", 
    accent: "gradient-blue",
    hasContent: true
  },
  { 
    id: "videos", 
    icon: Video, 
    title: "Videos", 
    description: "3 videos", 
    accent: "rich-violet",
    hasContent: true
  },
  { 
    id: "documents", 
    icon: Folder, 
    title: "Documents", 
    description: "5 files shared", 
    accent: "sage-green",
    hasContent: true
  },
  { 
    id: "messages", 
    icon: Mail, 
    title: "Messages", 
    description: "2 unread", 
    accent: "gradient-blue",
    badge: 2,
    hasContent: true
  },
  { 
    id: "meetings", 
    icon: Calendar, 
    title: "Meetings", 
    description: "Next: Tomorrow, 2pm", 
    accent: "soft-coral",
    hasContent: true
  },
  { 
    id: "questionnaire", 
    icon: ClipboardList, 
    title: "Questionnaire", 
    description: "1 to complete", 
    accent: "gradient-purple",
    hasContent: false
  },
];

const recentActivity = [
  { 
    icon: Folder, 
    description: "New document added: Case Study.pdf", 
    timestamp: "2 hours ago" 
  },
  { 
    icon: Calendar, 
    description: "Meeting scheduled for Nov 28", 
    timestamp: "Yesterday" 
  },
  { 
    icon: Mail, 
    description: "New message from Hamish", 
    timestamp: "2 days ago" 
  },
  { 
    icon: FileText, 
    description: "Proposal updated", 
    timestamp: "Nov 22" 
  },
];

export function ClientOverviewSection() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [heroContent] = useState<"video" | "proposal" | "both">("video");

  return (
    <div className="min-h-screen bg-[hsl(var(--warm-cream))]">
      {/* First-Time Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-2xl bg-white">
          <div className="flex flex-col items-center text-center space-y-6 py-6">
            {/* Logo */}
            <img 
              src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg" 
              alt="AgentFlow" 
              className="h-10"
            />
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">
              Welcome to Your AgentFlow Hub
            </h1>

            {/* Video Player Placeholder */}
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="h-16 w-16 mx-auto mb-3 text-[hsl(var(--medium-grey))]" />
                <p className="text-sm text-[hsl(var(--medium-grey))]">Video player placeholder</p>
              </div>
            </div>

            {/* Video Title & Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-[hsl(var(--dark-grey))]">
                Getting Started — 2 min
              </h3>
              <p className="text-sm text-[hsl(var(--medium-grey))]">
                A quick tour of your hub and how to get the most from it
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full justify-center">
              <Button 
                variant="link" 
                onClick={() => setShowWelcomeModal(false)}
                className="text-[hsl(var(--medium-grey))]"
              >
                Watch Later
              </Button>
              <Button 
                onClick={() => setShowWelcomeModal(false)}
                className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white px-8"
              >
                Got It
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[hsl(var(--bold-royal-blue))]">
            Welcome, Sarah
          </h1>
          <p className="text-lg text-[hsl(var(--dark-grey))]">
            Here's everything you need for your project with AgentFlow
          </p>
          <p className="text-sm text-[hsl(var(--medium-grey))]">
            Neverland Creative
          </p>
        </div>

        {/* Hero Content Area */}
        {heroContent === "video" && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Video Player */}
              <div className="aspect-video bg-muted flex items-center justify-center">
                <div className="text-center">
                  <Play className="h-20 w-20 mx-auto mb-3 text-[hsl(var(--medium-grey))]" />
                  <p className="text-[hsl(var(--medium-grey))]">Video player placeholder</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[hsl(var(--dark-grey))]">
                  Introduction from Hamish & Stephen
                </h3>
              </div>
            </CardContent>
          </Card>
        )}

        {heroContent === "proposal" && (
          <Card className="overflow-hidden">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
              {/* Proposal Thumbnail */}
              <div className="w-full md:w-48 aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                <FileText className="h-16 w-16 text-[hsl(var(--medium-grey))]" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-semibold text-[hsl(var(--dark-grey))] mb-4">
                  Our Proposal for Neverland Creative
                </h3>
                <Button className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white">
                  View Proposal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {heroContent === "both" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video (Primary) */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Play className="h-16 w-16 text-[hsl(var(--medium-grey))]" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[hsl(var(--dark-grey))]">
                    Introduction from Hamish & Stephen
                  </h3>
                </div>
              </CardContent>
            </Card>

            {/* Proposal (Secondary) */}
            <Card className="overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                <div className="w-32 h-40 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-12 w-12 text-[hsl(var(--medium-grey))]" />
                </div>
                <h3 className="font-semibold text-[hsl(var(--dark-grey))] mb-4">
                  Our Proposal
                </h3>
                <Button className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white">
                  View Proposal
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Links Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[hsl(var(--dark-grey))]">
            Your Hub
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.filter(link => link.hasContent).map((link) => {
              const Icon = link.icon;
              return (
                <Card 
                  key={link.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className={`p-3 rounded-lg bg-[hsl(var(--${link.accent}))]/10`}
                      >
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

        {/* Getting Started Card */}
        <Card className="bg-muted/30 border-2 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[hsl(var(--gradient-blue))]/10">
                <Play className="h-6 w-6 text-[hsl(var(--gradient-blue))]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[hsl(var(--dark-grey))] mb-1">
                  Getting Started
                </h3>
                <p className="text-sm text-[hsl(var(--medium-grey))]">
                  New to the hub? Watch our 2-minute guide
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowWelcomeModal(true)}
                className="text-[hsl(var(--gradient-blue))]"
              >
                Watch
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[hsl(var(--dark-grey))]">
            What's New
          </h2>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-start gap-3 pb-4 border-b last:border-b-0"
                    >
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-[hsl(var(--medium-grey))]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[hsl(var(--dark-grey))]">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-[hsl(var(--medium-grey))]" />
                          <span className="text-xs text-[hsl(var(--medium-grey))]">
                            {activity.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button 
                variant="link" 
                className="text-[hsl(var(--gradient-blue))] p-0 mt-4"
              >
                View all
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps CTA */}
        <Card className="border-l-4 border-l-[hsl(var(--soft-coral))] bg-[hsl(var(--soft-coral))]/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[hsl(var(--dark-grey))]">
                  Ready to move forward?
                </h3>
                <p className="text-[hsl(var(--medium-grey))]">
                  Review our proposal and let us know your thoughts
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white">
                  View Proposal
                </Button>
                <Button 
                  variant="link" 
                  className="text-[hsl(var(--medium-grey))] p-0 h-auto"
                >
                  Have questions? Send us a message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="pt-8 pb-4 text-center space-y-4">
          <p className="text-sm text-[hsl(var(--medium-grey))]">
            Questions? We're here to help.
          </p>
          <Button 
            variant="link" 
            className="text-[hsl(var(--gradient-blue))]"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send a Message
          </Button>
          <div className="flex flex-col items-center gap-3 pt-4">
            <img 
              src="https://www.goagentflow.com/assets/images/AgentFlowLogo.svg" 
              alt="AgentFlow" 
              className="h-6 opacity-50"
            />
            <p className="text-xs text-[hsl(var(--medium-grey))]">
              © 2025 AgentFlow. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
