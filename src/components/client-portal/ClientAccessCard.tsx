import { Send, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HubMember, HubInvite } from "@/types";

interface ClientAccessCardProps {
  members: HubMember[];
  invites: HubInvite[];
  portalUrl: string;
  onInviteClient: () => void;
  onCopyLink: () => void;
  onRemoveClient?: (memberId: string, email: string) => void;
  onRevokeInvite?: (inviteId: string, email: string) => void;
  removingMemberId?: string | null;
  revokingInviteId?: string | null;
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatRelativeTime = (isoDate: string | null) => {
  if (!isoDate) return "Not yet logged in";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
};

export function ClientAccessCard({
  members,
  invites,
  portalUrl,
  onInviteClient,
  onCopyLink,
  onRemoveClient,
  onRevokeInvite,
  removingMemberId,
  revokingInviteId,
}: ClientAccessCardProps) {
  const clientMembers = members.filter((m) => m.role === "client");
  const pendingInvites = invites.filter((i) => i.status === "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[hsl(var(--dark-grey))]">Client Access</CardTitle>
        <CardDescription>Manage who can view this portal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {clientMembers.map((client) => (
            <div key={client.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-1">
                <div className="font-medium text-[hsl(var(--dark-grey))]">{client.displayName}</div>
                <div className="text-sm text-[hsl(var(--medium-grey))]">{client.email}</div>
                <div className="text-xs text-[hsl(var(--medium-grey))]">
                  Joined {formatDate(client.joinedAt)} • Last active: {formatRelativeTime(client.lastActiveAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[hsl(var(--sage-green))]">Active</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => onRemoveClient?.(client.id, client.email)}
                  disabled={!onRemoveClient || removingMemberId === client.id}
                >
                  {removingMemberId === client.id ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Removing...
                    </span>
                  ) : (
                    "Remove"
                  )}
                </Button>
              </div>
            </div>
          ))}

          {pendingInvites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-1">
                <div className="font-medium text-[hsl(var(--dark-grey))]">{invite.email}</div>
                <div className="text-xs text-[hsl(var(--medium-grey))]">
                  Invited {formatDate(invite.invitedAt)} • Not yet logged in
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500">Pending</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => onRevokeInvite?.(invite.id, invite.email)}
                  disabled={!onRevokeInvite || revokingInviteId === invite.id}
                >
                  {revokingInviteId === invite.id ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Revoking...
                    </span>
                  ) : (
                    "Revoke"
                  )}
                </Button>
              </div>
            </div>
          ))}

          {clientMembers.length === 0 && pendingInvites.length === 0 && (
            <p className="text-[hsl(var(--medium-grey))] text-sm text-center py-4">
              No clients invited yet
            </p>
          )}
        </div>

        <Button
          className="w-full bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90 gap-2"
          onClick={onInviteClient}
        >
          <Send className="h-4 w-4" />
          Invite Client
        </Button>

        <div className="pt-4 border-t space-y-3">
          <Label className="text-[hsl(var(--dark-grey))] font-semibold">Share Link</Label>
          <div className="flex gap-2">
            <Input value={portalUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" className="gap-2" onClick={onCopyLink}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <p className="text-xs text-[hsl(var(--medium-grey))]">
            Clients need to be invited before they can access
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
