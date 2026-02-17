/**
 * Hub list filtering utilities
 *
 * Shared between mock and Supabase data paths to avoid duplication.
 */

import type { Hub, PaginationParams, PaginatedList } from "@/types";

/** Apply search, filter, sort, and pagination to a hub array */
export function applyHubFilters(
  hubs: Hub[],
  params?: PaginationParams
): PaginatedList<Hub> {
  let filtered = [...hubs];

  // Search
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (h) =>
        h.companyName.toLowerCase().includes(search) ||
        h.contactName.toLowerCase().includes(search)
    );
  }

  // Filters (supports multiple comma-separated field:value pairs)
  if (params?.filter) {
    const filters = params.filter.split(",");
    for (const f of filters) {
      const [field, value] = f.split(":");
      if (field === "status" && value) {
        filtered = filtered.filter((h) => h.status === value);
      }
      if (field === "hubType" && value) {
        filtered = filtered.filter((h) => h.hubType === value);
      }
    }
  }

  // Sort
  if (params?.sort) {
    const [field, direction] = params.sort.split(":");
    filtered.sort((a, b) => {
      const aVal = a[field as keyof Hub];
      const bVal = b[field as keyof Hub];
      const cmp = String(aVal).localeCompare(String(bVal));
      return direction === "desc" ? -cmp : cmp;
    });
  }

  // Pagination
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    },
  };
}
