/**
 * Email service — sends verification codes via Resend REST API.
 *
 * Fire-and-forget pattern: callers dispatch without awaiting.
 * If RESEND_API_KEY is not set, email sends are skipped with non-sensitive logs.
 */

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { emailDomainForLogs } from '../utils/email-log.js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const REPLY_TO_EMAIL = 'hamish@goagentflow.com';
const HUB_PRIVACY_PATH = '/hub-privacy.html';
const HUB_TERMS_PATH = '/hub-terms.html';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function absoluteHubLegalUrl(path: string): string {
  try {
    return new URL(path, env.CORS_ORIGIN).toString();
  } catch {
    return `https://www.goagentflow.com${path}`;
  }
}

function buildEmailLegalFooter(extraLine?: string): string {
  const privacyUrl = escapeHtml(absoluteHubLegalUrl(HUB_PRIVACY_PATH));
  const termsUrl = escapeHtml(absoluteHubLegalUrl(HUB_TERMS_PATH));
  const extra = extraLine
    ? `<p style="color: #aaa; font-size: 12px; margin: 0 0 8px 0;">${extraLine}</p>`
    : '';

  return `
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      ${extra}
      <p style="color: #aaa; font-size: 12px; margin: 0;">
        <a href="${termsUrl}" style="color: #6b7280; text-decoration: underline;">Hub Terms</a>
        &nbsp;|&nbsp;
        <a href="${privacyUrl}" style="color: #6b7280; text-decoration: underline;">Hub Privacy Notice</a>
      </p>
    `.trim();
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.warn({ emailDomain: emailDomainForLogs(to) }, '[Email] No RESEND_API_KEY — skipping email send');
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
      to: [to.trim().toLowerCase()],
      subject: sanitizeHeaderValue(subject),
      reply_to: [REPLY_TO_EMAIL],
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend API error ${res.status}`);
  }
}

export async function sendVerificationCode(
  to: string,
  code: string,
  hubName: string,
): Promise<void> {
  await sendEmail(
    to,
    `Your AgentFlow sign-in code: ${code}`,
    buildVerificationCodeHtml(code, escapeHtml(hubName)),
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
    logger.warn(
      { emailDomain: emailDomainForLogs(to) },
      '[Email] No RESEND_API_KEY — invite email skipped',
    );
  }

  await sendEmail(
    to,
    `You're invited to your AgentFlow hub for ${hubName}`,
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
    `New message in ${hubName}`,
    buildMessageNotificationHtml({
      heading: 'You have a new message',
      senderName: escapeHtml(senderName),
      hubName: escapeHtml(hubName),
      messagePreview: escapeHtml(messagePreview),
      ctaLabel: 'Open messages',
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

export async function sendPortalAccessRequestNotification(
  to: string,
  details: {
    requesterName: string;
    requesterEmail: string;
    requestedEmail: string;
    hubName: string;
    hubUrl: string;
    requestNote?: string;
  },
): Promise<void> {
  await sendEmail(
    to,
    `Portal access request for ${escapeHtml(details.hubName)}`,
    buildPortalAccessRequestHtml({
      requesterName: escapeHtml(details.requesterName),
      requesterEmail: escapeHtml(details.requesterEmail),
      requestedEmail: escapeHtml(details.requestedEmail),
      hubName: escapeHtml(details.hubName),
      hubUrl: escapeHtml(details.hubUrl),
      ...(details.requestNote ? { requestNote: escapeHtml(details.requestNote) } : {}),
    }),
  );
}

export async function sendAccessRecoveryEmail(
  to: string,
  accessUrl: string,
): Promise<void> {
  await sendEmail(
    to,
    "Here's your way back in",
    buildAccessRecoveryHtml(escapeHtml(accessUrl)),
  );
}

function buildInviteHtml(hubName: string, inviterName: string, portalUrl: string, message?: string): string {
  const messageBlock = message
    ? `
      <div style="margin-bottom: 24px; padding: 16px; background: #f9f9fb; border-radius: 8px; border-left: 3px solid #6366f1;">
        <p style="color: #555; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">A note from ${inviterName}</p>
        <p style="color: #444; margin: 0;"><em>"${message}"</em></p>
      </div>
    `
    : '';

  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${inviterName} has shared your hub. Open it to see updates, docs, and messages.
    </div>
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">You're in</h2>
      <p style="color: #555; margin-bottom: 12px;"><strong>${inviterName}</strong> has invited you to your AgentFlow hub for <strong>${hubName}</strong>.</p>
      <p style="color: #555; margin-bottom: 24px;">This is where we'll share progress, documents, and key updates.</p>
      ${messageBlock}
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${portalUrl}" style="display: inline-block; padding: 14px 32px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Open your hub</a>
      </div>
      <p style="color: #888; font-size: 14px;">You'll be asked to verify your email address when you open the hub.</p>
      ${buildEmailLegalFooter('Questions? Just reply to this email.')}
    </div>
  `.trim();
}

function buildVerificationCodeHtml(code: string, hubName: string): string {
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Use this 6-digit code to sign in securely. Expires in 10 minutes.
    </div>
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">Your sign-in code</h2>
      <p style="color: #555; margin-bottom: 24px;">Enter this code to sign in to <strong>${hubName}</strong>:</p>
      <div style="background: #f4f4f8; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; color: #555; font-size: 13px; text-transform: uppercase; letter-spacing: .04em;">Verification code</p>
        <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #1a1a2e;">${code}</span>
      </div>
      <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;">This code expires in 10 minutes.</p>
      <p style="color: #888; font-size: 14px; margin: 0;">If you didn't request this, you can ignore this email.</p>
      ${buildEmailLegalFooter()}
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
      ${buildEmailLegalFooter()}
    </div>
  `.trim();
}

function buildPortalAccessRequestHtml({
  requesterName,
  requesterEmail,
  requestedEmail,
  hubName,
  hubUrl,
  requestNote,
}: {
  requesterName: string;
  requesterEmail: string;
  requestedEmail: string;
  hubName: string;
  hubUrl: string;
  requestNote?: string;
}): string {
  const noteBlock = requestNote
    ? `<p style="margin: 0; color: #444;"><strong>Note:</strong> ${requestNote}</p>`
    : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">Portal teammate access request</h2>
      <p style="color: #555; margin-bottom: 16px;">
        <strong>${requesterName}</strong> (${requesterEmail}) requested access for
        <strong>${requestedEmail}</strong> in <strong>${hubName}</strong>.
      </p>
      ${noteBlock}
      <div style="text-align: center; margin: 24px 0;">
        <a href="${hubUrl}" style="display: inline-block; padding: 14px 32px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Review In Hub
        </a>
      </div>
      <p style="color: #888; font-size: 14px; margin: 0;">
        Add the teammate from Members/Invites to grant portal message access.
      </p>
      ${buildEmailLegalFooter()}
    </div>
  `.trim();
}

function buildAccessRecoveryHtml(accessUrl: string): string {
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Use this secure link to open the hubs and reports shared with you.
    </div>
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">Welcome back</h2>
      <p style="color: #555; margin-bottom: 24px;">Use the link below to get back to everything shared with you.</p>
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${accessUrl}" style="display: inline-block; padding: 14px 32px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Open my access</a>
      </div>
      <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;">This secure link expires in 20 minutes.</p>
      <p style="color: #888; font-size: 14px; margin: 0;">If you didn't request this, you can ignore this email.</p>
      ${buildEmailLegalFooter()}
    </div>
  `.trim();
}
