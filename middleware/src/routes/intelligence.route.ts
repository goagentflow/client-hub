/**
 * Intelligence routes — 3 endpoints, all 501
 * Relationship health and expansion opportunities
 */

import { Router } from 'express';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { send501 } from '../utils/response.js';
import type { Request, Response } from 'express';

export const intelligenceRouter = Router({ mergeParams: true });

intelligenceRouter.use(hubAccessMiddleware);
intelligenceRouter.use(requireStaffAccess);

intelligenceRouter.get('/relationship-health', (_req: Request, res: Response) => send501(res, 'Relationship health'));
intelligenceRouter.get('/expansion-opportunities', (_req: Request, res: Response) => send501(res, 'Expansion opportunities'));
intelligenceRouter.patch('/expansion-opportunities/:id', (_req: Request, res: Response) => send501(res, 'Update expansion opportunity'));
