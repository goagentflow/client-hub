/**
 * Hooks barrel export
 *
 * Usage: import { useHubs, useLogin, useTrackEngagement } from "@/hooks";
 */

// Existing hooks
export { useIsMobile } from "./use-mobile";
export { useToast, toast } from "./use-toast";

// Auth hooks
export {
  authKeys,
  useCurrentUser,
  useHubAccess,
  useLogin,
  useLogout,
  useIsAuthenticated,
  useUserRole,
} from "./use-auth";

// Hub hooks
export {
  hubKeys,
  useHubs,
  useHub,
  useHubOverview,
  useHubActivity,
  usePortalConfig,
  useCreateHub,
  useUpdateHub,
  useUpdateHubNotes,
  useUpdatePortalConfig,
  usePublishPortal,
  useConvertToClientHub,
} from "./use-hubs";

// Proposal hooks
export {
  proposalKeys,
  useProposal,
  useProposalEngagement,
  usePortalProposal,
  useUploadProposal,
  useDeleteProposal,
  useUpdateProposalSettings,
  useSubmitProposalComment,
} from "./use-proposals";

// Video hooks
export {
  videoKeys,
  useVideos,
  useVideo,
  useVideoEngagement,
  usePortalVideos,
  useUploadVideo,
  useAddVideoLink,
  useUpdateVideo,
  useDeleteVideo,
  useBulkVideoAction,
} from "./use-videos";

// Document hooks
export {
  documentKeys,
  useDocuments,
  useDocument,
  useDocumentEngagement,
  usePortalDocuments,
  useUploadDocument,
  useUpdateDocument,
  useDeleteDocument,
  useBulkDocumentAction,
} from "./use-documents";

// Message hooks
export {
  messageKeys,
  useMessageThreads,
  useMessageThread,
  usePortalMessages,
  useSendMessage,
  useSendPortalMessage,
  useUpdateTeamNotes,
  useArchiveThread,
} from "./use-messages";

// Meeting hooks
export {
  meetingKeys,
  useMeetings,
  useMeeting,
  useMeetingRecording,
  useMeetingTranscript,
  usePortalMeetings,
  useScheduleMeeting,
  useUpdateMeeting,
  useUpdateMeetingAgenda,
  useUpdateMeetingNotes,
  useCancelMeeting,
} from "./use-meetings";

// Questionnaire hooks
export {
  questionnaireKeys,
  useQuestionnaires,
  useQuestionnaire,
  useQuestionnaireAnalytics,
  usePortalQuestionnaires,
  useLinkQuestionnaire,
  useUpdateQuestionnaire,
  useUnlinkQuestionnaire,
} from "./use-questionnaires";

// Member hooks
export {
  memberKeys,
  useMembers,
  useInvites,
  useMemberActivity,
  usePortalMembers,
  useCreateInvite,
  useRevokeInvite,
  useUpdateMemberAccess,
  useRemoveMember,
  useCreateShareLink,
  useAcceptInvite,
  useInviteColleague,
} from "./use-members";

// Activity hooks
export {
  activityKeys,
  useActivityEvents,
  useLogEvent,
  useTrackEngagement,
  useLogLeadershipEvent,
  useTrackLeadershipView,
} from "./use-activity";

// ============================================================================
// Phase 2: Client Hub Hooks
// ============================================================================

// Project hooks
export {
  projectKeys,
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from "./use-projects";

// Decision Queue hooks
export {
  decisionKeys,
  useDecisions,
  useDecision,
  useCreateDecision,
  useUpdateDecision,
} from "./use-decisions";

// Client Intelligence hooks (Instant Answers, Meeting Intelligence, Performance, History)
export {
  instantAnswerKeys,
  meetingIntelligenceKeys,
  performanceKeys,
  historyKeys,
  useCreateInstantAnswer,
  useInstantAnswer,
  useRecentInstantAnswers,
  useGenerateMeetingPrep,
  useMeetingPrep,
  useGenerateMeetingFollowUp,
  useMeetingFollowUp,
  useGeneratePerformanceNarrative,
  usePerformanceNarrative,
  useLatestPerformanceNarrative,
  useHistoryEvents,
  useRiskAlerts,
  useAcknowledgeRiskAlert,
} from "./use-client-intelligence";

// Status Update hooks
export {
  statusUpdateKeys,
  useStatusUpdates,
  usePortalStatusUpdates,
  useCreateStatusUpdate,
} from "./use-status-updates";

// Relationship Intelligence hooks
export {
  relationshipKeys,
  useRelationshipHealth,
  useExpansionOpportunities,
  useUpdateExpansionOpportunity,
} from "./use-relationship-intelligence";

// Portal contacts hooks (staff-only)
export {
  portalContactKeys,
  usePortalContacts,
  useAccessMethod,
  useAddPortalContact,
  useRemovePortalContact,
  useUpdateAccessMethod,
} from "./use-portal-contacts";

// Leadership Portfolio hooks (admin-only)
export {
  leadershipKeys,
  usePortfolioOverview,
  usePortfolioClients,
  useAtRiskClients,
  useExpansionCandidates,
  useRefreshPortfolioMetrics,
} from "./use-leadership";
