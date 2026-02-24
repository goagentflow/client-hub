import { useState, useEffect } from "react";
import { Video, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HeroContentType } from "@/types";

interface WelcomeSectionProps {
  welcomeHeadline: string;
  welcomeMessage: string;
  heroContentType: HeroContentType;
  onHeadlineChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onHeroTypeChange: (value: HeroContentType) => void;
}

export function WelcomeSection({
  welcomeHeadline,
  welcomeMessage,
  heroContentType,
  onHeadlineChange,
  onMessageChange,
  onHeroTypeChange,
}: WelcomeSectionProps) {
  const [headline, setHeadline] = useState(welcomeHeadline);
  const [message, setMessage] = useState(welcomeMessage);

  // Sync local state when server data changes (e.g. after initial load)
  useEffect(() => { setHeadline(welcomeHeadline); }, [welcomeHeadline]);
  useEffect(() => { setMessage(welcomeMessage); }, [welcomeMessage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[hsl(var(--dark-grey))]">Welcome Section</CardTitle>
        <CardDescription>What clients see when they first arrive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="welcome-headline">Welcome Headline</Label>
          <Input
            id="welcome-headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            onBlur={() => { if (headline !== welcomeHeadline) onHeadlineChange(headline); }}
            className="font-semibold"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcome-message">Welcome Message</Label>
          <Textarea
            id="welcome-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => { if (message !== welcomeMessage) onMessageChange(message); }}
            rows={3}
          />
        </div>

        <div className="space-y-3 pt-4 border-t">
          <Label className="text-[hsl(var(--dark-grey))] font-semibold">Featured Content</Label>
          <RadioGroup value={heroContentType} onValueChange={(v) => onHeroTypeChange(v as HeroContentType)}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="hero-video" />
                <Label htmlFor="hero-video" className="font-normal cursor-pointer">Video</Label>
              </div>
              {heroContentType === "video" && (
                <div className="ml-6 space-y-2">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select video" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intro">Introduction Video</SelectItem>
                      <SelectItem value="demo">Platform Demo</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="bg-muted rounded-lg p-4 flex items-center justify-center h-32">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="proposal" id="hero-proposal" />
                <Label htmlFor="hero-proposal" className="font-normal cursor-pointer">Proposal document</Label>
              </div>
              {heroContentType === "proposal" && (
                <div className="ml-6 space-y-2">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select proposal document" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">AgentFlow Proposal.pptx</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="bg-muted rounded-lg p-4 flex items-center justify-center h-32">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="hero-none" />
                <Label htmlFor="hero-none" className="font-normal cursor-pointer">None</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
