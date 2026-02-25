/**
 * Hub lifecycle tests — unpublish + delete.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { loadApp, STAFF_HEADERS, mockRepo } from './test-setup.js';

const mockProjectFindMany = vi.fn();
const mockMilestoneDeleteMany = vi.fn();
const mockProjectDeleteMany = vi.fn();
const mockVideoDeleteMany = vi.fn();
const mockDocumentDeleteMany = vi.fn();
const mockEventDeleteMany = vi.fn();
const mockInviteDeleteMany = vi.fn();
const mockPortalContactDeleteMany = vi.fn();
const mockPortalVerificationDeleteMany = vi.fn();
const mockPortalDeviceDeleteMany = vi.fn();
const mockStatusUpdateDeleteMany = vi.fn();
const mockMessageDeleteMany = vi.fn();
const mockMemberDeleteMany = vi.fn();
const mockRevocationDeleteMany = vi.fn();
const mockCrmMapDeleteMany = vi.fn();
const mockHubDelete = vi.fn();
const mockTransaction = vi.fn();

const mockPrisma = {
  hubProject: { findMany: mockProjectFindMany, deleteMany: mockProjectDeleteMany },
  hubMilestone: { deleteMany: mockMilestoneDeleteMany },
  hubVideo: { deleteMany: mockVideoDeleteMany },
  hubDocument: { deleteMany: mockDocumentDeleteMany },
  hubEvent: { deleteMany: mockEventDeleteMany },
  hubInvite: { deleteMany: mockInviteDeleteMany },
  portalContact: { deleteMany: mockPortalContactDeleteMany },
  portalVerification: { deleteMany: mockPortalVerificationDeleteMany },
  portalDevice: { deleteMany: mockPortalDeviceDeleteMany },
  hubStatusUpdate: { deleteMany: mockStatusUpdateDeleteMany },
  hubMessage: { deleteMany: mockMessageDeleteMany },
  hubMember: { deleteMany: mockMemberDeleteMany },
  hubAccessRevocation: { deleteMany: mockRevocationDeleteMany },
  hubCrmOrgMap: { deleteMany: mockCrmMapDeleteMany },
  hub: { delete: mockHubDelete },
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

  const repoHub = mockRepo.hub as { update: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> };
  const repoRevocations = mockRepo.hubAccessRevocation as { upsert: ReturnType<typeof vi.fn> };

  repoHub.update.mockResolvedValue({
    id: 'hub-1',
    tenantId: 'tenant-agentflow',
    companyName: 'Test Co',
    contactName: 'Test User',
    contactEmail: 'test@test.com',
    status: 'active',
    hubType: 'pitch',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastActivity: new Date('2024-01-01'),
    clientsInvited: 0,
    lastVisit: null,
    clientDomain: 'test.com',
    internalNotes: null,
    convertedAt: null,
    convertedBy: null,
    isPublished: false,
    welcomeHeadline: null,
    welcomeMessage: null,
    heroContentType: null,
    heroContentId: null,
    showProposal: true,
    showVideos: true,
    showDocuments: true,
    showMessages: true,
    showMeetings: true,
    showQuestionnaire: true,
    passwordHash: null,
    accessMethod: 'email',
  });
  repoHub.findFirst.mockResolvedValue({ id: 'hub-1', tenantId: 'tenant-agentflow', companyName: 'Test Co' });
  repoRevocations.upsert.mockResolvedValue({});

  mockProjectFindMany.mockResolvedValue([]);
  mockMilestoneDeleteMany.mockResolvedValue({ count: 0 });
  mockProjectDeleteMany.mockResolvedValue({ count: 0 });
  mockVideoDeleteMany.mockResolvedValue({ count: 0 });
  mockDocumentDeleteMany.mockResolvedValue({ count: 0 });
  mockEventDeleteMany.mockResolvedValue({ count: 0 });
  mockInviteDeleteMany.mockResolvedValue({ count: 0 });
  mockPortalContactDeleteMany.mockResolvedValue({ count: 0 });
  mockPortalVerificationDeleteMany.mockResolvedValue({ count: 0 });
  mockPortalDeviceDeleteMany.mockResolvedValue({ count: 0 });
  mockStatusUpdateDeleteMany.mockResolvedValue({ count: 0 });
  mockMessageDeleteMany.mockResolvedValue({ count: 0 });
  mockMemberDeleteMany.mockResolvedValue({ count: 0 });
  mockRevocationDeleteMany.mockResolvedValue({ count: 0 });
  mockCrmMapDeleteMany.mockResolvedValue({ count: 0 });
  mockHubDelete.mockResolvedValue({ id: 'hub-1' });

  mockTransaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma));
});

describe('POST /hubs/:hubId/unpublish', () => {
  it('unpublishes and creates hub-wide revocation checkpoint', async () => {
    const res = await request(app)
      .post('/api/v1/hubs/hub-1/unpublish')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(200);
    const repoRevocations = mockRepo.hubAccessRevocation as { upsert: ReturnType<typeof vi.fn> };
    expect(repoRevocations.upsert).toHaveBeenCalledOnce();
  });
});

describe('DELETE /hubs/:hubId', () => {
  it('deletes hub and child records', async () => {
    const res = await request(app)
      .delete('/api/v1/hubs/hub-1')
      .set(STAFF_HEADERS);

    expect(res.status).toBe(204);
    expect(mockHubDelete).toHaveBeenCalledOnce();
  });
});
