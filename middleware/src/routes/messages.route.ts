/**
 * Message routes — 7 endpoints, all 501
 */

import { Router } from 'express';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { requireStaffAccess } from '../middleware/require-staff.js';
import { send501 } from '../utils/response.js';
import type { Request, Response } from 'express';

export const messagesRouter = Router({ mergeParams: true });

messagesRouter.use(hubAccessMiddleware);
messagesRouter.use(requireStaffAccess);

messagesRouter.get('/', (_req: Request, res: Response) => send501(res, 'Messages'));
messagesRouter.get('/:threadId', (_req: Request, res: Response) => send501(res, 'Message thread'));
messagesRouter.post('/', (_req: Request, res: Response) => send501(res, 'Send message'));
messagesRouter.patch('/:threadId/notes', (_req: Request, res: Response) => send501(res, 'Thread notes'));
messagesRouter.patch('/:threadId', (_req: Request, res: Response) => send501(res, 'Update thread'));
