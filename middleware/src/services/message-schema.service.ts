/**
 * Runtime safety net for message schema.
 *
 * The intended path is running raw SQL migrations during deployment.
 * This guard keeps production usable if a deploy happens before SQL is applied.
 */

import { getPrisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';

let ensured = false;
let ensurePromise: Promise<void> | null = null;

export async function ensureHubMessageSchema(): Promise<void> {
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
      CREATE TABLE IF NOT EXISTS hub_message (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        hub_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        sender_type TEXT NOT NULL CHECK (sender_type IN ('staff', 'portal_client')),
        sender_email TEXT NOT NULL CHECK (length(btrim(sender_email)) > 0),
        sender_name TEXT NOT NULL CHECK (length(btrim(sender_name)) > 0),
        body TEXT NOT NULL
          CHECK (length(btrim(body)) > 0)
          CHECK (length(body) <= 10000),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        FOREIGN KEY (hub_id, tenant_id) REFERENCES hub(id, tenant_id)
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_hub_message_tenant_hub
      ON hub_message(tenant_id, hub_id, created_at DESC, id DESC)
    `);

    ensured = true;
    logger.info('Ensured hub_message schema exists');
  })().catch((err) => {
    ensurePromise = null;
    throw err;
  });

  await ensurePromise;
}
