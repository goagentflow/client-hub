/**
 * Type exports - barrel file for clean imports
 *
 * Usage: import { Hub, User, EventType } from "@/types";
 */

// Common types
export type {
  PaginationParams,
  PaginationMeta,
  PaginatedList,
  ApiError,
  ApiErrorCode,
  ISODateString,
  UploadStatus,
  EntityId,
  ResourceRef,
  ResourceType,
} from "./common";

// Authentication types
export type {
  UserRole,
  UserPermissions,
  User,
  AuthState,
  TokenScopes,
  AuthMeResponse,
  HubAccessSummary,
  AccessLevel,
  HubAccessCheckResponse,
  HubPermissions,
} from "./auth";
export { hasAdminAccess } from "./auth";

// Hub types
export type {
  HubType,
  HubStatus,
  Hub,
  CreateHubRequest,
  UpdateHubRequest,
  HubOverview,
  HubAlert,
  AlertType,
  EngagementStats,
  PortalConfig,
  HeroContentType,
  PortalSectionConfig,
  PortalMeta,
  UpdatePortalConfigRequest,
  OnTrackStatus,
  StatusUpdateSource,
  StatusUpdate,
  CreateStatusUpdateRequest,
} from "./hub";
export { isPitchHub, isClientHub } from "./hub";

// Proposal types
export type {
  Proposal,
  ProposalSettings,
  ProposalVersion,
  UploadProposalRequest,
  UpdateProposalSettingsRequest,
  ProposalViewerInfo,
  ProposalEngagement,
  SlideViewEngagement,
  SlideEngagement,
  ProposalComment,
  CreateProposalCommentRequest,
} from "./proposal";

// Video types
export type {
  VideoSourceType,
  VideoVisibility,
  Video,
  UploadVideoRequest,
  AddVideoLinkRequest,
  UpdateVideoRequest,
  VideoEngagement,
  VideoView,
  BulkVideoActionRequest,
} from "./video";

// Document types
export type {
  DocumentVisibility,
  DocumentCategory,
  Document,
  DocumentVersion,
  UploadDocumentRequest,
  UpdateDocumentRequest,
  DocumentEngagement,
  DocumentView,
  BulkDocumentActionRequest,
  DocumentFilterParams,
} from "./document";

// Message types
export type {
  MessageThreadSummary,
  MessageThreadDetail,
  ThreadParticipant,
  Message,
  MessageSender,
  MessageRecipient,
  MessageAttachment,
  SendMessageRequest,
  FeedMessage,
  SendFeedMessageRequest,
  UpdateTeamNotesRequest,
  ArchiveThreadRequest,
  MessageFilterParams,
} from "./message";

// Meeting types
export type {
  MeetingStatus,
  Meeting,
  MeetingParticipant,
  ResponseStatus,
  MeetingRecording,
  MeetingTranscript,
  TranscriptSegment,
  ScheduleMeetingRequest,
  UpdateMeetingRequest,
  UpdateMeetingNotesRequest,
  MeetingFilterParams,
} from "./meeting";

// Questionnaire types
export type {
  QuestionnaireStatus,
  Questionnaire,
  QuestionnaireCompletion,
  LinkQuestionnaireRequest,
  UpdateQuestionnaireRequest,
  QuestionnaireResponse,
  QuestionnaireAnswer,
  QuestionnaireAnalytics,
  QuestionSummary,
} from "./questionnaire";
export { isQuestionnaireCompleted } from "./questionnaire";

// Member and access types
export type {
  HubMember,
  MemberRole,
  HubInvite,
  InviteStatus,
  CreateInviteRequest,
  UpdateMemberAccessRequest,
  ShareLink,
  CreateShareLinkRequest,
  AcceptInviteRequest,
  AcceptInviteResponse,
  MemberActivity,
} from "./member";
export { MemberActivityAction } from "./member";

// Activity and engagement types
export { EventType } from "./activity";
export type {
  ActivityEvent,
  LogEventRequest,
  LeadershipLogEventRequest,
  EventMetadata,
  HubViewedMetadata,
  ProposalViewedMetadata,
  ProposalSlideTimeMetadata,
  VideoWatchedMetadata,
  VideoCompletedMetadata,
  DocumentViewedMetadata,
  DocumentDownloadedMetadata,
  MeetingJoinedMetadata,
  MessageSentMetadata,
  MessageReadMetadata,
  QuestionnaireStartedMetadata,
  QuestionnaireCompletedMetadata,
  ShareSentMetadata,
  ShareAcceptedMetadata,
  LeadershipAccessedMetadata,
  ActivityFeedItem,
  ActivityType,
} from "./activity";

// ============================================================================
// Phase 2: Client Hub Types
// ============================================================================

// Project types
export type {
  ProjectStatus,
  MilestoneStatus,
  Project,
  ProjectMilestone,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  ProjectFilterParams,
} from "./project";

// Client Intelligence types (AI features)
export type {
  AsyncJobStatus,
  AsyncJobBase,
  InstantAnswerRequest,
  InstantAnswerJob,
  ConfidenceLevel,
  DecisionStatus,
  DecisionRelatedResource,
  DecisionItem,
  DecisionTransition,
  CreateDecisionRequest,
  UpdateDecisionRequest,
  MeetingPrep,
  MeetingFollowUp,
  PerformanceNarrative,
  GeneratePerformanceRequest,
  HistoryEventType,
  EventSignificance,
  InstitutionalMemoryEvent,
  HistoryFilterParams,
  RiskAlertType,
  RiskSeverity,
  RiskAlert,
  AcknowledgeAlertRequest,
  AcknowledgeAlertResponse,
} from "./client-intelligence";
export { VALID_DECISION_TRANSITIONS, isValidDecisionTransition } from "./client-intelligence";

// Relationship Intelligence types
export type {
  EvidenceSource,
  Evidence,
  HealthStatus,
  HealthTrend,
  HealthDriverType,
  HealthDriver,
  RelationshipHealth,
  ExpansionStatus,
  ExpansionConfidence,
  ExpansionOpportunity,
  UpdateExpansionRequest,
  ExpansionOpportunitiesResponse,
  PortfolioOverview,
  PortfolioClient,
  PortfolioClientsResponse,
  PortfolioFilterParams,
} from "./relationship-intelligence";

// Video filter params (Phase 2 addition)
export type { VideoFilterParams } from "./video";

// Message update request (Phase 2 addition)
export type { UpdateThreadRequest } from "./message";

// Meeting project assignment (Phase 2 addition)
export type { UpdateMeetingProjectRequest } from "./meeting";
