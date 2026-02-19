/**
 * Meeting routes — 10 endpoints, all 501
 */

import { Router } from 'express';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { send501 } from '../utils/response.js';
import type { Request, Response } from 'express';

export const meetingsRouter = Router({ mergeParams: true });

meetingsRouter.use(hubAccessMiddleware);
meetingsRouter.use(requireStaffAccess);

meetingsRouter.get('/', (_req: Request, res: Response) => send501(res, 'Meetings'));
meetingsRouter.get('/:id', (_req: Request, res: Response) => send501(res, 'Meeting detail'));
meetingsRouter.post('/', (_req: Request, res: Response) => send501(res, 'Schedule meeting'));
meetingsRouter.patch('/:id', (_req: Request, res: Response) => send501(res, 'Update meeting'));
meetingsRouter.patch('/:id/agenda', (_req: Request, res: Response) => send501(res, 'Meeting agenda'));
meetingsRouter.patch('/:id/notes', (_req: Request, res: Response) => send501(res, 'Meeting notes'));
meetingsRouter.delete('/:id', (_req: Request, res: Response) => send501(res, 'Delete meeting'));
meetingsRouter.get('/:id/recording', (_req: Request, res: Response) => send501(res, 'Meeting recording'));
meetingsRouter.get('/:id/transcript', (_req: Request, res: Response) => send501(res, 'Meeting transcript'));
