/**
 * Client Intelligence routes — all 501 stubs
 * Instant Answers, Meeting Prep, Follow-up, Performance, Decision Queue, History, Risk Alerts
 */

import { Router } from 'express';
import { hubAccessMiddleware } from '../middleware/hub-access.js';
import { send501 } from '../utils/response.js';
import type { Request, Response } from 'express';

export const clientIntelligenceRouter = Router({ mergeParams: true });

clientIntelligenceRouter.use(hubAccessMiddleware);

// Instant Answers (3 endpoints) — /latest BEFORE /:id to avoid param match
clientIntelligenceRouter.post('/instant-answer/requests', (_req: Request, res: Response) => send501(res, 'Instant answers'));
clientIntelligenceRouter.get('/instant-answer/latest', (_req: Request, res: Response) => send501(res, 'Latest instant answers'));
clientIntelligenceRouter.get('/instant-answer/:id', (_req: Request, res: Response) => send501(res, 'Instant answer result'));

// Meeting Prep (4 endpoints)
clientIntelligenceRouter.post('/meetings/:id/prep/generate', (_req: Request, res: Response) => send501(res, 'Meeting prep generation'));
clientIntelligenceRouter.get('/meetings/:id/prep', (_req: Request, res: Response) => send501(res, 'Meeting prep'));
clientIntelligenceRouter.post('/meetings/:id/follow-up/generate', (_req: Request, res: Response) => send501(res, 'Follow-up generation'));
clientIntelligenceRouter.get('/meetings/:id/follow-up', (_req: Request, res: Response) => send501(res, 'Meeting follow-up'));

// Performance (3 endpoints) — /latest BEFORE /:id
clientIntelligenceRouter.post('/performance/generate', (_req: Request, res: Response) => send501(res, 'Performance narrative generation'));
clientIntelligenceRouter.get('/performance/latest', (_req: Request, res: Response) => send501(res, 'Latest performance narrative'));
clientIntelligenceRouter.get('/performance/:id', (_req: Request, res: Response) => send501(res, 'Performance narrative'));

// Decision Queue (5 endpoints — includes history sub-route)
clientIntelligenceRouter.get('/decision-queue', (_req: Request, res: Response) => send501(res, 'Decision queue'));
clientIntelligenceRouter.post('/decision-queue', (_req: Request, res: Response) => send501(res, 'Create decision'));
clientIntelligenceRouter.get('/decision-queue/:id', (_req: Request, res: Response) => send501(res, 'Decision detail'));
clientIntelligenceRouter.patch('/decision-queue/:id', (_req: Request, res: Response) => send501(res, 'Update decision'));
clientIntelligenceRouter.get('/decision-queue/:id/history', (_req: Request, res: Response) => send501(res, 'Decision history'));

// History & Alerts (3 endpoints)
clientIntelligenceRouter.get('/history', (_req: Request, res: Response) => send501(res, 'Institutional memory'));
clientIntelligenceRouter.get('/risk-alerts', (_req: Request, res: Response) => send501(res, 'Risk alerts'));
clientIntelligenceRouter.patch('/risk-alerts/:id/acknowledge', (_req: Request, res: Response) => send501(res, 'Acknowledge risk alert'));
