/**
 * Shared test setup — mocks and helpers for contract tests.
 * Import this at the top of each test file to get consistent mocks.
 */

import { vi } from 'vitest';
import { SignJWT } from 'jose';
import type { Express } from 'express';

// Portal token secret — must match env mock below
export const TEST_PORTAL_SECRET = 'test-portal-secret-must-be-at-least-32-chars-long';

// Mock pino-http to avoid internal pino issues in test
vi.mock('pino-http', () => ({
  pinoHttp: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// --- Stub hub data + mock repos (vi.hoisted so vi.mock factories can access them) ---

const _hoisted = vi.hoisted(() => {
  const STUB_HUB = {
    id: 'hub-1', tenantId: 'tenant-agentflow',
    companyName: 'Test Co', contactName: 'Test User',
    contactEmail: 'test@test.com', status: 'active', hubType: 'pitch',
    createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'),
    lastActivity: new Date('2024-01-01'), clientsInvited: 0, lastVisit: null,
    clientDomain: 'test.com', internalNotes: null, convertedAt: null,
    convertedBy: null, isPublished: false, welcomeHeadline: null,
    welcomeMessage: null, heroContentType: null, heroContentId: null,
    showProposal: true, showVideos: true, showDocuments: true,
    showMessages: true, showMeetings: true, showQuestionnaire: true,
    passwordHash: null,
  };

  function makeMockScopedModel(defaults?: { findFirst?: unknown; findMany?: unknown[] }) {
    return {
      findMany: vi.fn().mockResolvedValue(defaults?.findMany ?? []),
      findFirst: vi.fn().mockResolvedValue(defaults?.findFirst ?? null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockImplementation(async (args: Record<string, unknown>) => {
        const data = args.data as Record<string, unknown>;
        return { ...STUB_HUB, ...data, id: 'hub-new' };
      }),
      update: vi.fn().mockImplementation(async (args: Record<string, unknown>) => {
        const data = args.data as Record<string, unknown>;
        return { ...STUB_HUB, ...data };
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      delete: vi.fn().mockResolvedValue({ id: 'del-1' }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    };
  }

  function makeMockRepo(tenantId = 'tenant-agentflow'): Record<string, unknown> {
    return {
      tenantId,
      hub: makeMockScopedModel({ findFirst: STUB_HUB }),
      hubVideo: makeMockScopedModel(),
      hubDocument: makeMockScopedModel(),
      hubProject: makeMockScopedModel(),
      hubMilestone: makeMockScopedModel(),
      hubEvent: makeMockScopedModel(),
      hubStatusUpdate: makeMockScopedModel(),
    };
  }

  const mockRepo: Record<string, unknown> = makeMockRepo();
  const mockAdminRepo: Record<string, unknown> = {
    query: vi.fn().mockImplementation(async (_a: string, _r: string, fn: (p: unknown) => unknown) => fn({})),
    ...makeMockRepo('admin'),
  };

  return { STUB_HUB, makeMockRepo, mockRepo, mockAdminRepo };
});

// Re-export hoisted values as regular exports (same object references)
export const makeMockRepo = _hoisted.makeMockRepo;
export const mockRepo = _hoisted.mockRepo;
export const mockAdminRepo = _hoisted.mockAdminRepo;

// Mock inject-repository — uses hoisted refs directly (same objects as exports)
vi.mock('../middleware/inject-repository.js', () => ({
  injectRepository: (_req: unknown, _res: unknown, next: () => void) => {
    const req = _req as Record<string, unknown>;
    req.repo = _hoisted.mockRepo;
    req.adminRepo = _hoisted.mockAdminRepo;
    next();
  },
}));

// Mock Supabase (still needed for files not yet migrated)
vi.mock('../adapters/supabase.adapter.js', () => {
  const mockFrom = () => {
    const c = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: undefined as unknown,
    };
    for (const key of Object.keys(c)) {
      if (key !== 'then' && typeof c[key as keyof typeof c] === 'function') {
        const fn = c[key as keyof typeof c] as ReturnType<typeof vi.fn>;
        fn.mockReturnValue(c);
      }
    }
    c.single = vi.fn().mockResolvedValue({ data: _hoisted.STUB_HUB, error: null });
    c.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    c.range = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
    return c;
  };
  return {
    supabase: { from: vi.fn().mockImplementation(() => mockFrom()) },
    mapHubRow: vi.fn().mockImplementation((row: Record<string, unknown>) => ({
      id: row.id, companyName: row.companyName || row.company_name,
      contactName: row.contactName || row.contact_name,
      contactEmail: row.contactEmail || row.contact_email,
      status: row.status, hubType: row.hubType || row.hub_type,
      createdAt: row.createdAt || row.created_at,
      updatedAt: row.updatedAt || row.updated_at,
      lastActivity: row.lastActivity || row.last_activity,
      clientsInvited: row.clientsInvited || row.clients_invited,
      lastVisit: row.lastVisit || row.last_visit,
      clientDomain: row.clientDomain || row.client_domain,
    })),
    mapPortalConfig: vi.fn().mockReturnValue({
      hubId: 'hub-1', isPublished: false, welcomeHeadline: '', welcomeMessage: '',
      heroContentType: 'none', heroContentId: null,
      sections: { showProposal: true, showVideos: true, showDocuments: true,
        showMessages: true, showMeetings: true, showQuestionnaire: true },
    }),
    mapVideoRow: vi.fn().mockImplementation((row: Record<string, unknown>) => ({ id: row.id, hubId: row.hub_id })),
    mapDocumentRow: vi.fn().mockImplementation((row: Record<string, unknown>) => ({ id: row.id, hubId: row.hub_id })),
    mapProposalRow: vi.fn().mockReturnValue({ id: 'prop-1', hubId: 'hub-1' }),
    mapEventRow: vi.fn().mockImplementation((row: Record<string, unknown>) => ({
      id: row.id, eventType: row.event_type, hubId: row.hub_id,
      userId: row.user_id, userName: row.user_name, userEmail: row.user_email,
      timestamp: row.created_at, metadata: row.metadata || {},
    })),
    mapProjectRow: vi.fn().mockReturnValue({
      id: 'proj-1', hubId: 'hub-1', name: 'Test', status: 'active',
      startDate: '2024-01-01', milestones: [], createdAt: '2024-01-01',
      updatedAt: '2024-01-01', createdBy: 'user-1',
    }),
    mapMilestoneRow: vi.fn().mockReturnValue({
      id: 'ms-1', name: 'Test', targetDate: '2024-01-01', status: 'not_started',
    }),
  };
});

// Mock env
vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
    AUTH_MODE: 'demo',
    DATA_BACKEND: 'azure_pg',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    CORS_ORIGIN: 'http://localhost:5173',
    LOG_LEVEL: 'silent',
    AZURE_TENANT_ID: 'test',
    AZURE_CLIENT_ID: 'test',
    AZURE_JWKS_URI: undefined,
    STAFF_ROLE_NAME: 'Staff',
    PORTAL_TOKEN_SECRET: 'test-portal-secret-must-be-at-least-32-chars-long',
    TRUST_PROXY: false,
  },
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

// Shared auth headers
export const STAFF_HEADERS = { 'X-Dev-User-Email': 'hamish@goagentflow.com' };
export const CLIENT_HEADERS = { 'X-Dev-User-Email': 'sarah@whitmorelaw.co.uk' };

// Helper: load app (call in beforeAll)
export async function loadApp(): Promise<Express> {
  const mod = await import('../app.js');
  return mod.app as unknown as Express;
}

// Helper: generate a portal JWT for testing
export async function makePortalToken(hubId: string, overrides?: { type?: string; exp?: string }): Promise<string> {
  const secret = new TextEncoder().encode(TEST_PORTAL_SECRET);
  const builder = new SignJWT({ type: overrides?.type ?? 'portal' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(hubId)
    .setIssuer('agentflow')
    .setAudience('agentflow-portal')
    .setIssuedAt()
    .setExpirationTime(overrides?.exp ?? '24h');
  return builder.sign(secret);
}

export function portalHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
