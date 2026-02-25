import { Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet as SheetPanel,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { DocumentPreviewRenderer } from "./DocumentPreviewRenderer";
import type { Document, DocumentCategory, DocumentEngagement } from "@/types";

interface DocumentDetailPanelProps {
  document: Document | null;
  hubId: string;
  engagement: DocumentEngagement | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { name?: string; description?: string; category?: DocumentCategory }) => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatTimeAgo = (isoDate: string) => {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  return formatDate(isoDate);
};

export function DocumentDetailPanel({
  document,
  hubId,
  engagement,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: DocumentDetailPanelProps) {
  const { toast } = useToast();

  if (!document) return null;

  const isClientDoc = document.visibility === "client";

  return (
    <SheetPanel open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl text-[hsl(var(--royal-blue))]">
            Document Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Preview */}
          <DocumentPreviewRenderer
            hubId={hubId}
            documentId={document.id}
            mimeType={document.mimeType}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={async () => {
                try {
                  const { downloadDocument } = await import("@/services/document.service");
                  await downloadDocument(document.hubId, document.id);
                } catch {
                  toast({
                    title: "Download failed",
                    description: "Could not download the document.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {document.embedUrl && (
              <Button variant="outline" className="flex-1" asChild>
                <a href={document.embedUrl} target="_blank" rel="noopener noreferrer">
                  Open in new tab
                </a>
              </Button>
            )}
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input defaultValue={document.name} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Add notes about this document"
                rows={3}
                defaultValue={document.description || ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select defaultValue={document.category}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                  <SelectItem value="brief">Brief</SelectItem>
                  <SelectItem value="deliverable">Deliverable</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Engagement (for client docs) */}
          {isClientDoc && engagement && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-[hsl(var(--dark-grey))]">Client Engagement</h3>
              <div className="space-y-2 text-sm">
                {engagement.viewHistory.length > 0 ? (
                  <>
                    <p className="text-[hsl(var(--medium-grey))]">
                      Viewed by:{" "}
                      <span className="text-[hsl(var(--dark-grey))]">
                        {engagement.viewHistory
                          .filter((v) => v.action === "view")
                          .map((v) => `${v.viewerName} (${formatDate(v.timestamp)})`)
                          .join(", ") || "Not viewed yet"}
                      </span>
                    </p>
                    <p className="text-[hsl(var(--medium-grey))]">
                      Downloaded:{" "}
                      <span className="text-[hsl(var(--dark-grey))]">
                        {engagement.totalDownloads} {engagement.totalDownloads === 1 ? "time" : "times"}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-[hsl(var(--medium-grey))]">No engagement yet</p>
                )}
              </div>
            </div>
          )}

          {/* Version History */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[hsl(var(--dark-grey))]">Versions</h3>
            <div className="space-y-2">
              {document.versions.map((version, index) => (
                <div
                  key={version.version}
                  className={`flex items-center justify-between p-3 rounded ${
                    index === 0 ? "bg-muted/50" : "bg-muted/30"
                  }`}
                >
                  <div>
                    <p className={index === 0 ? "font-medium text-sm" : "text-sm text-[hsl(var(--medium-grey))]"}>
                      v{version.version} — {formatDate(version.uploadedAt)}
                      {index === 0 && (
                        <Badge variant="secondary" className="ml-2">
                          Current
                        </Badge>
                      )}
                    </p>
                  </div>
                  {index > 0 && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={version.downloadUrl} download>
                        View
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Upload new version
            </Button>
          </div>

          {/* Team Notes */}
          <div className="space-y-2">
            <Label>Team Notes</Label>
            <Textarea
              placeholder="Notes for your team — not visible to clients even on client documents"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white w-full"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Copy link
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </SheetPanel>
  );
}
