/**
 * Portal config routes — 3 endpoints (GET, PATCH, publish)
 * Extracted from hubs.route.ts to keep files under 300 lines.
 */

import { Router } from 'express';
import { supabase, mapPortalConfig } from '../adapters/supabase.adapter.js';
import { HUB_SELECT } from '../adapters/hub-columns.js';
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
    const { data, error } = await supabase
      .from('hub')
      .select(HUB_SELECT)
      .eq('id', req.params.hubId)
      .single();

    if (error || !data) throw Errors.notFound('Hub', req.params.hubId);

    sendItem(res, mapPortalConfig(data));
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/portal-config — update portal config (staff-only)
portalConfigRouter.patch('/', requireStaffAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (req.body.welcomeHeadline !== undefined) updates.welcome_headline = req.body.welcomeHeadline;
    if (req.body.welcomeMessage !== undefined) updates.welcome_message = req.body.welcomeMessage;
    if (req.body.heroContentType !== undefined) updates.hero_content_type = req.body.heroContentType;
    if (req.body.heroContentId !== undefined) updates.hero_content_id = req.body.heroContentId;

    if (req.body.sections) {
      const s = req.body.sections;
      if (s.showProposal !== undefined) updates.show_proposal = s.showProposal;
      if (s.showVideos !== undefined) updates.show_videos = s.showVideos;
      if (s.showDocuments !== undefined) updates.show_documents = s.showDocuments;
      if (s.showMessages !== undefined) updates.show_messages = s.showMessages;
      if (s.showMeetings !== undefined) updates.show_meetings = s.showMeetings;
      if (s.showQuestionnaire !== undefined) updates.show_questionnaire = s.showQuestionnaire;
    }

    const { error } = await supabase
      .from('hub')
      .update(updates)
      .eq('id', req.params.hubId);

    if (error) throw error;

    // Return updated config
    const { data, error: fetchErr } = await supabase
      .from('hub')
      .select(HUB_SELECT)
      .eq('id', req.params.hubId)
      .single();

    if (fetchErr || !data) throw Errors.notFound('Hub', req.params.hubId);

    sendItem(res, mapPortalConfig(data));
  } catch (err) {
    next(err);
  }
});

