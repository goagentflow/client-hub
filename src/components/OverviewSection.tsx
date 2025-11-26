import { Play, FileText, Video, Folder, Mail, Calendar, Clipboard, Clock, FileCheck, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const quickLinks = [
  {
    title: "View Proposal",
    description: "Review our detailed proposal",
    icon: FileText,
    color: "text-[hsl(var(--gradient-blue))]",
  },
  {
    title: "Watch Videos",
    description: "Introduction and demo videos",
    icon: Video,
    color: "text-[hsl(var(--rich-violet))]",
  },
  {
    title: "Browse Documents",
    description: "Case studies and materials",
    icon: Folder,
    color: "text-[hsl(var(--sage-green))]",
  },
  {
    title: "Messages",
    description: "Your conversations",
    icon: Mail,
    color: "text-[hsl(var(--gradient-blue))]",
    badge: "3",
  },
  {
    title: "Upcoming Meeting",
    description: "Tomorrow, 2pm",
    icon: Calendar,
    color: "text-[hsl(var(--soft-coral))]",
  },
  {
    title: "Complete Questionnaire",
    description: "Status: Not started",
    icon: Clipboard,
    color: "text-[hsl(var(--medium-grey))]",
  },
];

const recentActivity = [
  {
    icon: FileCheck,
    description: "New document added: Case Study.pdf",
    timestamp: "2 hours ago",
  },
  {
    icon: CalendarCheck,
    description: "Meeting scheduled for Nov 28",
    timestamp: "Yesterday",
  },
  {
    icon: FileText,
    description: "Sarah viewed the proposal",
    timestamp: "2 days ago",
  },
];

export function OverviewSection() {
  return (
    <div className="min-h-screen bg-[hsl(var(--warm-cream))]">
      {/* Hero Area */}
      <div className="bg-gradient-to-r from-[hsl(var(--gradient-blue))] to-[hsl(var(--gradient-purple))] p-8 rounded-lg mb-8">
        <h1 className="text-4xl font-bold text-[hsl(var(--bold-royal-blue))] mb-2">
          Welcome, Sarah
        </h1>
        <p className="text-lg text-[hsl(var(--dark-grey))]">
          Here's everything you need for our proposal to Neverland Creative
        </p>
      </div>

      {/* Featured Video */}
      <div className="mb-8">
        <div className="relative aspect-video bg-[hsl(var(--medium-grey))] rounded-lg flex items-center justify-center mb-2">
          <Play className="w-16 h-16 text-white opacity-70" />
        </div>
        <p className="text-sm text-[hsl(var(--medium-grey))]">Watch our introduction</p>
      </div>

      {/* Quick Links Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[hsl(var(--bold-royal-blue))] mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Card key={link.title} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <link.icon className={`w-8 h-8 ${link.color}`} />
                  {link.badge && (
                    <Badge variant="destructive" className="bg-[hsl(var(--soft-coral))]">
                      {link.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-[hsl(var(--bold-royal-blue))]">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                    <activity.icon className="w-5 h-5 text-[hsl(var(--gradient-blue))] mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-[hsl(var(--dark-grey))]">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-[hsl(var(--medium-grey))]" />
                        <span className="text-xs text-[hsl(var(--medium-grey))]">
                          {activity.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Internal Notes Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-[hsl(var(--gradient-blue))]/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Internal Notes</CardTitle>
                <Badge variant="outline" className="text-xs">
                  Not visible to client
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add internal notes here..."
                className="min-h-[120px] mb-2"
                disabled
              />
              <p className="text-xs text-[hsl(var(--medium-grey))]">
                Last updated by Hamish, Nov 25
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Next Steps CTA */}
      <Card className="mt-8 bg-[hsl(var(--gradient-purple))]/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-[hsl(var(--bold-royal-blue))] mb-1">
                Ready to discuss?
              </h3>
              <p className="text-sm text-[hsl(var(--medium-grey))]">
                Schedule a call with our team
              </p>
            </div>
            <Button className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90">
              Schedule a Call
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
