/**
 * Member service
 *
 * Operations for hub member management, invites, and share links.
 * Domain restriction is enforced server-side for client invites.
 */

import type {
  HubMember,
  HubInvite,
  CreateInviteRequest,
  UpdateMemberAccessRequest,
  ShareLink,
  CreateShareLinkRequest,
  AcceptInviteResponse,
  MemberActivity,
  PaginatedList,
  PaginationParams,
  AccessLevel,
} from "@/types";
import { MemberActivityAction } from "@/types";
import { api, isMockApiEnabled, simulateDelay } from "./api";
import { mockMembers, mockHubs } from "./mock-data";

// Mock invites
const mockInvites: HubInvite[] = [];

// Mock share links
const mockShareLinks: ShareLink[] = [];

/**
 * Get members of a hub
 */
export async function getMembers(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<HubMember>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);

    const filtered = mockMembers.filter((m) => m.hubId === hubId);

    return {
      items: filtered,
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: filtered.length,
        totalPages: 1,
      },
    };
  }

  return api.get<PaginatedList<HubMember>>(`/hubs/${hubId}/members`);
}

/**
 * Get pending invites for a hub
 */
export async function getInvites(hubId: string): Promise<HubInvite[]> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    return mockInvites.filter((i) => i.hubId === hubId && i.status === "pending");
  }

  return api.get<HubInvite[]>(`/hubs/${hubId}/invites`);
}

/**
 * Create an invite to a hub
 */
export async function createInvite(
  hubId: string,
  data: CreateInviteRequest
): Promise<HubInvite> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);

    // Validate domain restriction for client invites
    const hub = mockHubs.find((h) => h.id === hubId);
    const emailDomain = data.email.split("@")[1];
    if (hub && emailDomain !== hub.clientDomain && emailDomain !== "goagentflow.com") {
      throw new Error(`Can only invite users from ${hub.clientDomain} or goagentflow.com`);
    }

    const invite: HubInvite = {
      id: `invite-${Date.now()}`,
      hubId,
      email: data.email,
      accessLevel: data.accessLevel,
      invitedBy: "user-staff-1",
      invitedByName: "Hamish Nicklin",
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: data.message || null,
      status: "pending",
    };

    mockInvites.push(invite);
    return invite;
  }

  return api.post<HubInvite>(`/hubs/${hubId}/invites`, data);
}

/**
 * Revoke an invite
 */
export async function revokeInvite(hubId: string, inviteId: string): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    const invite = mockInvites.find((i) => i.id === inviteId);
    if (invite) invite.status = "revoked";
    return;
  }

  return api.delete(`/hubs/${hubId}/invites/${inviteId}`);
}

/**
 * Update member access level
 */
export async function updateMemberAccess(
  hubId: string,
  memberId: string,
  data: UpdateMemberAccessRequest
): Promise<HubMember> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);

    const member = mockMembers.find((m) => m.id === memberId);
    if (!member) throw new Error("Member not found");
    member.accessLevel = data.accessLevel;
    return member;
  }

  return api.patch<HubMember>(`/hubs/${hubId}/members/${memberId}`, data);
}

/**
 * Remove member from hub
 */
export async function removeMember(hubId: string, memberId: string): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const index = mockMembers.findIndex((m) => m.id === memberId);
    if (index !== -1) mockMembers.splice(index, 1);
    return;
  }

  return api.delete(`/hubs/${hubId}/members/${memberId}`);
}

/**
 * Create a share link for a hub
 */
export async function createShareLink(
  hubId: string,
  data: CreateShareLinkRequest
): Promise<ShareLink> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);

    const link: ShareLink = {
      id: `link-${Date.now()}`,
      hubId,
      token: `sharetoken-${Date.now()}`,
      url: `https://hub.agentflow.com/join/sharetoken-${Date.now()}`,
      accessLevel: data.accessLevel,
      createdBy: "user-staff-1",
      createdByName: "Hamish Nicklin",
      createdAt: new Date().toISOString(),
      expiresAt: data.expiresInDays
        ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null,
      maxUses: data.maxUses || null,
      useCount: 0,
      isActive: true,
    };

    mockShareLinks.push(link);
    return link;
  }

  return api.post<ShareLink>(`/hubs/${hubId}/share-link`, data);
}

/**
 * Accept an invite (via token)
 */
export async function acceptInvite(token: string): Promise<AcceptInviteResponse> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);

    const invite = mockInvites.find((i) => i.token === token);
    if (!invite) throw new Error("Invalid or expired invite");
    if (invite.status !== "pending") throw new Error("Invite already used or expired");

    const hub = mockHubs.find((h) => h.id === invite.hubId);
    invite.status = "accepted";

    return {
      hubId: invite.hubId,
      hubName: hub?.companyName || "Unknown Hub",
      accessLevel: invite.accessLevel,
    };
  }

  return api.post<AcceptInviteResponse>(`/public/invites/${token}/accept`);
}

/**
 * Get member activity for a hub
 */
export async function getMemberActivity(
  hubId: string,
  params?: PaginationParams
): Promise<PaginatedList<MemberActivity>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);

    const activities: MemberActivity[] = [
      { memberId: "member-1", memberName: "Sarah Mitchell", action: MemberActivityAction.VIEWED_PROPOSAL, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), details: "Viewed slides 1-8", resource: { type: "proposal", id: "proposal-1" } },
      { memberId: "member-1", memberName: "Sarah Mitchell", action: MemberActivityAction.DOWNLOADED_DOCUMENT, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), details: "Downloaded Pricing Breakdown", resource: { type: "document", id: "doc-2" } },
    ];

    return {
      items: activities,
      pagination: { page: 1, pageSize: 20, totalItems: activities.length, totalPages: 1 },
    };
  }

  return api.get<PaginatedList<MemberActivity>>(`/hubs/${hubId}/members/activity`);
}

/**
 * Get portal members (client view)
 */
export async function getPortalMembers(
  hubId: string
): Promise<PaginatedList<HubMember>> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    const filtered = mockMembers.filter((m) => m.hubId === hubId);

    return {
      items: filtered,
      pagination: { page: 1, pageSize: 20, totalItems: filtered.length, totalPages: 1 },
    };
  }

  return api.get<PaginatedList<HubMember>>(`/hubs/${hubId}/portal/members`);
}

/**
 * Invite colleague from portal (client action)
 * Enforces domain restriction
 */
export async function inviteColleague(
  hubId: string,
  email: string,
  accessLevel: AccessLevel
): Promise<HubInvite> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);

    // Validate domain restriction
    const hub = mockHubs.find((h) => h.id === hubId);
    const emailDomain = email.split("@")[1];
    if (hub && emailDomain !== hub.clientDomain) {
      throw new Error(`You can only invite colleagues from ${hub.clientDomain}`);
    }

    const invite: HubInvite = {
      id: `invite-${Date.now()}`,
      hubId,
      email,
      accessLevel,
      invitedBy: "user-client-1",
      invitedByName: "Sarah Mitchell",
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: null,
      status: "pending",
    };

    mockInvites.push(invite);
    return invite;
  }

  return api.post<HubInvite>(`/hubs/${hubId}/portal/invite`, { email, accessLevel });
}
