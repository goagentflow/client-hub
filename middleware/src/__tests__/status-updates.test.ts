/**
 * Status Update contract tests
 *
 * Verifies:
 * - POST creates status update with server-derived fields
 * - Validation rejects missing/invalid fields
 * - Staff-only access (client users get 403)
 * - GET returns paginated list shape
 * - Portal auth (403 for unpublished hub, 401 for unauthenticated)
 * - Portal positive path: returns items with tenantId + createdSource stripped
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { STAFF_HEADERS, CLIENT_HEADERS, loadApp, makePortalToken, portalHeaders, makeMockRepo, mockAdminRepo } from './test-setup.js';

// Mock getPrisma + createTenantRepository so hub-access can re-scope for portal users
vi.mock('../db/prisma.js', () => ({ getPrisma: () => ({}) }));
const portalRepo = makeMockRepo('tenant-agentflow');
vi.mock('../db/tenant-repository.js', async (importOriginal) => {
  const orig = await importOriginal() as Record<string, unknown>;
  return {
    ...orig,
    createTenantRepository: () => portalRepo,
  };
});

let app: Express;

beforeAll(async () => {
  app = await loadApp();
});

const VALID_PAYLOAD = {
  period: 'Week 5 (w/c 31 Mar)',
  completed: 'Brand guidelines finalised',
  inProgress: 'Homepage development',
  nextPeriod: 'Complete homepage build',
  neededFromClient: 'Final logo files',
  onTrack: 'on_track',
};

describe('POST /hubs/:hubId/status-updates', () => {
  it('creates status update with 201 and server-derived fields', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/status-updates')
      .set(STAFF_HEADERS)
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.createdSource).toBe('staff_ui');
  });

  it('rejects missing period with 400', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/status-updates')
      .set(STAFF_HEADERS)
      .send({ ...VALID_PAYLOAD, period: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing completed with 400', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/status-updates')
      .set(STAFF_HEADERS)
      .send({ ...VALID_PAYLOAD, completed: '   ' });
    expect(res.status).toBe(400);
  });

  it('rejects missing inProgress with 400', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/status-updates')
      .set(STAFF_HEADERS)
      .send({ ...VALID_PAYLOAD, inProgress: '' });
    expect(res.status).toBe(400);
  });

  it('rejects missing nextPeriod with 400', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/status-updates')
      .set(STAFF_HEADERS)
      .send({ ...VALID_PAYLOAD, nextPeriod: '' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid onTrack value with 400', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/status-updates')
      .set(STAFF_HEADERS)
      .send({ ...VALID_PAYLOAD, onTrack: 'mostly_fine' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('onTrack must be one of');
  });

  it('rejects missing onTrack with 400', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/status-updates')
      .set(STAFF_HEADERS)
      .send({ ...VALID_PAYLOAD, onTrack: '' });
    expect(res.status).toBe(400);
  });

  it('rejects client (non-staff) users with 403', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/status-updates')
      .set(CLIENT_HEADERS)
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('rejects non-string field values with 400 (not 500)', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/status-updates')
      .set(STAFF_HEADERS)
      .send({ ...VALID_PAYLOAD, period: 123 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects non-string optional field with 400', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/status-updates')
      .set(STAFF_HEADERS)
      .send({ ...VALID_PAYLOAD, neededFromClient: ['array'] });
    expect(res.status).toBe(400);
  });
});

describe('GET /hubs/:hubId/status-updates', () => {
  it('returns paginated list shape', async () => {
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/status-updates')
      .set(STAFF_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('pageSize');
    expect(res.body.pagination).toHaveProperty('totalItems');
    expect(res.body.pagination).toHaveProperty('totalPages');
  });

  it('rejects client (non-staff) users with 403', async () => {
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/status-updates')
      .set(CLIENT_HEADERS);
    expect(res.status).toBe(403);
  });
});

describe('GET /hubs/:hubId/portal/status-updates', () => {
  it('portal token gets 403 for unpublished hub (default mock)', async () => {
    const token = await makePortalToken('hub-1');
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal/status-updates')
      .set(portalHeaders(token));
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal/status-updates');
    expect(res.status).toBe(401);
  });

  it('returns items with tenantId and createdSource stripped for published hub', async () => {
    // Reset adminRepo hub mock then set it to return a published hub
    const adminHub = mockAdminRepo.hub as { findFirst: ReturnType<typeof vi.fn> };
    adminHub.findFirst.mockResolvedValue({ id: 'hub-1', isPublished: true, tenantId: 'tenant-agentflow' });

    // Mock portalRepo to return a status update with internal fields
    const statusModel = portalRepo.hubStatusUpdate as Record<string, ReturnType<typeof vi.fn>>;
    statusModel.findMany!.mockResolvedValueOnce([{
      id: 'su-1', hubId: 'hub-1', tenantId: 'tenant-agentflow',
      period: 'Week 1', completed: 'Done', inProgress: 'WIP',
      nextPeriod: 'Plan', neededFromClient: null, onTrack: 'on_track',
      createdBy: 'Hamish', createdSource: 'staff_ui',
      createdAt: new Date('2026-02-01'),
    }]);
    statusModel.count!.mockResolvedValueOnce(1);

    const token = await makePortalToken('hub-1');
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal/status-updates')
      .set(portalHeaders(token));

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toHaveProperty('id', 'su-1');
    expect(res.body.items[0]).toHaveProperty('createdBy', 'Hamish');
    // Verify internal fields are stripped
    expect(res.body.items[0]).not.toHaveProperty('tenantId');
    expect(res.body.items[0]).not.toHaveProperty('createdSource');
  });
});
