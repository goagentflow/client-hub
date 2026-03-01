import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  welcomeVideoUrl?: string;
}

export function WelcomeModal({ isOpen, onClose, welcomeVideoUrl }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          <img
            src="/agentflow-logo.svg"
            alt="AgentFlow"
            className="h-10"
          />

          <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))]">
            Welcome to Your AgentFlow Hub
          </h1>

          <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
            {welcomeVideoUrl ? (
              <iframe
                src={welcomeVideoUrl}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            ) : (
              <div className="text-center">
                <Play className="h-16 w-16 mx-auto mb-3 text-[hsl(var(--medium-grey))]" />
                <p className="text-sm text-[hsl(var(--medium-grey))]">Video player placeholder</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-[hsl(var(--dark-grey))]">
              Getting Started — 2 min
            </h3>
            <p className="text-sm text-[hsl(var(--medium-grey))]">
              A quick tour of your hub and how to get the most from it
            </p>
          </div>

          <div className="flex gap-4 w-full justify-center">
            <Button
              variant="link"
              onClick={onClose}
              className="text-[hsl(var(--medium-grey))]"
            >
              Watch Later
            </Button>
            <Button
              onClick={onClose}
              className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 text-white px-8"
            >
              Got It
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
