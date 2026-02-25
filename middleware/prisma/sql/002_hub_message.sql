-- Hub Message table — flat chronological message feed.
-- Run via: pnpm db:migrate:sql (executes all prisma/sql/*.sql files)
-- Idempotent: safe to re-run.

-- Composite unique needed for composite FK.
CREATE UNIQUE INDEX IF NOT EXISTS uq_hub_id_tenant ON hub(id, tenant_id);

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
);

CREATE INDEX IF NOT EXISTS idx_hub_message_tenant_hub
  ON hub_message(tenant_id, hub_id, created_at DESC, id DESC);
