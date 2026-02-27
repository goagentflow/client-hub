import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Hub } from "@/types";

interface HubHeaderProps {
  hub: Hub;
  onSettings?: () => void;
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "active": return "bg-[hsl(var(--sage-green))] text-white";
    case "won": return "bg-[hsl(var(--gradient-blue))] text-white";
    case "lost": return "bg-[hsl(var(--medium-grey))] text-white";
    default: return "bg-muted text-muted-foreground";
  }
};

export function HubHeader({ hub, onSettings }: HubHeaderProps) {
  const hubTypeLabel = hub.hubType === "client" ? "Client Hub" : "Pitch Hub";

  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[hsl(var(--medium-grey))]/20">
      <div>
        <h1 className="text-4xl font-bold text-[hsl(var(--bold-royal-blue))]">
          {hub.companyName}
        </h1>
        <p className="text-lg text-[hsl(var(--medium-grey))]">{hubTypeLabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge className={getStatusBadgeClass(hub.status)}>
          {hub.status.charAt(0).toUpperCase() + hub.status.slice(1)}
        </Badge>
        <Button variant="ghost" size="icon" onClick={onSettings} aria-label="Open hub settings">
          <Settings className="w-5 h-5 text-[hsl(var(--medium-grey))]" />
        </Button>
      </div>
    </div>
  );
}
