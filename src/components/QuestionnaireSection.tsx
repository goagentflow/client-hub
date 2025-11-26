import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardList,
  Plus,
  MoreVertical,
  ExternalLink,
  Copy,
  Share2,
  BarChart3,
  Eye,
  Download,
  Send,
  QrCode,
} from "lucide-react";

export function QuestionnaireSection() {
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const questionnaires = [
    {
      id: "1",
      status: "active",
      title: "AI Readiness Assessment",
      description: "Pre-pitch survey to understand their current AI maturity and priorities",
      created: "Nov 18, 2025",
      responses: 12,
      sent: 15,
      completionRate: 80,
      lastResponse: "2 days ago",
    },
    {
      id: "2",
      status: "active",
      title: "Discovery: Daily Tasks Survey",
      description: "Understanding what team members do day-to-day to identify automation opportunities",
      created: "Nov 15, 2025",
      responses: 8,
      sent: 25,
      completionRate: 32,
      lastResponse: "1 day ago",
    },
    {
      id: "3",
      status: "draft",
      title: "Sprint Feedback Survey",
      description: "Post-Copilot sprint feedback form",
      created: "Nov 22, 2025",
      responses: 0,
      sent: 0,
      completionRate: 0,
      lastResponse: null,
    },
    {
      id: "4",
      status: "closed",
      title: "Initial Discovery Questions",
      description: "Early stage discovery",
      created: "Nov 10, 2025",
      responses: 6,
      sent: 10,
      completionRate: 60,
      lastResponse: "Closed Nov 15",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-sage-green text-white">Active</Badge>;
      case "draft":
        return <Badge className="bg-amber-500 text-white">Draft</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return null;
    }
  };

  if (selectedQuestionnaire) {
    return (
      <QuestionnaireDetail
        questionnaire={questionnaires.find((q) => q.id === selectedQuestionnaire)!}
        onBack={() => setSelectedQuestionnaire(null)}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-bold-royal-blue">Questionnaires</h1>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-soft-coral hover:bg-soft-coral/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Questionnaire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-bold-royal-blue">Add Questionnaire</DialogTitle>
              </DialogHeader>
              <AddQuestionnaireForm onClose={() => setAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-medium-grey text-sm">
          Create forms in Microsoft Forms, then add them here to track and share
        </p>
      </div>

      {/* Questionnaire Cards */}
      {questionnaires.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <ClipboardList className="w-16 h-16 text-medium-grey mb-4" />
          <h3 className="text-xl font-semibold text-dark-grey mb-2">No questionnaires yet</h3>
          <p className="text-medium-grey mb-6">Add a questionnaire to gather insights from your client</p>
          <Button className="bg-soft-coral hover:bg-soft-coral/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Questionnaire
          </Button>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {questionnaires.map((q) => (
            <Card
              key={q.id}
              className={`p-6 border-l-4 hover:shadow-md transition-shadow cursor-pointer ${
                q.status === "active"
                  ? "border-l-sage-green"
                  : q.status === "draft"
                  ? "border-l-amber-500"
                  : "border-l-medium-grey"
              } ${q.status === "closed" ? "opacity-70" : ""}`}
              onClick={() => setSelectedQuestionnaire(q.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(q.status)}
                    <h3 className="text-xl font-bold text-dark-grey">{q.title}</h3>
                  </div>
                  <p className="text-medium-grey">{q.description}</p>
                  <p className="text-sm text-medium-grey mt-2">Created: {q.created}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem>
                      {q.status === "closed" ? "Reopen" : "Close Questionnaire"}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {q.status !== "draft" && q.responses > 0 ? (
                <>
                  <div className="flex items-center gap-6 text-sm mb-3">
                    <span className="text-medium-grey">
                      <strong className="text-dark-grey">{q.responses} responses</strong>
                    </span>
                    <span className="text-medium-grey">Sent to: {q.sent} people</span>
                    <span className="text-medium-grey">
                      Completed: {q.responses} ({q.completionRate}%)
                    </span>
                    <span className="text-medium-grey">Last response: {q.lastResponse}</span>
                  </div>
                  <Progress value={q.completionRate} className="h-2 mb-4" />
                </>
              ) : q.status === "draft" ? (
                <p className="text-medium-grey text-sm mb-4">Not yet shared</p>
              ) : null}

              <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                <Button className="bg-gradient-blue hover:bg-gradient-blue/90 text-white">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Responses
                </Button>
                <Button variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-dark-grey mb-4">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-medium-grey">Total questionnaires:</span>
              <span className="font-semibold text-dark-grey">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medium-grey">Active:</span>
              <span className="font-semibold text-dark-grey">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medium-grey">Total responses:</span>
              <span className="font-semibold text-dark-grey">20</span>
            </div>
            <div className="flex justify-between">
              <span className="text-medium-grey">Awaiting responses:</span>
              <span className="font-semibold text-dark-grey">7</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-dark-grey mb-4">Recent Activity</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-dark-grey">New response to AI Readiness Assessment</p>
              <p className="text-medium-grey text-xs">2 days ago</p>
            </div>
            <div>
              <p className="text-dark-grey">Discovery survey sent to 25 people</p>
              <p className="text-medium-grey text-xs">Nov 20</p>
            </div>
            <div>
              <p className="text-dark-grey">Sprint Feedback created (draft)</p>
              <p className="text-medium-grey text-xs">Nov 22</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AddQuestionnaireForm({ onClose }: { onClose: () => void }) {
  const [linkType, setLinkType] = useState<"existing" | "new">("existing");

  return (
    <div className="space-y-6">
      <Tabs value={linkType} onValueChange={(v) => setLinkType(v as "existing" | "new")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">Link Existing Form</TabsTrigger>
          <TabsTrigger value="new">Create New Form</TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4 mt-6">
          <p className="text-sm text-medium-grey">
            Already created a form in Microsoft Forms? Paste the link here.
          </p>
          <div className="flex gap-2">
            <Input placeholder="Paste Microsoft Forms link..." className="flex-1" />
            <Button variant="outline">Fetch Details</Button>
          </div>
        </TabsContent>

        <TabsContent value="new" className="space-y-4 mt-6">
          <p className="text-sm text-medium-grey">Create a new form in Microsoft Forms</p>
          <Button variant="outline" className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Microsoft Forms
          </Button>
          <p className="text-sm text-medium-grey">Once created, paste the link above</p>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-dark-grey block mb-2">Title</label>
          <Input placeholder="AI Readiness Assessment" />
        </div>

        <div>
          <label className="text-sm font-medium text-dark-grey block mb-2">Description</label>
          <Textarea placeholder="What's this questionnaire for? (internal note)" />
        </div>

        <div>
          <label className="text-sm font-medium text-dark-grey block mb-2">Status</label>
          <Select defaultValue="draft">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium text-dark-grey">Show in client hub</p>
            <p className="text-sm text-medium-grey">Clients can complete this form directly in their hub</p>
          </div>
          <Switch />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button className="bg-gradient-blue hover:bg-gradient-blue/90 text-white" onClick={onClose}>
          Add Questionnaire
        </Button>
      </div>
    </div>
  );
}

function QuestionnaireDetail({
  questionnaire,
  onBack,
}: {
  questionnaire: any;
  onBack: () => void;
}) {
  const chartData = [
    { label: "Not started", count: 1, percentage: 8 },
    { label: "Early stage", count: 8, percentage: 67 },
    { label: "Developing", count: 2, percentage: 17 },
    { label: "Advanced", count: 1, percentage: 8 },
  ];

  const priorityData = [
    { label: "Automate admin tasks", count: 6, percentage: 50 },
    { label: "Improve customer service", count: 3, percentage: 25 },
    { label: "Data analysis", count: 2, percentage: 17 },
    { label: "Other", count: 1, percentage: 8 },
  ];

  const concernsData = [
    { label: "Data security", count: 9, percentage: 75 },
    { label: "Staff resistance", count: 5, percentage: 42 },
    { label: "Cost", count: 4, percentage: 33 },
    { label: "Lack of expertise", count: 7, percentage: 58 },
  ];

  const responses = [
    { name: "sarah@neverland...", submitted: "Nov 20, 2:30pm", status: "Complete" },
    { name: "james@neverland...", submitted: "Nov 20, 4:15pm", status: "Complete" },
    { name: "Anonymous", submitted: "Nov 21, 9:00am", status: "Complete" },
    { name: "emily@neverland...", submitted: "Nov 22, 11:30am", status: "Partial" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Back to Questionnaires
      </Button>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-bold-royal-blue">{questionnaire.title}</h1>
          {getStatusBadge(questionnaire.status)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Close</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-dark-grey mb-4">Details</h3>
            <div className="space-y-2 text-sm">
              <p className="text-medium-grey">{questionnaire.description}</p>
              <p className="text-medium-grey">Created: {questionnaire.created}</p>
              <div className="flex items-center gap-2">
                <span className="text-medium-grey">Form link:</span>
                <a href="#" className="text-bold-royal-blue hover:underline flex items-center gap-1">
                  https://forms.microsoft.com/...
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-medium-grey">Last response: {questionnaire.lastResponse}</p>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-medium-grey mb-1">Sent</p>
              <p className="text-2xl font-bold text-bold-royal-blue">{questionnaire.sent}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-medium-grey mb-1">Completed</p>
              <p className="text-2xl font-bold text-bold-royal-blue">{questionnaire.responses}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-medium-grey mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-bold-royal-blue">{questionnaire.completionRate}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-medium-grey mb-1">Avg. Time</p>
              <p className="text-2xl font-bold text-bold-royal-blue">4 min</p>
            </Card>
          </div>

          <Card className="p-6 border-l-4 border-l-rich-violet">
            <h3 className="font-semibold text-dark-grey mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Key Insights from Responses
            </h3>
            <ul className="space-y-2 text-sm text-dark-grey list-disc list-inside">
              <li>Most respondents rate their AI maturity as 'Early Stage' (67%)</li>
              <li>Top priority: automating repetitive admin tasks</li>
              <li>Main concern: data security and privacy</li>
              <li>8 of 12 interested in Copilot training</li>
            </ul>
            <Button variant="outline" className="mt-4">
              Generate Summary
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-dark-grey mb-4">Client Hub Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-grey">Visible in client hub: Yes</p>
                <p className="text-sm text-medium-grey">
                  Embedded form available for: Sarah Mitchell, James Chen
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-dark-grey">{questionnaire.responses} responses total</h3>
              <div className="flex gap-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View in Forms
                </Button>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="font-medium text-dark-grey mb-4">
                  Question 1: How would you rate your organisation's AI maturity?
                </h4>
                <div className="space-y-2">
                  {chartData.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-sm text-medium-grey w-32">{item.label}</span>
                      <div className="flex-1 bg-muted rounded-full h-8 relative">
                        <div
                          className="bg-gradient-blue h-full rounded-full flex items-center justify-end px-3"
                          style={{ width: `${item.percentage}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-dark-grey mb-4">
                  Question 2: What's your top priority for AI implementation?
                </h4>
                <div className="space-y-2">
                  {priorityData.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-sm text-medium-grey w-48">{item.label}</span>
                      <div className="flex-1 bg-muted rounded-full h-8 relative">
                        <div
                          className="bg-gradient-purple h-full rounded-full flex items-center justify-end px-3"
                          style={{ width: `${item.percentage}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-dark-grey mb-4">
                  Question 3: Main concerns about AI adoption? (Multi-select)
                </h4>
                <div className="space-y-2">
                  {concernsData.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-sm text-medium-grey w-48">{item.label}</span>
                      <div className="flex-1 bg-muted rounded-full h-8 relative">
                        <div
                          className="bg-sage-green h-full rounded-full flex items-center justify-end px-3"
                          style={{ width: `${item.percentage}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-dark-grey mb-4">Individual Responses</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-medium-grey">
                      Name/Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-medium-grey">
                      Submitted
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-medium-grey">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-medium-grey">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-dark-grey">{response.name}</td>
                      <td className="py-3 px-4 text-sm text-medium-grey">{response.submitted}</td>
                      <td className="py-3 px-4">
                        <Badge variant={response.status === "Complete" ? "default" : "secondary"}>
                          {response.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-dark-grey mb-4">Copy Link</h3>
            <div className="flex gap-2">
              <Input
                value="https://forms.microsoft.com/r/abc123def456"
                readOnly
                className="flex-1"
              />
              <Button variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
            <p className="text-sm text-medium-grey mt-2">Anyone with this link can complete the form</p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-dark-grey mb-4">Send via Email</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-dark-grey block mb-2">
                  Send to client contacts
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="sarah" />
                    <label htmlFor="sarah" className="text-sm text-dark-grey">
                      Sarah Mitchell
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="james" />
                    <label htmlFor="james" className="text-sm text-dark-grey">
                      James Chen
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-dark-grey block mb-2">
                  Add email addresses
                </label>
                <Input placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-dark-grey block mb-2">
                  Personal message (optional)
                </label>
                <Textarea placeholder="Add a personal message..." rows={4} />
              </div>
              <Button className="bg-gradient-blue hover:bg-gradient-blue/90 text-white">
                <Send className="w-4 h-4 mr-2" />
                Send Invite
              </Button>
              <p className="text-sm text-medium-grey">Invitation sent via Outlook</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-dark-grey mb-4">Client Hub</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-dark-grey">Show in client hub</p>
                <p className="text-sm text-medium-grey">
                  Clients can see and complete this questionnaire in their hub
                </p>
                <p className="text-sm text-medium-grey mt-1">
                  Currently visible to: Sarah Mitchell, James Chen
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-dark-grey mb-4">QR Code</h3>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-muted rounded flex items-center justify-center">
                <QrCode className="w-16 h-16 text-medium-grey" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-medium-grey mb-3">
                  Useful for in-person workshops and events
                </p>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-dark-grey mb-4">Distribution Tracking</h3>
            <div className="space-y-2 text-sm">
              <p className="text-dark-grey">Sent to 15 people via email</p>
              <p className="text-dark-grey">Link copied 3 times</p>
              <p className="text-dark-grey">12 completions</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return <Badge className="bg-sage-green text-white">Active</Badge>;
      case "draft":
        return <Badge className="bg-amber-500 text-white">Draft</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return null;
    }
  }
}
