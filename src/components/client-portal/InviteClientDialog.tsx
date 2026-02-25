import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AccessLevel, CreateInviteRequest } from "@/types";

interface InviteClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: CreateInviteRequest) => void;
  isInviting: boolean;
  clientDomain: string;
}

export function InviteClientDialog({ isOpen, onClose, onInvite, isInviting, clientDomain }: InviteClientDialogProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("full_access");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!email.trim()) return;
    onInvite({
      email,
      name: name.trim() || undefined,
      accessLevel,
      message: message || undefined,
    });
  };

  const handleClose = () => {
    setEmail("");
    setName("");
    setAccessLevel("full_access");
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--bold-royal-blue))]">Invite Client</DialogTitle>
          <DialogDescription>Send an email invitation to a client contact</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              placeholder={`name@${clientDomain}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <p className="text-xs text-[hsl(var(--medium-grey))]">
              Only emails from @{clientDomain} can be invited
            </p>
          </div>

          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-[hsl(var(--medium-grey))]">
              Used in messaging so clients are shown by name, not just email.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Access Level</Label>
            <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as AccessLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_access">Full Access - All sections</SelectItem>
                <SelectItem value="proposal_only">Proposal Only</SelectItem>
                <SelectItem value="documents_only">Documents Only</SelectItem>
                <SelectItem value="view_only">View Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Personal Message (optional)</Label>
            <Textarea
              placeholder="Add a personal message to the invite email..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button
              className="bg-[hsl(var(--soft-coral))] hover:bg-[hsl(var(--soft-coral))]/90"
              onClick={handleSubmit}
              disabled={!email.trim() || isInviting}
            >
              {isInviting ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
