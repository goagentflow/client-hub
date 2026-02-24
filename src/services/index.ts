/**
 * Services barrel export
 *
 * Usage: import { getHubs, loginWithCredentials } from "@/services";
 */

// API utilities
export { api, isMockApiEnabled, simulateDelay, ApiRequestError, setTokenGetter, setUnauthorizedHandler } from "./api";

// Auth service
export {
  loginWithCredentials,
  loginWithMsal,
  getAccessToken,
  getCurrentUser,
  checkHubAccess,
  logout,
  storeDemoSession,
  completeMsalRedirect,
} from "./auth.service";

// Hub portal auth
export { loginWithHubPassword } from "./hub-auth.service";

// Hub service
export {
  getHubs,
  getHub,
  createHub,
  updateHub,
  getHubOverview,
  updateHubNotes,
  getHubActivity,
  getPortalConfig,
  updatePortalConfig,
  publishPortal,
  convertToClientHub,
  rollbackConversion,
} from "./hub.service";
export type { ConvertHubResponse, ConvertHubRequest } from "./hub.service";

// Proposal service
export {
  getProposal,
  uploadProposal,
  deleteProposal,
  updateProposalSettings,
  getProposalEngagement,
  getPortalProposal,
  submitProposalComment,
} from "./proposal.service";

// Video service
export {
  getVideos,
  getVideo,
  uploadVideo,
  addVideoLink,
  updateVideo,
  deleteVideo,
  getVideoEngagement,
  bulkVideoAction,
  getPortalVideos,
} from "./video.service";

// Document service
export {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocumentEngagement,
  bulkDocumentAction,
  getPortalDocuments,
} from "./document.service";

// Message service
export {
  getMessageThreads,
  getMessageThread,
  sendMessage,
  updateTeamNotes,
  archiveThread,
  getPortalMessages,
  sendPortalMessage,
} from "./message.service";

// Meeting service
export {
  getMeetings,
  getMeeting,
  scheduleMeeting,
  updateMeeting,
  updateMeetingAgenda,
  updateMeetingNotes,
  cancelMeeting,
  getMeetingRecording,
  getMeetingTranscript,
  getPortalMeetings,
} from "./meeting.service";

// Questionnaire service
export {
  getQuestionnaires,
  getQuestionnaire,
  linkQuestionnaire,
  updateQuestionnaire,
  unlinkQuestionnaire,
  getQuestionnaireAnalytics,
  getPortalQuestionnaires,
} from "./questionnaire.service";

// Member service
export {
  getMembers,
  getInvites,
  createInvite,
  revokeInvite,
  updateMemberAccess,
  removeMember,
  createShareLink,
  acceptInvite,
  getMemberActivity,
  getPortalMembers,
  inviteColleague,
} from "./member.service";

// Activity service
export {
  logEvent,
  logLeadershipEvent,
  getEvents,
  getSessionEvents,
  clearSessionEvents,
} from "./activity.service";

// ============================================================================
// Phase 2: Client Hub Services
// ============================================================================

// Project service
export {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "./project.service";

// Client Intelligence services (split for maintainability)
export {
  createInstantAnswer,
  getInstantAnswer,
  getRecentInstantAnswers,
  getDecisions,
  getDecision,
  createDecision,
  updateDecision,
  generateMeetingPrep,
  getMeetingPrep,
  generateMeetingFollowUp,
  getMeetingFollowUp,
  generatePerformanceNarrative,
  getPerformanceNarrative,
  getLatestPerformanceNarrative,
  getHistoryEvents,
  getRiskAlerts,
  acknowledgeRiskAlert,
} from "./client-intelligence";
export type { DecisionFilterParams } from "./client-intelligence";

// Status Update service
export {
  getStatusUpdates,
  getPortalStatusUpdates,
  createStatusUpdate,
} from "./status-update.service";

// Relationship Intelligence service
export {
  getRelationshipHealth,
  getExpansionOpportunities,
  updateExpansionOpportunity,
} from "./relationship-intelligence.service";

// Portal contacts service (staff-only)
export {
  getPortalContacts,
  addPortalContact,
  removePortalContact,
  getAccessMethod,
  updateAccessMethod,
} from "./portal-contacts.service";
export type { PortalContact, AccessMethod } from "./portal-contacts.service";

// Leadership Portfolio service (admin-only)
export {
  getPortfolioOverview,
  getPortfolioClients,
  getAtRiskClients,
  getExpansionCandidates,
  refreshPortfolioMetrics,
} from "./leadership.service";
