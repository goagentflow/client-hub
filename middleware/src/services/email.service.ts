/**
 * Email service — sends verification codes via Resend REST API.
 *
 * Fire-and-forget pattern: callers dispatch without awaiting.
 * If RESEND_API_KEY is not set, logs the code (dev/demo only).
 */

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function sendVerificationCode(
  to: string,
  code: string,
  hubName: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.warn({ to, code, hubName }, '[Email] No RESEND_API_KEY — logging code instead of sending');
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [to],
      subject: `Your access code for ${escapeHtml(hubName)}`,
      html: buildEmailHtml(code, escapeHtml(hubName)),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

function buildEmailHtml(code: string, hubName: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">Your access code</h2>
      <p style="color: #555; margin-bottom: 24px;">Use this code to access the <strong>${hubName}</strong> portal:</p>
      <div style="background: #f4f4f8; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #1a1a2e;">${code}</span>
      </div>
      <p style="color: #888; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">AgentFlow</p>
    </div>
  `.trim();
}
