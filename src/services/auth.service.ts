/**
 * Authentication service
 *
 * Handles user authentication via MSAL and auth state management.
 * For now, uses mock data. When MSAL is configured, this will acquire
 * real tokens for the backend API scope.
 */

import type { User, AuthMeResponse, HubAccessCheckResponse } from "@/types";
import { api, isMockApiEnabled, isFeatureLive, simulateDelay } from "./api";
import { mockStaffUser, mockClientUser, mockClientHubUser, mockHubs } from "./mock-data";
import { verifyHubPassword } from "./supabase-data";
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
  if (isMockApiEnabled()) {
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

  // Real API call would go here
  return api.post<User>("/auth/login", { email, password });
}

/**
 * Get current authenticated user
 * Called on app init to restore session
 */
export async function getCurrentUser(): Promise<AuthMeResponse | null> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);

    // Check localStorage for demo session
    const storedRole = localStorage.getItem("userRole");
    const storedEmail = localStorage.getItem("userEmail");

    if (!storedRole || !storedEmail) {
      return null;
    }

    // Determine which user based on stored email
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

  return api.get<AuthMeResponse>("/auth/me");
}

/**
 * Check user's access to a specific hub
 */
export async function checkHubAccess(hubId: string): Promise<HubAccessCheckResponse> {
  if (isMockApiEnabled()) {
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

    // Staff has full access, clients have view access
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

  return api.get<HubAccessCheckResponse>(`/hubs/${hubId}/access`);
}

/**
 * Logout - clear session
 */
export async function logout(): Promise<void> {
  if (isMockApiEnabled()) {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    return;
  }

  return api.post("/auth/logout");
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
  if (!isFeatureLive("hubs")) return null;

  const result = await verifyHubPassword(hubId, simpleHash(password));
  if (!result.valid) return null;

  const user: User = {
    id: `client-${hubId}`,
    email: result.contact_email || "",
    displayName: result.contact_name || "",
    role: "client",
    permissions: { isAdmin: false, canConvertHubs: false, canViewAllHubs: false },
    tenantId: "hub-access",
    domain: result.client_domain || "",
  };

  localStorage.setItem("userRole", "client");
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("hubAccessId", hubId);

  return user;
}
