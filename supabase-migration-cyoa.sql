-- MakeATale CYOA Engine Migration
-- Run this in Supabase SQL editor AFTER the initial schema

-- 1. Alter stories table for CYOA
ALTER TABLE stories ALTER COLUMN title DROP NOT NULL;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_type text NOT NULL DEFAULT 'seed';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_ending boolean NOT NULL DEFAULT false;

-- Backfill: existing stories with parent_id are branches
UPDATE stories SET story_type = 'branch' WHERE parent_id IS NOT NULL;

-- 2. Chronicles table — saved journeys through the story tree
CREATE TABLE IF NOT EXISTS chronicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  root_story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  title text NOT NULL,
  story_path uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chronicles_user ON chronicles(user_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_root ON chronicles(root_story_id);

-- RLS: users can only access their own chronicles
ALTER TABLE chronicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chronicles_select_own" ON chronicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chronicles_insert_own" ON chronicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chronicles_update_own" ON chronicles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chronicles_delete_own" ON chronicles
  FOR DELETE USING (auth.uid() = user_id);

-- Service role bypass for API routes
CREATE POLICY "chronicles_service" ON chronicles
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Reading progress table — track where user is in a story tree
CREATE TABLE IF NOT EXISTS reading_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  root_story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, root_story_id)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reading_progress_select_own" ON reading_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reading_progress_upsert_own" ON reading_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reading_progress_update_own" ON reading_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reading_progress_service" ON reading_progress
  FOR ALL USING (true) WITH CHECK (true);

-- 4. RPC: get story ancestors (recursive CTE walking parent_id to root)
CREATE OR REPLACE FUNCTION get_story_ancestors(story_uuid uuid)
RETURNS SETOF stories AS $$
  WITH RECURSIVE ancestors AS (
    SELECT * FROM stories WHERE id = story_uuid
    UNION ALL
    SELECT s.* FROM stories s
    INNER JOIN ancestors a ON s.id = a.parent_id
  )
  SELECT * FROM ancestors ORDER BY depth ASC;
$$ LANGUAGE sql STABLE;
