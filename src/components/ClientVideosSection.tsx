import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Share2, Clock, Video, Loader2, Mail, Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHubId } from "@/contexts/hub-context";
import { usePortalVideos, useTrackEngagement, useInviteColleague } from "@/hooks";
import type { Video as VideoType } from "@/types";

const YOUTUBE_EMBED_ORIGIN = "https://www.youtube.com/embed/";

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

export function ClientVideosSection() {
  const hubId = useHubId();
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareVideoId, setShareVideoId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");

  // Data hooks
  const { data: videosData, isLoading } = usePortalVideos(hubId);
  const { mutate: inviteColleague, isPending: isInviting } = useInviteColleague(hubId);

  // Engagement tracking
  const { trackHubViewed, trackVideoWatched } = useTrackEngagement(hubId);

  useEffect(() => {
    trackHubViewed("portal-videos");
  }, [trackHubViewed]);

  const videos = videosData?.items || [];

  const handleVideoSelect = (video: VideoType) => {
    setSelectedVideo(video);
    // Track video open (0 watch time, 0% complete - placeholder player)
    trackVideoWatched(video.id, 0, 0);
  };

  const handleShareClick = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareVideoId(videoId);
    setShareModalOpen(true);
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return;
    const shareVideo = videos.find((v) => v.id === shareVideoId);
    inviteColleague(
      { email: inviteEmail.trim(), accessLevel: "full_access" },
      {
        onSuccess: () => {
          toast({
            title: "Invite sent",
            description: `Invitation to view "${shareVideo?.title}" sent to ${inviteEmail}`,
          });
          setShareModalOpen(false);
          setInviteEmail("");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to send invite. Make sure the email is from your organization.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))] mb-6">Videos</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-[hsl(var(--dark-grey))] mb-2">No Videos Yet</h2>
            <p className="text-[hsl(var(--medium-grey))]">Videos will appear here when the team shares them.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shareVideo = videos.find((v) => v.id === shareVideoId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))] mb-2">Videos</h1>
        <p className="text-[hsl(var(--medium-grey))]">Videos from the AgentFlow team</p>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => {
          const ytId = video.sourceType === "youtube" ? getYouTubeId(video.sourceUrl) : null;
          return (
          <Card
            key={video.id}
            className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
            onClick={() => handleVideoSelect(video)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {ytId && (
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {video.sourceType === "audio" ? (
                      <Headphones className="h-7 w-7 text-[hsl(var(--bold-royal-blue))]" />
                    ) : (
                      <Play className="h-7 w-7 text-[hsl(var(--bold-royal-blue))] ml-1" fill="currentColor" />
                    )}
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(video.duration)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white z-10"
                  onClick={(e) => handleShareClick(video.id, e)}
                >
                  <Share2 className="h-4 w-4 text-[hsl(var(--bold-royal-blue))]" />
                </Button>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[hsl(var(--dark-grey))] mb-2 line-clamp-1">{video.title}</h3>
                <p className="text-sm text-[hsl(var(--medium-grey))] line-clamp-2">{video.description}</p>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[hsl(var(--bold-royal-blue))]">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedVideo?.sourceType === "youtube" && getYouTubeId(selectedVideo.sourceUrl) ? (
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`${YOUTUBE_EMBED_ORIGIN}${getYouTubeId(selectedVideo.sourceUrl)}?autoplay=1`}
                  title={selectedVideo.title}
                  className="absolute inset-0 w-full h-full"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : selectedVideo?.sourceType === "audio" ? (
              <div className="bg-muted rounded-lg p-8 flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-[hsl(var(--gradient-blue))]/10 flex items-center justify-center">
                  <Headphones className="h-12 w-12 text-[hsl(var(--gradient-blue))]" />
                </div>
                <audio controls autoPlay src={selectedVideo.sourceUrl} className="w-full" />
              </div>
            ) : (
              <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-[hsl(var(--gradient-blue))] flex items-center justify-center">
                  <Play className="h-10 w-10 text-white ml-1" fill="currentColor" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 p-3 rounded-b-lg">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white/80">
                      <Play className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-white rounded-full" />
                    </div>
                    <span className="text-white text-sm">0:00 / {formatDuration(selectedVideo?.duration)}</span>
                  </div>
                </div>
              </div>
            )}
            <p className="text-[hsl(var(--dark-grey))]">{selectedVideo?.description}</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-[hsl(var(--gradient-blue))] text-[hsl(var(--gradient-blue))]"
                onClick={(e) => selectedVideo && handleShareClick(selectedVideo.id, e)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share this video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={(open) => { setShareModalOpen(open); if (!open) setInviteEmail(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[hsl(var(--bold-royal-blue))]">Share Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {shareVideo && (
              <div className="flex gap-3 p-3 bg-muted rounded-lg">
                <div className="w-24 aspect-video bg-muted-foreground/20 rounded flex-shrink-0 flex items-center justify-center">
                  <Play className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[hsl(var(--dark-grey))] truncate">{shareVideo.title}</p>
                  <p className="text-xs text-[hsl(var(--medium-grey))]">{formatDuration(shareVideo.duration)}</p>
                </div>
              </div>
            )}
            <p className="text-sm text-[hsl(var(--medium-grey))]">
              Invite a colleague from your organization to view this hub.
            </p>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Colleague's email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@yourcompany.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
                onClick={handleSendInvite}
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting ? "Sending..." : "Send Invite"}
              </Button>
              <Button variant="outline" onClick={() => setShareModalOpen(false)} disabled={isInviting}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
