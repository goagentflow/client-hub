/**
 * MSAL.js configuration for Azure AD authentication
 *
 * The frontend acquires tokens for the backend API's delegated scope.
 * Tokens are cached in sessionStorage by MSAL and refreshed silently.
 *
 * LIFECYCLE: Call initializeMsal() ONCE at app startup (in main.tsx),
 * before React renders. All other code uses getMsalInstance() which
 * returns the already-initialized singleton. Never call initialize()
 * or handleRedirectPromise() anywhere else.
 *
 * Env vars (set in .env or .env.local):
 *   VITE_AZURE_CLIENT_ID — frontend app registration ID
 *   VITE_AZURE_TENANT_ID — Azure AD tenant ID
 *   VITE_AZURE_BACKEND_CLIENT_ID — backend app registration ID (for scope URI)
 */

import { PublicClientApplication, type Configuration, type AuthenticationResult } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || '';
const backendClientId = import.meta.env.VITE_AZURE_BACKEND_CLIENT_ID || '';

let _msalInstance: PublicClientApplication | null = null;
let _initialized = false;
let _redirectResult: AuthenticationResult | null = null;

/** Check whether MSAL env vars are configured */
export function isMsalConfigured(): boolean {
  return Boolean(clientId && tenantId && backendClientId);
}

/**
 * Initialise MSAL and handle any pending redirect.
 * Call this ONCE at app startup before React renders.
 * Safe to call in mock mode — returns immediately.
 */
export async function initializeMsal(): Promise<void> {
  if (_initialized || !isMsalConfigured()) return;

  const msalConfig: Configuration = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin + import.meta.env.BASE_URL,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  };

  _msalInstance = new PublicClientApplication(msalConfig);
  await _msalInstance.initialize();

  // Process any pending redirect response (from loginRedirect flow)
  try {
    _redirectResult = await _msalInstance.handleRedirectPromise();
    if (_redirectResult?.account) {
      _msalInstance.setActiveAccount(_redirectResult.account);
    }
  } catch (err: unknown) {
    const msalErr = err as Record<string, unknown>;
    console.error('[MSAL] handleRedirectPromise failed:', {
      errorCode: msalErr.errorCode,
      errorMessage: msalErr.errorMessage,
      message: msalErr.message,
    });
  }

  _initialized = true;
}

/**
 * Get the MSAL instance (must be initialized first via initializeMsal).
 * Throws if not configured or not initialized.
 */
export function getMsalInstance(): PublicClientApplication {
  if (!_msalInstance) {
    throw new Error('MSAL not initialized. Call initializeMsal() at app startup.');
  }
  return _msalInstance;
}

/**
 * Get the redirect result from app startup.
 * Returns null if no redirect was pending or if not in redirect flow.
 */
export function getRedirectResult(): AuthenticationResult | null {
  return _redirectResult;
}

// Delegated scope defined in backend app registration.
export const API_SCOPES = [
  `api://${backendClientId || 'not-configured'}/access_as_user`,
];
