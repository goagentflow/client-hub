import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Play, Share2, X, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
}

const videos: Video[] = [
  {
    id: "1",
    title: "Welcome to Your Proposal",
    description: "Hamish introduces AgentFlow and walks through what's included",
    duration: "2:34"
  },
  {
    id: "2",
    title: "Solution Walkthrough",
    description: "Stephen explains our proposed approach in detail",
    duration: "8:15"
  },
  {
    id: "3",
    title: "Case Study: Similar Project",
    description: "See how we helped another client achieve results",
    duration: "4:52"
  }
];

export function ClientVideosSection() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareVideoId, setShareVideoId] = useState<string>("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();

  const handleShareClick = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareVideoId(videoId);
    setShareModalOpen(true);
    setShareEmail("");
    setShareMessage("");
    setEmailError("");
  };

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!email.endsWith("@neverlandcreative.com")) {
      setEmailError("You can only share with people at Neverland Creative");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleShare = () => {
    if (validateEmail(shareEmail)) {
      toast({
        title: "Video shared successfully",
        description: `An invitation has been sent to ${shareEmail}`,
      });
      setShareModalOpen(false);
    }
  };

  const handleCopyLink = () => {
    const shareVideo = videos.find(v => v.id === shareVideoId);
    navigator.clipboard.writeText(`https://portal.agentflow.com/video/${shareVideoId}`);
    toast({
      title: "Link copied",
      description: `Link to "${shareVideo?.title}" copied to clipboard`,
    });
  };

  const shareVideo = videos.find(v => v.id === shareVideoId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))] mb-2">
          Videos
        </h1>
        <p className="text-[hsl(var(--medium-grey))]">
          Videos from the AgentFlow team
        </p>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map((video) => (
          <Card
            key={video.id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden"
            onClick={() => setSelectedVideo(video)}
          >
            <CardContent className="p-0">
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-[hsl(var(--medium-grey))]/20 flex items-center justify-center">
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-[hsl(var(--bold-royal-blue))] ml-1" fill="currentColor" />
                  </div>
                </div>
                
                {/* Duration badge */}
                <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {video.duration}
                </div>

                {/* Share button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white z-10"
                  onClick={(e) => handleShareClick(video.id, e)}
                >
                  <Share2 className="h-4 w-4 text-[hsl(var(--bold-royal-blue))]" />
                </Button>
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="font-bold text-[hsl(var(--dark-grey))] mb-2 line-clamp-1">
                  {video.title}
                </h3>
                <p className="text-sm text-[hsl(var(--medium-grey))] line-clamp-2">
                  {video.description}
                </p>
                <Button 
                  className="w-full mt-4 bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Watch
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[hsl(var(--bold-royal-blue))]">
              {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Video Player Placeholder */}
            <div className="relative aspect-video bg-[hsl(var(--medium-grey))]/20 rounded-lg flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[hsl(var(--gradient-blue))] flex items-center justify-center">
                <Play className="h-10 w-10 text-white ml-1" fill="currentColor" />
              </div>
              
              {/* Mock video controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/75 p-3 rounded-b-lg">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="text-white hover:text-white/80">
                    <Play className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-white rounded-full" />
                  </div>
                  <span className="text-white text-sm">1:15 / {selectedVideo?.duration}</span>
                </div>
              </div>
            </div>

            {/* Video Description */}
            <div>
              <p className="text-[hsl(var(--dark-grey))]">
                {selectedVideo?.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-[hsl(var(--gradient-blue))] text-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/10"
                onClick={() => {
                  if (selectedVideo) {
                    handleShareClick(selectedVideo.id, {} as React.MouseEvent);
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share this video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[hsl(var(--bold-royal-blue))]">
              Share Video
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Video context */}
            {shareVideo && (
              <div className="flex gap-3 p-3 bg-[hsl(var(--warm-cream))] rounded-lg">
                <div className="w-24 aspect-video bg-[hsl(var(--medium-grey))]/20 rounded flex-shrink-0 flex items-center justify-center">
                  <Play className="h-6 w-6 text-[hsl(var(--medium-grey))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[hsl(var(--dark-grey))] truncate">
                    {shareVideo.title}
                  </p>
                  <p className="text-xs text-[hsl(var(--medium-grey))]">
                    {shareVideo.duration}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="share-email">Colleague's email</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="tom@neverlandcreative.com"
                value={shareEmail}
                onChange={(e) => {
                  setShareEmail(e.target.value);
                  setEmailError("");
                }}
                className={emailError ? "border-red-500" : ""}
              />
              {emailError && (
                <p className="text-sm text-red-500">{emailError}</p>
              )}
              <p className="text-xs text-[hsl(var(--medium-grey))]">
                You can only share with colleagues at @neverlandcreative.com
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-message">Add a message (optional)</Label>
              <Textarea
                id="share-message"
                placeholder="Hi Tom, take a look at this video..."
                rows={3}
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-[hsl(var(--medium-grey))]">
              <span className="text-lg">🔒</span>
              <p>Your colleague will need to sign in with their Microsoft account to view</p>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
                onClick={handleShare}
              >
                Send email invitation
              </Button>
              <Button
                variant="outline"
                className="border-[hsl(var(--gradient-blue))] text-[hsl(var(--gradient-blue))]"
                onClick={handleCopyLink}
              >
                Copy link
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShareModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
