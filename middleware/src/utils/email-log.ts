/**
 * Log-safe email helpers.
 *
 * Never log full email addresses in structured logs.
 */

export function emailDomainForLogs(email: string | null | undefined): string {
  if (!email) return 'unknown';
  const normalised = email.trim().toLowerCase();
  const at = normalised.indexOf('@');
  if (at < 0 || at === normalised.length - 1) {
    return 'unknown';
  }
  return normalised.slice(at + 1);
}

