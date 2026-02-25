import { useMemo, useState } from "react";
import { Users, Shield, UserPlus, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showRequestForm, setShowRequestForm] = useState(false);

  const canSubmit = useMemo(() => {
    return !!email.trim() && !isRequesting && !!onRequestAccess;
  }, [email, isRequesting, onRequestAccess]);

  const visibleContacts = audience?.clientAudience.knownReaders ?? [];
  const remainingCount = Math.max(0, visibleContacts.length - 4);
  const primaryContacts = visibleContacts.slice(0, 4);

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
    setShowRequestForm(false);
  };

  return (
    <Card data-testid="message-audience-card">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-[hsl(var(--bold-royal-blue))]" />
            Members of messaging group
          </CardTitle>
          {audience ? (
            <Badge variant="secondary" className="h-6 text-xs">
              Access: {audience.accessMethod}
            </Badge>
          ) : null}
        </div>
        <CardDescription className="text-xs">
          Shared visibility at hub level.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
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
          <div className="rounded-md border border-border/70 px-3 py-2 space-y-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dark-grey))]">Client</p>
                <p className="text-xs text-[hsl(var(--medium-grey))]">
                  {visibleContacts.length} contact{visibleContacts.length === 1 ? "" : "s"}
                </p>
              </div>

              {primaryContacts.length === 0 ? (
                <p className="text-xs text-[hsl(var(--medium-grey))]">No known client contacts are listed yet.</p>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {primaryContacts.map((contact) => (
                      <Badge
                        key={`${contact.email}-${contact.source}`}
                        variant="outline"
                        className="max-w-full truncate text-xs font-normal"
                        title={contact.name ? `${contact.name} (${contact.email})` : contact.email}
                      >
                        {contact.name || contact.email}
                      </Badge>
                    ))}
                  </div>
                  {primaryContacts.map((contact) => (
                    <p key={`${contact.email}-${contact.source}-meta`} className="text-[11px] text-[hsl(var(--medium-grey))]">
                      {contact.email} · {formatSource(contact.source)}
                    </p>
                  ))}
                  {remainingCount > 0 ? (
                    <p className="text-[11px] text-[hsl(var(--medium-grey))]">+{remainingCount} more contacts</p>
                  ) : null}
                </div>
              )}

              <p className="text-[11px] text-[hsl(var(--medium-grey))]">{audience.clientAudience.note}</p>
            </div>

            <div className="border-t pt-2 space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[hsl(var(--bold-royal-blue))]" />
                <p className="text-sm font-medium">Agent Flow staff</p>
              </div>
              <p className="text-xs text-[hsl(var(--dark-grey))]">Can read this message feed.</p>
            </div>
          </div>
        ) : null}

        {showPortalRequestForm ? (
          <div className="rounded-md border px-3 py-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[hsl(var(--bold-royal-blue))]" />
                <p className="text-sm font-medium">Request teammate access</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setShowRequestForm((prev) => !prev)}
              >
                {showRequestForm ? (
                  <>
                    Hide <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Open <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {showRequestForm ? (
              <>
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
              </>
            ) : (
              <p className="text-xs text-[hsl(var(--medium-grey))]">
                Need another client contact in this messaging group? Send a quick access request.
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
