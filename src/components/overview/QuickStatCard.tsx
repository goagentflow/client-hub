/**
 * QuickStatCard — Reusable clickable stat card for client hub overview grid.
 */

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface QuickStatCardProps {
  icon: ReactNode;
  title: string;
  isLoading: boolean;
  onClick?: () => void;
  linkText?: string;
  children: ReactNode;
}

export function QuickStatCard({
  icon,
  title,
  isLoading,
  onClick,
  linkText = "View all",
  children,
}: QuickStatCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[hsl(var(--medium-grey))] flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          children
        )}
        <div className="flex items-center justify-end mt-2 text-xs text-[hsl(var(--bold-royal-blue))]">
          {linkText} <ChevronRight className="w-3 h-3 ml-1" />
        </div>
      </CardContent>
    </Card>
  );
}
