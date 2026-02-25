/**
 * Utilities for deriving safe display names.
 */

const GENERIC_NAMES = new Set(['portal user']);

export function normaliseDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (GENERIC_NAMES.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export function deriveNameFromEmail(email: unknown): string {
  if (typeof email !== 'string') return 'Portal User';

  const local = email.trim().toLowerCase().split('@')[0] || '';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Portal User';

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function resolveDisplayName(name: unknown, email: unknown): string {
  return normaliseDisplayName(name) || deriveNameFromEmail(email);
}
