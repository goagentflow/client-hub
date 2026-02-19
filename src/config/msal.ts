/**
 * MSAL.js configuration for Azure AD authentication
 *
 * The frontend acquires tokens for the backend API's delegated scope.
 * Tokens are cached in sessionStorage by MSAL and refreshed silently.
 *
 * Env vars (set in .env or .env.local):
 *   VITE_AZURE_CLIENT_ID — frontend app registration ID
 *   VITE_AZURE_TENANT_ID — Azure AD tenant ID
 *   VITE_AZURE_BACKEND_CLIENT_ID — backend app registration ID (for scope URI)
 *
 * MSAL is lazily initialised — the instance is only created when env vars are set.
 * This prevents errors when running in mock/demo mode without Azure config.
 */

import { PublicClientApplication, type Configuration } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || '';
const backendClientId = import.meta.env.VITE_AZURE_BACKEND_CLIENT_ID || '';

let _msalInstance: PublicClientApplication | null = null;

/**
 * Get the MSAL instance (lazy — created on first call).
 * Throws if Azure env vars are not configured.
 */
export function getMsalInstance(): PublicClientApplication {
  if (_msalInstance) return _msalInstance;

  if (!clientId || !tenantId || !backendClientId) {
    throw new Error(
      'MSAL not configured: set VITE_AZURE_CLIENT_ID, VITE_AZURE_TENANT_ID, and VITE_AZURE_BACKEND_CLIENT_ID'
    );
  }

  const msalConfig: Configuration = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  };

  _msalInstance = new PublicClientApplication(msalConfig);
  return _msalInstance;
}

/** Check whether MSAL env vars are configured */
export function isMsalConfigured(): boolean {
  return Boolean(clientId && tenantId && backendClientId);
}

// Delegated scope defined in backend app registration.
// 'not-configured' fallback is a safe no-op — isMsalConfigured() prevents usage when env vars are missing.
export const API_SCOPES = [
  `api://${backendClientId || 'not-configured'}/access_as_user`,
];
