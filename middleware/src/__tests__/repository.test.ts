/**
 * Tests for TenantRepository, AdminRepository, and inject-repository middleware.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

// Mock env
vi.mock('../config/env.js', () => ({
  env: {
    DATA_BACKEND: 'azure_pg',
    AUTH_MODE: 'demo',
    LOG_LEVEL: 'silent',
  },
}));

// Mock prisma
vi.mock('../db/prisma.js', () => ({
  getPrisma: vi.fn(),
}));

import { createTenantRepository } from '../db/tenant-repository.js';
import { createAdminRepository } from '../db/admin-repository.js';
import { injectRepository } from '../middleware/inject-repository.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

function makeMockDelegate() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockResolvedValue({ id: 'new-1' }),
    update: vi.fn().mockResolvedValue({ id: 'upd-1' }),
    delete: vi.fn().mockResolvedValue({ id: 'del-1' }),
  };
}

function makeMockPrisma() {
  return {
    hub: makeMockDelegate(),
    hubVideo: makeMockDelegate(),
    hubDocument: makeMockDelegate(),
    hubProject: makeMockDelegate(),
    hubMilestone: makeMockDelegate(),
    hubEvent: makeMockDelegate(),
  };
}

// --- TenantRepository ---

describe('TenantRepository', () => {
  const TENANT_ID = 'tenant-abc';

  it('injects tenantId into findMany where clause', async () => {
    const prisma = makeMockPrisma();
    const repo = createTenantRepository(prisma as never, TENANT_ID);

    await repo.hub.findMany({ where: { status: 'active' } });

    expect(prisma.hub.findMany).toHaveBeenCalledWith({
      where: { status: 'active', tenantId: TENANT_ID },
    });
  });

  it('injects tenantId when no where clause provided', async () => {
    const prisma = makeMockPrisma();
    const repo = createTenantRepository(prisma as never, TENANT_ID);

    await repo.hub.findMany();

    expect(prisma.hub.findMany).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID },
    });
  });

  it('injects tenantId into findFirst where clause', async () => {
    const prisma = makeMockPrisma();
    const repo = createTenantRepository(prisma as never, TENANT_ID);

    await repo.hub.findFirst({ where: { id: 'hub-1' } });

    expect(prisma.hub.findFirst).toHaveBeenCalledWith({
      where: { id: 'hub-1', tenantId: TENANT_ID },
    });
  });

  it('injects tenantId into count where clause', async () => {
    const prisma = makeMockPrisma();
    const repo = createTenantRepository(prisma as never, TENANT_ID);

    await repo.hubEvent.count({ where: { hubId: 'hub-1' } });

    expect(prisma.hubEvent.count).toHaveBeenCalledWith({
      where: { hubId: 'hub-1', tenantId: TENANT_ID },
    });
  });

  it('injects tenantId into create data', async () => {
    const prisma = makeMockPrisma();
    const repo = createTenantRepository(prisma as never, TENANT_ID);

    await repo.hub.create({ data: { companyName: 'Test Co' } });

    expect(prisma.hub.create).toHaveBeenCalledWith({
      data: { companyName: 'Test Co', tenantId: TENANT_ID },
    });
  });

  it('injects tenantId into update where clause', async () => {
    const prisma = makeMockPrisma();
    const repo = createTenantRepository(prisma as never, TENANT_ID);

    await repo.hub.update({ where: { id: 'hub-1' }, data: { status: 'active' } });

    expect(prisma.hub.update).toHaveBeenCalledWith({
      where: { id: 'hub-1', tenantId: TENANT_ID },
      data: { status: 'active' },
    });
  });

  it('injects tenantId into delete where clause', async () => {
    const prisma = makeMockPrisma();
    const repo = createTenantRepository(prisma as never, TENANT_ID);

    await repo.hub.delete({ where: { id: 'hub-1' } });

    expect(prisma.hub.delete).toHaveBeenCalledWith({
      where: { id: 'hub-1', tenantId: TENANT_ID },
    });
  });

  it('scopes all model accessors', () => {
    const prisma = makeMockPrisma();
    const repo = createTenantRepository(prisma as never, TENANT_ID);

    expect(repo.hub).toBeDefined();
    expect(repo.hubVideo).toBeDefined();
    expect(repo.hubDocument).toBeDefined();
    expect(repo.hubProject).toBeDefined();
    expect(repo.hubMilestone).toBeDefined();
    expect(repo.hubEvent).toBeDefined();
    expect(repo.tenantId).toBe(TENANT_ID);
  });
});

// --- AdminRepository ---

describe('AdminRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs every model access automatically', async () => {
    const prisma = makeMockPrisma();
    const admin = createAdminRepository(prisma as never, 'user-admin');

    await admin.hub.findMany();

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-admin', bypassTenant: true }),
      'Admin repository access',
    );
  });

  it('query() logs action and reason before executing', async () => {
    const prisma = makeMockPrisma();
    const admin = createAdminRepository(prisma as never, 'user-admin');

    await admin.query('list-all-hubs', 'leadership dashboard', async (p) => {
      return (p as unknown as ReturnType<typeof makeMockPrisma>).hub.findMany();
    });

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'list-all-hubs',
        reason: 'leadership dashboard',
        userId: 'user-admin',
        bypassTenant: true,
      }),
      'Admin repository access',
    );
  });

  it('does not inject tenantId (cross-tenant access)', async () => {
    const prisma = makeMockPrisma();
    const admin = createAdminRepository(prisma as never, 'user-admin');

    await admin.hub.findMany({ where: { status: 'active' } });

    expect(prisma.hub.findMany).toHaveBeenCalledWith({ where: { status: 'active' } });
  });

  it('shares ScopedModel interface with TenantRepository', () => {
    const prisma = makeMockPrisma();
    const admin = createAdminRepository(prisma as never, 'user-admin');

    expect(admin.hub).toBeDefined();
    expect(admin.hubVideo).toBeDefined();
    expect(admin.hubDocument).toBeDefined();
    expect(admin.hubProject).toBeDefined();
    expect(admin.hubMilestone).toBeDefined();
    expect(admin.hubEvent).toBeDefined();
  });
});

// --- inject-repository middleware ---

describe('injectRepository middleware', () => {
  function makeMockReqRes(overrides: Record<string, unknown> = {}) {
    const req = {
      user: { tenantId: 'tenant-abc', userId: 'user-1', email: 'test@test.com', name: 'Test', isStaff: true },
      correlationId: 'corr-1',
      ...overrides,
    } as never;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as never;
    const next = vi.fn();
    return { req, res, next };
  }

  it('skips when DATA_BACKEND is not azure_pg', () => {
    const mutableEnv = env as Record<string, unknown>;
    const original = mutableEnv.DATA_BACKEND;
    mutableEnv.DATA_BACKEND = 'mock';

    const { req, res, next } = makeMockReqRes();
    injectRepository(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as Record<string, unknown>).repo).toBeUndefined();

    mutableEnv.DATA_BACKEND = original;
  });

  it('returns 500 when tenantId is missing in azure_pg mode', () => {
    const { req, res, next } = makeMockReqRes({ user: { userId: 'user-1' } });
    injectRepository(req, res, next);

    expect((res as Record<string, CallableFunction>).status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when user is missing entirely', () => {
    const { req, res, next } = makeMockReqRes({ user: undefined });
    injectRepository(req, res, next);

    expect((res as Record<string, CallableFunction>).status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
