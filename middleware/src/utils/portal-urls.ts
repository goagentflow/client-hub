/**
 * Centralised portal URL construction.
 *
 * The client-hub SPA runs under /clienthub/ in production (BASE_URL).
 * All outbound portal links (emails, redirects) must use this prefix.
 */

import { env } from '../config/env.js';

const PORTAL_BASE = '/clienthub/portal';

/** Absolute URL to a portal hub page, e.g. https://goagentflow.com/clienthub/portal/{hubId} */
export function portalHubUrl(hubId: string, subPath?: string): string {
  const path = subPath
    ? `${PORTAL_BASE}/${hubId}/${subPath.replace(/^\//, '')}`
    : `${PORTAL_BASE}/${hubId}`;
  return new URL(path, env.CORS_ORIGIN).toString();
}

/** Absolute URL to a staff hub admin page, e.g. /clienthub/hub/{hubId}/messages */
export function hubAdminUrl(hubId: string, subPath: string): string {
  return new URL(`/clienthub/hub/${hubId}/${subPath.replace(/^\//, '')}`, env.CORS_ORIGIN).toString();
}
