/**
 * Authentication service
 *
 * Two auth modes:
 *   Mock/Demo: hardcoded credentials for wireframe testing
 *   MSAL: Azure AD login via popup, token acquisition for backend API
 *
 * Portal auth (hub password) works in both modes.
 */

import type { User, AuthMeResponse, HubAccessCheckResponse } from "@/types";
import { isMockApiEnabled, simulateDelay } from "./api";
import { mockStaffUser, mockClientUser, mockClientHubUser, mockHubs } from "./mock-data";
import { simpleHash } from "@/lib/hash";

// Demo credentials for wireframe testing
const DEMO_CREDENTIALS = {
  staff: { email: "hamish@goagentflow.com", password: "password123" },
  client: { email: "sarah@whitmorelaw.co.uk", password: "password123" },
  clientHub: { email: "alex@meridiandigital.co", password: "password123" },
};

/**
 * Login with demo credentials (mock mode only)
 * Throws on invalid credentials so React Query isError triggers.
 */
export async function loginWithCredentials(
  email: string,
  password: string
): Promise<User> {
  if (!isMockApiEnabled()) {
    throw new Error("Demo login is not available in production mode. Use Microsoft sign-in.");
  }

  await simulateDelay(500);

  if (email === DEMO_CREDENTIALS.staff.email && password === DEMO_CREDENTIALS.staff.password) {
    return mockStaffUser;
  }
  if (email === DEMO_CREDENTIALS.client.email && password === DEMO_CREDENTIALS.client.password) {
    return mockClientUser;
  }
  if (email === DEMO_CREDENTIALS.clientHub.email && password === DEMO_CREDENTIALS.clientHub.password) {
    return mockClientHubUser;
  }
  throw new Error("Invalid credentials");
}

/**
 * Login with MSAL (Azure AD popup)
 * Acquires a token for the backend API scope, then fetches user profile.
 */
export async function loginWithMsal(): Promise<User> {
  const { getMsalInstance, API_SCOPES } = await import("@/config/msal");
  const msalInstance = getMsalInstance();

  await msalInstance.initialize();
  const response = await msalInstance.loginPopup({ scopes: API_SCOPES });
  const account = response.account;
  if (!account) throw new Error("Microsoft sign-in did not return an account");

  msalInstance.setActiveAccount(account);

  const user = await fetchCurrentUser();
  if (!user) throw new Error("Failed to fetch user profile after sign-in");
  storeDemoSession(user);
  return user;
}

/**
 * Get access token for backend API calls (MSAL silent acquisition)
 * Returns null if no active session or token can't be acquired silently.
 */
export async function getAccessToken(): Promise<string | null> {
  if (isMockApiEnabled()) return null;

  try {
    const { getMsalInstance, isMsalConfigured, API_SCOPES } = await import("@/config/msal");
    if (!isMsalConfigured()) return null;

    const msalInstance = getMsalInstance();
    await msalInstance.initialize();

    // Try active account first, then fall back to first cached account (session recovery after reload)
    let account = msalInstance.getActiveAccount();
    if (!account) {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        account = accounts[0];
        msalInstance.setActiveAccount(account);
      }
    }
    if (!account) return null;

    const response = await msalInstance.acquireTokenSilent({
      scopes: API_SCOPES,
      account,
    });
    return response.accessToken;
  } catch {
    return null;
  }
}

/**
 * Fetch current user profile from middleware GET /auth/me
 */
async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { api } = await import("./api");
    const result = await api.get<{ user: User; hubAccess: unknown[] }>("/auth/me");
    return result.user;
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user (restores session on app init)
 *
 * Production: calls GET /auth/me (backend-validated)
 * Mock mode: reads from localStorage + mock data
 */
export async function getCurrentUser(): Promise<AuthMeResponse | null> {
  // Production mode: validate session against backend
  if (!isMockApiEnabled()) {
    try {
      const { isMsalConfigured } = await import("@/config/msal");
      if (!isMsalConfigured()) return null;

      const { api } = await import("./api");
      const result = await api.get<AuthMeResponse>("/auth/me");
      return result;
    } catch {
      return null;
    }
  }

  // Mock mode: restore from localStorage + mock data
  await simulateDelay(200);

  const storedRole = localStorage.getItem("userRole");
  const storedEmail = localStorage.getItem("userEmail");

  if (!storedRole || !storedEmail) {
    return null;
  }

  let user = mockStaffUser;
  if (storedRole === "client") {
    user = storedEmail === mockClientHubUser.email ? mockClientHubUser : mockClientUser;
  }
  const hubAccess = mockHubs
    .filter((h) => storedRole === "staff" || h.clientDomain === user.domain)
    .map((h) => ({
      hubId: h.id,
      hubName: h.companyName,
      accessLevel: "full_access" as const,
      grantedAt: h.createdAt,
    }));

  return { user, hubAccess };
}

/**
 * Check user's access to a specific hub
 */
export async function checkHubAccess(hubId: string): Promise<HubAccessCheckResponse> {
  await simulateDelay(100);

  const storedRole = localStorage.getItem("userRole");
  const hub = mockHubs.find((h) => h.id === hubId);

  if (!hub) {
    return {
      hasAccess: false,
      accessLevel: null,
      permissions: {
        canViewProposal: false,
        canViewDocuments: false,
        canViewVideos: false,
        canViewMessages: false,
        canViewMeetings: false,
        canViewQuestionnaire: false,
        canInviteMembers: false,
        canManageAccess: false,
      },
    };
  }

  const isStaff = storedRole === "staff";

  return {
    hasAccess: true,
    accessLevel: isStaff ? "full_access" : "view_only",
    permissions: {
      canViewProposal: true,
      canViewDocuments: true,
      canViewVideos: true,
      canViewMessages: true,
      canViewMeetings: true,
      canViewQuestionnaire: true,
      canInviteMembers: isStaff,
      canManageAccess: isStaff,
    },
  };
}

/**
 * Logout - clear session
 */
export async function logout(): Promise<void> {
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");

  // Also sign out of MSAL if active
  if (!isMockApiEnabled()) {
    try {
      const { getMsalInstance, isMsalConfigured } = await import("@/config/msal");
      if (isMsalConfigured()) {
        const msalInstance = getMsalInstance();
        const account = msalInstance.getActiveAccount();
        if (account) {
          await msalInstance.logoutPopup({ account });
        }
      }
    } catch {
      // Silent failure — localStorage already cleared
    }
  }
}

/**
 * Store demo session (for wireframe only)
 */
export function storeDemoSession(user: User): void {
  localStorage.setItem("userRole", user.role);
  localStorage.setItem("userEmail", user.email);
}

/**
 * Login with hub password (client portal access)
 */
export async function loginWithHubPassword(
  hubId: string,
  password: string
): Promise<User | null> {
  if (isMockApiEnabled()) return null;

  const { api } = await import("./api");
  const result = await api.post<{ data: { valid: boolean; token?: string } }>(
    `/public/hubs/${hubId}/verify-password`,
    { passwordHash: simpleHash(password) }
  );
  if (!result.data.valid || !result.data.token) return null;

  sessionStorage.setItem(`portal_token_${hubId}`, result.data.token);
  sessionStorage.setItem(`hub_access_${hubId}`, "true");

  const user: User = {
    id: `client-${hubId}`,
    email: "",
    displayName: "",
    role: "client",
    permissions: { isAdmin: false, canConvertHubs: false, canViewAllHubs: false },
    tenantId: "hub-access",
    domain: "",
  };

  localStorage.setItem("userRole", "client");
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("hubAccessId", hubId);

  return user;
}
