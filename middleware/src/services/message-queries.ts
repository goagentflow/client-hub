/**
 * Message query helpers — shared between staff and portal routes.
 */

import type { HubMessage } from '@prisma/client';
import type { TenantRepository } from '../db/tenant-repository.js';
import { parsePagination } from '../utils/pagination.js';
import { resolveDisplayName } from '../utils/person-name.js';

export interface MessageDTO {
  id: string;
  hubId: string;
  senderType: string;
  senderEmail: string;
  senderName: string;
  body: string;
  createdAt: string;
}

function mapMessage(message: HubMessage): MessageDTO {
  return {
    id: message.id,
    hubId: message.hubId,
    senderType: message.senderType,
    senderEmail: message.senderEmail,
    senderName: resolveDisplayName(message.senderName, message.senderEmail),
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

export function mapMessageForPortal(message: HubMessage): MessageDTO {
  return mapMessage(message);
}

export async function queryMessages(
  repo: TenantRepository,
  hubId: string,
  query: Record<string, unknown>,
) {
  const { page, pageSize } = parsePagination(query);
  const where = { hubId };

  const [items, totalItems] = await Promise.all([
    repo.hubMessage.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }) as Promise<HubMessage[]>,
    repo.hubMessage.count({ where }),
  ]);

  return {
    items,
    mappedItems: items.map(mapMessage),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}
