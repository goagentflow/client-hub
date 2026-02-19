import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, FileX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useHubId } from "@/contexts/hub-context";
import {
  usePortalProposal,
  useSubmitProposalComment,
  useTrackEngagement,
} from "@/hooks";
import {
  ProposalHeader,
  ProposalSlideViewer,
  SlideThumbnails,
  SlideCommentDialog,
} from "./client-proposal";

export function ClientProposalSection() {
  const navigate = useNavigate();
  const hubId = useHubId();
  const { toast } = useToast();

  // State
  const [currentSlide, setCurrentSlide] = useState(1);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentSlide, setCommentSlide] = useState(1);
  const [commentedSlides, setCommentedSlides] = useState<number[]>([]);

  // Data hooks
  const { data: proposal, isLoading } = usePortalProposal(hubId);
  const { mutate: submitComment, isPending: isSubmitting } = useSubmitProposalComment(hubId);

  // Engagement tracking
  const { trackProposalViewed, trackProposalSlideTime } = useTrackEngagement(hubId);

  useEffect(() => {
    if (proposal) {
      // Track initial view at slide 1
      trackProposalViewed(proposal.id, 1);
    }
  }, [proposal, trackProposalViewed]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-16 text-center">
            <FileX className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-[hsl(var(--dark-grey))] mb-2">
              No Proposal Available
            </h2>
            <p className="text-[hsl(var(--medium-grey))] mb-6">
              The proposal hasn't been shared yet. Check back soon!
            </p>
            <Button
              variant="outline"
              onClick={() => navigate(`/portal/${hubId}/overview`)}
            >
              Back to Overview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSlides = proposal.totalSlides || 24;
  const canDownload = proposal.settings?.isDownloadEnabled ?? true;
  const title = proposal.fileName?.replace(/\.[^/.]+$/, "") || "Our Proposal";

  const handleSlideSelect = (slideNum: number) => {
    setCurrentSlide(slideNum);
  };

  const handleSlideTimeSpent = (slideNum: number, seconds: number) => {
    trackProposalSlideTime(proposal.id, slideNum, seconds);
  };

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your proposal is being downloaded",
    });
  };

  const handleOpenExternal = () => {
    toast({
      title: "Opening proposal",
      description: "Opening in a new tab...",
    });
  };

  const handleAskQuestion = () => {
    navigate(`/portal/${hubId}/messages`);
  };

  const handleSlideComment = (slideNum: number) => {
    setCommentSlide(slideNum);
    setCommentDialogOpen(true);
  };

  const handleSubmitComment = (content: string) => {
    submitComment(
      { slideNumber: commentSlide, content },
      {
        onSuccess: () => {
          setCommentedSlides((prev) =>
            prev.includes(commentSlide) ? prev : [...prev, commentSlide]
          );
          setCommentDialogOpen(false);
          toast({
            title: "Comment sent",
            description: "The AgentFlow team will respond in Messages",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to send comment. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <ProposalHeader
        title={title}
        canDownload={canDownload}
        onDownload={handleDownload}
        onOpenExternal={handleOpenExternal}
        onAskQuestion={handleAskQuestion}
      />

      {/* Main Content */}
      <div className={`grid grid-cols-1 ${proposal.embedUrl ? "" : "lg:grid-cols-4"} gap-6`}>
        {/* Slide Thumbnails - Sidebar (hidden when Office embed handles its own navigation) */}
        {!proposal.embedUrl && (
          <div className="lg:col-span-1 order-2 lg:order-1">
            <SlideThumbnails
              totalSlides={totalSlides}
              currentSlide={currentSlide}
              commentedSlides={commentedSlides}
              onSlideSelect={handleSlideSelect}
            />
          </div>
        )}

        {/* Main Viewer */}
        <div className={proposal.embedUrl ? "" : "lg:col-span-3 order-1 lg:order-2"}>
          <ProposalSlideViewer
            currentSlide={currentSlide}
            onSlideComment={handleSlideComment}
            onSlideTimeSpent={handleSlideTimeSpent}
            embedUrl={proposal.embedUrl}
          />
        </div>
      </div>

      {/* Comment Dialog */}
      <SlideCommentDialog
        isOpen={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        slideNumber={commentSlide}
        onSubmit={handleSubmitComment}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
