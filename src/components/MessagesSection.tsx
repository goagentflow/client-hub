import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Mail, Search, Paperclip, Filter, Archive, Eye, EyeOff, ChevronLeft } from "lucide-react";

interface EmailThread {
  id: number;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  hasAttachment?: boolean;
  messages: Message[];
}

interface Message {
  id: number;
  sender: string;
  senderEmail: string;
  recipient: string;
  timestamp: string;
  body: string;
  isYou: boolean;
  attachment?: {
    name: string;
    size: string;
  };
}

const threads: EmailThread[] = [
  {
    id: 1,
    sender: "Sarah Mitchell",
    subject: "Re: Questions about timeline",
    preview: "Thanks for clarifying. One more thing...",
    time: "2h ago",
    unread: true,
    messages: [
      {
        id: 1,
        sender: "You",
        senderEmail: "hamish@agentflow.com",
        recipient: "sarah@neverlandcreative.com",
        timestamp: "Nov 22, 10:15 AM",
        body: "Hi Sarah, thanks for your questions about the timeline. I wanted to clarify a few points from our last discussion. We're looking at a 6-8 week implementation period once we receive approval. Let me know if you need more details on any specific phase.",
        isYou: true,
      },
      {
        id: 2,
        sender: "Sarah Mitchell",
        senderEmail: "sarah@neverlandcreative.com",
        recipient: "hamish@agentflow.com",
        timestamp: "Nov 22, 2:30 PM",
        body: "Thanks for the quick response Hamish. That timeline works for us. I just want to make sure we understand the onboarding process. Can you walk me through what we need to prepare on our end?",
        isYou: false,
      },
      {
        id: 3,
        sender: "You",
        senderEmail: "hamish@agentflow.com",
        recipient: "sarah@neverlandcreative.com",
        timestamp: "Nov 22, 3:45 PM",
        body: "Absolutely! I'll prepare a detailed onboarding checklist for you. The main things you'll need are access to your current systems, a list of key stakeholders, and about 2-3 hours of your team's time in the first week for kickoff sessions.",
        isYou: true,
      },
      {
        id: 4,
        sender: "Sarah Mitchell",
        senderEmail: "sarah@neverlandcreative.com",
        recipient: "hamish@agentflow.com",
        timestamp: "2 hours ago",
        body: "Perfect! That all sounds manageable. One more thing - can you send over the timeline document with the milestones broken down? It would help me present this to our leadership team.",
        isYou: false,
        attachment: {
          name: "Timeline_Questions.pdf",
          size: "234 KB",
        },
      },
    ],
  },
  {
    id: 2,
    sender: "Sarah Mitchell",
    subject: "Re: Thanks for the proposal!",
    preview: "This looks great, I've shared it with...",
    time: "Yesterday",
    unread: true,
    messages: [
      {
        id: 1,
        sender: "Sarah Mitchell",
        senderEmail: "sarah@neverlandcreative.com",
        recipient: "hamish@agentflow.com",
        timestamp: "Yesterday, 4:20 PM",
        body: "Hi Hamish, I just finished reviewing the proposal and it looks great! I've shared it with James and the rest of our team. We should have feedback by end of week.",
        isYou: false,
      },
    ],
  },
  {
    id: 3,
    sender: "You to Sarah, James",
    subject: "Following up on our call",
    preview: "Hi both, Great speaking earlier...",
    time: "Nov 22",
    unread: false,
    messages: [
      {
        id: 1,
        sender: "You",
        senderEmail: "hamish@agentflow.com",
        recipient: "sarah@neverlandcreative.com, james@neverlandcreative.com",
        timestamp: "Nov 22, 9:30 AM",
        body: "Hi both, Great speaking earlier today. As discussed, I'm sending over the revised proposal with the timeline adjustments we talked about. Looking forward to your feedback.",
        isYou: true,
      },
    ],
  },
  {
    id: 4,
    sender: "James Chen",
    subject: "Quick question on pricing",
    preview: "Hi Hamish, Sarah forwarded the...",
    time: "Nov 21",
    unread: false,
    hasAttachment: true,
    messages: [
      {
        id: 1,
        sender: "James Chen",
        senderEmail: "james@neverlandcreative.com",
        recipient: "hamish@agentflow.com",
        timestamp: "Nov 21, 11:45 AM",
        body: "Hi Hamish, Sarah forwarded the proposal to me. It looks comprehensive. I have a quick question about the pricing structure for the advanced analytics module. Can we discuss this on our next call?",
        isYou: false,
        attachment: {
          name: "Pricing_Notes.xlsx",
          size: "89 KB",
        },
      },
    ],
  },
  {
    id: 5,
    sender: "You to Sarah",
    subject: "Welcome to your AgentFlow Hub",
    preview: "Hi Sarah, Thanks for the opportunity...",
    time: "Nov 18",
    unread: false,
    messages: [
      {
        id: 1,
        sender: "You",
        senderEmail: "hamish@agentflow.com",
        recipient: "sarah@neverlandcreative.com",
        timestamp: "Nov 18, 2:00 PM",
        body: "Hi Sarah, Thanks for the opportunity to work with Neverland Creative. I've set up your AgentFlow Hub where you can access our proposal, case studies, and all relevant materials. Feel free to explore and let me know if you have any questions!",
        isYou: true,
      },
    ],
  },
];

export function MessagesSection() {
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(threads[0]);
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [showNotesEdit, setShowNotesEdit] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">Messages</h1>
          <p className="text-sm text-[hsl(var(--medium-grey))] mt-1 flex items-center gap-2">
            Showing emails with @neverlandcreative.com
            <span className="text-xs">• Synced from Outlook</span>
          </p>
        </div>
        
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white">
              Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">To</label>
                <Input placeholder="sarah@neverlandcreative.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Subject</label>
                <Input placeholder="Enter subject" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message</label>
                <Textarea 
                  placeholder="Write your message..." 
                  className="min-h-[200px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach Files
                </Button>
              </div>
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-[hsl(var(--medium-grey))]">
                  Message will be sent via Outlook
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
                  <Button className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90">
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Two-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Thread List */}
        <div className={`w-full md:w-1/3 border-r border-border/50 flex flex-col ${showMobileThread ? 'hidden md:flex' : 'flex'}`}>
          {/* Search and Filters */}
          <div className="p-4 space-y-3 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--medium-grey))]" />
              <Input 
                placeholder="Search messages..." 
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 text-xs">
              <Button variant="ghost" size="sm" className="h-7">
                <Filter className="h-3 w-3 mr-1" />
                All Messages
              </Button>
              <Button variant="ghost" size="sm" className="h-7">Unread</Button>
              <Button variant="ghost" size="sm" className="h-7">Sent</Button>
            </div>
          </div>

          {/* Thread List */}
          <ScrollArea className="flex-1">
            <div>
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => {
                    setSelectedThread(thread);
                    setShowMobileThread(true);
                  }}
                  className={`p-4 border-b border-border/30 cursor-pointer transition-colors hover:bg-muted/30 ${
                    selectedThread?.id === thread.id 
                      ? 'bg-[hsl(var(--gradient-blue))]/10 border-l-4 border-l-[hsl(var(--gradient-blue))]' 
                      : thread.unread 
                      ? 'bg-blue-50/50' 
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {thread.unread && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <p className={`text-sm truncate ${thread.unread ? 'font-semibold' : 'font-medium'}`}>
                          {thread.sender}
                        </p>
                      </div>
                      <p className={`text-sm mt-1 truncate ${thread.unread ? 'font-medium' : ''}`}>
                        {thread.subject}
                      </p>
                      <p className="text-xs text-[hsl(var(--medium-grey))] mt-1 truncate">
                        {thread.preview}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-[hsl(var(--medium-grey))]">{thread.time}</span>
                      {thread.hasAttachment && (
                        <Paperclip className="h-3 w-3 text-[hsl(var(--medium-grey))]" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Quick Stats Sidebar */}
          <div className="p-4 border-t border-border/50 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--medium-grey))]">Total threads:</span>
                    <span className="font-medium">6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--medium-grey))]">Unread:</span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--medium-grey))]">Last received:</span>
                    <span className="font-medium">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">Participants</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Sarah Mitchell</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">sarah@neverlandcreative.com</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))] mt-1">Last email: 2h ago</p>
                  </div>
                  <div>
                    <p className="font-medium">James Chen</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))]">james@neverlandcreative.com</p>
                    <p className="text-xs text-[hsl(var(--medium-grey))] mt-1">Last email: Nov 21</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel: Thread View */}
        <div className={`flex-1 flex flex-col ${!showMobileThread ? 'hidden md:flex' : 'flex'}`}>
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden mb-2"
                      onClick={() => setShowMobileThread(false)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <h2 className="text-xl font-semibold text-[hsl(var(--dark-grey))]">
                      {selectedThread.subject}
                    </h2>
                    <p className="text-sm text-[hsl(var(--medium-grey))] mt-1">
                      {selectedThread.sender} • {selectedThread.messages.length} messages in thread
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" size="sm">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button variant="ghost" size="sm">
                      Mark unread
                    </Button>
                  </div>
                </div>

                {/* Team Notes */}
                <Card className="mt-4 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4 text-[hsl(var(--medium-grey))]" />
                        <h3 className="font-semibold text-sm">Team Notes</h3>
                        <span className="text-xs text-[hsl(var(--medium-grey))]">(Not visible to client)</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowNotesEdit(!showNotesEdit)}
                      >
                        {showNotesEdit ? 'Save' : 'Edit'}
                      </Button>
                    </div>
                    {showNotesEdit ? (
                      <Textarea 
                        placeholder="Sarah seems keen but James is the decision maker. Make sure to address his pricing question directly.&#10;&#10;Follow up by Friday if no reply.&#10;- Hamish"
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm text-[hsl(var(--medium-grey))] whitespace-pre-line">
                        Sarah seems keen but James is the decision maker. Make sure to address his pricing question directly.
                        {'\n\n'}
                        Follow up by Friday if no reply.
                        {'\n'}- Hamish
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6 max-w-4xl">
                  {selectedThread.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isYou ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${message.isYou ? 'text-right' : 'text-left'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {message.isYou && (
                            <>
                              <span className="text-xs text-[hsl(var(--medium-grey))]">{message.timestamp}</span>
                              <span className="text-sm font-semibold">{message.sender}</span>
                              <div className="w-8 h-8 rounded-full bg-[hsl(var(--gradient-blue))] flex items-center justify-center text-white text-sm font-medium">
                                H
                              </div>
                            </>
                          )}
                          {!message.isYou && (
                            <>
                              <div className="w-8 h-8 rounded-full bg-[hsl(var(--gradient-purple))] flex items-center justify-center text-white text-sm font-medium">
                                {message.sender[0]}
                              </div>
                              <span className="text-sm font-semibold">{message.sender}</span>
                              <span className="text-xs text-[hsl(var(--medium-grey))]">{message.timestamp}</span>
                            </>
                          )}
                        </div>
                        <Card className={message.isYou ? 'bg-[hsl(var(--gradient-blue))]/10' : ''}>
                          <CardContent className="p-4">
                            <p className="text-sm text-[hsl(var(--dark-grey))] whitespace-pre-line">
                              {message.body}
                            </p>
                            {message.attachment && (
                              <div className="mt-3 p-3 bg-background rounded border border-border/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Paperclip className="h-4 w-4 text-[hsl(var(--medium-grey))]" />
                                  <div>
                                    <p className="text-sm font-medium">{message.attachment.name}</p>
                                    <p className="text-xs text-[hsl(var(--medium-grey))]">{message.attachment.size}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">Download</Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Composer */}
              <div className="p-6 border-t border-border/50">
                <div className="space-y-3">
                  <Textarea 
                    placeholder="Write your reply..." 
                    className="min-h-[100px]"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Attach
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-[hsl(var(--medium-grey))]">
                        Sent via Outlook to {selectedThread.messages[selectedThread.messages.length - 1].senderEmail}
                      </p>
                      <Button className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90">
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-16 w-16 text-[hsl(var(--medium-grey))] mx-auto mb-4" />
                <p className="text-[hsl(var(--medium-grey))]">Select a conversation to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
