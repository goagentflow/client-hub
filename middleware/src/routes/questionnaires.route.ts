/**
 * Questionnaire routes — 7 endpoints, all 501
 */

import { Router } from 'express';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { send501 } from '../utils/response.js';
import type { Request, Response } from 'express';

export const questionnairesRouter = Router({ mergeParams: true });

questionnairesRouter.use(hubAccessMiddleware);
questionnairesRouter.use(requireStaffAccess);

questionnairesRouter.get('/', (_req: Request, res: Response) => res.json({ items: [], total: 0 }));
questionnairesRouter.get('/:id', (_req: Request, res: Response) => send501(res, 'Questionnaire detail'));
questionnairesRouter.post('/', (_req: Request, res: Response) => send501(res, 'Create questionnaire'));
questionnairesRouter.patch('/:id', (_req: Request, res: Response) => send501(res, 'Update questionnaire'));
questionnairesRouter.delete('/:id', (_req: Request, res: Response) => send501(res, 'Delete questionnaire'));
questionnairesRouter.get('/:id/responses', (_req: Request, res: Response) => send501(res, 'Questionnaire responses'));
