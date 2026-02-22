/**
 * Proposal routes — 7 endpoints (3 real, 4 x 501)
 * Proposals are stored as hub_document rows with isProposal=true
 */

import { Router } from 'express';
import { mapProposal } from '../db/document.mapper.js';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { sendItem, send204, send501 } from '../utils/response.js';
import type { Request, Response, NextFunction } from 'express';

export const proposalsRouter = Router({ mergeParams: true });

proposalsRouter.use(hubAccessMiddleware);
proposalsRouter.use(requireStaffAccess);

// GET /hubs/:hubId/proposal
proposalsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await req.repo!.hubDocument.findFirst({
      where: { hubId: req.params.hubId, isProposal: true },
      orderBy: { uploadedAt: 'desc' },
    });

    sendItem(res, doc ? mapProposal(doc) : null);
  } catch (err) {
    next(err);
  }
});

// DELETE /hubs/:hubId/proposal
proposalsRouter.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await req.repo!.hubDocument.deleteMany({
      where: { hubId: req.params.hubId, isProposal: true },
    });

    send204(res);
  } catch (err) {
    next(err);
  }
});

// PATCH /hubs/:hubId/proposal/settings
proposalsRouter.patch('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (req.body.isClientVisible !== undefined) {
      updates.visibility = req.body.isClientVisible ? 'client' : 'internal';
    }

    if (Object.keys(updates).length > 0) {
      await req.repo!.hubDocument.updateMany({
        where: { hubId: req.params.hubId, isProposal: true },
        data: updates,
      });
    }

    // Return updated proposal
    const doc = await req.repo!.hubDocument.findFirst({
      where: { hubId: req.params.hubId, isProposal: true },
      orderBy: { uploadedAt: 'desc' },
    });

    sendItem(res, doc ? mapProposal(doc) : null);
  } catch (err) {
    next(err);
  }
});

// GET /hubs/:hubId/proposal/engagement — 501
proposalsRouter.get('/engagement', (_req: Request, res: Response) => {
  send501(res, 'Proposal engagement analytics');
});

// POST /hubs/:hubId/proposal (upload) — 501
proposalsRouter.post('/', (_req: Request, res: Response) => {
  send501(res, 'Proposal file upload');
});
