import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

export function ProposalSection() {
  // For demo purposes, toggle between empty and uploaded state
  const [hasProposal, setHasProposal] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(3);
  const totalSlides = 12;

  if (!hasProposal) {
    return (
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">
              Proposal
            </h1>
          </div>
          <Button className="bg-[hsl(var(--gradient-blue))]">
            Upload New Version
          </Button>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-2xl p-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Upload your proposal
                </h2>
                <p className="text-muted-foreground">
                  PowerPoint or PDF, max 50MB
                </p>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-12 w-full">
                <div className="flex flex-col items-center space-y-4">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your file here
                  </p>
                  <Button className="bg-[hsl(var(--gradient-blue))]">
                    Choose File
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic">
                Tip: Create your proposal in PowerPoint, then upload it here
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">
              Proposal
            </h1>
          </div>
          <Button className="bg-[hsl(var(--gradient-blue))]">
            Upload New Version
          </Button>
        </div>

        {/* Document info bar */}
        <Card className="p-4 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <FileText className="w-8 h-8 text-[hsl(var(--gradient-blue))] flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground break-words">
                  AgentFlow Proposal - Neverland Creative.pptx
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>Uploaded Nov 22 by Hamish</span>
                  <span>·</span>
                  <span>12 slides</span>
                  <span>·</span>
                  <span>4.2 MB</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Replace
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive">
                Delete
              </Button>
            </div>
          </div>
        </Card>

        {/* Document viewer */}
        <Card className="flex-1 flex flex-col p-6">
          <div className="flex-1 bg-muted rounded-md flex items-center justify-center mb-4">
            <div className="text-center space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                Document viewer placeholder
              </p>
              <p className="text-sm text-muted-foreground">
                Slide {currentSlide} preview would appear here
              </p>
            </div>
          </div>

          {/* Slide navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
              disabled={currentSlide === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Slide {currentSlide} of {totalSlides}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentSlide(Math.min(totalSlides, currentSlide + 1))
              }
              disabled={currentSlide === totalSlides}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in new tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[hsl(var(--gradient-blue))] text-white hover:bg-[hsl(var(--gradient-blue))]/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </Card>

        {/* Client Access panel */}
        <Card className="p-4 mt-6">
          <h3 className="font-semibold text-foreground mb-4">Client Access</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Visible to client</span>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="download-enabled" defaultChecked />
                <label
                  htmlFor="download-enabled"
                  className="text-sm cursor-pointer"
                >
                  Download enabled for client
                </label>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Copy Share Link
            </Button>
          </div>
        </Card>
      </div>

      {/* Right sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        {/* Engagement panel */}
        <Card className="p-4">
          <h3 className="font-semibold text-[hsl(var(--dark-grey))] mb-4">
            Client Engagement
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Viewed by:</p>
                <p className="text-sm text-muted-foreground">Sarah Mitchell</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total views:</span>
              <span className="font-semibold">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last viewed:</span>
              <span className="text-sm">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time spent:</span>
              <span className="text-sm">~8 minutes</span>
            </div>
          </div>
        </Card>

        {/* Slide Engagement panel */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-[hsl(var(--dark-grey))]">
              Slide Engagement
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Slide 1 (Intro)</span>
              <span className="text-muted-foreground">30 sec</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Slide 2 (Challenge)</span>
              <span className="text-muted-foreground">45 sec</span>
            </div>
            <div className="flex items-center justify-between text-sm bg-[hsl(var(--sage-green))]/10 p-2 rounded">
              <span className="font-medium">Slide 5 (Pricing)</span>
              <span className="font-semibold">2 min</span>
            </div>
            <p className="text-xs text-muted-foreground italic mt-3">
              Most viewed: Slide 5 (Pricing)
            </p>
          </div>
        </Card>

        {/* Version History panel */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-[hsl(var(--dark-grey))]">
              Version History
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Current
              </Badge>
              <span className="text-sm">v2 - Nov 22</span>
            </div>
            <div className="text-sm text-muted-foreground">v1 - Nov 18</div>
            <Button variant="link" size="sm" className="p-0 h-auto text-sm">
              View previous versions
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
