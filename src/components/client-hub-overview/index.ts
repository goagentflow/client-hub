/**
 * Client Hub Overview components
 *
 * Client-facing overview for active clients (hubType === "client").
 * Status updates, project status, and Coming Soon placeholders.
 *
 * @see docs/CLIENT_HUB_OVERVIEW_REDESIGN.md for design spec
 */

// Main container
export { ClientHubOverview } from "./ClientHubOverview";

// Active cards
export { ProjectStatusCard } from "./ProjectStatusCard";
export { StatusUpdateCard } from "./StatusUpdateCard";

// Retained for future use (not currently rendered)
export { DecisionsWaitingCard } from "./DecisionsWaitingCard";
export { QuickAskInput } from "./QuickAskInput";
export { UpcomingCard } from "./UpcomingCard";
export { RecentMessagesCard } from "./RecentMessagesCard";
