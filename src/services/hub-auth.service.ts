/**
 * Hub portal authentication service
 *
 * Handles client portal access via hub password verification.
 * Separated from auth.service.ts to keep files within 300-line limit.
 */

import type { User } from "@/types";
import { isMockApiEnabled } from "./api";
import { simpleHash } from "@/lib/hash";

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
