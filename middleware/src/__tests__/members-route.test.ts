/**
 * Members route tests — list/update/remove (live endpoints).
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { loadApp, STAFF_HEADERS, mockRepo } from './test-setup.js';

const mockHubFindFirst = vi.fn();
const mockHubMemberFindFirst = vi.fn();
const mockHubMemberUpdate = vi.fn();
const mockHubInviteUpdateMany = vi.fn();
const mockPortalContactDeleteMany = vi.fn();
const mockPortalVerificationDeleteMany = vi.fn();
const mockPortalDeviceDeleteMany = vi.fn();
const mockHubMemberTxUpdate = vi.fn();
const mockHubMemberTxUpdateMany = vi.fn();
const mockHubAccessRevocationUpsert = vi.fn();
const mockTransaction = vi.fn();

const mockPrisma = {
  hub: { findFirst: mockHubFindFirst, update: vi.fn() },
  hubMember: {
    findFirst: mockHubMemberFindFirst,
    update: mockHubMemberUpdate,
    updateMany: mockHubMemberTxUpdateMany,
    findMany: vi.fn(),
    count: vi.fn(),
  },
  hubInvite: { updateMany: mockHubInviteUpdateMany },
  portalContact: { deleteMany: mockPortalContactDeleteMany },
  portalVerification: { deleteMany: mockPortalVerificationDeleteMany },
  portalDevice: { deleteMany: mockPortalDeviceDeleteMany },
  hubAccessRevocation: { upsert: mockHubAccessRevocationUpsert },
  hubCrmOrgMap: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  hubMessage: { findMany: vi.fn() },
  $queryRawUnsafe: vi.fn().mockResolvedValue([{ has_org: false, has_activity: false }]),
  $executeRawUnsafe: vi.fn().mockResolvedValue(1),
  $transaction: mockTransaction,
};

vi.mock('../db/prisma.js', () => ({ getPrisma: () => mockPrisma }));

let app: Express;

beforeAll(async () => {
  app = await loadApp();
});

beforeEach(() => {
  vi.clearAllMocks();

  const repoHub = mockRepo.hub as { findFirst: ReturnType<typeof vi.fn> };
  const repoMember = mockRepo.hubMember as { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  const repoContact = mockRepo.portalContact as { findMany: ReturnType<typeof vi.fn> };

  repoHub.findFirst.mockResolvedValue({
    id: 'hub-1',
    tenantId: 'tenant-agentflow',
    companyName: 'Test Co',
  });
  repoContact.findMany.mockResolvedValue([]);
  repoMember.findMany.mockResolvedValue([]);
  repoMember.count.mockResolvedValue(0);

  mockHubFindFirst.mockResolvedValue({
    id: 'hub-1',
    tenantId: 'tenant-agentflow',
    companyName: 'Test Co',
    contactEmail: 'owner@test.com',
    clientDomain: 'test.com',
    accessMethod: 'email',
  });

  mockTransaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => unknown) => fn({
    ...mockPrisma,
    hubMember: {
      ...mockPrisma.hubMember,
      update: mockHubMemberTxUpdate,
      updateMany: mockHubMemberTxUpdateMany,
    },
  }));
});

describe('GET /hubs/:hubId/members', () => {
  it('returns paginated members list', async () => {
    const repoMember = mockRepo.hubMember as { findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };

    repoMember.findMany.mockResolvedValueOnce([
      {
        id: 'm-1',
        hubId: 'hub-1',
        userId: null,
        email: 'client@test.com',
        displayName: 'Client User',
        role: 'client',
        accessLevel: 'full_access',
        invitedBy: 'user-staff-1',
        invitedByName: 'Hamish Nicklin',
        joinedAt: new Date('2026-02-25T10:00:00.000Z'),
        lastActiveAt: null,
      },
    ]);
    repoMember.count.mockResolvedValueOnce(1);

    const res = await request(app)
      .get('/api/v1/hubs/hub-1/members')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(200);
    expect(res.body.pagination.totalItems).toBe(1);
    expect(res.body.items[0]).toMatchObject({
      id: 'm-1',
      role: 'client',
      email: 'client@test.com',
    });
  });
});

describe('PATCH /hubs/:hubId/members/:id', () => {
  it('updates member access level', async () => {
    mockHubMemberFindFirst.mockResolvedValueOnce({
      id: 'm-1',
      hubId: 'hub-1',
      userId: null,
      email: 'client@test.com',
      displayName: 'Client User',
      role: 'client',
      accessLevel: 'full_access',
      invitedBy: 'user-staff-1',
      invitedByName: 'Hamish Nicklin',
      joinedAt: new Date('2026-02-25T10:00:00.000Z'),
      lastActiveAt: null,
      status: 'active',
    });
    mockHubMemberUpdate.mockResolvedValueOnce({
      id: 'm-1',
      hubId: 'hub-1',
      userId: null,
      email: 'client@test.com',
      displayName: 'Client User',
      role: 'client',
      accessLevel: 'view_only',
      invitedBy: 'user-staff-1',
      invitedByName: 'Hamish Nicklin',
      joinedAt: new Date('2026-02-25T10:00:00.000Z'),
      lastActiveAt: null,
    });

    const res = await request(app)
      .patch('/api/v1/hubs/hub-1/members/m-1')
      .set(STAFF_HEADERS)
      .send({ accessLevel: 'view_only' });

    expect(res.status).toBe(200);
    expect(res.body.accessLevel).toBe('view_only');
  });
});

describe('DELETE /hubs/:hubId/members/:id', () => {
  it('revokes member and cascades portal artifacts', async () => {
    mockHubMemberFindFirst.mockResolvedValueOnce({
      id: 'm-1',
      hubId: 'hub-1',
      tenantId: 'tenant-agentflow',
      email: 'client@test.com',
      role: 'client',
      status: 'active',
    });
    mockHubMemberTxUpdate.mockResolvedValueOnce({});
    mockHubInviteUpdateMany.mockResolvedValueOnce({ count: 1 });
    mockPortalContactDeleteMany.mockResolvedValueOnce({ count: 1 });
    mockPortalVerificationDeleteMany.mockResolvedValueOnce({ count: 1 });
    mockPortalDeviceDeleteMany.mockResolvedValueOnce({ count: 1 });
    mockHubMemberTxUpdateMany.mockResolvedValueOnce({ count: 1 });
    mockHubAccessRevocationUpsert.mockResolvedValueOnce({});

    const res = await request(app)
      .delete('/api/v1/hubs/hub-1/members/m-1')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(204);
    expect(mockPortalContactDeleteMany).toHaveBeenCalledOnce();
    expect(mockHubAccessRevocationUpsert).toHaveBeenCalledOnce();
  });
});
