/**
 * Portal config routes — 2 endpoints (GET, PATCH)
 * Extracted from hubs.route.ts to keep files under 300 lines.
 */

import { Router } from 'express';
import { mapPortalConfig } from '../db/hub.mapper.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem } from '../utils/response.js';
import { Errors } from '../middleware/error-handler.js';
import type { Request, Response, NextFunction } from 'express';

export const portalConfigRouter = Router({ mergeParams: true });

portalConfigRouter.use(hubAccessMiddleware);

// GET /hubs/:hubId/portal-config — portal configuration (staff-only)
portalConfigRouter.get('/', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hub = await req.repo!.hub.findFirst({ where: { id: req.params.hubId } });
    if (!hub) throw Errors.notFound('Hub', req.params.hubId);
    sendItem(res, mapPortalConfig(hub));
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/portal-config — update portal config (staff-only)
portalConfigRouter.patch('/', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};

    if (req.body.welcomeHeadline !== undefined) data.welcomeHeadline = req.body.welcomeHeadline;
    if (req.body.welcomeMessage !== undefined) data.welcomeMessage = req.body.welcomeMessage;
    if (req.body.heroContentType !== undefined) data.heroContentType = req.body.heroContentType;
    if (req.body.heroContentId !== undefined) data.heroContentId = req.body.heroContentId;

    if (req.body.sections) {
      const s = req.body.sections;
      if (s.showProposal !== undefined) data.showProposal = s.showProposal;
      if (s.showVideos !== undefined) data.showVideos = s.showVideos;
      if (s.showDocuments !== undefined) data.showDocuments = s.showDocuments;
      if (s.showMessages !== undefined) data.showMessages = s.showMessages;
      if (s.showMeetings !== undefined) data.showMeetings = s.showMeetings;
      if (s.showQuestionnaire !== undefined) data.showQuestionnaire = s.showQuestionnaire;
    }

    await req.repo!.hub.update({ where: { id: req.params.hubId }, data });

    const hub = await req.repo!.hub.findFirst({ where: { id: req.params.hubId } });
    if (!hub) throw Errors.notFound('Hub', req.params.hubId);

    sendItem(res, mapPortalConfig(hub));
  } catch (err) {
    next(err);
  }
});
