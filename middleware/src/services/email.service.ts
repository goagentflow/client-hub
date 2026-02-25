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

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.warn({ to, subject }, '[Email] No RESEND_API_KEY — skipping email send');
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
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

export async function sendVerificationCode(
  to: string,
  code: string,
  hubName: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.warn({ to, code, hubName }, '[Email] No RESEND_API_KEY — logging code instead of sending');
  }

  await sendEmail(
    to,
    `Your access code for ${escapeHtml(hubName)}`,
    buildEmailHtml(code, escapeHtml(hubName)),
  );
}

export async function sendPortalInvite(
  to: string,
  hubName: string,
  inviterName: string,
  portalUrl: string,
  message?: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.warn({ to, hubName, inviterName }, '[Email] No RESEND_API_KEY — logging invite instead of sending');
  }

  await sendEmail(
    to,
    `You've been invited to ${escapeHtml(hubName)}`,
    buildInviteHtml(
      escapeHtml(hubName),
      escapeHtml(inviterName),
      escapeHtml(portalUrl),
      message ? escapeHtml(message) : undefined,
    ),
  );
}

export async function sendNewMessageNotification(
  to: string,
  senderName: string,
  hubName: string,
  messagePreview: string,
  portalUrl: string,
): Promise<void> {
  await sendEmail(
    to,
    `New message from ${escapeHtml(senderName)} in ${escapeHtml(hubName)}`,
    buildMessageNotificationHtml({
      heading: 'New message from your agency team',
      senderName: escapeHtml(senderName),
      hubName: escapeHtml(hubName),
      messagePreview: escapeHtml(messagePreview),
      ctaLabel: 'Open Portal',
      ctaUrl: escapeHtml(portalUrl),
    }),
  );
}

export async function sendClientReplyNotification(
  to: string,
  clientName: string,
  hubName: string,
  messagePreview: string,
  hubUrl: string,
): Promise<void> {
  await sendEmail(
    to,
    `New client reply from ${escapeHtml(clientName)} in ${escapeHtml(hubName)}`,
    buildMessageNotificationHtml({
      heading: 'New client reply',
      senderName: escapeHtml(clientName),
      hubName: escapeHtml(hubName),
      messagePreview: escapeHtml(messagePreview),
      ctaLabel: 'Open Hub Messages',
      ctaUrl: escapeHtml(hubUrl),
    }),
  );
}

function buildInviteHtml(hubName: string, inviterName: string, portalUrl: string, message?: string): string {
  const messageBlock = message
    ? `<p style="color: #555; margin-bottom: 24px; padding: 16px; background: #f9f9fb; border-radius: 8px; border-left: 3px solid #6366f1;"><em>"${message}"</em></p>`
    : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">You've been invited</h2>
      <p style="color: #555; margin-bottom: 24px;"><strong>${inviterName}</strong> has invited you to the <strong>${hubName}</strong> portal.</p>
      ${messageBlock}
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${portalUrl}" style="display: inline-block; padding: 14px 32px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Portal</a>
      </div>
      <p style="color: #888; font-size: 14px;">You'll be asked to verify your email address when you open the portal.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">AgentFlow</p>
    </div>
  `.trim();
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

function buildMessageNotificationHtml({
  heading,
  senderName,
  hubName,
  messagePreview,
  ctaLabel,
  ctaUrl,
}: {
  heading: string;
  senderName: string;
  hubName: string;
  messagePreview: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">${heading}</h2>
      <p style="color: #555; margin-bottom: 20px;">
        <strong>${senderName}</strong> posted a new message in <strong>${hubName}</strong>.
      </p>
      <blockquote style="margin: 0 0 24px 0; padding: 14px 16px; background: #f9f9fb; border-left: 3px solid #6366f1; border-radius: 8px; color: #333;">
        ${messagePreview}
      </blockquote>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${ctaUrl}" style="display: inline-block; padding: 14px 32px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">${ctaLabel}</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">AgentFlow</p>
    </div>
  `.trim();
}
