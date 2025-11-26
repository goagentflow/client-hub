import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, Maximize2, ChevronLeft, ChevronRight, MessageSquare, Lock, Send, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ClientProposalSection() {
  const [currentSlide, setCurrentSlide] = useState(3);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [comment, setComment] = useState("");
  const [commentSent, setCommentSent] = useState(false);
  const { toast } = useToast();

  const totalSlides = 12;
  const commentedSlides = [3, 7]; // Mock slides with comments

  const handlePrevious = () => {
    if (currentSlide > 1) setCurrentSlide(currentSlide - 1);
  };

  const handleNext = () => {
    if (currentSlide < totalSlides) setCurrentSlide(currentSlide + 1);
  };

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your proposal PDF is being downloaded...",
    });
  };

  const handleSendComment = () => {
    if (comment.trim()) {
      setCommentSent(true);
      setTimeout(() => {
        setCommentSent(false);
        setComment("");
      }, 5000);
    }
  };

  const handleShare = () => {
    if (!shareEmail.endsWith("@neverlandcreative.com")) {
      toast({
        title: "Invalid email",
        description: "You can only share with people at Neverland Creative",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Proposal shared",
      description: `Invitation sent to ${shareEmail}`,
    });
    setShowShareModal(false);
    setShareEmail("");
    setShareMessage("");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + "/portal/proposal");
    toast({
      title: "Link copied",
      description: "Proposal link copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[hsl(var(--bold-royal-blue))]">
            Proposal
          </h1>
          <p className="text-lg text-[hsl(var(--medium-grey))] mt-1">
            Our Proposal for Neverland Creative
          </p>
          <div className="flex gap-4 mt-3 text-sm text-[hsl(var(--medium-grey))]">
            <span>Prepared November 2025</span>
            <span>•</span>
            <span>{totalSlides} slides</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDownload}
            className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={() => setShowShareModal(true)}
            variant="outline"
            className="border-[hsl(var(--gradient-blue))] text-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/10"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Viewer */}
        <div className="lg:col-span-2 space-y-4">
          {/* Document Viewer */}
          <Card className="bg-white p-4 md:p-6">
            {/* Slide Display */}
            <div className="bg-[hsl(var(--warm-cream))] border-2 border-border/20 rounded-lg aspect-[16/9] flex items-center justify-center mb-4 relative group">
              <div className="text-center space-y-4 p-8">
                <div className="text-6xl font-bold text-[hsl(var(--gradient-blue))]/20">
                  {currentSlide}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-[hsl(var(--dark-grey))]">
                    Slide {currentSlide} Content
                  </h3>
                  <p className="text-[hsl(var(--medium-grey))]">
                    Proposal slide placeholder
                  </p>
                </div>
              </div>
              
              {/* Full screen button */}
              <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 rounded-md hover:bg-white">
                <Maximize2 className="h-4 w-4 text-[hsl(var(--dark-grey))]" />
              </button>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={handlePrevious}
                disabled={currentSlide === 1}
                variant="outline"
                className="text-[hsl(var(--dark-grey))]"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm font-medium text-[hsl(var(--dark-grey))]">
                Slide {currentSlide} of {totalSlides}
              </span>
              
              <Button
                onClick={handleNext}
                disabled={currentSlide === totalSlides}
                variant="outline"
                className="text-[hsl(var(--dark-grey))]"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Thumbnail Strip */}
            <div className="border-t border-border/20 pt-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: totalSlides }, (_, i) => i + 1).map((slideNum) => (
                  <button
                    key={slideNum}
                    onClick={() => setCurrentSlide(slideNum)}
                    className={`
                      flex-shrink-0 relative w-20 h-14 rounded border-2 transition-all
                      ${slideNum === currentSlide 
                        ? 'border-[hsl(var(--gradient-blue))] bg-[hsl(var(--gradient-blue))]/10' 
                        : 'border-border/30 bg-[hsl(var(--warm-cream))] hover:border-[hsl(var(--gradient-blue))]/50'
                      }
                    `}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[hsl(var(--medium-grey))]">
                      {slideNum}
                    </span>
                    {commentedSlides.includes(slideNum) && (
                      <div className="absolute -top-1 -right-1 bg-[hsl(var(--soft-coral))] rounded-full p-1">
                        <MessageSquare className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Comment Section */}
          <Card className="bg-white p-6">
            <h3 className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-3">
              Have a question about this slide?
            </h3>
            
            {commentSent ? (
              <div className="bg-[hsl(var(--gradient-blue))]/10 border border-[hsl(var(--gradient-blue))]/20 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--gradient-blue))] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[hsl(var(--dark-grey))] font-medium">
                      Your comment has been sent to the AgentFlow team
                    </p>
                    <p className="text-sm text-[hsl(var(--medium-grey))] mt-1">
                      You'll find the conversation in Messages.
                    </p>
                  </div>
                </div>
                <a
                  href="/portal/messages"
                  className="text-sm text-[hsl(var(--bold-royal-blue))] hover:underline inline-block"
                >
                  Go to Messages →
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your comment or question..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button
                  onClick={handleSendComment}
                  disabled={!comment.trim()}
                  className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* About This Proposal */}
          <Card className="bg-white p-5">
            <h3 className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-4">
              About This Proposal
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[hsl(var(--medium-grey))]">Prepared by</span>
                <span className="text-[hsl(var(--dark-grey))] font-medium">AgentFlow</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--medium-grey))]">Date</span>
                <span className="text-[hsl(var(--dark-grey))] font-medium">November 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--medium-grey))]">Pages</span>
                <span className="text-[hsl(var(--dark-grey))] font-medium">{totalSlides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--medium-grey))]">Last updated</span>
                <span className="text-[hsl(var(--dark-grey))] font-medium">Nov 22</span>
              </div>
            </div>
          </Card>

          {/* Your Comments */}
          <Card className="bg-white p-5">
            <h3 className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-4">
              Your Comments
            </h3>
            <div className="space-y-3">
              {commentedSlides.length > 0 ? (
                commentedSlides.map((slideNum) => (
                  <a
                    key={slideNum}
                    href="/portal/messages"
                    className="block p-3 rounded-lg border border-border/30 hover:border-[hsl(var(--gradient-blue))]/50 hover:bg-[hsl(var(--gradient-blue))]/5 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-[hsl(var(--gradient-blue))] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[hsl(var(--dark-grey))]">
                          Slide {slideNum}
                        </p>
                        <p className="text-xs text-[hsl(var(--medium-grey))] truncate">
                          {slideNum === 3 ? "Question about timeline" : "Can we discuss pricing?"}
                        </p>
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-sm text-[hsl(var(--medium-grey))]">
                  No comments yet
                </p>
              )}
            </div>
          </Card>

          {/* Need Help */}
          <Card className="bg-white p-5">
            <h3 className="text-lg font-semibold text-[hsl(var(--dark-grey))] mb-3">
              Need Help?
            </h3>
            <p className="text-sm text-[hsl(var(--medium-grey))] mb-4">
              Questions about this proposal?
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-[hsl(var(--gradient-blue))] text-[hsl(var(--gradient-blue))]"
                onClick={() => window.location.href = "/portal/messages"}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send a Message
              </Button>
              <a
                href="/portal/meetings"
                className="block text-center text-sm text-[hsl(var(--bold-royal-blue))] hover:underline py-2"
              >
                Request a Meeting
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--bold-royal-blue))]">
              Share Proposal
            </DialogTitle>
            <DialogDescription className="text-[hsl(var(--medium-grey))]">
              You can share this with colleagues who have a @neverlandcreative.com email address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="share-email" className="text-[hsl(var(--dark-grey))]">
                Colleague's email
              </Label>
              <Input
                id="share-email"
                type="email"
                placeholder="tom@neverlandcreative.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-message" className="text-[hsl(var(--dark-grey))]">
                Add a message (optional)
              </Label>
              <Textarea
                id="share-message"
                placeholder="Hi Tom, take a look at this proposal..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleShare}
                disabled={!shareEmail.trim()}
                className="flex-1 bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white"
              >
                Send Invitation
              </Button>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="border-[hsl(var(--gradient-blue))] text-[hsl(var(--gradient-blue))]"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start gap-2 p-3 bg-[hsl(var(--warm-cream))] rounded-lg">
              <Lock className="h-4 w-4 text-[hsl(var(--medium-grey))] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[hsl(var(--medium-grey))]">
                Your colleague will need to sign in with their Microsoft account to view
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
