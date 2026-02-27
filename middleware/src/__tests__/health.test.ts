/**
 * Health endpoint tests — /health, /health/ready, /health/live
 *
 * Covers:
 * - 200 when DB is reachable
 * - 503 when DB is unreachable
 * - Liveness probe (no DB dependency)
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

// Mock pino-http
vi.mock('pino-http', () => ({
  pinoHttp: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mock env
vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
    AUTH_MODE: 'demo',
    DATA_BACKEND: 'azure_pg',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    CORS_ORIGIN: 'http://localhost:5173',
    LOG_LEVEL: 'silent',
    AZURE_TENANT_ID: 'test',
    AZURE_CLIENT_ID: 'test',
    AZURE_JWKS_URI: undefined,
    STAFF_ROLE_NAME: 'Staff',
    PORTAL_TOKEN_SECRET: 'test-portal-secret-must-be-at-least-32-chars-long',
    PITCH_PASSWORD_HASH_MAP: '{}',
    TRUST_PROXY: false,
  },
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

// Mock Prisma — controllable per test
const mockQueryRaw = vi.fn();
vi.mock('../db/prisma.js', () => ({
  getPrisma: () => ({ $queryRaw: mockQueryRaw }),
}));

// Mock inject-repository (needed for app import)
vi.mock('../middleware/inject-repository.js', () => ({
  injectRepository: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mock Supabase adapter (needed for app import)
vi.mock('../adapters/supabase.adapter.js', () => ({
  supabase: { from: vi.fn() },
  mapHubRow: vi.fn(), mapPortalConfig: vi.fn(), mapVideoRow: vi.fn(),
  mapDocumentRow: vi.fn(), mapProposalRow: vi.fn(), mapEventRow: vi.fn(),
  mapProjectRow: vi.fn(), mapMilestoneRow: vi.fn(),
}));

// Mock public-queries (needed for app import)
vi.mock('../db/public-queries.js', () => ({
  findPublishedHub: vi.fn().mockResolvedValue(null),
  findHubForPasswordVerify: vi.fn().mockResolvedValue(null),
}));

let app: Express;

beforeAll(async () => {
  const mod = await import('../app.js');
  app = mod.app as unknown as Express;
});

beforeEach(() => {
  mockQueryRaw.mockReset();
});

describe('GET /health', () => {
  it('returns 200 healthy when DB is reachable', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.checks).toEqual(
      expect.arrayContaining([
        { name: 'server', status: 'pass' },
        { name: 'database', status: 'pass' },
      ])
    );
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns 503 degraded when DB is unreachable', async () => {
    mockQueryRaw.mockRejectedValue(new Error('Connection refused'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks).toEqual(
      expect.arrayContaining([
        { name: 'server', status: 'pass' },
        { name: 'database', status: 'fail', message: 'Database unreachable' },
      ])
    );
  });
});

describe('GET /health/ready', () => {
  it('returns 200 when DB is reachable', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });

  it('returns 503 when DB is unreachable', async () => {
    mockQueryRaw.mockRejectedValue(new Error('Connection refused'));

    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.ready).toBe(false);
  });
});

describe('GET /health/live', () => {
  it('returns 200 always (no DB dependency)', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body.live).toBe(true);
    // Should not call DB at all
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });
});
