/**
 * Invite endpoint tests — GET + DELETE /api/v1/hubs/:hubId/invites
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { loadApp, STAFF_HEADERS } from './test-setup.js';
import { INVITE_FIXTURES } from './members-invites-fixtures.js';

// --- Mocks ---

const mockInviteFindMany = vi.fn();
const mockInviteFindFirst = vi.fn();
const mockInviteUpdate = vi.fn();
const mockContactDeleteMany = vi.fn();
const mockVerificationDeleteMany = vi.fn();
const mockDeviceDeleteMany = vi.fn();
const mockHubMemberUpdateMany = vi.fn();
const mockHubMemberFindMany = vi.fn();
const mockAccessRevokeUpsert = vi.fn();
const mockTransaction = vi.fn();

const mockPrisma = {
  hub: { findFirst: vi.fn(), update: vi.fn() },
  hubInvite: { create: vi.fn(), update: mockInviteUpdate, findMany: mockInviteFindMany, findFirst: mockInviteFindFirst },
  portalContact: { upsert: vi.fn(), deleteMany: mockContactDeleteMany },
  hubMember: { upsert: vi.fn(), updateMany: mockHubMemberUpdateMany, findMany: mockHubMemberFindMany, count: vi.fn() },
  hubAccessRevocation: { upsert: mockAccessRevokeUpsert, findMany: vi.fn(), deleteMany: vi.fn() },
  hubCrmOrgMap: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  portalVerification: { deleteMany: mockVerificationDeleteMany },
  portalDevice: { deleteMany: mockDeviceDeleteMany },
  $transaction: mockTransaction,
};

vi.mock('../db/prisma.js', () => ({ getPrisma: () => mockPrisma }));
vi.mock('../services/email.service.js', () => ({
  sendVerificationCode: vi.fn().mockResolvedValue(undefined),
  sendPortalInvite: vi.fn().mockResolvedValue(undefined),
  sendAccessRecoveryEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../config/env.js', () => ({ env: INVITE_FIXTURES.ENV_MOCK }));
vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() },
}));
vi.mock('pino-http', () => ({
  pinoHttp: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// --- Setup ---

const { INVITE_RESULT, API } = INVITE_FIXTURES;

let app: Express;
beforeAll(async () => { app = await loadApp(); });
beforeEach(() => {
  vi.clearAllMocks();
  mockTransaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma));
  mockHubMemberFindMany.mockResolvedValue([]);
});

// --- Tests ---

describe('GET /hubs/:hubId/invites', () => {
  it('returns only pending non-expired invites', async () => {
    mockInviteFindMany.mockResolvedValueOnce([INVITE_RESULT]);
    mockHubMemberFindMany.mockResolvedValueOnce([]);

    const res = await request(app).get(API).set(STAFF_HEADERS);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);

    const queryArg = mockInviteFindMany.mock.calls[0]?.[0] as Record<string, Record<string, unknown>> | undefined;
    expect(queryArg?.where?.status).toBe('pending');
    expect(queryArg?.where?.expiresAt).toBeDefined();
  });

  it('hides pending invites when the same email already has active client access', async () => {
    mockInviteFindMany.mockResolvedValueOnce([INVITE_RESULT]);
    mockHubMemberFindMany.mockResolvedValueOnce([{ email: INVITE_RESULT.email }]);

    const res = await request(app).get(API).set(STAFF_HEADERS);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('excludes expired pending invites via query filter', async () => {
    mockInviteFindMany.mockResolvedValueOnce([]);
    mockHubMemberFindMany.mockResolvedValueOnce([]);

    const res = await request(app).get(API).set(STAFF_HEADERS);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
    const queryArg = mockInviteFindMany.mock.calls[0]?.[0] as Record<string, Record<string, unknown>> | undefined;
    expect(queryArg?.where?.expiresAt).toBeDefined();
  });

  it('uses select clause that excludes token field', async () => {
    mockInviteFindMany.mockResolvedValueOnce([INVITE_RESULT]);
    mockHubMemberFindMany.mockResolvedValueOnce([]);

    await request(app).get(API).set(STAFF_HEADERS);

    const queryArg = mockInviteFindMany.mock.calls[0]?.[0] as Record<string, Record<string, boolean>> | undefined;
    expect(queryArg?.select).toBeDefined();
    expect(queryArg?.select?.token).toBeUndefined();
    expect(queryArg?.select?.email).toBe(true);
  });
});

describe('DELETE /hubs/:hubId/invites/:id', () => {
  it('revokes invite and cascades deletion', async () => {
    mockInviteFindFirst.mockResolvedValueOnce(INVITE_RESULT);
    mockInviteUpdate.mockResolvedValueOnce({ ...INVITE_RESULT, status: 'revoked' });
    mockContactDeleteMany.mockResolvedValueOnce({ count: 1 });
    mockVerificationDeleteMany.mockResolvedValueOnce({ count: 0 });
    mockDeviceDeleteMany.mockResolvedValueOnce({ count: 0 });
    mockHubMemberUpdateMany.mockResolvedValueOnce({ count: 1 });
    mockAccessRevokeUpsert.mockResolvedValueOnce({});

    const res = await request(app).delete(`${API}/inv-1`).set(STAFF_HEADERS);

    expect(res.status).toBe(204);
    expect(mockInviteUpdate).toHaveBeenCalledOnce();
    expect(mockContactDeleteMany).toHaveBeenCalledOnce();
    expect(mockVerificationDeleteMany).toHaveBeenCalledOnce();
    expect(mockDeviceDeleteMany).toHaveBeenCalledOnce();
    expect(mockHubMemberUpdateMany).toHaveBeenCalledOnce();
    expect(mockAccessRevokeUpsert).toHaveBeenCalledOnce();
  });

  it('returns 404 when invite not found', async () => {
    mockInviteFindFirst.mockResolvedValueOnce(null);

    const res = await request(app).delete(`${API}/nonexistent`).set(STAFF_HEADERS);

    expect(res.status).toBe(404);
  });

  it('returns 404 when invite exists on a different hub (hub-scoped)', async () => {
    // Invite exists but on hub-other, not hub-inv-1 (the URL hub)
    mockInviteFindFirst.mockResolvedValueOnce(null); // hubId filter excludes it

    const res = await request(app).delete(`${API}/inv-on-other-hub`).set(STAFF_HEADERS);

    expect(res.status).toBe(404);
    // Verify the query included hubId
    const queryArg = mockInviteFindFirst.mock.calls[0]?.[0] as Record<string, Record<string, unknown>> | undefined;
    expect(queryArg?.where?.hubId).toBe(INVITE_FIXTURES.HUB_ID);
  });
});
