/**
 * Authentication and authorization types
 *
 * Phase 2: Added UserPermissions for granular access control (leadership views, hub conversion)
 */

import type { EntityId, ISODateString } from "./common";

// User roles
export type UserRole = "staff" | "client";

// User permissions for granular access control (Phase 2)
export interface UserPermissions {
  isAdmin: boolean; // Required for /leadership/* endpoints
  canConvertHubs: boolean; // Can convert pitch hubs to client hubs
  canViewAllHubs: boolean; // Can see all hubs, not just assigned ones
}

// Current authenticated user
export interface User {
  id: EntityId;
  email: string;
  displayName: string;
  role: UserRole;
  permissions: UserPermissions; // Phase 2: Granular permissions
  avatarUrl?: string;
  tenantId: string; // Azure AD tenant ID (read-only, for debugging)
  domain: string; // Email domain (read-only, for display/debugging)
}

// Helper to check admin access
export function hasAdminAccess(user: User): boolean {
  return user.role === "staff" && user.permissions.isAdmin;
}

// Auth state for the application
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
}

// MSAL token scopes - backend API only, no Graph scopes on client
export interface TokenScopes {
  api: string; // e.g., "api://agentflow-backend/access_as_user"
}

// Response from /api/v1/auth/me
export interface AuthMeResponse {
  user: User;
  hubAccess: HubAccessSummary[];
}

// Summary of user's access to a hub
export interface HubAccessSummary {
  hubId: EntityId;
  hubName: string;
  accessLevel: AccessLevel;
  grantedAt: ISODateString;
}

// Access levels for hub resources
export type AccessLevel =
  | "full_access"
  | "proposal_only"
  | "documents_only"
  | "view_only";

// Permission check response
export interface HubAccessCheckResponse {
  hasAccess: boolean;
  accessLevel: AccessLevel | null;
  permissions: HubPermissions;
}

// Granular permissions within a hub
export interface HubPermissions {
  canViewProposal: boolean;
  canViewDocuments: boolean;
  canViewVideos: boolean;
  canViewMessages: boolean;
  canViewMeetings: boolean;
  canViewQuestionnaire: boolean;
  canInviteMembers: boolean;
  canManageAccess: boolean;
}
