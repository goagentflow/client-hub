/**
 * Canonical staff cross-product entry URLs.
 * Keep all launcher/switcher links in one place to avoid drift.
 */
export const PRODUCT_LINKS = {
  CLIENT_HUB: "/hubs",
  COPILOT_AUTH: "/assess/auth?bridge=true&sso=azure",
  CRM_ADMIN: "/assess/auth?bridge=true&sso=azure&return_to=/assess/admin",
  DISCOVERY_ADMIN: "/assess/auth?bridge=true&sso=azure&return_to=/discovery/admin/dashboard",
} as const;

