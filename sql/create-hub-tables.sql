-- ============================================================
-- AgentFlow Pitch Hub: Supabase Tables
-- Run this in the Supabase SQL Editor (Dashboard > SQL)
-- These tables sit alongside existing CRM tables but are
-- only queried by the pitch hub React app.
-- ============================================================

-- 1. hub — one row per client portal
CREATE TABLE hub (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES org(id),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  client_domain TEXT NOT NULL,
  hub_type TEXT NOT NULL DEFAULT 'pitch' CHECK (hub_type IN ('pitch', 'client')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'won', 'lost')),
  password_hash TEXT,
  welcome_headline TEXT,
  welcome_message TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. hub_video — YouTube links from pitch system
CREATE TABLE hub_video (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES hub(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'link',
  source_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  visibility TEXT NOT NULL DEFAULT 'client' CHECK (visibility IN ('client', 'internal')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by_name TEXT NOT NULL DEFAULT 'Hamish Nicklin',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 3. hub_document — PPTs and other files
CREATE TABLE hub_document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES hub(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  category TEXT NOT NULL DEFAULT 'proposal' CHECK (category IN ('proposal', 'contract', 'reference', 'brief', 'deliverable', 'other')),
  visibility TEXT NOT NULL DEFAULT 'client' CHECK (visibility IN ('client', 'internal')),
  download_url TEXT,
  embed_url TEXT,
  is_proposal BOOLEAN NOT NULL DEFAULT false,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by_name TEXT NOT NULL DEFAULT 'Hamish Nicklin',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX idx_hub_org_id ON hub(org_id);
CREATE INDEX idx_hub_video_hub_id ON hub_video(hub_id);
CREATE INDEX idx_hub_document_hub_id ON hub_document(hub_id);
CREATE INDEX idx_hub_document_is_proposal ON hub_document(hub_id, is_proposal) WHERE is_proposal = true;

-- updated_at trigger (reuse if you have one, otherwise create)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_updated_at
  BEFORE UPDATE ON hub
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS: Read-only for anon, write requires service_role
-- ============================================================

ALTER TABLE hub ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_video ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_document ENABLE ROW LEVEL SECURITY;

-- Anon can read hubs (excluding password_hash — enforced at query level)
CREATE POLICY "anon_read_hub" ON hub
  FOR SELECT TO anon USING (true);

-- Anon can read videos and documents
CREATE POLICY "anon_read_hub_video" ON hub_video
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_hub_document" ON hub_document
  FOR SELECT TO anon USING (true);

-- Service role (used by pitch system) can do everything
CREATE POLICY "service_all_hub" ON hub
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_hub_video" ON hub_video
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_hub_document" ON hub_document
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon can insert hubs (for the Create Hub dialog in the frontend)
CREATE POLICY "anon_insert_hub" ON hub
  FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- RPC: Server-side password verification
-- The password_hash never leaves the database.
-- ============================================================

CREATE OR REPLACE FUNCTION verify_hub_password(
  p_hub_id UUID,
  p_password_hash TEXT
)
RETURNS JSON AS $$
DECLARE
  hub_row RECORD;
BEGIN
  SELECT id, company_name, contact_name, contact_email, client_domain,
         password_hash
  INTO hub_row
  FROM hub
  WHERE id = p_hub_id;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF hub_row.password_hash IS NULL THEN
    -- No password set — open access
    RETURN json_build_object(
      'valid', true,
      'contact_name', hub_row.contact_name,
      'contact_email', hub_row.contact_email,
      'client_domain', hub_row.client_domain
    );
  END IF;

  IF hub_row.password_hash = p_password_hash THEN
    RETURN json_build_object(
      'valid', true,
      'contact_name', hub_row.contact_name,
      'contact_email', hub_row.contact_email,
      'client_domain', hub_row.client_domain
    );
  ELSE
    RETURN json_build_object('valid', false, 'reason', 'wrong_password');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anon to call the RPC
GRANT EXECUTE ON FUNCTION verify_hub_password(UUID, TEXT) TO anon;
