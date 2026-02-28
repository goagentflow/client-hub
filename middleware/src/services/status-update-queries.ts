/**
 * Status Update query helpers — shared between staff and portal routes.
 * Neutral service module: no auth, no HTTP. Just data access.
 */

import type { TenantRepository } from '../db/tenant-repository.js';
import { parsePagination } from '../utils/pagination.js';

export async function queryStatusUpdates(
  repo: TenantRepository,
  hubId: string,
  query: Record<string, unknown>,
) {
  const { page, pageSize } = parsePagination(query);
  const where = { hubId };

  const [items, totalItems] = await Promise.all([
    repo.hubStatusUpdate.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    repo.hubStatusUpdate.count({ where }),
  ]);

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}

/** Strip internal fields (tenantId, createdSource) for portal/client responses */
export function mapStatusUpdateForPortal(item: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...item };
  delete rest.tenantId;
  delete rest.createdSource;
  return rest;
}
