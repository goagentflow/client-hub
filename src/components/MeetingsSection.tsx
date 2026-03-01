import { useState, useEffect } from "react";
import { Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHubId } from "@/contexts/hub-context";
import { useToast } from "@/hooks/use-toast";
import {
  useMeetings,
  useScheduleMeeting,
  useUpdateMeetingNotes,
  useCancelMeeting,
  useTrackEngagement,
} from "@/hooks";
import {
  MeetingCard,
  PastMeetingCard,
  ScheduleMeetingDialog,
  MeetingsSidebar,
} from "./meetings";
import { copyTextToClipboard } from "@/lib/clipboard";

export function MeetingsSection() {
  const hubId = useHubId();
  const { toast } = useToast();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Hooks for data fetching
  const { data: upcomingData, isLoading: loadingUpcoming } = useMeetings(hubId, { status: "scheduled" });
  const { data: pastData, isLoading: loadingPast } = useMeetings(hubId, { status: "completed" });

  // Mutations
  const { mutate: scheduleMeeting, isPending: isScheduling } = useScheduleMeeting(hubId);
  const { mutate: updateNotes, isPending: isSavingNotes } = useUpdateMeetingNotes(hubId);
  const { mutate: cancelMeeting } = useCancelMeeting(hubId);

  // Engagement tracking
  const { trackHubViewed, trackMeetingJoined } = useTrackEngagement(hubId);

  // Track meetings section view on mount
  useEffect(() => {
    trackHubViewed("meetings");
  }, [trackHubViewed]);

  const isLoading = loadingUpcoming || loadingPast;
  const upcomingMeetings = upcomingData?.items || [];
  const pastMeetings = pastData?.items || [];

  const handleSchedule = (data: {
    title: string;
    startTime: string;
    endTime: string;
    attendeeEmails: string[];
    agenda?: string;
  }) => {
    scheduleMeeting(data, {
      onSuccess: () => setScheduleOpen(false),
    });
  };

  const handleSaveNotes = (meetingId: string, notes: string) => {
    updateNotes({ meetingId, notes });
  };

  const handleJoin = (meetingId: string, joinUrl: string) => {
    trackMeetingJoined(meetingId);
    window.open(joinUrl, "_blank");
  };

  const handleCancel = (meetingId: string) => {
    if (confirm("Are you sure you want to cancel this meeting?")) {
      cancelMeeting(meetingId);
    }
  };

  const handleCopyLink = (joinUrl: string | undefined) => {
    if (joinUrl) {
      void copyTextToClipboard(joinUrl).then((copied) => {
        toast({
          title: copied ? "Link copied" : "Could not copy link",
          description: copied
            ? "Meeting join link copied to clipboard"
            : "Clipboard access is blocked in this browser context.",
          variant: copied ? "default" : "destructive",
        });
      });
    }
  };

  const handleSendReminder = (title: string) => {
    toast({
      title: "Reminder sent",
      description: `Reminder sent to all attendees for "${title}"`,
    });
  };

  const handleEditAgenda = (title: string) => {
    toast({
      title: "Edit Agenda",
      description: `Opening agenda editor for "${title}"`,
    });
  };

  const handleEditMeeting = (title: string) => {
    toast({
      title: "Edit Meeting",
      description: `Opening editor for "${title}"`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "hsl(var(--royal-blue))" }}>
                Meetings
              </h1>
              <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: "hsl(var(--medium-grey))" }}>
                <span>Showing meetings with client contacts</span>
                <span className="text-xs">·</span>
                <span className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  Synced from Outlook
                </span>
              </div>
            </div>
            <Button
              style={{ backgroundColor: "hsl(var(--soft-coral))" }}
              className="text-white hover:opacity-90"
              onClick={() => setScheduleOpen(true)}
            >
              Schedule Meeting
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming">Upcoming ({upcomingMeetings.length})</TabsTrigger>
                <TabsTrigger value="past">Past Meetings ({pastMeetings.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingMeetings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No upcoming meetings scheduled
                  </div>
                ) : (
                  upcomingMeetings.map((meeting, index) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      isHighlighted={index === 0}
                      onJoin={() => meeting.joinUrl && handleJoin(meeting.id, meeting.joinUrl)}
                      onEditAgenda={() => handleEditAgenda(meeting.title)}
                      onEdit={() => handleEditMeeting(meeting.title)}
                      onCancel={() => handleCancel(meeting.id)}
                      onCopyLink={() => handleCopyLink(meeting.joinUrl)}
                      onSendReminder={() => handleSendReminder(meeting.title)}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastMeetings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No past meetings
                  </div>
                ) : (
                  pastMeetings.map((meeting) => (
                    <PastMeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onSaveNotes={(notes) => handleSaveNotes(meeting.id, notes)}
                      isSavingNotes={isSavingNotes}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <MeetingsSidebar upcomingMeetings={upcomingMeetings} pastMeetings={pastMeetings} />
        </div>
      </div>

      <ScheduleMeetingDialog
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSchedule={handleSchedule}
        isScheduling={isScheduling}
      />
    </div>
  );
}
