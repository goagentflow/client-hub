/**
 * Email service security tests.
 *
 * Ensures we never log verification secrets when email delivery is disabled.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockWarn = vi.fn();

vi.mock('../config/env.js', () => ({
  env: {
    RESEND_API_KEY: '',
    RESEND_FROM_EMAIL: 'noreply@test.local',
  },
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    warn: (...args: unknown[]) => mockWarn(...args),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { sendVerificationCode } from '../services/email.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockWarn.mockReset();
});

describe('sendVerificationCode', () => {
  it('does not log OTP values when RESEND_API_KEY is missing', async () => {
    await sendVerificationCode('client@example.com', '123456', 'Acme Hub');

    expect(mockWarn).toHaveBeenCalledOnce();
    const logged = JSON.stringify(mockWarn.mock.calls);
    expect(logged).not.toContain('123456');
    expect(logged).not.toContain('client@example.com');
    expect(logged).toContain('example.com');
    expect(logged).toContain('No RESEND_API_KEY');
  });
});
