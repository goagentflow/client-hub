/**
 * Portal email verification tests — public endpoints
 *
 * Verifies access-method, request-code, verify-code, verify-device,
 * including method-gating enforcement.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { loadApp } from './test-setup.js';

const mockFindHubAccessMethod = vi.fn();
const mockFindPortalContact = vi.fn();
const mockUpsertVerification = vi.fn();
const mockFindActiveVerification = vi.fn();
const mockIncrementAttempts = vi.fn();
const mockMarkVerificationUsed = vi.fn();
const mockCreateDeviceRecord = vi.fn();
const mockFindValidDevice = vi.fn();

vi.mock('../db/portal-verification-queries.js', () => ({
  findHubAccessMethod: (...args: unknown[]) => mockFindHubAccessMethod(...args),
  findPortalContact: (...args: unknown[]) => mockFindPortalContact(...args),
  upsertVerification: (...args: unknown[]) => mockUpsertVerification(...args),
  findActiveVerification: (...args: unknown[]) => mockFindActiveVerification(...args),
  incrementAttempts: (...args: unknown[]) => mockIncrementAttempts(...args),
  markVerificationUsed: (...args: unknown[]) => mockMarkVerificationUsed(...args),
  createDeviceRecord: (...args: unknown[]) => mockCreateDeviceRecord(...args),
  findValidDevice: (...args: unknown[]) => mockFindValidDevice(...args),
}));

const mockSendVerificationCode = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/email.service.js', () => ({
  sendVerificationCode: (...args: unknown[]) => mockSendVerificationCode(...args),
}));

vi.mock('../db/prisma.js', () => ({ getPrisma: () => ({}) }));

let app: Express;
beforeAll(async () => { app = await loadApp(); });
beforeEach(() => { vi.clearAllMocks(); });

const EMAIL_HUB = { id: 'hub-e', companyName: 'Test', accessMethod: 'email', isPublished: true };
const PW_HUB = { id: 'hub-pw', companyName: 'Test', accessMethod: 'password', isPublished: true };

describe('GET /public/hubs/:hubId/access-method', () => {
  it('returns access method for published hub', async () => {
    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    const res = await request(app).get('/api/v1/public/hubs/hub-e/access-method');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ method: 'email' });
  });

  it('returns 404 for non-existent or unpublished hub', async () => {
    mockFindHubAccessMethod.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/v1/public/hubs/no-such/access-method');
    expect(res.status).toBe(404);
  });
});

describe('POST /public/hubs/:hubId/request-code', () => {
  it('sends code for authorised contact on email-gated hub', async () => {
    mockFindPortalContact.mockResolvedValueOnce({ id: 'c-1', email: 'a@t.com' });
    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    mockUpsertVerification.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-rc-1/request-code')
      .send({ email: 'a@t.com' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ sent: true });
    expect(mockSendVerificationCode).toHaveBeenCalledOnce();
  });

  it('returns { sent: true } but does NOT send for unknown email', async () => {
    mockFindPortalContact.mockResolvedValueOnce(null);
    mockFindHubAccessMethod.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-rc-2/request-code')
      .send({ email: 'stranger@evil.com' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ sent: true });
    expect(mockSendVerificationCode).not.toHaveBeenCalled();
  });

  it('does NOT send code when hub is password-gated (method enforcement)', async () => {
    mockFindPortalContact.mockResolvedValueOnce({ id: 'c-1', email: 'a@t.com' });
    mockFindHubAccessMethod.mockResolvedValueOnce(PW_HUB);

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-rc-3/request-code')
      .send({ email: 'a@t.com' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ sent: true });
    expect(mockSendVerificationCode).not.toHaveBeenCalled();
    expect(mockUpsertVerification).not.toHaveBeenCalled();
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/public/hubs/hub-rc-4/request-code')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /public/hubs/:hubId/verify-code', () => {
  it('issues JWT + device token for correct code on email-gated hub', async () => {
    const crypto = await import('node:crypto');
    const hash = crypto.createHash('sha256').update('123456').digest('hex');

    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    mockFindActiveVerification.mockResolvedValueOnce({
      id: 'v-1', codeHash: hash, attempts: 0, used: false,
      expiresAt: new Date(Date.now() + 600000),
    });
    mockMarkVerificationUsed.mockResolvedValueOnce({});
    mockFindPortalContact.mockResolvedValueOnce({ id: 'c-1', name: 'Test' });
    mockCreateDeviceRecord.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-vc-1/verify-code')
      .send({ email: 'a@t.com', code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
    expect(typeof res.body.data.deviceToken).toBe('string');
  });

  it('rejects correct code when hub switched to password (method enforcement)', async () => {
    mockFindHubAccessMethod.mockResolvedValueOnce(PW_HUB);

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-vc-2/verify-code')
      .send({ email: 'a@t.com', code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
  });

  it('rejects when contact was revoked (correct code but no contact)', async () => {
    const crypto = await import('node:crypto');
    const hash = crypto.createHash('sha256').update('123456').digest('hex');

    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    mockFindActiveVerification.mockResolvedValueOnce({
      id: 'v-1', codeHash: hash, attempts: 0, used: false,
      expiresAt: new Date(Date.now() + 600000),
    });
    mockFindPortalContact.mockResolvedValueOnce(null); // contact removed

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-vc-7/verify-code')
      .send({ email: 'a@t.com', code: '123456' });
    expect(res.body.data.valid).toBe(false);
    expect(mockMarkVerificationUsed).not.toHaveBeenCalled();
  });

  it('rejects wrong code and increments attempts', async () => {
    const crypto = await import('node:crypto');
    const storedHash = crypto.createHash('sha256').update('654321').digest('hex');

    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    mockFindActiveVerification.mockResolvedValueOnce({
      id: 'v-1', codeHash: storedHash, attempts: 0, used: false,
      expiresAt: new Date(Date.now() + 600000),
    });
    mockIncrementAttempts.mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-vc-3/verify-code')
      .send({ email: 'a@t.com', code: '999999' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(mockIncrementAttempts).toHaveBeenCalledWith('v-1');
  });

  it('rejects expired code', async () => {
    const crypto = await import('node:crypto');
    const hash = crypto.createHash('sha256').update('123456').digest('hex');

    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    mockFindActiveVerification.mockResolvedValueOnce({
      id: 'v-1', codeHash: hash, attempts: 0, used: false,
      expiresAt: new Date(Date.now() - 1000),
    });

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-vc-4/verify-code')
      .send({ email: 'a@t.com', code: '123456' });
    expect(res.body.data.valid).toBe(false);
  });

  it('rejects already-used code', async () => {
    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    mockFindActiveVerification.mockResolvedValueOnce({
      id: 'v-1', codeHash: 'x', attempts: 0, used: true,
      expiresAt: new Date(Date.now() + 600000),
    });
    const res = await request(app)
      .post('/api/v1/public/hubs/hub-vc-5/verify-code')
      .send({ email: 'a@t.com', code: '123456' });
    expect(res.body.data.valid).toBe(false);
  });

  it('rejects after max attempts exceeded', async () => {
    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    mockFindActiveVerification.mockResolvedValueOnce({
      id: 'v-1', codeHash: 'x', attempts: 5, used: false,
      expiresAt: new Date(Date.now() + 600000),
    });
    const res = await request(app)
      .post('/api/v1/public/hubs/hub-vc-6/verify-code')
      .send({ email: 'a@t.com', code: '123456' });
    expect(res.body.data.valid).toBe(false);
  });
});

describe('POST /public/hubs/:hubId/verify-device', () => {
  it('issues JWT for valid device token on email-gated hub', async () => {
    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    mockFindValidDevice.mockResolvedValueOnce({ id: 'd-1' });
    mockFindPortalContact.mockResolvedValueOnce({ id: 'c-1', name: 'C' });

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-d-1/verify-device')
      .send({ email: 'a@t.com', deviceToken: 'tok' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects device token when hub switched to password', async () => {
    mockFindHubAccessMethod.mockResolvedValueOnce(PW_HUB);

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-d-2/verify-device')
      .send({ email: 'a@t.com', deviceToken: 'tok' });
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
  });

  it('rejects when device token not found', async () => {
    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    mockFindValidDevice.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-d-3/verify-device')
      .send({ email: 'a@t.com', deviceToken: 'bad' });
    expect(res.body.data.valid).toBe(false);
  });

  it('rejects when contact was revoked', async () => {
    mockFindHubAccessMethod.mockResolvedValueOnce(EMAIL_HUB);
    mockFindValidDevice.mockResolvedValueOnce({ id: 'd-1' });
    mockFindPortalContact.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/v1/public/hubs/hub-d-4/verify-device')
      .send({ email: 'a@t.com', deviceToken: 'tok' });
    expect(res.body.data.valid).toBe(false);
  });
});
