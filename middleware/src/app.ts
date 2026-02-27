/**
 * Express application setup — extracted for testability.
 * Import this in tests; import server.ts to start listening.
 */

import express, { type Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { correlationIdMiddleware, errorHandler, authMiddleware, injectRepository } from './middleware/index.js';
import { healthRouter } from './routes/health.js';
import { apiRouter } from './routes/index.js';
import { publicRouter } from './routes/public.route.js';
import { portalVerificationRouter } from './routes/portal-verification.route.js';
import { accessRecoveryRouter } from './routes/access-recovery.route.js';

const app = express();

// Proxy trust (only enable behind a reverse proxy)
if (env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Request parsing
app.use(express.json());

// Correlation ID - must be before logging
app.use(correlationIdMiddleware);

// Request logging
app.use(
  pinoHttp({
    logger,
    customProps: (req: Request) => ({
      correlationId: req.correlationId,
    }),
    // Don't log health checks in production
    autoLogging: {
      ignore: (req: Request) => req.url?.startsWith('/health') ?? false,
    },
  })
);

// Routes - health check (no auth)
app.use('/health', healthRouter);

// Public routes (no auth, rate-limited)
app.use('/api/v1/public', publicRouter);
app.use('/api/v1/public', portalVerificationRouter);
app.use('/api/v1/public', accessRecoveryRouter);

// API v1 routes (auth required)
app.use('/api/v1', authMiddleware, injectRepository, apiRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Route not found',
    correlationId: (_req as Request).correlationId,
  });
});

// Global error handler - must be last
app.use(errorHandler);

export { app };
