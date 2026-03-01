/**
 * Portfolio Overview Card - Summary metrics for leadership dashboard
 */

import { Users, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PortfolioOverview } from "@/types";

interface PortfolioOverviewCardProps {
  overview: PortfolioOverview;
}

interface MetricItemProps {
  icon: typeof Users;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  testId: string;
}

function MetricItem({ icon: Icon, label, value, color, bgColor, testId }: MetricItemProps) {
  return (
    <div className="flex items-center gap-4" data-testid={testId}>
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[hsl(var(--dark-grey))]">{value}</p>
        <p className="text-sm text-[hsl(var(--medium-grey))]">{label}</p>
      </div>
    </div>
  );
}

export function PortfolioOverviewCard({ overview }: PortfolioOverviewCardProps) {
  return (
    <Card data-testid="portfolio-overview-card">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <MetricItem
            icon={Users}
            label="Total Clients"
            value={overview.totalClients}
            color="text-[hsl(var(--bold-royal-blue))]"
            bgColor="bg-[hsl(var(--bold-royal-blue))]/10"
            testId="portfolio-metric-total-clients"
          />
          <MetricItem
            icon={AlertTriangle}
            label="At Risk"
            value={overview.atRiskCount}
            color="text-[hsl(var(--soft-coral))]"
            bgColor="bg-[hsl(var(--soft-coral))]/10"
            testId="portfolio-metric-at-risk"
          />
          <MetricItem
            icon={TrendingUp}
            label="Expansion Ready"
            value={overview.expansionReadyCount}
            color="text-[hsl(var(--sage-green))]"
            bgColor="bg-[hsl(var(--sage-green))]/10"
            testId="portfolio-metric-expansion-ready"
          />
          <MetricItem
            icon={Activity}
            label="Avg Health Score"
            value={overview.avgHealthScore}
            color="text-[hsl(var(--dark-grey))]"
            bgColor="bg-[hsl(var(--light-grey))]"
            testId="portfolio-metric-avg-health-score"
          />
        </div>
      </CardContent>
    </Card>
  );
}
