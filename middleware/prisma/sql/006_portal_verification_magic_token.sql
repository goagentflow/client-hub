-- Add magic_token_hash column to portal_verification for magic link auth.
-- Nullable: only populated when request-code generates a magic link alongside the OTP code.
ALTER TABLE portal_verification ADD COLUMN IF NOT EXISTS magic_token_hash TEXT;
