import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Document } from "@/types";

interface DocumentsStatsProps {
  clientDocuments: Document[];
  internalDocuments: Document[];
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function DocumentsStats({ clientDocuments, internalDocuments }: DocumentsStatsProps) {
  const allDocs = [...clientDocuments, ...internalDocuments];
  const totalStorage = allDocs.reduce((sum, doc) => sum + doc.fileSize, 0);

  // Find most viewed client document
  const mostViewed = clientDocuments.reduce<Document | null>((max, doc) => {
    if (!max || doc.views > max.views) return doc;
    return max;
  }, null);

  // Get recent activity (most recently uploaded docs)
  const recentDocs = [...allDocs]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 3);

  return (
    <div className="w-64 space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-[hsl(var(--dark-grey))]">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[hsl(var(--medium-grey))]">Client documents:</span>
              <span className="font-medium">{clientDocuments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--medium-grey))]">Internal documents:</span>
              <span className="font-medium">{internalDocuments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--medium-grey))]">Total storage:</span>
              <span className="font-medium">{formatFileSize(totalStorage)}</span>
            </div>
            <Separator />
            {mostViewed && mostViewed.views > 0 && (
              <div>
                <p className="text-[hsl(var(--medium-grey))]">Most viewed:</p>
                <p className="font-medium">{mostViewed.name} ({mostViewed.views} views)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-[hsl(var(--dark-grey))]">Recent Activity</h3>
          <div className="space-y-3 text-sm">
            {recentDocs.map((doc) => (
              <div key={doc.id}>
                <p className="text-[hsl(var(--dark-grey))]">
                  {doc.uploadedByName} uploaded {doc.name}
                </p>
                <p className="text-xs text-[hsl(var(--medium-grey))]">
                  {formatTimeAgo(doc.uploadedAt)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
