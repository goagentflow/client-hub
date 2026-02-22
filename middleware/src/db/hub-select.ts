/**
 * Shared Prisma hub select — excludes passwordHash.
 * Used by hubs.route.ts, conversion.route.ts, and any route that needs full hub fields.
 */

export const HUB_SELECT = {
  id: true, tenantId: true, companyName: true, contactName: true,
  contactEmail: true, status: true, hubType: true, createdAt: true,
  updatedAt: true, lastActivity: true, clientsInvited: true, lastVisit: true,
  clientDomain: true, internalNotes: true, convertedAt: true, convertedBy: true,
  isPublished: true, welcomeHeadline: true, welcomeMessage: true,
  heroContentType: true, heroContentId: true, showProposal: true,
  showVideos: true, showDocuments: true, showMessages: true,
  showMeetings: true, showQuestionnaire: true,
};
