/**
 * DocumentPreviewRenderer — shared inline preview for PDF + images.
 *
 * - PDF: rendered via <iframe>
 * - Image (JPEG, PNG, GIF, WebP): rendered via <img>
 * - Office docs: Google Docs Viewer behind VITE_ENABLE_GVIEW_PREVIEW flag (disabled by default)
 * - Other: fallback panel with Download + Open in new tab actions
 *
 * Fetches a preview URL from the /preview endpoint (does NOT increment downloads).
 * Tracks expiresAt and shows a refresh button when the URL expires.
 */

import { useState, useEffect, useCallback } from "react";
import { FileText, Download, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDocumentPreviewUrl } from "@/services/document.service";

const GVIEW_ENABLED = import.meta.env.VITE_ENABLE_GVIEW_PREVIEW === "true";

interface DocumentPreviewRendererProps {
  hubId: string;
  documentId: string;
  mimeType: string;
  portal?: boolean;
  onDownload?: () => void;
}

type PreviewType = "pdf" | "image" | "office" | "unsupported";

function getPreviewType(mimeType: string): PreviewType {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType.includes("word") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint")
  ) {
    return "office";
  }
  return "unsupported";
}

export function DocumentPreviewRenderer({
  hubId,
  documentId,
  mimeType,
  portal,
  onDownload,
}: DocumentPreviewRendererProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const previewType = getPreviewType(mimeType);

  const fetchPreviewUrl = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsExpired(false);
    try {
      const result = await getDocumentPreviewUrl(hubId, documentId, { portal });
      setUrl(result.url);
      setExpiresAt(result.expiresAt);
    } catch {
      setError("Could not load preview");
    } finally {
      setIsLoading(false);
    }
  }, [hubId, documentId, portal]);

  useEffect(() => {
    fetchPreviewUrl();
  }, [fetchPreviewUrl]);

  // Track expiry
  useEffect(() => {
    if (!expiresAt) return;
    const expiryMs = new Date(expiresAt).getTime() - Date.now();
    if (expiryMs <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setTimeout(() => setIsExpired(true), expiryMs);
    return () => clearTimeout(timer);
  }, [expiresAt]);

  // Loading state
  if (isLoading) {
    return (
      <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gradient-blue))]" />
      </div>
    );
  }

  // Error state
  if (error || !url) {
    return (
      <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-3">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error || "Preview not available"}</p>
          <Button variant="outline" size="sm" onClick={fetchPreviewUrl}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Expired URL — show refresh prompt
  if (isExpired) {
    return (
      <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-3">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Preview link has expired</p>
          <Button variant="outline" size="sm" onClick={fetchPreviewUrl}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh preview
          </Button>
        </div>
      </div>
    );
  }

  // PDF preview
  if (previewType === "pdf") {
    return (
      <iframe
        src={url}
        className="w-full aspect-[4/3] rounded-lg border"
        title="Document preview"
      />
    );
  }

  // Image preview
  if (previewType === "image") {
    return (
      <div className="w-full rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
        <img
          src={url}
          alt="Document preview"
          className="max-w-full max-h-[60vh] object-contain"
        />
      </div>
    );
  }

  // Office docs — feature-flagged Google Docs Viewer
  if (previewType === "office" && GVIEW_ENABLED) {
    const gviewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    return (
      <iframe
        src={gviewUrl}
        className="w-full aspect-[4/3] rounded-lg border"
        title="Document preview"
      />
    );
  }

  // Fallback — unsupported or office without gview
  return (
    <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center space-y-3">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Preview not available for this file type
        </p>
        <div className="flex gap-2 justify-center">
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in new tab
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
