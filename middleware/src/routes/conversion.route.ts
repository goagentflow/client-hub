/**
 * Hub conversion routes — 2 endpoints (1 real, 1 x 501)
 * Admin guard applied.
 */

import { Router } from 'express';
import { supabase, mapHubRow, mapProjectRow } from '../adapters/supabase.adapter.js';
import type { ProjectRow } from '../adapters/project.mapper.js';
import { HUB_SELECT } from '../adapters/hub-columns.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { sendItem, send501 } from '../utils/response.js';
import { Errors } from '../middleware/error-handler.js';
import type { Request, Response, NextFunction } from 'express';

export const conversionRouter = Router({ mergeParams: true });

conversionRouter.use(hubAccessMiddleware);
conversionRouter.use(requireAdmin);

// POST /hubs/:hubId/convert
conversionRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = req.params.hubId;
    const now = new Date().toISOString();

    // Get current hub
    const { data: hub, error: hubErr } = await supabase
      .from('hub')
      .select(HUB_SELECT)
      .eq('id', hubId)
      .single();

    if (hubErr || !hub) throw Errors.notFound('Hub', hubId);

    // Idempotent: if already converted, return existing state
    if (hub.hub_type === 'client') {
      sendItem(res, {
        hub: mapHubRow(hub),
        archiveSummary: {
          proposalArchived: true,
          proposalDocumentId: undefined,
          questionnaireArchived: true,
          questionnaireHistoryId: undefined,
        },
        alreadyConverted: true,
        audit: {
          convertedBy: hub.converted_by || req.user.userId,
          convertedAt: hub.converted_at || now,
        },
      });
      return;
    }

    // Convert: update hub type
    const { data: updated, error: updateErr } = await supabase
      .from('hub')
      .update({
        hub_type: 'client',
        converted_at: now,
        converted_by: req.user.userId,
        updated_at: now,
      })
      .eq('id', hubId)
      .select(HUB_SELECT)
      .single();

    if (updateErr) throw updateErr;

    // Check for proposal to archive
    const { data: proposal } = await supabase
      .from('hub_document')
      .select('id')
      .eq('hub_id', hubId)
      .eq('is_proposal', true)
      .maybeSingle();

    // Create initial project if requested
    let project = undefined;
    if (req.body?.initialProjectName) {
      const { data: newProject } = await supabase
        .from('hub_project')
        .insert({
          hub_id: hubId,
          name: req.body.initialProjectName,
          status: 'active',
          start_date: now,
          created_by: req.user.userId,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single();

      if (newProject) {
        project = mapProjectRow(newProject as ProjectRow);
      }
    }

    sendItem(res, {
      hub: mapHubRow(updated),
      archiveSummary: {
        proposalArchived: !!proposal,
        proposalDocumentId: proposal?.id,
        questionnaireArchived: false,
        questionnaireHistoryId: undefined,
      },
      project,
      alreadyConverted: false,
      audit: {
        convertedBy: req.user.userId,
        convertedAt: now,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /hubs/:hubId/convert/rollback — 501
conversionRouter.post('/rollback', (_req: Request, res: Response) => {
  send501(res, 'Conversion rollback');
});
