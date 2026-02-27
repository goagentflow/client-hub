import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProposalVersion, ISODateString } from "@/types";

interface VersionHistoryPanelProps {
  versions: ProposalVersion[] | undefined;
  uploadedAt: ISODateString;
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function VersionHistoryPanel({ versions, uploadedAt }: VersionHistoryPanelProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-[hsl(var(--dark-grey))]">
          Version History
        </h3>
      </div>
      <div className="space-y-2">
        {versions && versions.length > 0 ? (
          <>
            {versions.map((version, index) => (
              <div key={`${version.id}-${index}`} className="flex items-center gap-2">
                {index === 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Current
                  </Badge>
                )}
                <span className={index === 0 ? "text-sm" : "text-sm text-muted-foreground"}>
                  v{version.versionNumber} - {formatDate(version.uploadedAt)}
                </span>
              </div>
            ))}
            {versions.length > 1 && (
              <Button variant="link" size="sm" className="p-0 h-auto text-sm">
                View previous versions
              </Button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Current
            </Badge>
            <span className="text-sm">v1 - {formatDate(uploadedAt)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
