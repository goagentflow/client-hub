/**
 * Public routes tests
 *
 * Verifies portal-meta, password-status, verify-password, and invite accept stub.
 * These endpoints require no auth and are rate-limited.
 *
 * Mocks public-queries.ts functions since public routes now use
 * direct Prisma access (no Supabase adapter, no tenant context).
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { loadApp } from './test-setup.js';

// Mock public queries module
const mockFindPublishedHub = vi.fn();
const mockFindHubForPasswordVerify = vi.fn();

vi.mock('../db/public-queries.js', () => ({
  findPublishedHub: (...args: unknown[]) => mockFindPublishedHub(...args),
  findHubForPasswordVerify: (...args: unknown[]) => mockFindHubForPasswordVerify(...args),
}));

let app: Express;

beforeAll(async () => {
  app = await loadApp();
});

describe('Public routes — response shape', () => {
  it('GET /public/hubs/:hubId/portal-meta returns portal-meta shape for published hub', async () => {
    mockFindPublishedHub.mockResolvedValueOnce({
      id: 'hub-pub', companyName: 'Published Co', hubType: 'pitch', isPublished: true,
    });

    const res = await request(app).get('/api/v1/public/hubs/hub-pub/portal-meta');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      id: 'hub-pub',
      companyName: 'Published Co',
      hubType: 'pitch',
      isPublished: true,
    });
    // Verify no sensitive fields leak
    expect(res.body.data).not.toHaveProperty('contactEmail');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('GET /public/hubs/:hubId/password-status returns hasPassword shape', async () => {
    mockFindPublishedHub.mockResolvedValueOnce({
      id: 'hub-1', companyName: 'Test', hubType: 'pitch', isPublished: true,
    });
    mockFindHubForPasswordVerify.mockResolvedValueOnce({
      id: 'hub-1', passwordHash: 'abc123', isPublished: true,
    });

    const res = await request(app).get('/api/v1/public/hubs/hub-1/password-status');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('hasPassword');
    expect(res.body.data.hasPassword).toBe(true);
  });

  it('POST /public/invites/:token/accept returns 501 stub', async () => {
    const res = await request(app)
      .post('/api/v1/public/invites/some-token/accept')
      .send({});
    expect(res.status).toBe(501);
    expect(res.body.code).toBe('NOT_IMPLEMENTED');
  });
});

describe('Public routes — unpublished hub contract (portal-meta)', () => {
  it('portal-meta returns 404 for unpublished hub', async () => {
    mockFindPublishedHub.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/v1/public/hubs/hub-unpublished/portal-meta');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toBe('Hub not found');
  });

  it('portal-meta returns 404 for non-existent hub', async () => {
    mockFindPublishedHub.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/v1/public/hubs/does-not-exist/portal-meta');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('Public routes — verify-password contract', () => {
  it('returns { valid: false } for unpublished hub (uniform non-enumerating)', async () => {
    mockFindHubForPasswordVerify.mockResolvedValueOnce({
      id: 'hub-draft', passwordHash: 'abc123', isPublished: false,
    });

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-draft/verify-password')
      .send({ passwordHash: 'abc123' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    // Must NOT leak reason for failure
    expect(res.body.data).not.toHaveProperty('reason');
    expect(res.body.data).not.toHaveProperty('token');
  });

  it('returns { valid: false } for wrong password on published hub', async () => {
    mockFindHubForPasswordVerify.mockResolvedValueOnce({
      id: 'hub-pw', passwordHash: 'correct-hash', isPublished: true,
    });

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-pw/verify-password')
      .send({ passwordHash: 'wrong-hash' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data).not.toHaveProperty('token');
  });

  it('no-password hub auto-issues token (published, empty password_hash)', async () => {
    mockFindHubForPasswordVerify.mockResolvedValueOnce({
      id: 'hub-open', passwordHash: null, isPublished: true,
    });

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-open/verify-password')
      .send({ passwordHash: '' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.token.length).toBeGreaterThan(10);
  });

  it('correct password on published hub issues token', async () => {
    mockFindHubForPasswordVerify.mockResolvedValueOnce({
      id: 'hub-pw', passwordHash: 'correct-hash', isPublished: true,
    });

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-pw/verify-password')
      .send({ passwordHash: 'correct-hash' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe('string');
  });

  it('non-existent hub returns { valid: false }', async () => {
    mockFindHubForPasswordVerify.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/v1/public/hubs/no-such-hub/verify-password')
      .send({ passwordHash: 'anything' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
  });
});
