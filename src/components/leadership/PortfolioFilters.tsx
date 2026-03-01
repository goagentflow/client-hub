/**
 * Portfolio Filters - Sorting controls for the clients grid
 */

import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { PortfolioFilterParams } from "@/types";

interface PortfolioFiltersProps {
  filters: PortfolioFilterParams;
  onChange: (filters: PortfolioFilterParams) => void;
}

const sortOptions = [
  { value: "health", label: "Health Score" },
  { value: "expansion", label: "Expansion Potential" },
  { value: "name", label: "Client Name" },
  { value: "lastActivity", label: "Last Activity" },
] as const;

export function PortfolioFilters({ filters, onChange }: PortfolioFiltersProps) {
  const toggleOrder = () => {
    onChange({
      ...filters,
      order: filters.order === "asc" ? "desc" : "asc",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[hsl(var(--medium-grey))]">Sort by:</span>
      <Select
        value={filters.sortBy || "health"}
        onValueChange={(value) =>
          onChange({
            ...filters,
            sortBy: value as PortfolioFilterParams["sortBy"],
          })
        }
      >
        <SelectTrigger className="w-[160px]" aria-label="Sort clients">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={toggleOrder}
        title={filters.order === "asc" ? "Ascending" : "Descending"}
      >
        <ArrowUpDown
          className={`w-4 h-4 transition-transform ${
            filters.order === "desc" ? "rotate-180" : ""
          }`}
        />
      </Button>
    </div>
  );
}
