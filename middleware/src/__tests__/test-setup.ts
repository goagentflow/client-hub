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

// Mock Supabase before importing app
vi.mock('../adapters/supabase.adapter.js', () => {
  const mockFrom = () => {
    const makeChain = (overrides?: Record<string, unknown>) => {
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
        ...overrides,
      };

      // Make all chainable methods return the chain
      for (const key of Object.keys(c)) {
        if (key !== 'then' && typeof c[key as keyof typeof c] === 'function') {
          const fn = c[key as keyof typeof c] as ReturnType<typeof vi.fn>;
          fn.mockReturnValue(c);
        }
      }

      // Terminal methods
      c.single = vi.fn().mockResolvedValue({
        data: {
          id: 'hub-1', company_name: 'Test Co', contact_name: 'Test User',
          contact_email: 'test@test.com', status: 'active', hub_type: 'pitch',
          created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
          last_activity: '2024-01-01T00:00:00Z', clients_invited: 0, last_visit: null,
          client_domain: 'test.com', internal_notes: null, converted_at: null,
          converted_by: null, is_published: false, welcome_headline: null,
          welcome_message: null, hero_content_type: null, hero_content_id: null,
          show_proposal: true, show_videos: true, show_documents: true,
          show_messages: true, show_meetings: true, show_questionnaire: true,
          password_hash: null,
        },
        error: null,
      });
      c.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

      // For selects with count
      c.range = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });

      return c;
    };

    return makeChain();
  };

  return {
    supabase: {
      from: vi.fn().mockImplementation(() => mockFrom()),
    },
    mapHubRow: vi.fn().mockImplementation((row: Record<string, unknown>) => ({
      id: row.id, companyName: row.company_name, contactName: row.contact_name,
      contactEmail: row.contact_email, status: row.status, hubType: row.hub_type,
      createdAt: row.created_at, updatedAt: row.updated_at, lastActivity: row.last_activity,
      clientsInvited: row.clients_invited, lastVisit: row.last_visit, clientDomain: row.client_domain,
    })),
    mapPortalConfig: vi.fn().mockReturnValue({
      hubId: 'hub-1', isPublished: false, welcomeHeadline: '', welcomeMessage: '',
      heroContentType: 'none', heroContentId: null,
      sections: { showProposal: true, showVideos: true, showDocuments: true, showMessages: true, showMeetings: true, showQuestionnaire: true },
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
    DEMO_MODE: true,
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    CORS_ORIGIN: 'http://localhost:5173',
    LOG_LEVEL: 'silent',
    AZURE_TENANT_ID: 'test',
    AZURE_CLIENT_ID: 'test',
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
