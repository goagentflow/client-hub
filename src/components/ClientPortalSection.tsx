import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  Copy, 
  Send, 
  CheckCircle2, 
  Circle, 
  FileText, 
  Video, 
  Folder, 
  Mail, 
  Calendar, 
  ClipboardList,
  AlertCircle,
  Monitor
} from "lucide-react";

const invitedClients = [
  {
    name: "Sarah Mitchell",
    email: "sarah@neverlandcreative.com",
    invitedDate: "Nov 20",
    lastVisit: "2 hours ago",
    status: "active"
  },
  {
    name: "James Chen",
    email: "james@neverlandcreative.com",
    invitedDate: "Nov 22",
    lastVisit: "Not yet logged in",
    status: "pending"
  }
];

const portalSections = [
  { id: "proposal", name: "Proposal", icon: FileText, enabled: true, content: "1 document" },
  { id: "videos", name: "Videos", icon: Video, enabled: true, content: "2 videos" },
  { id: "documents", name: "Documents", icon: Folder, enabled: true, content: "4 files shared" },
  { id: "messages", name: "Messages", icon: Mail, enabled: true, content: "Always recommended" },
  { id: "meetings", name: "Meetings", icon: Calendar, enabled: true, content: "1 upcoming" },
  { id: "questionnaire", name: "Questionnaire", icon: ClipboardList, enabled: false, content: "Not created yet" }
];

const checklistItems = [
  { id: 1, text: "Welcome message set", completed: true },
  { id: 2, text: "Hero content selected", completed: true },
  { id: 3, text: "Proposal uploaded", completed: true },
  { id: 4, text: "At least one client invited", completed: true },
  { id: 5, text: "Questionnaire created (optional)", completed: false }
];

export function ClientPortalSection() {
  const [status, setStatus] = useState<"draft" | "live">("draft");
  const [heroContent, setHeroContent] = useState("video");
  const [sections, setSections] = useState(portalSections);

  const toggleSection = (id: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const completedItems = checklistItems.filter(item => item.completed).length;

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">
              Client Portal
            </h1>
            <Badge className={status === "live" ? "bg-[hsl(var(--sage-green))]" : "bg-amber-500"}>
              {status === "live" ? "Live" : "Draft"}
            </Badge>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview as Client
            </Button>
            <Button className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 gap-2">
              <Send className="h-4 w-4" />
              Publish
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        {status === "draft" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-900">
                This portal is not yet visible to clients. Invite clients and publish when ready.
              </p>
            </div>
            <Button variant="link" className="text-amber-900 font-semibold">
              Publish Now
            </Button>
          </div>
        ) : (
          <div className="bg-[hsl(var(--sage-green))]/10 border border-[hsl(var(--sage-green))]/30 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--sage-green))]" />
              <p className="text-[hsl(var(--dark-grey))]">
                Portal is live. 2 clients have access.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Copy className="h-4 w-4" />
                Copy link
              </Button>
              <Button variant="link" size="sm">
                Manage access
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Welcome & Hero */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[hsl(var(--dark-grey))]">Welcome Section</CardTitle>
                <CardDescription>What clients see when they first arrive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcome-headline">Welcome Headline</Label>
                  <Input 
                    id="welcome-headline" 
                    defaultValue="Welcome to your AgentFlow Hub"
                    className="font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-message">Welcome Message</Label>
                  <Textarea 
                    id="welcome-message" 
                    defaultValue="Here's everything you need for our proposal. Take your time exploring the materials, and reach out if you have any questions."
                    rows={3}
                  />
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-[hsl(var(--dark-grey))] font-semibold">Featured Content</Label>
                  <RadioGroup value={heroContent} onValueChange={setHeroContent}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="video" id="hero-video" />
                        <Label htmlFor="hero-video" className="font-normal cursor-pointer">
                          Video
                        </Label>
                      </div>
                      {heroContent === "video" && (
                        <div className="ml-6 space-y-2">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select video" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="intro">Introduction Video</SelectItem>
                              <SelectItem value="demo">Platform Demo</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="bg-muted rounded-lg p-4 flex items-center justify-center h-32">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="proposal" id="hero-proposal" />
                        <Label htmlFor="hero-proposal" className="font-normal cursor-pointer">
                          Proposal document
                        </Label>
                      </div>
                      {heroContent === "proposal" && (
                        <div className="ml-6 space-y-2">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select proposal document" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="main">AgentFlow Proposal - Client Example123.pptx</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="bg-muted rounded-lg p-4 flex items-center justify-center h-32">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="hero-both" />
                        <Label htmlFor="hero-both" className="font-normal cursor-pointer">
                          Both
                        </Label>
                      </div>
                      {heroContent === "both" && (
                        <div className="ml-6 space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Video</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select video" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="intro">Introduction Video</SelectItem>
                                <SelectItem value="demo">Platform Demo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Proposal Document</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select proposal document" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="main">AgentFlow Proposal - Client Example123.pptx</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="hero-none" />
                        <Label htmlFor="hero-none" className="font-normal cursor-pointer">
                          None
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Portal Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[hsl(var(--dark-grey))]">What's Included</CardTitle>
                <CardDescription>Toggle which sections clients can see</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <div key={section.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-[hsl(var(--medium-grey))]" />
                          <div>
                            <div className="font-medium text-[hsl(var(--dark-grey))]">{section.name}</div>
                            <div className="text-sm text-[hsl(var(--medium-grey))]">{section.content}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="link" size="sm" className="text-[hsl(var(--gradient-blue))]">
                            Manage
                          </Button>
                          <Switch 
                            checked={section.enabled} 
                            onCheckedChange={() => toggleSection(section.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-[hsl(var(--medium-grey))] mt-4">
                  Clients only see sections that are toggled on and have content
                </p>
              </CardContent>
            </Card>

            {/* Section 3: Client Access */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[hsl(var(--dark-grey))]">Client Access</CardTitle>
                <CardDescription>Manage who can view this portal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {invitedClients.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-1">
                        <div className="font-medium text-[hsl(var(--dark-grey))]">{client.name}</div>
                        <div className="text-sm text-[hsl(var(--medium-grey))]">{client.email}</div>
                        <div className="text-xs text-[hsl(var(--medium-grey))]">
                          Invited {client.invitedDate} • {client.lastVisit}
                        </div>
                      </div>
                      <Badge className={client.status === "active" ? "bg-[hsl(var(--sage-green))]" : "bg-amber-500"}>
                        {client.status === "active" ? "Active" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 gap-2">
                  <Send className="h-4 w-4" />
                  Invite Client
                </Button>

                <div className="pt-4 border-t space-y-3">
                  <Label className="text-[hsl(var(--dark-grey))] font-semibold">Share Link</Label>
                  <div className="flex gap-2">
                    <Input 
                      value="https://hub.agentflow.com/neverlandcreative" 
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-[hsl(var(--medium-grey))]">
                    Clients need to be invited before they can access
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Preview */}
            <Card>
              <CardContent className="pt-6">
                <Button className="w-full bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 gap-2 h-12">
                  <Monitor className="h-5 w-5" />
                  Preview Client Portal
                </Button>
                <p className="text-center text-sm text-[hsl(var(--medium-grey))] mt-2">
                  See exactly what Sarah will see when she logs in
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Publishing Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[hsl(var(--dark-grey))]">Publishing Checklist</CardTitle>
                <CardDescription>
                  {completedItems} of {checklistItems.length} complete
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      {item.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-[hsl(var(--sage-green))] shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-[hsl(var(--medium-grey))] shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${item.completed ? 'text-[hsl(var(--dark-grey))]' : 'text-[hsl(var(--medium-grey))]'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats (only if live) */}
            {status === "live" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[hsl(var(--dark-grey))]">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[hsl(var(--medium-grey))]">Portal views</span>
                      <span className="font-semibold text-[hsl(var(--dark-grey))]">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[hsl(var(--medium-grey))]">Last visit</span>
                      <span className="font-semibold text-[hsl(var(--dark-grey))]">2 hours ago</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="text-sm text-[hsl(var(--medium-grey))] mb-1">Most viewed</div>
                      <div className="font-semibold text-[hsl(var(--dark-grey))]">Proposal (8 views)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
