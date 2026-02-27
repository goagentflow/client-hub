/**
 * Access recovery tests — public endpoints
 *
 * Verifies request-link behavior, grouped my-access payloads,
 * input validation, rate-limits, and one-time token semantics.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { loadApp } from './test-setup.js';

const mockFindAccessRecoveryHubsByEmail = vi.fn();
const mockCreateAccessRecoveryToken = vi.fn();
const mockConsumeAccessRecoveryToken = vi.fn();
const mockSendAccessRecoveryEmail = vi.fn().mockResolvedValue(undefined);

vi.mock('../db/access-recovery-queries.js', () => ({
  findAccessRecoveryHubsByEmail: (...args: unknown[]) => mockFindAccessRecoveryHubsByEmail(...args),
}));

vi.mock('../db/access-recovery-token-queries.js', () => ({
  createAccessRecoveryToken: (...args: unknown[]) => mockCreateAccessRecoveryToken(...args),
  consumeAccessRecoveryToken: (...args: unknown[]) => mockConsumeAccessRecoveryToken(...args),
}));

vi.mock('../services/email.service.js', async (importOriginal) => {
  const orig = await importOriginal() as Record<string, unknown>;
  return {
    ...orig,
    sendAccessRecoveryEmail: (...args: unknown[]) => mockSendAccessRecoveryEmail(...args),
  };
});

let app: Express;

beforeAll(async () => {
  app = await loadApp();
  app.set('trust proxy', true);
});

beforeEach(() => {
  vi.clearAllMocks();
  mockFindAccessRecoveryHubsByEmail.mockReset();
  mockCreateAccessRecoveryToken.mockReset();
  mockCreateAccessRecoveryToken.mockResolvedValue(undefined);
  mockConsumeAccessRecoveryToken.mockReset();
  mockSendAccessRecoveryEmail.mockReset();
  mockSendAccessRecoveryEmail.mockResolvedValue(undefined);
});

function makeHubRow(overrides?: Partial<{
  hubId: string;
  companyName: string;
  hubType: string;
  updatedAt: Date;
  lastActivity: Date;
}>) {
  return {
    hubId: 'hub-1',
    companyName: 'Acme Co',
    hubType: 'client',
    updatedAt: new Date(),
    lastActivity: new Date(),
    ...overrides,
  };
}

function requestLink(email: string, ip: string) {
  return request(app)
    .post('/api/v1/public/access/request-link')
    .set('X-Forwarded-For', ip)
    .send({ email });
}

function requestItems(token: string, ip: string) {
  return request(app)
    .get(`/api/v1/public/access/items?token=${encodeURIComponent(token)}`)
    .set('X-Forwarded-For', ip);
}

describe('POST /public/access/request-link', () => {
  it('returns 400 for invalid email payload', async () => {
    const res = await request(app)
      .post('/api/v1/public/access/request-link')
      .set('X-Forwarded-For', '10.0.0.1')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
    expect(mockFindAccessRecoveryHubsByEmail).not.toHaveBeenCalled();
    expect(mockSendAccessRecoveryEmail).not.toHaveBeenCalled();
  });

  it('returns sent:true and does not send email for unknown address', async () => {
    mockFindAccessRecoveryHubsByEmail.mockResolvedValueOnce([]);

    const res = await requestLink('unknown@example.com', '10.0.0.2');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ sent: true });
    expect(mockSendAccessRecoveryEmail).not.toHaveBeenCalled();
  });

  it('sends direct portal link when there is one active hub', async () => {
    mockFindAccessRecoveryHubsByEmail.mockResolvedValueOnce([
      makeHubRow({ hubId: 'hub-single' }),
    ]);

    const res = await requestLink('client-single@example.com', '10.0.0.3');

    expect(res.status).toBe(200);
    expect(mockSendAccessRecoveryEmail).toHaveBeenCalledOnce();
    const link = mockSendAccessRecoveryEmail.mock.calls[0]?.[1];
    expect(typeof link).toBe('string');
    expect(link).toContain('/clienthub/portal/hub-single');
    expect(mockCreateAccessRecoveryToken).not.toHaveBeenCalled();
  });

  it('sends my-access link with opaque token when there are multiple active hubs', async () => {
    mockFindAccessRecoveryHubsByEmail.mockResolvedValueOnce([
      makeHubRow({ hubId: 'hub-1', lastActivity: new Date(Date.now() - 1_000) }),
      makeHubRow({ hubId: 'hub-2', lastActivity: new Date(Date.now() - 2_000) }),
    ]);

    const res = await requestLink('client-multi@example.com', '10.0.0.4');

    expect(res.status).toBe(200);
    expect(mockSendAccessRecoveryEmail).toHaveBeenCalledOnce();

    const link = mockSendAccessRecoveryEmail.mock.calls[0]?.[1];
    expect(typeof link).toBe('string');
    expect(link).toContain('/my-access?token=');
    const tokenMatch = /[?&]token=([^&]+)/.exec(link);
    const rawToken = tokenMatch?.[1];
    const token = rawToken ? decodeURIComponent(rawToken) : null;

    expect(token).toMatch(/^[a-f0-9]{64}$/i);
    expect(token?.includes('.')).toBe(false);
    expect(mockCreateAccessRecoveryToken).toHaveBeenCalledOnce();
    expect(mockCreateAccessRecoveryToken).toHaveBeenCalledWith(
      token,
      'client-multi@example.com',
      expect.any(Date),
    );
  });

  it('rate-limits repeated requests for the same email', async () => {
    mockFindAccessRecoveryHubsByEmail.mockResolvedValue([]);

    const first = await requestLink('rate-limit@example.com', '10.0.0.5');
    const second = await requestLink('rate-limit@example.com', '10.0.0.6');

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.body.code).toBe('RATE_LIMITED');
  });
});

describe('GET /public/access/items', () => {
  it('returns 400 when token is missing', async () => {
    const res = await request(app)
      .get('/api/v1/public/access/items')
      .set('X-Forwarded-For', '10.0.0.7');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('returns grouped access items with recommended reason', async () => {
    mockConsumeAccessRecoveryToken.mockResolvedValueOnce({
      status: 'valid',
      email: 'client@example.com',
    });

    mockFindAccessRecoveryHubsByEmail.mockResolvedValueOnce([
      makeHubRow({
        hubId: 'hub-recommended',
        hubType: 'client',
        lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      }),
      makeHubRow({
        hubId: 'hub-active',
        hubType: 'pitch',
        lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      }),
      makeHubRow({
        hubId: 'hub-past',
        hubType: 'pitch',
        lastActivity: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      }),
    ]);

    const res = await requestItems('a'.repeat(64), '10.0.0.8');

    expect(res.status).toBe(200);
    expect(res.body.data.recommended.hubId).toBe('hub-recommended');
    expect(res.body.data.recommended.reason).toBe('Most recently active');
    expect(res.body.data.active).toHaveLength(1);
    expect(res.body.data.active[0].hubId).toBe('hub-active');
    expect(res.body.data.past).toHaveLength(1);
    expect(res.body.data.past[0].hubId).toBe('hub-past');
  });

  it('returns 401 TOKEN_EXPIRED for expired or replayed token', async () => {
    mockConsumeAccessRecoveryToken.mockResolvedValueOnce({
      status: 'expired_or_used',
    });

    const res = await requestItems('b'.repeat(64), '10.0.0.9');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  it('returns 401 for malformed/invalid token', async () => {
    mockConsumeAccessRecoveryToken.mockResolvedValueOnce({
      status: 'invalid',
    });

    const res = await requestItems('bad-token', '10.0.0.10');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('enforces one-time token semantics on replay', async () => {
    mockConsumeAccessRecoveryToken
      .mockResolvedValueOnce({ status: 'valid', email: 'client@example.com' })
      .mockResolvedValueOnce({ status: 'expired_or_used' });

    mockFindAccessRecoveryHubsByEmail.mockResolvedValueOnce([
      makeHubRow({ hubId: 'hub-1' }),
    ]);

    const token = 'c'.repeat(64);
    const first = await requestItems(token, '10.0.0.11');
    const second = await requestItems(token, '10.0.0.11');

    expect(first.status).toBe(200);
    expect(second.status).toBe(401);
    expect(second.body.code).toBe('TOKEN_EXPIRED');
  });
});
