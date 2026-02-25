import { UserPlus, Link2, FilePlus, Mail, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuickActionType =
  | "invite-client"
  | "add-video-link"
  | "upload-document"
  | "send-message";

interface QuickAction {
  id: QuickActionType;
  label: string;
  icon: LucideIcon;
  color: string;
  primary?: boolean;
}

const quickActions: QuickAction[] = [
  { id: "invite-client", label: "Invite Client", icon: UserPlus, color: "bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90", primary: true },
  { id: "add-video-link", label: "Add Video Link", icon: Link2, color: "bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90" },
  { id: "upload-document", label: "Upload Document", icon: FilePlus, color: "bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90" },
  { id: "send-message", label: "Send Message", icon: Mail, color: "bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90" },
];

interface QuickActionsProps {
  onAction: (action: QuickActionType) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-[hsl(var(--dark-grey))] mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            className={`${action.color} text-white h-auto py-4 justify-start`}
            onClick={() => onAction(action.id)}
          >
            <action.icon className="w-5 h-5 mr-3" />
            <span className="text-base font-semibold">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
