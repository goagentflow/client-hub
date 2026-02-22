/**
 * Hub conversion routes — 2 endpoints (1 real, 1 x 501)
 * Admin guard applied.
 */

import { Router } from 'express';
import { mapHub } from '../db/hub.mapper.js';
import { mapProject } from '../db/project.mapper.js';
import { HUB_SELECT } from '../db/hub-select.js';
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
    const now = new Date();

    // Get current hub
    const hub = await req.repo!.hub.findFirst({
      where: { id: hubId },
      select: HUB_SELECT,
    });
    if (!hub) throw Errors.notFound('Hub', hubId);

    // Idempotent: if already converted, return existing state
    if (hub.hubType === 'client') {
      sendItem(res, {
        hub: mapHub(hub),
        archiveSummary: {
          proposalArchived: true,
          proposalDocumentId: undefined,
          questionnaireArchived: true,
          questionnaireHistoryId: undefined,
        },
        alreadyConverted: true,
        audit: {
          convertedBy: hub.convertedBy || req.user.userId,
          convertedAt: hub.convertedAt?.toISOString() || now.toISOString(),
        },
      });
      return;
    }

    // Convert: update hub type
    const updated = await req.repo!.hub.update({
      where: { id: hubId },
      data: {
        hubType: 'client',
        convertedAt: now,
        convertedBy: req.user.userId,
      },
      select: HUB_SELECT,
    });

    // Check for proposal to archive
    const proposal = await req.repo!.hubDocument.findFirst({
      where: { hubId, isProposal: true },
      select: { id: true },
    });

    // Create initial project if requested
    let project = undefined;
    if (req.body?.initialProjectName) {
      const newProject = await req.repo!.hubProject.create({
        data: {
          hubId,
          name: req.body.initialProjectName,
          status: 'active',
          startDate: now,
          createdBy: req.user.userId,
        },
      });
      project = mapProject(newProject);
    }

    sendItem(res, {
      hub: mapHub(updated),
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
        convertedAt: now.toISOString(),
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
