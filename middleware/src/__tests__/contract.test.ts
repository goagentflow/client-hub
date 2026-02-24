/**
 * Contract smoke tests
 *
 * Verifies:
 * 1. Every route returns correct HTTP status
 * 2. Error responses match { code, message } shape
 * 3. List endpoints return { items, pagination } shape
 * 4. Hub CRUD returns correct field names
 * 5. 501 routes return { code: "NOT_IMPLEMENTED" }
 * 6. Auth rejects missing X-Dev-User-Email (401)
 * 7. Admin routes reject non-staff users (403)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { STAFF_HEADERS, CLIENT_HEADERS, loadApp } from './test-setup.js';

let app: Express;

beforeAll(async () => {
  app = await loadApp();
});

// ============================================================================
// 1. Auth — rejects missing header
// ============================================================================
describe('Auth', () => {
  it('returns 401 without X-Dev-User-Email', async () => {
    const res = await request(app).get('/api/v1/hubs');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
    expect(res.body.message).toBeDefined();
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .get('/api/v1/hubs')
      .set('X-Dev-User-Email', 'nobody@example.com');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });
});

// ============================================================================
// 2. Hub list — returns { items, pagination }
// ============================================================================
describe('Hub list', () => {
  it('GET /hubs returns paginated list shape', async () => {
    const res = await request(app).get('/api/v1/hubs').set(STAFF_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('pageSize');
    expect(res.body.pagination).toHaveProperty('totalItems');
    expect(res.body.pagination).toHaveProperty('totalPages');
  });
});

// ============================================================================
// 3. Hub single — returns correct field names
// ============================================================================
describe('Hub detail', () => {
  it('GET /hubs/:id returns Hub shape', async () => {
    const res = await request(app).get('/api/v1/hubs/hub-1').set(STAFF_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('companyName');
    expect(res.body).toHaveProperty('contactName');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('hubType');
  });
});

// ============================================================================
// 4. 501 routes
// ============================================================================
describe('501 stubs', () => {
  const stub501Routes = [
    ['GET', '/api/v1/hubs/hub-1/videos/vid-1/engagement'],
    ['POST', '/api/v1/hubs/hub-1/videos'],
    ['GET', '/api/v1/hubs/hub-1/documents/doc-1/engagement'],
    ['POST', '/api/v1/hubs/hub-1/documents'],
    ['GET', '/api/v1/hubs/hub-1/proposal/engagement'],
    ['POST', '/api/v1/hubs/hub-1/proposal'],
    ['GET', '/api/v1/hubs/hub-1/messages'],
    ['GET', '/api/v1/hubs/hub-1/meetings'],
    ['GET', '/api/v1/hubs/hub-1/relationship-health'],
    ['GET', '/api/v1/hubs/hub-1/expansion-opportunities'],
    ['GET', '/api/v1/hubs/hub-1/decision-queue'],
    ['GET', '/api/v1/hubs/hub-1/history'],
    ['GET', '/api/v1/hubs/hub-1/risk-alerts'],
    ['POST', '/api/v1/hubs/hub-1/portal/proposal/comment'],
    ['GET', '/api/v1/hubs/hub-1/portal/messages'],
    ['GET', '/api/v1/hubs/hub-1/portal/meetings'],
    ['GET', '/api/v1/hubs/hub-1/portal/members'],
    ['GET', '/api/v1/hubs/hub-1/portal/questionnaires'],
    ['POST', '/api/v1/hubs/hub-1/convert/rollback'],
    ['GET', '/api/v1/leadership/at-risk'],
    ['GET', '/api/v1/leadership/expansion'],
    ['POST', '/api/v1/leadership/refresh'],
  ];

  for (const [method, path] of stub501Routes) {
    it(`${method} ${path} → 501`, async () => {
      const req = method === 'POST'
        ? request(app).post(path!).set(STAFF_HEADERS).send({})
        : method === 'PATCH'
          ? request(app).patch(path!).set(STAFF_HEADERS).send({})
          : request(app).get(path!).set(STAFF_HEADERS);

      const res = await req;
      expect(res.status).toBe(501);
      expect(res.body.code).toBe('NOT_IMPLEMENTED');
      expect(res.body.message).toBeDefined();
    });
  }
});

// ============================================================================
// 4b. Empty-list stubs (200) — endpoints returning empty PaginatedList
// ============================================================================
describe('Empty-list stubs (200)', () => {
  const emptyListRoutes = [
    '/api/v1/hubs/hub-1/members',
    '/api/v1/hubs/hub-1/questionnaires',
  ];

  for (const path of emptyListRoutes) {
    it(`GET ${path} → 200 with empty PaginatedList`, async () => {
      const res = await request(app).get(path).set(STAFF_HEADERS);
      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
      });
    });
  }
});

// ============================================================================
// 4c. Hub creation with hubType
// ============================================================================
describe('Hub creation with hubType', () => {
  it('POST /hubs with hubType: "client" creates a client hub', async () => {
    const res = await request(app)
      .post('/api/v1/hubs')
      .set(STAFF_HEADERS)
      .send({
        companyName: 'Client Co',
        contactName: 'Jane Doe',
        contactEmail: 'jane@clientco.com',
        hubType: 'client',
      });
    expect(res.status).toBe(201);
    expect(res.body.hubType).toBe('client');
  });

  it('POST /hubs with invalid hubType defaults to "pitch"', async () => {
    const res = await request(app)
      .post('/api/v1/hubs')
      .set(STAFF_HEADERS)
      .send({
        companyName: 'Fallback Co',
        contactName: 'John Smith',
        contactEmail: 'john@fallback.com',
        hubType: 'invalid',
      });
    expect(res.status).toBe(201);
    expect(res.body.hubType).toBe('pitch');
  });

  it('POST /hubs without hubType defaults to "pitch"', async () => {
    const res = await request(app)
      .post('/api/v1/hubs')
      .set(STAFF_HEADERS)
      .send({
        companyName: 'Default Co',
        contactName: 'Bob Jones',
        contactEmail: 'bob@default.com',
      });
    expect(res.status).toBe(201);
    expect(res.body.hubType).toBe('pitch');
  });
});

// ============================================================================
// 5. Admin guard — rejects non-staff
// ============================================================================
describe('Admin guard', () => {
  it('leadership portfolio rejects client users with 403', async () => {
    const res = await request(app)
      .get('/api/v1/leadership/portfolio')
      .set(CLIENT_HEADERS);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('conversion rejects client users with 403', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/convert')
      .set(CLIENT_HEADERS)
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});

// ============================================================================
// 6. 404 — unknown routes
// ============================================================================
describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app)
      .get('/api/v1/nonexistent')
      .set(STAFF_HEADERS);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

// ============================================================================
// 7. Error shape
// ============================================================================
describe('Error shape', () => {
  it('errors have flat { code, message } shape (no nested error object)', async () => {
    const res = await request(app).get('/api/v1/hubs');
    // 401 without auth
    expect(res.body).not.toHaveProperty('error');
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('message');
  });
});
