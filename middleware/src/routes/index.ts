/**
 * API router — mounts all route modules under /api/v1
 */

import { Router } from 'express';
import { hubsRouter } from './hubs.route.js';
import { portalConfigRouter } from './portal-config.route.js';
import { videosRouter } from './videos.route.js';
import { documentsRouter } from './documents.route.js';
import { proposalsRouter } from './proposals.route.js';
import { portalRouter } from './portal.route.js';
import { messagesRouter } from './messages.route.js';
import { meetingsRouter } from './meetings.route.js';
import { membersRouter, invitesRouter, shareLinkRouter } from './members.route.js';
import { questionnairesRouter } from './questionnaires.route.js';
import { intelligenceRouter } from './intelligence.route.js';
import { eventsRouter, leadershipEventsRouter } from './events.route.js';
import { projectsRouter } from './projects.route.js';
import { conversionRouter } from './conversion.route.js';
import { leadershipRouter } from './leadership.route.js';
import { clientIntelligenceRouter } from './client-intelligence.route.js';
import { authRouter } from './auth.route.js';
import { portalContactsRouter, accessMethodRouter } from './portal-contacts.route.js';
import { statusUpdatesRouter } from './status-updates.route.js';

export { healthRouter } from './health.js';

export const apiRouter = Router();

// Auth
apiRouter.use('/auth', authRouter);

// Hub CRUD
apiRouter.use('/hubs', hubsRouter);

// Hub sub-resources
apiRouter.use('/hubs/:hubId/videos', videosRouter);
apiRouter.use('/hubs/:hubId/documents', documentsRouter);
apiRouter.use('/hubs/:hubId/proposal', proposalsRouter);
apiRouter.use('/hubs/:hubId/portal', portalRouter);
apiRouter.use('/hubs/:hubId/messages', messagesRouter);
apiRouter.use('/hubs/:hubId/meetings', meetingsRouter);
apiRouter.use('/hubs/:hubId/members', membersRouter);
apiRouter.use('/hubs/:hubId/invites', invitesRouter);
apiRouter.use('/hubs/:hubId/share-link', shareLinkRouter);
apiRouter.use('/hubs/:hubId/questionnaires', questionnairesRouter);
apiRouter.use('/hubs/:hubId/portal-config', portalConfigRouter);
apiRouter.use('/hubs/:hubId/portal-contacts', portalContactsRouter);
apiRouter.use('/hubs/:hubId/access-method', accessMethodRouter);
apiRouter.use('/hubs/:hubId/events', eventsRouter);
apiRouter.use('/hubs/:hubId/projects', projectsRouter);
apiRouter.use('/hubs/:hubId/status-updates', statusUpdatesRouter);
apiRouter.use('/hubs/:hubId/convert', conversionRouter);

// Hub intelligence (relationship health, expansion)
apiRouter.use('/hubs/:hubId', intelligenceRouter);

// Hub client intelligence (instant answers, meetings, performance, decisions, history)
apiRouter.use('/hubs/:hubId', clientIntelligenceRouter);

// Leadership (admin-only)
apiRouter.use('/leadership', leadershipRouter);
apiRouter.use('/leadership/events', leadershipEventsRouter);
