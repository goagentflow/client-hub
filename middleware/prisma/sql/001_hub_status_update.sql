-- Hub Status Update table — append-only fortnightly status updates
-- Run via: pnpm db:migrate:sql  (executes all prisma/sql/*.sql files)
-- Or manually: psql $DATABASE_URL -f prisma/sql/001_hub_status_update.sql
-- All statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS)

-- Composite unique on hub(id, tenant_id) to enable composite FK
CREATE UNIQUE INDEX IF NOT EXISTS uq_hub_id_tenant ON hub(id, tenant_id);

CREATE TABLE IF NOT EXISTS hub_status_update (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  period TEXT NOT NULL,
  completed TEXT NOT NULL,
  in_progress TEXT NOT NULL,
  next_period TEXT NOT NULL,
  needed_from_client TEXT,
  on_track TEXT NOT NULL DEFAULT 'on_track'
    CHECK (on_track IN ('on_track', 'at_risk', 'off_track')),
  created_by TEXT NOT NULL CHECK (length(btrim(created_by)) > 0),
  created_source TEXT NOT NULL DEFAULT 'staff_ui'
    CHECK (created_source IN ('staff_ui', 'claude_sql')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (hub_id, tenant_id) REFERENCES hub(id, tenant_id),
  -- Prevent empty/whitespace-only required text fields (guards direct SQL writes)
  CHECK (length(btrim(period)) > 0),
  CHECK (length(btrim(completed)) > 0),
  CHECK (length(btrim(in_progress)) > 0),
  CHECK (length(btrim(next_period)) > 0),
  -- Length limits (match server-side validation)
  CHECK (length(period) <= 200),
  CHECK (length(completed) <= 5000),
  CHECK (length(in_progress) <= 5000),
  CHECK (length(next_period) <= 5000),
  CHECK (needed_from_client IS NULL OR length(needed_from_client) <= 5000)
);

CREATE INDEX IF NOT EXISTS idx_hub_status_update_tenant_hub
  ON hub_status_update(tenant_id, hub_id, created_at DESC, id DESC);

-- Append-only triggers — prevent UPDATE and DELETE
CREATE OR REPLACE FUNCTION prevent_status_update_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'hub_status_update is append-only: % not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_status_update_no_update ON hub_status_update;
CREATE TRIGGER trg_status_update_no_update
  BEFORE UPDATE ON hub_status_update FOR EACH ROW
  EXECUTE FUNCTION prevent_status_update_mutation();

DROP TRIGGER IF EXISTS trg_status_update_no_delete ON hub_status_update;
CREATE TRIGGER trg_status_update_no_delete
  BEFORE DELETE ON hub_status_update FOR EACH ROW
  EXECUTE FUNCTION prevent_status_update_mutation();
