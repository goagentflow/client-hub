/**
 * Runtime safety net for membership/access schema.
 *
 * Primary path is SQL migrations. This keeps API routes resilient if
 * deploy order is temporarily out of sync.
 */

import { getPrisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';

let ensured = false;
let ensurePromise: Promise<void> | null = null;

export async function ensureMembershipSchema(): Promise<void> {
  if (ensured) return;
  if (ensurePromise) {
    await ensurePromise;
    return;
  }

  ensurePromise = (async () => {
    const prisma = getPrisma();

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_hub_id_tenant
      ON hub(id, tenant_id)
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS hub_member (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        hub_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        user_id TEXT,
        email TEXT NOT NULL CHECK (length(btrim(email)) > 0),
        display_name TEXT,
        role TEXT NOT NULL CHECK (role IN ('staff', 'client')),
        access_level TEXT NOT NULL DEFAULT 'full_access'
          CHECK (access_level IN ('full_access', 'proposal_only', 'documents_only', 'view_only')),
        invited_by TEXT,
        invited_by_name TEXT,
        source TEXT NOT NULL DEFAULT 'system'
          CHECK (source IN ('portal_contact', 'invite', 'message', 'staff_manual', 'system')),
        status TEXT NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'revoked')),
        joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_active_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        FOREIGN KEY (hub_id, tenant_id) REFERENCES hub(id, tenant_id) ON DELETE CASCADE
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_hub_member_hub_email_role
      ON hub_member(hub_id, email, role)
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS hub_access_revocation (
        hub_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        email_key TEXT NOT NULL CHECK (length(btrim(email_key)) > 0),
        revoked_after TIMESTAMPTZ NOT NULL DEFAULT date_trunc('second', now()),
        reason TEXT,
        revoked_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (hub_id, email_key),
        FOREIGN KEY (hub_id, tenant_id) REFERENCES hub(id, tenant_id) ON DELETE CASCADE
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS hub_crm_org_map (
        hub_id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        org_id TEXT NOT NULL CHECK (length(btrim(org_id)) > 0),
        linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        linked_by TEXT,
        source TEXT NOT NULL DEFAULT 'auto'
          CHECK (source IN ('auto', 'manual', 'migration')),
        FOREIGN KEY (hub_id, tenant_id) REFERENCES hub(id, tenant_id) ON DELETE CASCADE
      )
    `);

    ensured = true;
    logger.info('Ensured membership/revocation schema exists');
  })().catch((err) => {
    ensurePromise = null;
    throw err;
  });

  await ensurePromise;
}
