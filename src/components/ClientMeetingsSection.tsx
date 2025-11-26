import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Video, Users, Clock, Download, Share2, ChevronDown, ChevronUp, Plus, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export const ClientMeetingsSection = () => {
  const [requestOpen, setRequestOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareType, setShareType] = useState<"recording" | "summary">("recording");
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [requestTopic, setRequestTopic] = useState("");
  const [requestTimes, setRequestTimes] = useState("");
  const [requestDuration, setRequestDuration] = useState("30");
  const { toast } = useToast();

  const handleShare = () => {
    if (!shareEmail || !shareEmail.endsWith("@neverlandcreative.com")) {
      toast({
        title: "Invalid email",
        description: "Please enter a @neverlandcreative.com email address",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Shared successfully",
      description: `${shareType === "recording" ? "Recording" : "Summary"} shared with ${shareEmail}`,
    });
    setShareOpen(false);
    setShareEmail("");
    setShareMessage("");
  };

  const handleRequestMeeting = () => {
    if (!requestTopic.trim()) {
      toast({
        title: "Topic required",
        description: "Please describe what you'd like to discuss",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Meeting request sent!",
      description: "The AgentFlow team will be in touch to confirm a time. You'll receive a confirmation in Messages.",
    });
    setRequestOpen(false);
    setRequestTopic("");
    setRequestTimes("");
    setRequestDuration("30");
  };

  const copyLink = () => {
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))] mb-2">Meetings</h1>
          <p className="text-[hsl(var(--medium-grey))]">Schedule and join calls with the AgentFlow team</p>
        </div>
        <Button onClick={() => setRequestOpen(true)} className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Request Meeting
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming <span className="ml-2 px-2 py-0.5 rounded-full bg-[hsl(var(--gradient-blue))] text-white text-xs">1</span>
          </TabsTrigger>
          <TabsTrigger value="past">
            Past Meetings <span className="ml-2 px-2 py-0.5 rounded-full bg-[hsl(var(--medium-grey))]/20 text-[hsl(var(--medium-grey))] text-xs">2</span>
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Meetings */}
        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            {/* Next Meeting Card */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-[hsl(var(--soft-coral))] p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[hsl(var(--dark-grey))] mb-2">Proposal Review Call</h3>
                <div className="space-y-2 text-sm text-[hsl(var(--medium-grey))]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Tomorrow, Nov 27 at 2:00 PM GMT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>45 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span>Microsoft Teams</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div className="flex items-center gap-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-[hsl(var(--gradient-blue))] text-white">H</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-[hsl(var(--gradient-purple))] text-white">S</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-[hsl(var(--soft-coral))] text-white">Y</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-[hsl(var(--sage-green))] text-white">J</AvatarFallback>
                      </Avatar>
                      <span className="ml-2 text-sm">Hamish, Stephen, You, James Chen</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full sm:w-auto mb-4 bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90">
                <Video className="mr-2 h-4 w-4" />
                Join Meeting
              </Button>

              {/* Agenda */}
              <Collapsible open={agendaOpen} onOpenChange={setAgendaOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--bold-royal-blue))] hover:underline">
                  {agendaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Agenda
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2">
                  <div className="bg-[hsl(var(--warm-cream))] p-4 rounded-md">
                    <ul className="space-y-2 text-sm text-[hsl(var(--dark-grey))]">
                      <li>• Introductions (5 min)</li>
                      <li>• Proposal walkthrough (20 min)</li>
                      <li>• Questions and discussion (15 min)</li>
                      <li>• Next steps (5 min)</li>
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="mt-4">
                <Button variant="link" className="text-[hsl(var(--bold-royal-blue))] p-0">
                  <Download className="mr-2 h-4 w-4" />
                  Add to Calendar
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Past Meetings */}
        <TabsContent value="past" className="mt-6">
          <div className="space-y-4">
            {/* Past Meeting 1 */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-[hsl(var(--rich-violet))] p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[hsl(var(--dark-grey))] mb-2">Discovery Call</h3>
                <div className="space-y-2 text-sm text-[hsl(var(--medium-grey))]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Nov 20, 2025 at 11:00 AM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>52 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Hamish, Stephen, You, James Chen</span>
                  </div>
                </div>
              </div>

              {/* Recording */}
              <Collapsible open={recordingOpen} onOpenChange={setRecordingOpen} className="mb-3">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--bold-royal-blue))] hover:underline">
                  {recordingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Recording
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="bg-muted rounded-lg aspect-video flex items-center justify-center mb-3">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Watch Recording
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShareType("recording");
                        setShareOpen(true);
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Summary */}
              <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen} className="mb-3">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--bold-royal-blue))] hover:underline">
                  {summaryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Summary
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="bg-[hsl(var(--warm-cream))] p-4 rounded-md mb-3">
                    <div className="text-sm text-[hsl(var(--dark-grey))] space-y-3">
                      <div>
                        <p className="font-semibold mb-2">Key Discussion Points:</p>
                        <ul className="space-y-1">
                          <li>• Project timeline discussed — targeting Q2 launch</li>
                          <li>• Budget range confirmed</li>
                          <li>• Next steps: detailed proposal review</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">Action Items:</p>
                        <ul className="space-y-1">
                          <li>• AgentFlow to send revised scope</li>
                          <li>• Sarah to confirm stakeholder availability</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download Summary
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShareType("summary");
                        setShareOpen(true);
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Transcript */}
              <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--bold-royal-blue))] hover:underline">
                  {transcriptOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Transcript
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="bg-muted p-4 rounded-md mb-3 max-h-64 overflow-y-auto">
                    <div className="text-sm text-[hsl(var(--dark-grey))] space-y-2">
                      <p><strong>Hamish:</strong> Thanks for joining us today, Sarah. I'm excited to learn more about your project.</p>
                      <p><strong>Sarah:</strong> Thanks for having me! I'm looking forward to discussing how AgentFlow can help.</p>
                      <p><strong>Stephen:</strong> Let me start by walking through our approach...</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download Transcript
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Past Meeting 2 - No shared content */}
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-[hsl(var(--rich-violet))] p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[hsl(var(--dark-grey))] mb-2">Initial Consultation</h3>
                <div className="space-y-2 text-sm text-[hsl(var(--medium-grey))]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Nov 15, 2025 at 3:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>30 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Hamish, You</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[hsl(var(--medium-grey))] italic">Recording and notes not available for this meeting</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Share Modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {shareType === "recording" ? "Recording" : "Summary"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-email">Colleague's email</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="colleague@neverlandcreative.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <p className="text-xs text-[hsl(var(--medium-grey))]">Share with colleagues at @neverlandcreative.com</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-message">Personal message (optional)</Label>
              <Textarea
                id="share-message"
                placeholder="Add a note..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyLink} className="flex-1">
                Copy Link
              </Button>
            </div>
            <p className="text-xs text-[hsl(var(--medium-grey))]">Your colleague will need to sign in to view</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90">
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Meeting Modal */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request a Meeting</DialogTitle>
            <p className="text-sm text-[hsl(var(--medium-grey))]">The AgentFlow team will get back to you to confirm</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="request-topic">What would you like to discuss?</Label>
              <Textarea
                id="request-topic"
                placeholder="e.g., Questions about the proposal, next steps discussion..."
                value={requestTopic}
                onChange={(e) => setRequestTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-times">Preferred times (optional)</Label>
              <Textarea
                id="request-times"
                placeholder="e.g., Tuesday afternoon, or any time Thursday"
                value={requestTimes}
                onChange={(e) => setRequestTimes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-duration">Duration</Label>
              <Select value={requestDuration} onValueChange={setRequestDuration}>
                <SelectTrigger id="request-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-attendees">Attendees from your team (optional)</Label>
              <Input
                id="request-attendees"
                type="email"
                placeholder="colleague@neverlandcreative.com"
              />
              <Button variant="link" className="p-0 h-auto text-sm">
                <Plus className="mr-1 h-3 w-3" />
                Add another
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRequestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestMeeting} className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90">
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
