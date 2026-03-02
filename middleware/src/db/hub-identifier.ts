/**
 * Hub identifier resolver.
 *
 * Supports canonical hub IDs and legacy company-name slugs
 * (for example: "Curious Health" -> "curioushealth").
 */

import { getPrisma } from './prisma.js';

const MIN_NORMALIZED_LENGTH = 3;

export function normalizeHubIdentifier(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function resolveHubId(
  identifier: string,
  options: { publishedOnly?: boolean } = {},
): Promise<string | null> {
  const raw = identifier.trim();
  if (!raw) return null;

  const prisma = getPrisma();
  const publishedOnly = options.publishedOnly === true;

  const byId = await prisma.hub.findFirst({
    where: publishedOnly ? { id: raw, isPublished: true } : { id: raw },
    select: { id: true },
  });
  if (byId) return byId.id;

  const normalizedIdentifier = normalizeHubIdentifier(raw);
  if (normalizedIdentifier.length < MIN_NORMALIZED_LENGTH) return null;

  const candidates = await prisma.hub.findMany({
    where: publishedOnly ? { isPublished: true } : {},
    select: { id: true, companyName: true },
  });

  const matches = candidates.filter(
    (hub) => normalizeHubIdentifier(hub.companyName) === normalizedIdentifier,
  );

  if (matches.length !== 1) return null;
  return matches[0]?.id ?? null;
}
