/**
 * Public routes tests
 *
 * Verifies portal-meta, password-status, verify-password, and invite accept stub.
 * These endpoints require no auth and are rate-limited.
 *
 * Uses per-test mock overrides on supabase.from() to test both published
 * and unpublished hub scenarios — the global mock always returns data,
 * so we override single() to control what each route handler sees.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { loadApp } from './test-setup.js';
import { supabase } from '../adapters/supabase.adapter.js';

let app: Express;

beforeAll(async () => {
  app = await loadApp();
});

/** Override the mock chain so .single() returns the given data */
function mockSupabaseSingle(data: Record<string, unknown> | null, error: unknown = null): void {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  // Make all chainable methods return the chain
  mockChain.select.mockReturnValue(mockChain);
  mockChain.eq.mockReturnValue(mockChain);
  vi.mocked(supabase.from).mockReturnValue(mockChain as never);
}

describe('Public routes — response shape', () => {
  it('GET /public/hubs/:hubId/portal-meta returns portal-meta shape for published hub', async () => {
    mockSupabaseSingle({
      id: 'hub-pub', company_name: 'Published Co', hub_type: 'pitch', is_published: true,
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
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  it('GET /public/hubs/:hubId/password-status returns hasPassword shape', async () => {
    mockSupabaseSingle({ password_hash: 'abc123' });

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
    // Simulate what Supabase returns when .eq('is_published', true) finds nothing
    mockSupabaseSingle(null, { code: 'PGRST116', message: 'not found' });

    const res = await request(app).get('/api/v1/public/hubs/hub-unpublished/portal-meta');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toBe('Hub not found');
  });

  it('portal-meta returns 404 for non-existent hub', async () => {
    mockSupabaseSingle(null, { code: 'PGRST116', message: 'not found' });

    const res = await request(app).get('/api/v1/public/hubs/does-not-exist/portal-meta');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('Public routes — verify-password contract', () => {
  it('returns { valid: false } for unpublished hub (uniform non-enumerating)', async () => {
    // Hub exists but is_published: false — route checks this in JS
    mockSupabaseSingle({
      id: 'hub-draft', password_hash: 'abc123', is_published: false,
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
    mockSupabaseSingle({
      id: 'hub-pw', password_hash: 'correct-hash', is_published: true,
    });

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-pw/verify-password')
      .send({ passwordHash: 'wrong-hash' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data).not.toHaveProperty('token');
  });

  it('no-password hub auto-issues token (published, empty password_hash)', async () => {
    mockSupabaseSingle({
      id: 'hub-open', password_hash: null, is_published: true,
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
    mockSupabaseSingle({
      id: 'hub-pw', password_hash: 'correct-hash', is_published: true,
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
    mockSupabaseSingle(null, { code: 'PGRST116', message: 'not found' });

    const res = await request(app)
      .post('/api/v1/public/hubs/no-such-hub/verify-password')
      .send({ passwordHash: 'anything' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
  });
});
