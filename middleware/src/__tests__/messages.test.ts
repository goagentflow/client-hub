/**
 * Message feed endpoint tests
 */

import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import {
  STAFF_HEADERS,
  CLIENT_HEADERS,
  loadApp,
  makePortalToken,
  portalHeaders,
  mockRepo,
  mockAdminRepo,
  makeMockRepo,
} from './test-setup.js';

const mockSendNewMessageNotification = vi.fn().mockResolvedValue(undefined);
const mockSendClientReplyNotification = vi.fn().mockResolvedValue(undefined);

vi.mock('../services/email.service.js', async (importOriginal) => {
  const orig = await importOriginal() as Record<string, unknown>;
  return {
    ...orig,
    sendNewMessageNotification: (...args: unknown[]) => mockSendNewMessageNotification(...args),
    sendClientReplyNotification: (...args: unknown[]) => mockSendClientReplyNotification(...args),
  };
});

// Portal routes re-scope req.repo via createTenantRepository(getPrisma(), hub.tenantId).
// Mock both so portal tests stay in-memory and deterministic.
vi.mock('../db/prisma.js', () => ({ getPrisma: () => ({}) }));
const portalRepo = makeMockRepo('tenant-agentflow');
vi.mock('../db/tenant-repository.js', async (importOriginal) => {
  const orig = await importOriginal() as Record<string, unknown>;
  return { ...orig, createTenantRepository: () => portalRepo };
});

let app: Express;

beforeAll(async () => {
  app = await loadApp();
});

beforeEach(() => {
  vi.clearAllMocks();

  function setRepoDefaults(repo: Record<string, unknown>): void {
    const hub = repo.hub as { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    const portalContact = repo.portalContact as { findMany: ReturnType<typeof vi.fn> };
    const msg = repo.hubMessage as {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };

    hub.findFirst.mockResolvedValue({
      id: 'hub-1',
      companyName: 'Test Co',
      contactEmail: 'owner@test.com',
    });
    hub.update.mockResolvedValue({ id: 'hub-1' });
    portalContact.findMany.mockResolvedValue([
      { email: 'client1@test.com' },
      { email: 'client2@test.com' },
    ]);

    msg.create.mockImplementation(async (args: Record<string, unknown>) => {
      const data = args.data as Record<string, unknown>;
      return {
        id: 'msg-1',
        hubId: data.hubId,
        tenantId: 'tenant-agentflow',
        senderType: data.senderType,
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        body: data.body,
        createdAt: new Date('2026-02-25T12:00:00.000Z'),
      };
    });
    msg.findMany.mockResolvedValue([
      {
        id: 'msg-2',
        hubId: 'hub-1',
        tenantId: 'tenant-agentflow',
        senderType: 'staff',
        senderEmail: 'hamish@goagentflow.com',
        senderName: 'Hamish Nicklin',
        body: 'Latest message',
        createdAt: new Date('2026-02-25T13:00:00.000Z'),
      },
      {
        id: 'msg-1',
        hubId: 'hub-1',
        tenantId: 'tenant-agentflow',
        senderType: 'portal_client',
        senderEmail: 'client@test.com',
        senderName: 'Client User',
        body: 'Older message',
        createdAt: new Date('2026-02-25T12:00:00.000Z'),
      },
    ]);
    msg.count.mockResolvedValue(2);
  }

  setRepoDefaults(mockRepo as Record<string, unknown>);
  setRepoDefaults(portalRepo as Record<string, unknown>);
});

afterEach(() => {
  // Reset admin hub publish state for portal tests
  const adminHub = mockAdminRepo.hub as { findFirst: ReturnType<typeof vi.fn> };
  adminHub.findFirst.mockReset();
  adminHub.findFirst.mockResolvedValue(null);
});

describe('Staff message feed endpoints', () => {
  it('POST /hubs/:hubId/messages creates message with server-derived sender fields', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/messages')
      .set(STAFF_HEADERS)
      .send({
        body: '  Hello from staff  ',
        senderEmail: 'spoof@example.com',
        senderName: 'Spoof',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 'msg-1',
      hubId: 'hub-1',
      senderType: 'staff',
      senderEmail: 'hamish@goagentflow.com',
      senderName: 'Hamish Nicklin',
      body: 'Hello from staff',
    });
    expect(mockSendNewMessageNotification).toHaveBeenCalledTimes(2);
  });

  it('POST /hubs/:hubId/messages rejects empty/whitespace body with 400', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/messages')
      .set(STAFF_HEADERS)
      .send({ body: '    ' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /hubs/:hubId/messages rejects body over 10,000 chars with 400', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/messages')
      .set(STAFF_HEADERS)
      .send({ body: 'x'.repeat(10001) });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/10000/i);
  });

  it('POST /hubs/:hubId/messages rejects non-string body with 400', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/messages')
      .set(STAFF_HEADERS)
      .send({ body: 123 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/string/i);
  });

  it('GET /hubs/:hubId/messages returns paginated list shape', async () => {
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/messages?page=1&pageSize=10')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toMatchObject({
      page: 1,
      pageSize: 10,
      totalItems: 2,
      totalPages: 1,
    });
    expect(res.body.items[0]).toMatchObject({
      id: 'msg-2',
      senderType: 'staff',
    });
  });

  it('staff endpoints reject non-staff user with 403', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/messages')
      .set(CLIENT_HEADERS)
      .send({ body: 'Hello' });

    expect(res.status).toBe(403);
  });

  it('staff notifications dedupe recipients by email', async () => {
    const portalContact = mockRepo.portalContact as { findMany: ReturnType<typeof vi.fn> };
    portalContact.findMany.mockResolvedValueOnce([
      { email: 'Client@Test.com' },
      { email: 'client@test.com' },
      { email: 'other@test.com' },
    ]);

    const res = await request(app)
      .post('/api/v1/hubs/hub-1/messages')
      .set(STAFF_HEADERS)
      .send({ body: 'Dedup test' });

    expect(res.status).toBe(201);
    expect(mockSendNewMessageNotification).toHaveBeenCalledTimes(2);
  });

  it('staff notifications fallback to hub contactEmail when no portal contacts', async () => {
    const portalContact = mockRepo.portalContact as { findMany: ReturnType<typeof vi.fn> };
    portalContact.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .post('/api/v1/hubs/hub-1/messages')
      .set(STAFF_HEADERS)
      .send({ body: 'Fallback recipient test' });

    expect(res.status).toBe(201);
    expect(mockSendNewMessageNotification).toHaveBeenCalledTimes(1);
    expect(mockSendNewMessageNotification.mock.calls[0]?.[0]).toBe('owner@test.com');
  });

  it('message creation succeeds even if notification send fails', async () => {
    mockSendNewMessageNotification.mockRejectedValueOnce(new Error('resend failure'));

    const res = await request(app)
      .post('/api/v1/hubs/hub-1/messages')
      .set(STAFF_HEADERS)
      .send({ body: 'Should still create' });

    expect(res.status).toBe(201);
  });
});

describe('Portal message feed endpoints', () => {
  async function portalToken(headers?: { email?: string; name?: string }): Promise<Record<string, string>> {
    const token = await makePortalToken('hub-1', {
      email: headers?.email,
      name: headers?.name,
    });
    return portalHeaders(token);
  }

  function setPublishedHub(): void {
    const adminHub = mockAdminRepo.hub as { findFirst: ReturnType<typeof vi.fn> };
    adminHub.findFirst.mockResolvedValue({
      id: 'hub-1',
      tenantId: 'tenant-agentflow',
      isPublished: true,
    });
  }

  it('GET /hubs/:hubId/portal/messages returns list with tenantId stripped', async () => {
    setPublishedHub();

    const headers = await portalToken({ email: 'client@test.com', name: 'Client User' });
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal/messages')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).not.toHaveProperty('tenantId');
  });

  it('POST /hubs/:hubId/portal/messages creates message with senderType portal_client', async () => {
    setPublishedHub();

    const headers = await portalToken({ email: 'client@test.com', name: 'Client User' });
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/portal/messages')
      .set(headers)
      .send({ body: '  Hello from portal  ' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      senderType: 'portal_client',
      senderEmail: 'client@test.com',
      senderName: 'Client User',
      body: 'Hello from portal',
    });
    expect(mockSendClientReplyNotification).toHaveBeenCalledTimes(1);
  });

  it('POST /hubs/:hubId/portal/messages rejects token without verified email claim', async () => {
    setPublishedHub();

    const headers = await portalToken({ name: 'No Email User' });
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/portal/messages')
      .set(headers)
      .send({ body: 'Hello' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('portal token cannot access a different hub', async () => {
    const adminHub = mockAdminRepo.hub as { findFirst: ReturnType<typeof vi.fn> };
    adminHub.findFirst.mockResolvedValue({
      id: 'hub-2',
      tenantId: 'tenant-agentflow',
      isPublished: true,
    });

    const token = await makePortalToken('hub-2', { email: 'client@test.com' });
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal/messages')
      .set(portalHeaders(token));

    expect(res.status).toBe(403);
  });

  it('portal endpoints return 401 when unauthenticated', async () => {
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal/messages');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('portal GET returns 403 when hub is unpublished', async () => {
    const adminHub = mockAdminRepo.hub as { findFirst: ReturnType<typeof vi.fn> };
    adminHub.findFirst.mockResolvedValue({
      id: 'hub-1',
      tenantId: 'tenant-agentflow',
      isPublished: false,
    });

    const headers = await portalToken({ email: 'client@test.com' });
    const res = await request(app)
      .get('/api/v1/hubs/hub-1/portal/messages')
      .set(headers);

    expect(res.status).toBe(403);
  });
});
