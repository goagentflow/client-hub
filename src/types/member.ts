/**
 * Member and access management types
 *
 * Handles invites, share links, and access control.
 * Domain restriction enforced server-side for client invites.
 */

import type { EntityId, ISODateString, ResourceRef } from "./common";
import type { AccessLevel, HubPermissions } from "./auth";

// Hub member (user with access to hub)
export interface HubMember {
  id: EntityId;
  hubId: EntityId;
  userId: EntityId;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: MemberRole;
  accessLevel: AccessLevel;
  permissions: HubPermissions;
  invitedBy: EntityId;
  invitedByName: string;
  joinedAt: ISODateString;
  lastActiveAt: ISODateString | null;
}

export type MemberRole = "staff" | "client";

// Pending invite
export interface HubInvite {
  id: EntityId;
  hubId: EntityId;
  email: string;
  accessLevel: AccessLevel;
  invitedBy: EntityId;
  invitedByName: string;
  invitedAt: ISODateString;
  expiresAt: ISODateString;
  message?: string | null;
  status: InviteStatus;
}

// Invite status (lowercase for consistency)
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

// Create invite request
export interface CreateInviteRequest {
  email: string;
  accessLevel: AccessLevel;
  message?: string; // Optional personal message in invite email
}

// Update member access request
export interface UpdateMemberAccessRequest {
  accessLevel: AccessLevel;
}

// Share link entity
export interface ShareLink {
  id: EntityId;
  hubId: EntityId;
  token: string;
  url: string;
  accessLevel: AccessLevel;
  createdBy: EntityId;
  createdByName: string;
  createdAt: ISODateString;
  expiresAt: ISODateString | null;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
}

// Create share link request
export interface CreateShareLinkRequest {
  accessLevel: AccessLevel;
  expiresInDays?: number;
  maxUses?: number;
}

// Accept invite request (via token)
export interface AcceptInviteRequest {
  token: string;
}

// Accept invite response
export interface AcceptInviteResponse {
  hubId: EntityId;
  hubName: string;
  accessLevel: AccessLevel;
}

// Member activity action enum (for consistent audit trails)
export enum MemberActivityAction {
  JOINED = "joined",
  INVITED = "invited",
  ACCESS_CHANGED = "access_changed",
  REMOVED = "removed",
  VIEWED_PROPOSAL = "viewed_proposal",
  DOWNLOADED_DOCUMENT = "downloaded_document",
  SENT_MESSAGE = "sent_message",
  JOINED_MEETING = "joined_meeting",
}

// Member activity for people section
export interface MemberActivity {
  memberId: EntityId;
  memberName: string;
  action: MemberActivityAction;
  timestamp: ISODateString;
  details: string | null;
  resource: ResourceRef | null; // What resource was acted upon
}
