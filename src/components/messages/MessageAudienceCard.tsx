import { useMemo, useState } from "react";
import { Users, Shield, UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MessageAudience, RequestMessageAccessRequest } from "@/types";

interface MessageAudienceCardProps {
  audience?: MessageAudience;
  isLoading?: boolean;
  errorMessage?: string;
  showPortalRequestForm?: boolean;
  isRequesting?: boolean;
  onRequestAccess?: (data: RequestMessageAccessRequest) => void;
}

function formatSource(source: "portal_contact" | "hub_contact"): string {
  return source === "portal_contact" ? "approved contact" : "hub owner contact";
}

export function MessageAudienceCard({
  audience,
  isLoading = false,
  errorMessage,
  showPortalRequestForm = false,
  isRequesting = false,
  onRequestAccess,
}: MessageAudienceCardProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const canSubmit = useMemo(() => {
    return !!email.trim() && !isRequesting && !!onRequestAccess;
  }, [email, isRequesting, onRequestAccess]);

  const visibleContacts = audience?.clientAudience.knownReaders ?? [];
  const remainingCount = Math.max(0, visibleContacts.length - 8);
  const primaryContacts = visibleContacts.slice(0, 8);

  const submitRequest = () => {
    if (!canSubmit || !onRequestAccess) return;
    onRequestAccess({
      email: email.trim().toLowerCase(),
      name: name.trim() || undefined,
      note: note.trim() || undefined,
    });
    setEmail("");
    setName("");
    setNote("");
  };

  return (
    <Card data-testid="message-audience-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-[hsl(var(--bold-royal-blue))]" />
          Who Can Read This Feed
        </CardTitle>
        <CardDescription>
          Visibility is shared at hub level, not per individual message.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading message audience...
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        {!isLoading && !errorMessage && audience ? (
          <>
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[hsl(var(--bold-royal-blue))]" />
                <p className="text-sm font-medium">Agent Flow staff</p>
              </div>
              <p className="text-sm text-[hsl(var(--dark-grey))]">Can read this message feed.</p>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Client readers</p>
                <Badge variant="secondary">Access: {audience.accessMethod}</Badge>
              </div>

              <p className="text-xs text-[hsl(var(--medium-grey))]">{audience.clientAudience.note}</p>

              {primaryContacts.length === 0 ? (
                <p className="text-sm text-[hsl(var(--medium-grey))]">No known client contacts are listed yet.</p>
              ) : (
                <div className="space-y-2">
                  {primaryContacts.map((contact) => (
                    <div
                      key={`${contact.email}-${contact.source}`}
                      className="rounded border border-border/60 px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-[hsl(var(--dark-grey))]">
                        {contact.name || contact.email}
                      </p>
                      <p className="text-xs text-[hsl(var(--medium-grey))]">
                        {contact.email} · {formatSource(contact.source)}
                      </p>
                    </div>
                  ))}
                  {remainingCount > 0 ? (
                    <p className="text-xs text-[hsl(var(--medium-grey))]">+{remainingCount} more contacts</p>
                  ) : null}
                </div>
              )}
            </div>
          </>
        ) : null}

        {showPortalRequestForm ? (
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[hsl(var(--bold-royal-blue))]" />
              <p className="text-sm font-medium">Request teammate access</p>
            </div>
            <p className="text-xs text-[hsl(var(--medium-grey))]">
              Request that Agent Flow staff adds another client contact to this hub.
            </p>

            <div className="space-y-2">
              <Label htmlFor="request-email">Teammate email</Label>
              <Input
                id="request-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="request-name">Teammate name (optional)</Label>
              <Input
                id="request-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="request-note">Note (optional)</Label>
              <Textarea
                id="request-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Please add them to hub messages."
                rows={2}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={submitRequest} disabled={!canSubmit}>
                {isRequesting ? "Sending request..." : "Send access request"}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
