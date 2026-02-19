/**
 * Authentication service
 *
 * Handles user authentication via MSAL and auth state management.
 * For now, uses mock data. When MSAL is configured, this will acquire
 * real tokens for the backend API scope.
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
 * Login with demo credentials
 * Returns user if credentials match, null otherwise
 */
export async function loginWithCredentials(
  email: string,
  password: string
): Promise<User | null> {
  // Auth has no real backend — always use demo credentials
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
  return null;
}

/**
 * Get current authenticated user
 * Called on app init to restore session
 */
export async function getCurrentUser(): Promise<AuthMeResponse | null> {
  // Auth has no real backend — always use demo session from localStorage
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
  // Auth has no real backend — always use demo access checks
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
  // Auth has no real backend — always clear demo session
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
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
 * Hashes the password client-side, then verifies via Supabase RPC.
 * The stored hash never leaves the database.
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

  // Store portal token for this hub
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
