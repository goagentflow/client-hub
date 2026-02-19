import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare } from "lucide-react";

const ALLOWED_EMBED_ORIGINS = [
  "https://view.officeapps.live.com/",
  "https://onedrive.live.com/",
];

function isAllowedEmbedUrl(url: string): boolean {
  return ALLOWED_EMBED_ORIGINS.some((origin) => url.startsWith(origin));
}

interface ProposalSlideViewerProps {
  currentSlide: number;
  onSlideComment: (slideNum: number) => void;
  onSlideTimeSpent?: (slideNum: number, seconds: number) => void;
  embedUrl?: string;
}

export function ProposalSlideViewer({
  currentSlide,
  onSlideComment,
  onSlideTimeSpent,
  embedUrl,
}: ProposalSlideViewerProps) {
  const slideStartTime = useRef<number>(Date.now());
  const lastTrackedSlide = useRef<number>(currentSlide);

  // Track time spent on slide when navigating away
  useEffect(() => {
    if (lastTrackedSlide.current !== currentSlide && onSlideTimeSpent) {
      const timeSpent = Math.round((Date.now() - slideStartTime.current) / 1000);
      if (timeSpent >= 2) {
        onSlideTimeSpent(lastTrackedSlide.current, timeSpent);
      }
      slideStartTime.current = Date.now();
      lastTrackedSlide.current = currentSlide;
    }
  }, [currentSlide, onSlideTimeSpent]);

  // Track time on unmount
  useEffect(() => {
    return () => {
      if (onSlideTimeSpent) {
        const timeSpent = Math.round((Date.now() - slideStartTime.current) / 1000);
        if (timeSpent >= 2) {
          onSlideTimeSpent(lastTrackedSlide.current, timeSpent);
        }
      }
    };
  }, [onSlideTimeSpent]);

  const validEmbedUrl = embedUrl && isAllowedEmbedUrl(embedUrl) ? embedUrl : null;

  return (
    <Card className="flex-1 flex flex-col">
      {/* Slide Viewer */}
      {validEmbedUrl ? (
        <div className="flex-1 relative min-h-[500px]">
          <iframe
            src={validEmbedUrl}
            title="Proposal"
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex-1 bg-muted flex items-center justify-center p-8 relative min-h-[400px]">
          <div className="text-center space-y-4">
            <FileText className="w-20 h-20 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-lg">Slide {currentSlide} Preview</p>
            <p className="text-sm text-muted-foreground">
              Document viewer placeholder — slide content would appear here
            </p>
          </div>
        </div>
      )}

      {/* Comment on this slide */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSlideComment(currentSlide)}
          className="w-full text-[hsl(var(--gradient-blue))] hover:text-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/10"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Comment on this slide
        </Button>
      </div>
    </Card>
  );
}
