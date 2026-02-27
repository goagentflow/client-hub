-- One-time access recovery token storage.
-- Raw tokens are never stored; only SHA-256 token_hash values are persisted.
-- Run via: pnpm db:migrate:sql

CREATE TABLE IF NOT EXISTS access_recovery_token (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE CHECK (length(btrim(token_hash)) = 64),
  email TEXT NOT NULL CHECK (length(btrim(email)) > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_recovery_token_expires
  ON access_recovery_token(expires_at);

CREATE INDEX IF NOT EXISTS idx_access_recovery_token_email_created
  ON access_recovery_token(email, created_at DESC);
