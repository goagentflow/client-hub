import { useState, useRef } from "react";
import { Upload, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import type { DocumentCategory, DocumentVisibility } from "@/types";

interface UploadDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: {
    file: File;
    name: string;
    category: DocumentCategory;
    visibility: DocumentVisibility;
    description?: string;
  }) => void;
  defaultVisibility: DocumentVisibility;
  isUploading: boolean;
}

export function UploadDocumentDialog({
  isOpen,
  onClose,
  onUpload,
  defaultVisibility,
  isUploading,
}: UploadDocumentDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [description, setDescription] = useState("");

  const isClientTab = defaultVisibility === "client";
  const descriptionRequired = isClientTab;
  const descriptionMissing = descriptionRequired && !description.trim();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      }
    }
  };

  const handleSubmit = () => {
    if (!selectedFile || !name || !category || descriptionMissing) return;

    onUpload({
      file: selectedFile,
      name,
      category,
      visibility: defaultVisibility,
      description: description.trim() || undefined,
    });

    // Reset form
    setSelectedFile(null);
    setName("");
    setCategory("other");
    setDescription("");
  };

  const handleClose = () => {
    setSelectedFile(null);
    setName("");
    setCategory("other");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl text-[hsl(var(--royal-blue))]">
            Upload {isClientTab ? "Client" : "Internal"} Document
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
            {selectedFile ? (
              <div>
                <p className="text-[hsl(var(--dark-grey))] font-medium mb-2">
                  {selectedFile.name}
                </p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Change file
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-[hsl(var(--dark-grey))] font-medium mb-2">
                  Drag and drop files here
                </p>
                <p className="text-sm text-[hsl(var(--medium-grey))] mb-4">or</p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose files
                </Button>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Document Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document name"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
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

          <div className="space-y-2">
            <Label>
              Summary
              {descriptionRequired && <span className="text-[hsl(var(--soft-coral))] ml-1">*</span>}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for the client — what is this document and why is it relevant?"
              rows={3}
            />
            {descriptionMissing && selectedFile && (
              <p className="text-xs text-[hsl(var(--soft-coral))]">
                A summary is required for client-visible documents
              </p>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded text-sm text-[hsl(var(--medium-grey))]">
            {isClientTab ? (
              <p className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                These files will be visible to clients
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                These files will NOT be visible to clients
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="bg-[hsl(var(--gradient-blue))] hover:bg-[hsl(var(--gradient-blue))]/90 text-white"
              onClick={handleSubmit}
              disabled={!selectedFile || !name || descriptionMissing || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
