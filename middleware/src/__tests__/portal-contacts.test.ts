/**
 * Portal contacts tests — staff CRUD + access method
 *
 * Verifies staff-only contact management, access method endpoints,
 * tenant isolation, Prisma error mapping, and method-switch revocation.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { loadApp, STAFF_HEADERS } from './test-setup.js';

vi.mock('../db/portal-verification-queries.js', () => ({
  findHubAccessMethod: vi.fn(),
  findPortalContact: vi.fn(),
  upsertVerification: vi.fn(),
  findActiveVerification: vi.fn(),
  incrementAttempts: vi.fn(),
  markVerificationUsed: vi.fn(),
  createDeviceRecord: vi.fn(),
  findValidDevice: vi.fn(),
}));

vi.mock('../services/email.service.js', () => ({
  sendVerificationCode: vi.fn().mockResolvedValue(undefined),
}));

const mockPrisma = {
  portalContact: {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    delete: vi.fn(),
  },
  portalDevice: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  portalVerification: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  hub: {
    findFirst: vi.fn().mockResolvedValue({ tenantId: 'tenant-agentflow', accessMethod: 'email' }),
    update: vi.fn(),
  },
  $transaction: vi.fn().mockResolvedValue([]),
};

vi.mock('../db/prisma.js', () => ({ getPrisma: () => mockPrisma }));

let app: Express;
beforeAll(async () => { app = await loadApp(); });
beforeEach(() => { vi.clearAllMocks(); });

describe('Staff portal contacts CRUD', () => {
  beforeEach(() => {
    mockPrisma.hub.findFirst.mockResolvedValue({ tenantId: 'tenant-agentflow', accessMethod: 'email' });
  });

  it('GET lists contacts', async () => {
    mockPrisma.portalContact.findMany.mockResolvedValueOnce([
      { id: 'c-1', email: 'a@t.com', name: 'Alice', addedBy: 'u-1', createdAt: '2024-01-01' },
    ]);
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal-contacts')
      .set(STAFF_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBe('a@t.com');
  });

  it('POST adds a contact', async () => {
    mockPrisma.portalContact.create.mockResolvedValueOnce({
      id: 'c-new', email: 'new@t.com', name: 'N', addedBy: 'u-1', createdAt: '2024-01-01',
    });
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/portal-contacts')
      .set(STAFF_HEADERS)
      .send({ email: 'New@T.com', name: 'N' });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('c-new');
  });

  it('POST returns 409 for duplicate contact', async () => {
    const err = new Error('Unique constraint') as Error & { code: string };
    err.code = 'P2002';
    mockPrisma.portalContact.create.mockRejectedValueOnce(err);

    const res = await request(app)
      .post('/api/v1/hubs/hub-1/portal-contacts')
      .set(STAFF_HEADERS)
      .send({ email: 'dupe@t.com' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('DELETE cascades delete', async () => {
    mockPrisma.portalContact.findUnique.mockResolvedValueOnce({
      id: 'c-1', hubId: 'hub-1', email: 'a@t.com',
    });
    const res = await request(app)
      .delete('/api/v1/hubs/hub-1/portal-contacts/c-1')
      .set(STAFF_HEADERS);
    expect(res.status).toBe(204);
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
  });

  it('DELETE returns 404 for non-existent contact', async () => {
    mockPrisma.portalContact.findUnique.mockResolvedValueOnce(null);
    const res = await request(app)
      .delete('/api/v1/hubs/hub-1/portal-contacts/no-such')
      .set(STAFF_HEADERS);
    expect(res.status).toBe(404);
  });
});

describe('GET /hubs/:hubId/access-method (staff)', () => {
  it('returns current access method', async () => {
    mockPrisma.hub.findFirst.mockResolvedValueOnce({ tenantId: 'tenant-agentflow', accessMethod: 'email' });
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/access-method')
      .set(STAFF_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ method: 'email' });
  });
});

describe('PATCH /hubs/:hubId/access-method', () => {
  beforeEach(() => {
    mockPrisma.hub.findFirst.mockResolvedValue({ tenantId: 'tenant-agentflow', accessMethod: 'email' });
    mockPrisma.hub.update.mockResolvedValue({});
  });

  it('updates access method', async () => {
    const res = await request(app)
      .patch('/api/v1/hubs/hub-1/access-method')
      .set(STAFF_HEADERS)
      .send({ method: 'email' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ method: 'email' });
  });

  it('switching to open clears passwordHash', async () => {
    const res = await request(app)
      .patch('/api/v1/hubs/hub-1/access-method')
      .set(STAFF_HEADERS)
      .send({ method: 'open' });
    expect(res.status).toBe(200);
    expect(mockPrisma.hub.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accessMethod: 'open', passwordHash: null }),
      }),
    );
  });

  it('switching away from email revokes devices and verifications', async () => {
    await request(app)
      .patch('/api/v1/hubs/hub-1/access-method')
      .set(STAFF_HEADERS)
      .send({ method: 'password' });
    expect(mockPrisma.portalDevice.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { hubId: 'hub-1' } }),
    );
    expect(mockPrisma.portalVerification.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { hubId: 'hub-1' } }),
    );
  });

  it('switching to email does NOT revoke devices', async () => {
    await request(app)
      .patch('/api/v1/hubs/hub-1/access-method')
      .set(STAFF_HEADERS)
      .send({ method: 'email' });
    expect(mockPrisma.portalDevice.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects invalid access method', async () => {
    const res = await request(app)
      .patch('/api/v1/hubs/hub-1/access-method')
      .set(STAFF_HEADERS)
      .send({ method: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when hub not found (P2025)', async () => {
    const err = new Error('Not found') as Error & { code: string };
    err.code = 'P2025';
    mockPrisma.hub.update.mockRejectedValueOnce(err);

    const res = await request(app)
      .patch('/api/v1/hubs/hub-1/access-method')
      .set(STAFF_HEADERS)
      .send({ method: 'email' });
    expect(res.status).toBe(404);
  });
});

describe('Tenant isolation', () => {
  it('returns 404 when hub does not exist', async () => {
    mockPrisma.hub.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal-contacts')
      .set(STAFF_HEADERS);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('returns 403 when hub belongs to different tenant', async () => {
    mockPrisma.hub.findFirst.mockResolvedValueOnce({ tenantId: 'other-tenant', accessMethod: 'email' });

    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal-contacts')
      .set(STAFF_HEADERS);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
