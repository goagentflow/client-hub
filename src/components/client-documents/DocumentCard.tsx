import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, FileImage, File, Download, Eye, Share2 } from "lucide-react";
import { CATEGORY_COLOURS, CATEGORY_LABELS } from "@/lib/document-categories";
import type { Document } from "@/types";

interface DocumentCardProps {
  document: Document;
  onView: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onShare: (doc: Document) => void;
}

const getDocumentIcon = (mimeType: string) => {
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return FileSpreadsheet;
  if (mimeType.startsWith("image/")) return FileImage;
  return File;
};

const getFileExtension = (mimeType: string, fileName: string): string => {
  const ext = fileName.split(".").pop()?.toUpperCase();
  if (ext && ext.length <= 4) return ext;
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "XLSX";
  if (mimeType.includes("csv")) return "CSV";
  if (mimeType.includes("png")) return "PNG";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "JPG";
  if (mimeType.includes("word")) return "DOCX";
  return "FILE";
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function DocumentCard({ document, onView, onDownload, onShare }: DocumentCardProps) {
  const Icon = getDocumentIcon(document.mimeType);
  const fileExtension = getFileExtension(document.mimeType, document.fileName);
  const colours = CATEGORY_COLOURS[document.category] ?? CATEGORY_COLOURS.other;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-[hsl(var(--gradient-blue))]/10">
            <Icon className="h-6 w-6 text-[hsl(var(--gradient-blue))]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[hsl(var(--dark-grey))] truncate">{document.name}</h3>
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--medium-grey))] mt-1 flex-wrap">
              <Badge variant="outline" className={`${colours.bg} ${colours.text} border-0 text-xs px-2 py-0`}>
                {CATEGORY_LABELS[document.category] ?? "Other"}
              </Badge>
              <span>{fileExtension}</span>
              <span>·</span>
              <span>{formatFileSize(document.fileSize)}</span>
              <span>·</span>
              <span>{formatDate(document.uploadedAt)}</span>
            </div>
            {document.description && (
              <p className="text-sm text-[hsl(var(--medium-grey))] mt-1.5 line-clamp-1">
                {document.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onView(document)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDownload(document)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onShare(document)}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
