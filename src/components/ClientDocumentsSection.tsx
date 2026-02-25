import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, Search, Loader2, Mail, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHubId } from "@/contexts/hub-context";
import { usePortalDocuments, useTrackEngagement, useInviteColleague } from "@/hooks";
import { DocumentCard, DocumentPreviewDialog } from "./client-documents";
import type { Document } from "@/types";

export function ClientDocumentsSection() {
  const hubId = useHubId();
  const { toast } = useToast();
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  // Data hooks
  const { data: documentsData, isLoading } = usePortalDocuments(hubId);
  const { mutate: inviteColleague, isPending: isInviting } = useInviteColleague(hubId);

  // Engagement tracking
  const { trackHubViewed, trackDocumentViewed, trackDocumentDownloaded } = useTrackEngagement(hubId);

  useEffect(() => {
    trackHubViewed("portal-documents");
  }, [trackHubViewed]);

  const documents = documentsData?.items || [];

  // Filter documents by search
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) ||
        (doc.description?.toLowerCase().includes(query) ?? false)
    );
  }, [documents, searchQuery]);

  const handleView = (doc: Document) => {
    setPreviewDoc(doc);
    trackDocumentViewed(doc.id);
  };

  const handleDownload = async (doc: Document) => {
    trackDocumentDownloaded(doc.id);
    try {
      const { downloadDocument } = await import("@/services/document.service");
      await downloadDocument(hubId, doc.id, { portal: true });
      toast({
        title: "Download started",
        description: `Downloading ${doc.name}`,
      });
    } catch {
      toast({
        title: "Download failed",
        description: "Could not download the document.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (doc: Document) => {
    setShareDoc(doc);
    setShareModalOpen(true);
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim() || !shareDoc) return;
    inviteColleague(
      { email: inviteEmail.trim(), accessLevel: "full_access" },
      {
        onSuccess: () => {
          toast({
            title: "Invite sent",
            description: `Invitation to view "${shareDoc.name}" sent to ${inviteEmail}`,
          });
          setShareModalOpen(false);
          setShareDoc(null);
          setInviteEmail("");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to send invite. Make sure the email is from your organization.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))] mb-6">Documents</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-[hsl(var(--dark-grey))] mb-2">No Documents Yet</h2>
            <p className="text-[hsl(var(--medium-grey))]">Documents will appear here when the team shares them.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--bold-royal-blue))] mb-2">Documents</h1>
          <p className="text-[hsl(var(--medium-grey))]">
            {documents.length} document{documents.length !== 1 ? "s" : ""} shared with you
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {filteredDocuments.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onView={handleView}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        ))}

        {filteredDocuments.length === 0 && searchQuery && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No documents match "{searchQuery}"
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <DocumentPreviewDialog
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
      />

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={(open) => { setShareModalOpen(open); if (!open) { setInviteEmail(""); setShareDoc(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-[hsl(var(--bold-royal-blue))]">Share Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {shareDoc && (
              <div className="flex gap-3 p-3 bg-muted rounded-lg">
                <div className="w-12 h-12 bg-muted-foreground/20 rounded flex-shrink-0 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[hsl(var(--dark-grey))] truncate">{shareDoc.name}</p>
                  <p className="text-xs text-[hsl(var(--medium-grey))] capitalize">{shareDoc.category}</p>
                </div>
              </div>
            )}
            <p className="text-sm text-[hsl(var(--medium-grey))]">
              Invite a colleague from your organization to view this hub.
            </p>
            <div className="space-y-2">
              <Label htmlFor="doc-invite-email">Colleague's email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="doc-invite-email"
                  type="email"
                  placeholder="colleague@yourcompany.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90"
                onClick={handleSendInvite}
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting ? "Sending..." : "Send Invite"}
              </Button>
              <Button variant="outline" onClick={() => setShareModalOpen(false)} disabled={isInviting}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
