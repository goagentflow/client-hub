/**
 * Hub Conversion service
 *
 * Handles pitch-to-client hub conversion:
 * - Atomic conversion with archival
 * - Idempotent operation
 * - Optional initial project creation
 * - Admin-only rollback (early-phase recovery)
 */

import type { Hub, Project } from "@/types";
import { api, isMockApiEnabled, simulateDelay, ApiRequestError } from "./api";
import { mockProjects } from "./mock-data-client-hub";
import { mockHubs } from "./mock-data";

// ============================================================================
// Types
// ============================================================================

export interface ConvertHubResponse {
  hub: Hub;
  archiveSummary: {
    proposalArchived: boolean;
    proposalDocumentId?: string;
    questionnaireArchived: boolean;
    questionnaireHistoryId?: string;
  };
  project?: Project;
  alreadyConverted: boolean;
  audit: {
    convertedBy: string;
    convertedAt: string;
  };
}

export interface ConvertHubRequest {
  initialProjectName?: string;
}

// ============================================================================
// Conversion Operations
// ============================================================================

/**
 * Convert a pitch hub to a client hub
 * Atomic operation: archives proposal, handles questionnaire, creates optional first project
 * Idempotent: calling twice returns same result without side effects
 */
export async function convertToClientHub(
  hubId: string,
  data?: ConvertHubRequest
): Promise<ConvertHubResponse> {
  if (isMockApiEnabled()) {
    await simulateDelay(800);

    const hub = mockHubs.find((h) => h.id === hubId);
    if (!hub) {
      throw new ApiRequestError(
        { code: "NOT_FOUND", message: "Hub not found" },
        404
      );
    }

    const now = new Date().toISOString();
    const userId = "user-staff-1";

    // Check if already a client hub (converted or created directly)
    if (hub.hubType === "client") {
      const wasConverted = !!hub.convertedAt;
      return {
        hub,
        archiveSummary: {
          proposalArchived: wasConverted,
          proposalDocumentId: wasConverted ? `doc-archived-${hubId}` : undefined,
          questionnaireArchived: wasConverted,
          questionnaireHistoryId: wasConverted ? `history-questionnaire-${hubId}` : undefined,
        },
        alreadyConverted: true,
        createdAsClient: !wasConverted,
        audit: wasConverted
          ? { convertedBy: hub.convertedBy!, convertedAt: hub.convertedAt! }
          : { convertedBy: null, convertedAt: null },
      };
    }

    // Perform conversion
    hub.hubType = "client";
    hub.convertedAt = now;
    hub.convertedBy = userId;
    hub.updatedAt = now;

    let project: Project | undefined;

    // Create initial project if name provided
    if (data?.initialProjectName) {
      project = {
        id: `project-${Date.now()}`,
        hubId,
        name: data.initialProjectName,
        description: undefined,
        status: "active",
        startDate: now,
        targetEndDate: undefined,
        lead: userId,
        leadName: "Hamish Nicklin",
        milestones: [],
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      };
      mockProjects.push(project);
    }

    return {
      hub,
      archiveSummary: {
        proposalArchived: true,
        proposalDocumentId: `doc-archived-${hubId}`,
        questionnaireArchived: true,
        questionnaireHistoryId: `history-questionnaire-${hubId}`,
      },
      project,
      alreadyConverted: false,
      audit: {
        convertedBy: userId,
        convertedAt: now,
      },
    };
  }

  return api.post<ConvertHubResponse>(`/hubs/${hubId}/convert`, data);
}

/**
 * Rollback hub conversion (INTERNAL USE ONLY - requires admin)
 * NOT for production use - early-phase recovery only
 */
export async function rollbackConversion(hubId: string): Promise<Hub> {
  if (isMockApiEnabled()) {
    await simulateDelay(500);

    const hub = mockHubs.find((h) => h.id === hubId);
    if (!hub) {
      throw new ApiRequestError(
        { code: "NOT_FOUND", message: "Hub not found" },
        404
      );
    }

    // Only rollback if actually a client hub
    if (hub.hubType !== "client") {
      throw new ApiRequestError(
        { code: "INVALID_STATE", message: "Hub is not a client hub" },
        409
      );
    }

    // Reverse conversion
    hub.hubType = "pitch";
    hub.convertedAt = undefined;
    hub.convertedBy = undefined;
    hub.updatedAt = new Date().toISOString();

    return hub;
  }

  return api.post<Hub>(`/hubs/${hubId}/convert/rollback`);
}
