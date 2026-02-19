/**
 * Member and invite routes — 11 endpoints, all 501
 */

import { Router } from 'express';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { send501 } from '../utils/response.js';
import type { Request, Response } from 'express';

export const membersRouter = Router({ mergeParams: true });

membersRouter.use(hubAccessMiddleware);
membersRouter.use(requireStaffAccess);

membersRouter.get('/', (_req: Request, res: Response) => send501(res, 'Members'));
membersRouter.get('/activity', (_req: Request, res: Response) => send501(res, 'Member activity'));
membersRouter.patch('/:id', (_req: Request, res: Response) => send501(res, 'Update member'));
membersRouter.delete('/:id', (_req: Request, res: Response) => send501(res, 'Remove member'));

// Invites
export const invitesRouter = Router({ mergeParams: true });
invitesRouter.use(hubAccessMiddleware);
invitesRouter.use(requireStaffAccess);

invitesRouter.get('/', (_req: Request, res: Response) => send501(res, 'Invites'));
invitesRouter.post('/', (_req: Request, res: Response) => send501(res, 'Create invite'));
invitesRouter.delete('/:id', (_req: Request, res: Response) => send501(res, 'Delete invite'));

// Share link
export const shareLinkRouter = Router({ mergeParams: true });
shareLinkRouter.use(hubAccessMiddleware);
shareLinkRouter.use(requireStaffAccess);
shareLinkRouter.post('/', (_req: Request, res: Response) => send501(res, 'Share link'));

// Accept invite (not hub-scoped)
export const acceptInviteRouter = Router();
acceptInviteRouter.post('/:token/accept', (_req: Request, res: Response) => send501(res, 'Accept invite'));
