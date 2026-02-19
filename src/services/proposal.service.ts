/**
 * Proposal service
 *
 * Operations for proposal upload, viewing, and engagement tracking.
 */

import type {
  Proposal,
  UpdateProposalSettingsRequest,
  ProposalEngagement,
  ProposalComment,
  CreateProposalCommentRequest,
} from "@/types";
import { api, isMockApiEnabled, simulateDelay } from "./api";
import { mockProposal } from "./mock-data";

// Mock engagement data
const mockEngagement: ProposalEngagement = {
  totalViews: 12,
  uniqueViewers: 3,
  avgTimeSpent: 420,
  slideEngagement: Array.from({ length: 24 }, (_, i) => ({
    slideNumber: i + 1,
    views: Math.floor(Math.random() * 10) + 1,
    avgTimeSpent: Math.floor(Math.random() * 60) + 10,
    dropOffRate: i > 15 ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 10),
  })),
};

/**
 * Get proposal for a hub
 */
export async function getProposal(hubId: string): Promise<Proposal | null> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    return hubId === "hub-1" ? mockProposal : null;
  }

  return api.get<Proposal | null>(`/hubs/${hubId}/proposal`);
}

/**
 * Upload a new proposal (or replace existing)
 */
export async function uploadProposal(
  hubId: string,
  file: File,
  replaceExisting?: boolean
): Promise<Proposal> {
  if (isMockApiEnabled()) {
    await simulateDelay(1500); // Simulate upload time

    const newProposal: Proposal = {
      ...mockProposal,
      id: `proposal-${Date.now()}`,
      hubId,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      versions: replaceExisting
        ? [
            {
              version: mockProposal.versions.length + 1,
              uploadedAt: new Date().toISOString(),
              uploadedBy: "user-staff-1",
              uploadedByName: "Hamish Nicklin",
              fileName: file.name,
            },
            ...mockProposal.versions,
          ]
        : [],
    };

    return newProposal;
  }

  const formData = new FormData();
  formData.append("file", file);
  if (replaceExisting) formData.append("replaceExisting", "true");

  return api.upload<Proposal>(`/hubs/${hubId}/proposal`, formData);
}

/**
 * Delete proposal
 */
export async function deleteProposal(hubId: string): Promise<void> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    return;
  }

  return api.delete(`/hubs/${hubId}/proposal`);
}

/**
 * Update proposal settings (visibility, download)
 */
export async function updateProposalSettings(
  hubId: string,
  settings: UpdateProposalSettingsRequest
): Promise<Proposal> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    Object.assign(mockProposal.settings, settings);
    return mockProposal;
  }

  return api.patch<Proposal>(`/hubs/${hubId}/proposal/settings`, settings);
}

/**
 * Get proposal engagement analytics
 */
export async function getProposalEngagement(hubId: string): Promise<ProposalEngagement> {
  if (isMockApiEnabled()) {
    await simulateDelay(200);
    return mockEngagement;
  }

  return api.get<ProposalEngagement>(`/hubs/${hubId}/proposal/engagement`);
}

/**
 * Get client-facing proposal (portal view)
 * Returns null if not visible to client
 */
export async function getPortalProposal(hubId: string): Promise<Proposal | null> {
  if (isMockApiEnabled()) {
    await simulateDelay(300);
    return mockProposal.settings.isClientVisible ? mockProposal : null;
  }

  return api.get<Proposal | null>(`/hubs/${hubId}/portal/proposal`);
}

/**
 * Submit a comment on a proposal slide (client portal)
 * Creates a message thread with the slide reference
 */
export async function submitProposalComment(
  hubId: string,
  data: CreateProposalCommentRequest
): Promise<ProposalComment> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);

    const comment: ProposalComment = {
      id: `comment-${Date.now()}`,
      proposalId: mockProposal.id,
      slideNumber: data.slideNumber,
      authorId: "user-client-1",
      authorName: "Sarah Mitchell",
      authorEmail: "sarah@whitmorelaw.co.uk",
      content: data.content,
      createdAt: new Date().toISOString(),
      threadId: `thread-${Date.now()}`,
    };

    return comment;
  }

  return api.post<ProposalComment>(`/hubs/${hubId}/portal/proposal/comment`, data);
}
