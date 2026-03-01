/**
 * Client Card - Individual client card for the portfolio grid
 */

import { useNavigate } from "react-router-dom";
import { TrendingUp, AlertTriangle, Minus, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PortfolioClient, HealthStatus, ExpansionConfidence } from "@/types";

interface ClientCardProps {
  client: PortfolioClient;
}

const healthStatusConfig: Record<
  HealthStatus,
  { label: string; color: string; bgColor: string; icon: typeof TrendingUp }
> = {
  strong: {
    label: "Strong",
    color: "text-[hsl(var(--sage-green))]",
    bgColor: "bg-[hsl(var(--sage-green))]/10",
    icon: TrendingUp,
  },
  stable: {
    label: "Stable",
    color: "text-[hsl(var(--bold-royal-blue))]",
    bgColor: "bg-[hsl(var(--bold-royal-blue))]/10",
    icon: Minus,
  },
  at_risk: {
    label: "At Risk",
    color: "text-[hsl(var(--soft-coral))]",
    bgColor: "bg-[hsl(var(--soft-coral))]/10",
    icon: AlertTriangle,
  },
};

const expansionConfig: Record<
  ExpansionConfidence,
  { label: string; color: string }
> = {
  high: {
    label: "High potential",
    color: "bg-[hsl(var(--sage-green))]/10 text-[hsl(var(--sage-green))]",
  },
  medium: {
    label: "Medium potential",
    color: "bg-[hsl(var(--bold-royal-blue))]/10 text-[hsl(var(--bold-royal-blue))]",
  },
  low: {
    label: "Low potential",
    color: "bg-[hsl(var(--light-grey))] text-[hsl(var(--medium-grey))]",
  },
};

function formatLastActivity(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function ClientCard({ client }: ClientCardProps) {
  const navigate = useNavigate();
  const healthConfig = healthStatusConfig[client.healthStatus];
  const HealthIcon = healthConfig.icon;
  const expansion = client.expansionPotential
    ? expansionConfig[client.expansionPotential]
    : null;

  return (
    <Card
      data-testid="leadership-client-card"
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/hub/${client.hubId}`)}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[hsl(var(--dark-grey))] truncate">
              {client.name}
            </h3>
            <p className="text-xs text-[hsl(var(--medium-grey))]">
              Last activity: {formatLastActivity(client.lastActivity)}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-[hsl(var(--medium-grey))] flex-shrink-0" />
        </div>

        <div className="flex items-center gap-3 mb-3">
          {/* Health Score Circle */}
          <div
            className={`w-12 h-12 rounded-full ${healthConfig.bgColor} flex items-center justify-center`}
          >
            <span className={`text-lg font-bold ${healthConfig.color}`}>
              {client.healthScore}
            </span>
          </div>

          <div>
            <div className={`flex items-center gap-1 ${healthConfig.color}`}>
              <HealthIcon className="w-3 h-3" />
              <span className="text-sm font-medium">{healthConfig.label}</span>
            </div>
          </div>
        </div>

        {expansion && (
          <Badge variant="outline" className={`text-xs ${expansion.color}`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {expansion.label}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
