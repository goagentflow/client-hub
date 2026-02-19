-- ============================================================================
-- Middleware Migration: New columns and tables for middleware API
-- Run this against Supabase SQL editor
-- ============================================================================

-- 1. Add internal_notes, converted_at, converted_by to hub table
ALTER TABLE hub ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE hub ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE hub ADD COLUMN IF NOT EXISTS converted_by TEXT;

-- 2. Remove anon insert policy (middleware uses service_role — no anon writes)
DROP POLICY IF EXISTS "anon_insert_hub" ON hub;

-- 3. Create hub_event table for activity tracking
CREATE TABLE IF NOT EXISTS hub_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES hub(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_id TEXT,
  user_email TEXT,
  user_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_event_hub_id ON hub_event(hub_id);
CREATE INDEX IF NOT EXISTS idx_hub_event_created ON hub_event(hub_id, created_at DESC);

ALTER TABLE hub_event ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all_hub_event" ON hub_event;
CREATE POLICY "service_all_hub_event" ON hub_event FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Create hub_project table
CREATE TABLE IF NOT EXISTS hub_project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES hub(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_hold','completed','cancelled')),
  start_date DATE,
  target_end_date DATE,
  lead TEXT,
  lead_name TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_project_hub_id ON hub_project(hub_id);

ALTER TABLE hub_project ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all_hub_project" ON hub_project;
CREATE POLICY "service_all_hub_project" ON hub_project FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Create hub_milestone table
CREATE TABLE IF NOT EXISTS hub_milestone (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES hub_project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','missed')),
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_milestone_project ON hub_milestone(project_id);

ALTER TABLE hub_milestone ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all_hub_milestone" ON hub_milestone;
CREATE POLICY "service_all_hub_milestone" ON hub_milestone FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Make hub_event.hub_id nullable (for leadership events that are global)
ALTER TABLE hub_event ALTER COLUMN hub_id DROP NOT NULL;
