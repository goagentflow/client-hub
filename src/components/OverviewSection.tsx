import { UserPlus, Video, FilePlus, Mail, CalendarPlus, ClipboardPlus, Users, Clock, FileText, Folder, Eye, EyeOff, AlertCircle, CheckCircle, Settings, ArrowRight, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const hubStatus = [
  {
    label: "Clients Invited",
    value: "2",
    detail: "Sarah Mitchell, James Chen",
    icon: Users,
  },
  {
    label: "Last Client Visit",
    value: "2 hours ago",
    detail: "",
    icon: Clock,
  },
  {
    label: "Content",
    value: "4 videos, 6 documents",
    detail: "",
    icon: Folder,
  },
  {
    label: "Questionnaire",
    value: "Not completed",
    detail: "",
    icon: ClipboardPlus,
  },
];

const quickActions = [
  { label: "Invite Client", icon: UserPlus, color: "bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90", primary: true },
  { label: "Upload Video", icon: Video, color: "bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90" },
  { label: "Upload Document", icon: FilePlus, color: "bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90" },
  { label: "Send Message", icon: Mail, color: "bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90" },
  { label: "Schedule Meeting", icon: CalendarPlus, color: "bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90" },
  { label: "Create Questionnaire", icon: ClipboardPlus, color: "bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90" },
];

const recentActivity = [
  {
    description: "Sarah viewed the proposal",
    timestamp: "2 hours ago",
    isClientAction: true,
    user: "Sarah",
  },
  {
    description: "You uploaded Case Study.pdf",
    timestamp: "Yesterday",
    isClientAction: false,
  },
  {
    description: "Sarah watched Introduction video",
    timestamp: "Yesterday",
    isClientAction: true,
    user: "Sarah",
  },
  {
    description: "You scheduled a meeting for Nov 28",
    timestamp: "Nov 22",
    isClientAction: false,
  },
  {
    description: "Sarah was invited to the hub",
    timestamp: "Nov 20",
    isClientAction: true,
    user: "Sarah",
  },
  {
    description: "Hub created",
    timestamp: "Nov 18",
    isClientAction: false,
  },
];

const alerts = [
  { label: "Questionnaire not created yet", completed: false },
  { label: "James Chen hasn't logged in yet", completed: false },
  { label: "Proposal uploaded", completed: true },
  { label: "Meeting scheduled", completed: true },
];

const engagementStats = [
  { label: "Total hub visits", value: "7" },
  { label: "Last visit", value: "2 hours ago (Sarah)" },
  { label: "Proposal views", value: "3" },
  { label: "Videos watched", value: "2 of 4" },
  { label: "Documents downloaded", value: "1" },
  { label: "Avg. time per visit", value: "~4 min" },
];

export function OverviewSection() {
  return (
    <div className="min-h-screen bg-[hsl(var(--warm-cream))]">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[hsl(var(--medium-grey))]/20">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--bold-royal-blue))]">
            Neverland Creative
          </h1>
          <p className="text-lg text-[hsl(var(--medium-grey))]">Pitch Hub</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-[hsl(var(--sage-green))] text-white">
            Active
          </Badge>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5 text-[hsl(var(--medium-grey))]" />
          </Button>
        </div>
      </div>

      {/* Hub Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {hubStatus.map((status) => (
          <Card key={status.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <status.icon className="w-6 h-6 text-[hsl(var(--gradient-blue))]" />
                <div className="flex-1">
                  <p className="text-sm text-[hsl(var(--medium-grey))] mb-1">
                    {status.label}
                  </p>
                  <p className="text-xl font-bold text-[hsl(var(--bold-royal-blue))]">
                    {status.value}
                  </p>
                  {status.detail && (
                    <p className="text-xs text-[hsl(var(--medium-grey))] mt-1">
                      {status.detail}
                    </p>
                  )}
                  {status.label === "Clients Invited" && (
                    <div className="flex gap-1 mt-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-[hsl(var(--gradient-blue))] text-white">
                          SM
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-[hsl(var(--gradient-purple))] text-white">
                          JC
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[hsl(var(--dark-grey))] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              className={`${action.color} text-white h-auto py-4 justify-start`}
            >
              <action.icon className="w-5 h-5 mr-3" />
              <span className="text-base font-semibold">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[hsl(var(--bold-royal-blue))]">
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 pb-4 border-b last:border-b-0 ${
                      activity.isClientAction ? "bg-[hsl(var(--gradient-blue))]/5 -mx-4 px-4 py-2" : ""
                    }`}
                  >
                    {activity.isClientAction ? (
                      <User className="w-5 h-5 text-[hsl(var(--gradient-blue))] mt-1" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--sage-green))] mt-1" />
                    )}
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
              <button className="text-sm text-[hsl(var(--gradient-blue))] hover:underline mt-4">
                View all
              </button>
            </CardContent>
          </Card>

          {/* To Do / Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[hsl(var(--dark-grey))]">
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${
                      alert.completed ? "opacity-50" : ""
                    }`}
                  >
                    {alert.completed ? (
                      <CheckCircle className="w-5 h-5 text-[hsl(var(--sage-green))] mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[hsl(var(--soft-coral))] mt-0.5" />
                    )}
                    <p
                      className={`text-sm ${
                        alert.completed
                          ? "text-[hsl(var(--medium-grey))] line-through"
                          : "text-[hsl(var(--dark-grey))]"
                      }`}
                    >
                      {alert.label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Internal Notes */}
          <Card className="bg-[hsl(var(--warm-cream))]/50 border-2 border-[hsl(var(--medium-grey))]/20">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <EyeOff className="w-4 h-4" />
                <CardTitle className="text-lg">Internal Notes</CardTitle>
              </div>
              <p className="text-xs text-[hsl(var(--medium-grey))]">
                Only visible to AgentFlow team
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-white/50 p-4 rounded-md border border-[hsl(var(--medium-grey))]/20 min-h-[180px] text-sm text-[hsl(var(--dark-grey))] whitespace-pre-line mb-3">
                Key contact is Sarah but James is the decision maker.
                
                Budget: £50-75k approved
                Timeline: Want to launch by Q2
                
                Sarah very responsive. James harder to pin down - suggest CC'ing him on all important messages.
                
                - Hamish, Nov 24
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Edit
              </Button>
            </CardContent>
          </Card>

          {/* Engagement Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[hsl(var(--dark-grey))]">
                Client Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {engagementStats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <span className="text-sm text-[hsl(var(--dark-grey))]">
                      {stat.label}
                    </span>
                    <span className="text-sm font-semibold text-[hsl(var(--bold-royal-blue))]">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview as Client Link */}
      <div className="text-center">
        <button className="text-sm text-[hsl(var(--medium-grey))] hover:text-[hsl(var(--gradient-blue))] inline-flex items-center gap-2">
          See what Sarah sees
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
