import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Calendar, 
  Video, 
  Users, 
  Clock, 
  ChevronDown, 
  Play, 
  Download, 
  FileText, 
  Sparkles,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Bell,
  Edit,
  Plus,
  GripVertical
} from "lucide-react";

export function MeetingsSection() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'hsl(var(--royal-blue))' }}>
                Meetings
              </h1>
            <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>
              <span>Showing meetings with @example123.com</span>
              <span className="text-xs">•</span>
              <span className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                Synced from Outlook
              </span>
            </div>
            </div>
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <Button style={{ backgroundColor: 'hsl(var(--soft-coral))' }} className="text-white hover:opacity-90">
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule Meeting</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Meeting Title</Label>
                    <Input placeholder="e.g., Proposal Review Call" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input type="date" />
                    </div>
                    <div>
                      <Label>Time (GMT)</Label>
                      <Input type="time" defaultValue="14:00" />
                    </div>
                  </div>

                  <div>
                    <Label>Duration</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Attendees</Label>
                    <Input placeholder="Sarah Mitchell, James Chen" defaultValue="Sarah Mitchell, James Chen" />
                    <Button variant="outline" size="sm" className="mt-2">
                      Add AgentFlow team
                    </Button>
                  </div>

                  <div>
                    <Label>Location</Label>
                    <Select defaultValue="teams">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="in-person">In Person</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Agenda (optional)</Label>
                    <Textarea 
                      placeholder="Add agenda items..."
                      rows={4}
                    />
                    <p className="text-xs mt-1" style={{ color: 'hsl(var(--medium-grey))' }}>
                      This will be included in the calendar invite
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Video className="h-4 w-4" style={{ color: 'hsl(var(--medium-grey))' }} />
                    <span className="text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>
                      Invite will be sent via Outlook
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setScheduleOpen(false)}>Cancel</Button>
                    <Button style={{ backgroundColor: 'hsl(var(--gradient-blue))' }} className="text-white">
                      Send Invite
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming">
                  Upcoming (2)
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past Meetings (3)
                </TabsTrigger>
              </TabsList>

              {/* Upcoming Tab */}
              <TabsContent value="upcoming" className="space-y-4">
                {/* Next Meeting - Highlighted */}
                <Card className="border-l-4" style={{ borderLeftColor: 'hsl(var(--soft-coral))' }}>
                  <CardHeader>
                    <CardTitle className="text-xl" style={{ color: 'hsl(var(--dark-grey))' }}>
                      Proposal Review Call
                    </CardTitle>
                    <div className="space-y-2 text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Tomorrow, Nov 27 at 2:00 PM GMT</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>45 minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>Microsoft Teams</span>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <Users className="h-4 w-4" />
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">YO</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">ST</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">SM</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">JC</AvatarFallback>
                          </Avatar>
                          <span className="text-sm ml-1">You, Stephen, Sarah Mitchell, James Chen</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" style={{ backgroundColor: 'hsl(var(--gradient-blue))' }}>
                      Join Meeting
                    </Button>

                    {/* Agenda Section */}
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 px-2 rounded">
                        <span className="font-medium">Agenda</span>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 px-2">
                        <ul className="space-y-1 text-sm" style={{ color: 'hsl(var(--dark-grey))' }}>
                          <li>• Introductions (5 min)</li>
                          <li>• Proposal walkthrough (20 min)</li>
                          <li>• Questions and discussion (15 min)</li>
                          <li>• Next steps (5 min)</li>
                        </ul>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="px-0 mt-2"
                          onClick={() => setAgendaOpen(true)}
                        >
                          Edit Agenda
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Meeting Details */}
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 px-2 rounded">
                        <span className="font-medium">Meeting Details</span>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 px-2 space-y-2 text-sm">
                        <div>
                          <span style={{ color: 'hsl(var(--medium-grey))' }}>Invite sent:</span> Nov 22
                        </div>
                        <div>
                          <span style={{ color: 'hsl(var(--medium-grey))' }}>Responses:</span> Sarah: Accepted, James: Tentative
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button variant="link" size="sm" className="px-0 h-auto">Edit Meeting</Button>
                          <Button variant="link" size="sm" className="px-0 h-auto text-destructive">Cancel Meeting</Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 border-t text-sm">
                      <Button variant="link" size="sm" className="px-0">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Copy Join Link
                      </Button>
                      <Button variant="link" size="sm" className="px-0">
                        <Bell className="h-3 w-3 mr-1" />
                        Send Reminder
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Second Upcoming Meeting */}
                <Card className="border-l-4" style={{ borderLeftColor: 'hsl(var(--border))' }}>
                  <CardHeader>
                    <CardTitle className="text-xl" style={{ color: 'hsl(var(--dark-grey))' }}>
                      Follow-up Discussion
                    </CardTitle>
                    <div className="space-y-2 text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Dec 3 at 10:00 AM GMT</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>30 minutes</span>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <Users className="h-4 w-4" />
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">YO</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">SM</AvatarFallback>
                          </Avatar>
                          <span className="text-sm ml-1">You, Sarah Mitchell</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" style={{ backgroundColor: 'hsl(var(--gradient-blue))' }}>
                      Join Meeting
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Past Meetings Tab */}
              <TabsContent value="past" className="space-y-4">
                {/* Past Meeting 1 - Most Recent with All Features */}
                <Card className="border-l-4" style={{ borderLeftColor: 'hsl(var(--rich-violet))' }}>
                  <CardHeader>
                    <CardTitle className="text-xl" style={{ color: 'hsl(var(--dark-grey))' }}>
                      Discovery Call
                    </CardTitle>
                    <div className="space-y-2 text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Nov 20, 2025 at 11:00 AM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>52 minutes</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Hamish, Stephen, Sarah Mitchell, James Chen</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Recording Section */}
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 px-2 rounded">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          <span className="font-medium">Recording</span>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 px-2 space-y-3">
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Play className="h-12 w-12 mx-auto mb-2" style={{ color: 'hsl(var(--medium-grey))' }} />
                            <span className="text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>51:47</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex gap-3">
                            <Button variant="link" size="sm" className="px-0 h-auto">
                              <Video className="h-3 w-3 mr-1" />
                              Open in Teams
                            </Button>
                            <Button variant="link" size="sm" className="px-0 h-auto">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <EyeOff className="h-4 w-4" style={{ color: 'hsl(var(--medium-grey))' }} />
                            <span style={{ color: 'hsl(var(--medium-grey))' }}>Not visible to client</span>
                          </div>
                        </div>
                        <p className="text-xs" style={{ color: 'hsl(var(--medium-grey))' }}>
                          Turn on visibility to share this recording in the client's hub
                        </p>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Transcript Section */}
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 px-2 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Transcript</span>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 px-2 space-y-3">
                        <Input placeholder="Search transcript..." />
                        <div className="max-h-48 overflow-y-auto p-3 bg-muted/30 rounded text-sm space-y-2" style={{ color: 'hsl(var(--dark-grey))' }}>
                          <p><strong>Hamish:</strong> Thanks for joining us today, Sarah and James...</p>
                          <p><strong>Sarah:</strong> Thanks for having us. We're excited to learn more about what AgentFlow can do...</p>
                          <p><strong>James:</strong> Yes, particularly interested in the timeline and how this would integrate with our existing systems...</p>
                          <p><strong>Stephen:</strong> Great question, James. Let me walk you through our typical integration process...</p>
                        </div>
                        <Button variant="link" size="sm" className="px-0">
                          <Download className="h-3 w-3 mr-1" />
                          Download Transcript
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* AI Summary Section */}
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 px-2 rounded">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" style={{ color: 'hsl(var(--rich-violet))' }} />
                          <span className="font-medium">AI Summary</span>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 px-2 space-y-4">
                        {/* Auto Summary */}
                        <div>
                          <div className="text-xs mb-2" style={{ color: 'hsl(var(--medium-grey))' }}>
                            Generated by Teams
                          </div>
                          <div 
                            className="p-4 rounded-lg border-l-4" 
                            style={{ 
                              backgroundColor: 'hsl(var(--warm-cream))',
                              borderLeftColor: 'hsl(var(--rich-violet))'
                            }}
                          >
                            <div className="space-y-3 text-sm" style={{ color: 'hsl(var(--dark-grey))' }}>
                              <div>
                                <strong>Key Discussion Points:</strong>
                                <ul className="mt-1 space-y-1 ml-4">
                                  <li>• Client looking to launch new service line by Q2 2025</li>
                                  <li>• Budget range confirmed at £50-75k</li>
                                  <li>• Main concerns: timeline feasibility and team capacity</li>
                                  <li>• Positive response to case study examples</li>
                                </ul>
                              </div>
                              <div>
                                <strong>Decisions Made:</strong>
                                <ul className="mt-1 space-y-1 ml-4">
                                  <li>• AgentFlow to provide detailed proposal by Nov 25</li>
                                  <li>• Client to confirm stakeholder availability for follow-up</li>
                                </ul>
                              </div>
                              <div>
                                <strong>Action Items:</strong>
                                <ul className="mt-1 space-y-1 ml-4">
                                  <li>• Hamish: Send revised scope document</li>
                                  <li>• Stephen: Prepare technical architecture overview</li>
                                  <li>• Sarah: Share brand guidelines</li>
                                  <li>• James: Confirm budget sign-off process</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Custom Summary */}
                        <div>
                          <Label className="text-sm">Ask a specific question about this meeting</Label>
                          <div className="space-y-2 mt-2">
                            <Input placeholder="What did they say about..." />
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" size="sm">What concerns did they raise?</Button>
                              <Button variant="outline" size="sm">What's their budget?</Button>
                              <Button variant="outline" size="sm">What are the next steps?</Button>
                              <Button variant="outline" size="sm">Summarise James's comments</Button>
                            </div>
                            <Button style={{ backgroundColor: 'hsl(var(--gradient-blue))' }} className="text-white">
                              Generate
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Notes Section */}
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 px-2 rounded">
                        <div className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4" />
                          <span className="font-medium">Meeting Notes</span>
                          <span className="text-xs" style={{ color: 'hsl(var(--medium-grey))' }}>
                            Internal only
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 px-2 space-y-2">
                        <Textarea 
                          rows={6}
                          defaultValue="Good energy on the call. James is the decision maker but Sarah is the champion.

James seemed hesitant on timeline — we should build in buffer.

Follow up on the brand guidelines Sarah promised to send.

- Hamish"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-xs" style={{ color: 'hsl(var(--medium-grey))' }}>
                            Last edited: Nov 20 by Hamish
                          </span>
                          <Button size="sm" style={{ backgroundColor: 'hsl(var(--gradient-blue))' }}>
                            Save Notes
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>

                {/* Past Meeting 2 */}
                <Card className="border-l-4" style={{ borderLeftColor: 'hsl(var(--rich-violet))' }}>
                  <CardHeader>
                    <CardTitle className="text-xl" style={{ color: 'hsl(var(--dark-grey))' }}>
                      Initial Introduction
                    </CardTitle>
                    <div className="space-y-2 text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Nov 15, 2025 at 3:00 PM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>28 minutes</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>
                      <FileText className="h-4 w-4 inline mr-2" />
                      Recording available
                    </div>
                  </CardContent>
                </Card>

                {/* Past Meeting 3 */}
                <Card className="border-l-4" style={{ borderLeftColor: 'hsl(var(--rich-violet))' }}>
                  <CardHeader>
                    <CardTitle className="text-xl" style={{ color: 'hsl(var(--dark-grey))' }}>
                      Preliminary Chat
                    </CardTitle>
                    <div className="space-y-2 text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Nov 10, 2025 at 11:30 AM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>15 minutes</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>
                      No recording available
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'hsl(var(--medium-grey))' }}>Upcoming meetings:</span>
                  <span className="font-medium">2</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'hsl(var(--medium-grey))' }}>Past meetings:</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'hsl(var(--medium-grey))' }}>Total meeting time:</span>
                  <span className="font-medium">2h 45m</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'hsl(var(--medium-grey))' }}>Recordings available:</span>
                  <span className="font-medium">2</span>
                </div>
              </CardContent>
            </Card>

            {/* Attendee Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attendee Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">Sarah Mitchell</div>
                      <div className="text-xs" style={{ color: 'hsl(var(--medium-grey))' }}>3 meetings</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>JC</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">James Chen</div>
                      <div className="text-xs" style={{ color: 'hsl(var(--medium-grey))' }}>2 meetings</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Agenda Modal */}
      <Dialog open={agendaOpen} onOpenChange={setAgendaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Meeting Agenda</DialogTitle>
            <p className="text-sm" style={{ color: 'hsl(var(--medium-grey))' }}>
              Proposal Review Call — Nov 27
            </p>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              {[
                { title: "Introductions", time: "5 min" },
                { title: "Proposal walkthrough", time: "20 min" },
                { title: "Questions and discussion", time: "15 min" },
                { title: "Next steps", time: "5 min" }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded">
                  <GripVertical className="h-4 w-4" style={{ color: 'hsl(var(--medium-grey))' }} />
                  <Input defaultValue={item.title} className="flex-1" />
                  <Input defaultValue={item.time} className="w-24" />
                </div>
              ))}
            </div>
            
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>

            <div className="space-y-2 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked />
                Send agenda to attendees
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked />
                Visible in client hub
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setAgendaOpen(false)}>Cancel</Button>
              <Button style={{ backgroundColor: 'hsl(var(--gradient-blue))' }} className="text-white">
                Save Agenda
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
