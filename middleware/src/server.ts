/**
 * Server entry point — starts listening.
 * Separate from app.ts so tests can import the app without starting the server.
 */

import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV, demoMode: env.DEMO_MODE }, 'AgentFlow middleware started');
});

// Graceful shutdown
const shutdown = (signal: string): void => {
  logger.info({ signal }, 'Shutdown signal received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
