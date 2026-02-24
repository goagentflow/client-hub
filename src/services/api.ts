/**
 * Base API client with error handling
 *
 * Provides a thin wrapper around fetch with:
 * - Automatic token injection (when MSAL is configured)
 * - Consistent error handling with ApiError shape
 * - Configurable base URL for environment switching
 *
 * For now, all calls are intercepted by mock implementations.
 * When middleware is ready, set USE_MOCK_API=false and configure API_BASE_URL.
 */

import type { ApiError } from "@/types";

// Configuration - will be environment variables in production
const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "https://api.agentflow.com",
  useMockApi: import.meta.env.VITE_USE_MOCK_API !== "false", // Default to mock
};

// Base path for portal route matching (accounts for /clienthub/ deploy prefix)
const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
const PORTAL_PATH_RE = new RegExp(`^${BASE_PATH}/portal/([^/]+)`);

// Token getter - will be replaced with MSAL token acquisition
let getAccessToken: (() => Promise<string | null>) | null = null;

// 401 handler - called when session expires or token is invalid
let onUnauthorized: (() => void) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>): void {
  getAccessToken = getter;
}

/**
 * Register a handler for 401 Unauthorized responses
 * Typically used to clear session and redirect to login
 */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

// API error class for typed error handling
export class ApiRequestError extends Error {
  constructor(
    public readonly error: ApiError,
    public readonly status: number
  ) {
    super(error.message);
    this.name = "ApiRequestError";
  }
}

// Check if we should use mock API
export function isMockApiEnabled(): boolean {
  return config.useMockApi;
}

// Build full URL for an endpoint
function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`/api/v1${endpoint}`, config.apiBaseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }
  return url.toString();
}

// Positive allowlist: only these endpoint patterns receive portal tokens.
// Derived from actual route mounts in middleware/src/routes/index.ts,
// frontend service calls in src/services/*.service.ts,
// and PortalDetail.tsx route config.
const PORTAL_ENDPOINT_PATTERNS = [
  /^\/public\//,                                    // public endpoints (portal-meta, verify-password)
  /^\/hubs\/[^/]+\/portal(?:\/|$)/,                 // portal sub-routes
  /^\/hubs\/[^/]+\/instant-answer(?:\/|$)/,          // client intelligence: instant answers
  /^\/hubs\/[^/]+\/decision-queue(?:\/|$)/,          // client intelligence: decision queue
  /^\/hubs\/[^/]+\/performance(?:\/|$)/,             // client intelligence: performance narratives
  /^\/hubs\/[^/]+\/history$/,                        // client intelligence: institutional memory
  /^\/hubs\/[^/]+\/risk-alerts(?:\/|$)/,             // client intelligence: risk alerts
  /^\/hubs\/[^/]+\/meetings\/[^/]+\/prep(?:\/|$)/,   // client intelligence: meeting prep
  /^\/hubs\/[^/]+\/meetings\/[^/]+\/follow-up(?:\/|$)/, // client intelligence: meeting follow-up
];

// Events: portal can only POST (engagement tracking), GET is staff-only
const PORTAL_EVENTS_PATTERN = /^\/hubs\/[^/]+\/events$/;

// Core fetch wrapper with auth and error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  queryParams?: Record<string, string>
): Promise<T> {
  const url = buildUrl(endpoint, queryParams);

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  // --- Token injection (strict order) ---
  let usedPortalToken = false;
  let portalHubIdForCleanup: string | null = null;

  // Step 1: Resolve staff token (MSAL or dev header)
  if (getAccessToken) {
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      const email = localStorage.getItem('userEmail');
      if (email) headers['X-Dev-User-Email'] = email;
    }
  } else {
    const email = localStorage.getItem('userEmail');
    if (email) headers['X-Dev-User-Email'] = email;
  }

  // Step 2: Portal token — only if NO staff auth was set above (Bearer OR dev header)
  const hasStaffAuth = !!headers["Authorization"] || !!headers["X-Dev-User-Email"];
  if (!hasStaffAuth) {
    const portalMatch = window.location.pathname.match(PORTAL_PATH_RE);
    if (portalMatch) {
      const portalHubId = portalMatch[1];
      const portalToken = sessionStorage.getItem(`portal_token_${portalHubId}`);
      if (portalToken) {
        const method = (options.method || 'GET').toUpperCase();
        const isPortalEndpoint = PORTAL_ENDPOINT_PATTERNS.some(p => p.test(endpoint))
          || (method === 'POST' && PORTAL_EVENTS_PATTERN.test(endpoint));
        // Verify endpoint hubId matches page hubId (no cross-hub token sends)
        const endpointHubMatch = endpoint.match(/^\/hubs\/([^/]+)\//);
        const endpointHubId = endpointHubMatch?.[1];
        const hubIdMatches = !endpointHubId || endpointHubId === portalHubId;

        if (isPortalEndpoint && hubIdMatches) {
          headers["Authorization"] = `Bearer ${portalToken}`;
          usedPortalToken = true;
          portalHubIdForCleanup = portalHubId;
        }
      }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle non-OK responses
  if (!response.ok) {
    // Handle 401 Unauthorized
    if (response.status === 401) {
      if (usedPortalToken && portalHubIdForCleanup) {
        // Portal token rejected — clear stale session, redirect to password gate
        sessionStorage.removeItem(`portal_token_${portalHubIdForCleanup}`);
        sessionStorage.removeItem(`hub_access_${portalHubIdForCleanup}`);
        window.location.href = `${BASE_PATH}/portal/${portalHubIdForCleanup}`;
        // Short-circuit to prevent noisy error handling before navigation
        throw new ApiRequestError(
          { code: 'UNAUTHENTICATED', message: 'Portal session expired' },
          401
        );
      }
      // Staff auth failure — use existing global handler
      if (onUnauthorized) onUnauthorized();
    }

    let error: ApiError;
    try {
      error = await response.json();
    } catch {
      error = {
        code: response.status === 401 ? "UNAUTHENTICATED" : "INTERNAL_ERROR",
        message: `Request failed with status ${response.status}`,
      };
    }
    throw new ApiRequestError(error, response.status);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// HTTP method helpers
export const api = {
  get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return apiFetch<T>(endpoint, { method: "GET" }, params);
  },

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return apiFetch<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body: unknown): Promise<T> {
    return apiFetch<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint, { method: "DELETE" });
  },

  // For file uploads - doesn't set Content-Type (let browser set multipart boundary)
  upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return apiFetch<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: {}, // Clear Content-Type
    });
  },
};

// Simulate network delay for mock API (makes UI feel more realistic)
export function simulateDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
