/**
 * CreateHubDialog — form for creating a new hub (pitch or client)
 *
 * Collects hub type, company name, contact name, and contact email.
 * Inserts into Supabase (or mock) via hub.service.createHub().
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createHub } from "@/services/hub.service";
import { useQueryClient } from "@tanstack/react-query";
import type { HubType } from "@/types/hub";

interface CreateHubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHubDialog({ open, onOpenChange }: CreateHubDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [hubType, setHubType] = useState<HubType>("pitch");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setHubType("pitch");
    setCompanyName("");
    setContactName("");
    setContactEmail("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!companyName.trim() || !contactName.trim() || !contactEmail.trim()) {
      setError("All fields are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newHub = await createHub({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        hubType,
      });

      // Invalidate hub list cache so the new hub appears
      await queryClient.invalidateQueries({ queryKey: ["hubs"] });

      handleClose();
      navigate(`/hub/${newHub.id}/overview`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create hub. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Hub</DialogTitle>
          <DialogDescription>
            Set up a new hub for a prospective or existing client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hubType">Hub Type</Label>
            <Select value={hubType} onValueChange={(v) => setHubType(v as HubType)}>
              <SelectTrigger id="hubType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pitch">Pitch Hub — new business</SelectItem>
                <SelectItem value="client">Client Hub — existing client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="e.g. Whitmore & Associates"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              placeholder="e.g. Sarah Mitchell"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="e.g. sarah@whitmorelaw.co.uk"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-soft-coral hover:bg-soft-coral/90 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Hub"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
