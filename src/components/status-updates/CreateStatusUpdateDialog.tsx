/**
 * CreateStatusUpdateDialog — Staff form for fortnightly status updates
 */

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
import type { CreateStatusUpdateRequest, OnTrackStatus } from "@/types";

interface CreateStatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStatusUpdateRequest) => void;
  isSubmitting: boolean;
}

export function CreateStatusUpdateDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateStatusUpdateDialogProps) {
  const [period, setPeriod] = useState("");
  const [completed, setCompleted] = useState("");
  const [inProgress, setInProgress] = useState("");
  const [nextPeriod, setNextPeriod] = useState("");
  const [neededFromClient, setNeededFromClient] = useState("");
  const [onTrack, setOnTrack] = useState<OnTrackStatus>("on_track");

  const canSubmit =
    period.trim() &&
    completed.trim() &&
    inProgress.trim() &&
    nextPeriod.trim() &&
    !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      period: period.trim(),
      completed: completed.trim(),
      inProgress: inProgress.trim(),
      nextPeriod: nextPeriod.trim(),
      neededFromClient: neededFromClient.trim() || undefined,
      onTrack,
    });
  };

  const handleClose = () => {
    setPeriod("");
    setCompleted("");
    setInProgress("");
    setNextPeriod("");
    setNeededFromClient("");
    setOnTrack("on_track");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--bold-royal-blue))]">
            Add Status Update
          </DialogTitle>
          <DialogDescription>
            Fortnightly status update visible to the client
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="period">Period</Label>
            <Input
              id="period"
              placeholder="e.g. Week 5 (w/c 31 Mar)"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="completed">Completed</Label>
            <Textarea
              id="completed"
              placeholder="What was completed this period..."
              value={completed}
              onChange={(e) => setCompleted(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inProgress">In Progress</Label>
            <Textarea
              id="inProgress"
              placeholder="What's currently being worked on..."
              value={inProgress}
              onChange={(e) => setInProgress(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextPeriod">Next 2 Weeks</Label>
            <Textarea
              id="nextPeriod"
              placeholder="What's planned for the next period..."
              value={nextPeriod}
              onChange={(e) => setNextPeriod(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neededFromClient">
              Needed from Client{" "}
              <span className="text-[hsl(var(--medium-grey))] font-normal">(optional)</span>
            </Label>
            <Textarea
              id="neededFromClient"
              placeholder="Any blockers or actions needed from the client..."
              value={neededFromClient}
              onChange={(e) => setNeededFromClient(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={onTrack}
              onValueChange={(v) => setOnTrack(v as OnTrackStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="off_track">Off Track</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-[hsl(var(--bold-royal-blue))] hover:bg-[hsl(var(--bold-royal-blue))]/90 text-white"
            >
              {isSubmitting ? "Saving..." : "Add Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
