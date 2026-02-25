import { useState, useEffect } from "react";
import { Upload, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHubId } from "@/contexts/hub-context";
import {
  useDocuments,
  useDocument,
  useDocumentEngagement,
  useUploadDocument,
  useUpdateDocument,
  useDeleteDocument,
  useBulkDocumentAction,
  useTrackEngagement,
  useToast,
} from "@/hooks";
import {
  DocumentsTable,
  DocumentDetailPanel,
  UploadDocumentDialog,
  BulkActionsBar,
  DocumentsStats,
} from "./documents";
import type { DocumentVisibility, DocumentCategory } from "@/types";

export function DocumentsSection() {
  const hubId = useHubId();
  const [activeTab, setActiveTab] = useState<DocumentVisibility>("client");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Hooks for data fetching
  const { data: clientDocs, isLoading: loadingClient } = useDocuments(hubId, { visibility: "client" });
  const { data: internalDocs, isLoading: loadingInternal } = useDocuments(hubId, { visibility: "internal" });
  const { data: selectedDocument } = useDocument(hubId, selectedDocId || "");
  const { data: engagement } = useDocumentEngagement(hubId, selectedDocId || "");

  // Mutations
  const { mutate: uploadDocument, isPending: isUploading } = useUploadDocument(hubId);
  const { mutate: updateDocument, isPending: isUpdating } = useUpdateDocument(hubId);
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument(hubId);
  const { mutate: bulkAction } = useBulkDocumentAction(hubId);

  // Engagement tracking
  const { trackDocumentViewed, trackDocumentDownloaded } = useTrackEngagement(hubId);
  const { toast } = useToast();

  const handleBulkDownload = () => {
    toast({
      title: "Downloading",
      description: `Preparing ${selectedDocs.length} document${selectedDocs.length > 1 ? "s" : ""} for download...`,
    });
  };

  const handleBulkChangeCategory = () => {
    toast({
      title: "Change Category",
      description: `Select a new category for ${selectedDocs.length} document${selectedDocs.length > 1 ? "s" : ""}`,
    });
  };

  // Track document view
  useEffect(() => {
    if (selectedDocId) {
      trackDocumentViewed(selectedDocId);
    }
  }, [selectedDocId, trackDocumentViewed]);

  const isLoading = loadingClient || loadingInternal;
  const clientDocuments = clientDocs?.items || [];
  const internalDocuments = internalDocs?.items || [];

  // Filter documents by search
  const filteredDocs = (activeTab === "client" ? clientDocuments : internalDocuments).filter(
    (doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDocSelection = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleUpload = (data: {
    file: File;
    name: string;
    category: DocumentCategory;
    visibility: DocumentVisibility;
  }) => {
    uploadDocument(data, {
      onSuccess: () => setUploadModalOpen(false),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocument(id);
      if (selectedDocId === id) setSelectedDocId(null);
    }
  };

  const handleMoveVisibility = (id: string, visibility: DocumentVisibility) => {
    updateDocument({ documentId: id, visibility });
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedDocs.length} documents?`)) {
      bulkAction({ documentIds: selectedDocs, action: "delete" });
      setSelectedDocs([]);
    }
  };

  const handleBulkMoveVisibility = () => {
    const newVisibility = activeTab === "client" ? "internal" : "client";
    bulkAction({ documentIds: selectedDocs, action: "set_visibility", visibility: newVisibility });
    setSelectedDocs([]);
  };

  const handleDownload = async (documentId: string, _downloadUrl: string) => {
    trackDocumentDownloaded(documentId);
    try {
      const { downloadDocument } = await import("@/services/document.service");
      await downloadDocument(hubId, documentId);
    } catch {
      toast({ title: "Download failed", description: "Could not download the document.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-[hsl(var(--royal-blue))]">Documents</h1>
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentVisibility)} className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="client" className="flex-1 sm:flex-none">
              Client Documents
              <Badge variant="secondary" className="ml-2">
                {clientDocuments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="internal" className="flex-1 sm:flex-none">
              Internal Documents
              <Badge variant="secondary" className="ml-2">
                {internalDocuments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client" className="space-y-6">
            {/* Info Banner */}
            <div className="bg-[hsl(var(--gradient-blue))]/10 border border-[hsl(var(--gradient-blue))]/20 rounded-lg p-4 flex items-center gap-3">
              <Eye className="h-5 w-5 text-[hsl(var(--gradient-blue))]" />
              <p className="text-sm text-[hsl(var(--dark-grey))]">
                These documents are visible to clients in the portal
              </p>
            </div>

            <Input
              placeholder="Search client documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <DocumentsTable
              documents={filteredDocs}
              visibility="client"
              selectedDocs={selectedDocs}
              onDocSelect={toggleDocSelection}
              onDocClick={setSelectedDocId}
              onDelete={handleDelete}
              onMoveVisibility={handleMoveVisibility}
              onDownload={handleDownload}
            />
          </TabsContent>

          <TabsContent value="internal" className="space-y-6">
            {/* Info Banner */}
            <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-center gap-3">
              <EyeOff className="h-5 w-5 text-[hsl(var(--medium-grey))]" />
              <p className="text-sm text-[hsl(var(--dark-grey))]">
                These documents are only visible to your team — clients cannot see them
              </p>
            </div>

            <Input
              placeholder="Search internal documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <DocumentsTable
              documents={filteredDocs}
              visibility="internal"
              selectedDocs={selectedDocs}
              onDocSelect={toggleDocSelection}
              onDocClick={setSelectedDocId}
              onDelete={handleDelete}
              onMoveVisibility={handleMoveVisibility}
              onDownload={handleDownload}
            />
          </TabsContent>
        </Tabs>

        <BulkActionsBar
          selectedCount={selectedDocs.length}
          currentVisibility={activeTab}
          onDownload={handleBulkDownload}
          onMoveVisibility={handleBulkMoveVisibility}
          onChangeCategory={handleBulkChangeCategory}
          onDelete={handleBulkDelete}
        />

        <UploadDocumentDialog
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUpload}
          defaultVisibility={activeTab}
          isUploading={isUploading}
        />

        <DocumentDetailPanel
          document={selectedDocument || null}
          engagement={engagement}
          isOpen={!!selectedDocId}
          onClose={() => setSelectedDocId(null)}
          onSave={(updates) => updateDocument({ documentId: selectedDocId!, ...updates })}
          onDelete={() => selectedDocId && handleDelete(selectedDocId)}
          isSaving={isUpdating}
          isDeleting={isDeleting}
        />
      </div>

      <DocumentsStats
        clientDocuments={clientDocuments}
        internalDocuments={internalDocuments}
      />
    </div>
  );
}
