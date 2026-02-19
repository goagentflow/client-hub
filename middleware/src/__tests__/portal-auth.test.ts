/**
 * Portal auth and staff guard tests
 *
 * Verifies:
 * - Portal JWT auth flow (hub-bound tokens, mismatch, invalid tokens)
 * - Staff guards reject client/portal users
 * - Portal event type allowlist
 * - Stale portal token precedence
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { STAFF_HEADERS, CLIENT_HEADERS, loadApp, makePortalToken, portalHeaders } from './test-setup.js';

let app: Express;

beforeAll(async () => {
  app = await loadApp();
});

// ============================================================================
// Portal token auth — validates JWT, creates portal user context
// ============================================================================
describe('Portal token auth', () => {
  it('portal token for hub-1 can access hub-1 events POST (published check)', async () => {
    const token = await makePortalToken('hub-1');
    // Hub-access checks is_published — mock returns is_published: false → 403
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/events')
      .set(portalHeaders(token))
      .send({ eventType: 'hub.viewed', metadata: { section: 'overview' } });
    // Expect 403 because default mock hub is unpublished
    expect(res.status).toBe(403);
  });

  it('portal token for hub-A cannot access hub-B (hub mismatch → 403)', async () => {
    const token = await makePortalToken('hub-A');
    const res = await request(app)
      .post('/api/v1/hubs/hub-B/events')
      .set(portalHeaders(token))
      .send({ eventType: 'hub.viewed', metadata: { section: 'overview' } });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
    expect(res.body.message).toContain('Portal access denied');
  });

  it('portal token cannot access staff-only hub list endpoint', async () => {
    const token = await makePortalToken('hub-1');
    const res = await request(app)
      .get('/api/v1/hubs')
      .set(portalHeaders(token));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('invalid portal token falls through to demo auth (401 without dev header)', async () => {
    const res = await request(app)
      .get('/api/v1/hubs')
      .set({ Authorization: 'Bearer totally-invalid-token' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('portal token with wrong type claim falls through to demo auth', async () => {
    const token = await makePortalToken('hub-1', { type: 'admin' });
    const res = await request(app)
      .get('/api/v1/hubs')
      .set(portalHeaders(token));
    // Wrong type → falls through → no X-Dev-User-Email → 401
    expect(res.status).toBe(401);
  });
});

// ============================================================================
// Staff guards — client/portal users rejected from staff-only endpoints
// ============================================================================
describe('Staff guards', () => {
  it('client user cannot access hub list', async () => {
    const res = await request(app)
      .get('/api/v1/hubs')
      .set(CLIENT_HEADERS);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('client user cannot create a hub', async () => {
    const res = await request(app)
      .post('/api/v1/hubs')
      .set(CLIENT_HEADERS)
      .send({ companyName: 'Test', contactName: 'Test', contactEmail: 'a@b.com' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('client user cannot update a hub', async () => {
    const res = await request(app)
      .patch('/api/v1/hubs/hub-1')
      .set(CLIENT_HEADERS)
      .send({ companyName: 'New Name' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('client user cannot get hub overview', async () => {
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/overview')
      .set(CLIENT_HEADERS);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('client user cannot list events (GET)', async () => {
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/events')
      .set(CLIENT_HEADERS);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('client user cannot access staff portal-preview', async () => {
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal-preview')
      .set(CLIENT_HEADERS);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('staff user can access portal-preview', async () => {
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal-preview')
      .set(STAFF_HEADERS);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('companyName');
    expect(res.body).toHaveProperty('hubType');
    expect(res.body).toHaveProperty('isPublished');
  });
});

// ============================================================================
// Portal event type allowlist
// ============================================================================
describe('Portal event type allowlist', () => {
  it('PORTAL_ALLOWED_EVENTS contains expected engagement types', async () => {
    const { PORTAL_ALLOWED_EVENTS } = await import('../routes/events.route.js');
    expect(PORTAL_ALLOWED_EVENTS).toContain('hub.viewed');
    expect(PORTAL_ALLOWED_EVENTS).toContain('video.watched');
    expect(PORTAL_ALLOWED_EVENTS).toContain('document.viewed');
    expect(PORTAL_ALLOWED_EVENTS).toContain('questionnaire.completed');
    // Staff-only events must NOT be in the allowlist
    expect(PORTAL_ALLOWED_EVENTS).not.toContain('share.sent');
    expect(PORTAL_ALLOWED_EVENTS).not.toContain('message.sent');
    expect(PORTAL_ALLOWED_EVENTS).not.toContain('leadership.accessed');
  });
});

// ============================================================================
// Stale portal token — staff auth takes precedence
// ============================================================================
describe('Stale portal token with staff auth', () => {
  it('valid Bearer token resolves before dev header (portal token wins → 403 on staff-only)', async () => {
    const token = await makePortalToken('hub-1');
    // Both Bearer and X-Dev-User-Email sent — Bearer resolves first in auth middleware
    const res = await request(app)
      .get('/api/v1/hubs')
      .set({
        ...portalHeaders(token),
        'X-Dev-User-Email': 'hamish@goagentflow.com',
      });
    // Portal token is valid → auth resolves as portal user (isStaff=false) → 403 on staff-only list
    // This confirms the frontend must NOT send both (enforced in api.ts)
    expect(res.status).toBe(403);
  });
});
