import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DocumentPreviewRenderer } from "@/components/documents/DocumentPreviewRenderer";
import type { Document } from "@/types";

interface DocumentPreviewDialogProps {
  document: Document | null;
  hubId: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (doc: Document) => void;
}

export function DocumentPreviewDialog({
  document,
  hubId,
  isOpen,
  onClose,
  onDownload,
}: DocumentPreviewDialogProps) {
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-[hsl(var(--bold-royal-blue))]">{document.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DocumentPreviewRenderer
            hubId={hubId}
            documentId={document.id}
            mimeType={document.mimeType}
            portal
            onDownload={() => onDownload(document)}
          />

          <div className="flex gap-3">
            <Button
              className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
              onClick={() => onDownload(document)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
