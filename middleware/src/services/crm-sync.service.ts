/**
 * CRM sync service (insight-pulse shared DB).
 *
 * Non-blocking, best-effort sync for hub membership activity:
 * - resolve/create org row
 * - map hub -> org in hub_crm_org_map
 * - append activity_log entries
 *
 * Any CRM failure is logged and swallowed so core hub operations remain reliable.
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let crmCapabilityChecked = false;
let crmTablesAvailable = false;

function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

function asUuidOrNull(value: string | null | undefined): string | null {
  return isUuid(value) ? value : null;
}

function isMissingRelationError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  return e.code === 'P2021' || (typeof e.message === 'string' && e.message.includes('does not exist'));
}

async function detectCrmTables(prisma: PrismaClient): Promise<boolean> {
  if (crmCapabilityChecked) return crmTablesAvailable;

  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ has_org: boolean; has_activity: boolean }>>(
      "SELECT to_regclass('public.org') IS NOT NULL AS has_org, to_regclass('public.activity_log') IS NOT NULL AS has_activity",
    );

    crmTablesAvailable = !!rows[0]?.has_org && !!rows[0]?.has_activity;
  } catch (err) {
    crmTablesAvailable = false;
    logger.warn({ err }, 'Unable to verify CRM tables; CRM sync disabled for this runtime');
  }

  crmCapabilityChecked = true;
  return crmTablesAvailable;
}

async function resolveOrCreateOrg(
  prisma: PrismaClient,
  args: { hubId: string; tenantId: string; companyName: string; linkedBy?: string },
): Promise<string | null> {
  const mapping = await prisma.hubCrmOrgMap.findUnique({
    where: { hubId: args.hubId },
    select: { orgId: true },
  });
  if (mapping?.orgId) return mapping.orgId;

  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    'SELECT id::text AS id FROM org WHERE lower(name) = lower($1) ORDER BY created_at DESC LIMIT 1',
    args.companyName,
  );

  const orgId = existing[0]?.id
    || (await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      'INSERT INTO org (name) VALUES ($1) RETURNING id::text AS id',
      args.companyName,
    ))[0]?.id;

  if (!orgId) return null;

  await prisma.hubCrmOrgMap.upsert({
    where: { hubId: args.hubId },
    create: {
      hubId: args.hubId,
      tenantId: args.tenantId,
      orgId,
      linkedBy: args.linkedBy || null,
      source: 'auto',
    },
    update: {
      tenantId: args.tenantId,
      orgId,
      linkedBy: args.linkedBy || null,
      linkedAt: new Date(),
      source: 'auto',
    },
  });

  return orgId;
}

export interface CrmMemberActivityInput {
  hubId: string;
  tenantId: string;
  companyName: string;
  actorUserId?: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  activityType?: 'team_invited' | 'status_changed' | 'other';
}

export async function syncMemberActivityToCrm(
  prisma: PrismaClient,
  input: CrmMemberActivityInput,
): Promise<void> {
  try {
    const available = await detectCrmTables(prisma);
    if (!available) return;

    const orgId = await resolveOrCreateOrg(prisma, {
      hubId: input.hubId,
      tenantId: input.tenantId,
      companyName: input.companyName,
      ...(input.actorUserId ? { linkedBy: input.actorUserId } : {}),
    });

    if (!isUuid(orgId)) {
      logger.warn({ hubId: input.hubId, orgId }, 'CRM sync skipped because resolved orgId is not a UUID');
      return;
    }

    const userId = asUuidOrNull(input.actorUserId);
    const metadata = {
      hubId: input.hubId,
      tenantId: input.tenantId,
      ...input.metadata,
    };

    await prisma.$executeRawUnsafe(
      `INSERT INTO activity_log (org_id, user_id, activity_type, title, content, metadata)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb)`,
      orgId,
      userId,
      input.activityType || 'other',
      input.title,
      input.content,
      JSON.stringify(metadata),
    );
  } catch (err) {
    if (isMissingRelationError(err)) {
      logger.warn({ hubId: input.hubId }, 'CRM tables unavailable; skipped CRM membership sync');
      return;
    }

    logger.warn({ err, hubId: input.hubId }, 'CRM membership sync failed (non-blocking)');
  }
}
