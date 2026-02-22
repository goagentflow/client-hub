/**
 * Prisma client singleton.
 *
 * Lazy-initialised on first access so the app can start without
 * a DATABASE_URL in test (where all DB access is mocked).
 * Re-uses a single instance across hot-reloads in development
 * (stored on globalThis to survive module re-imports).
 */

import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = new PrismaClient({
      log: env.LOG_LEVEL === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
  }

  return globalForPrisma.__prisma;
}
