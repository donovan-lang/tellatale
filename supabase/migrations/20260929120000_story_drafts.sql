-- Story drafts saved to the signed-in user's account (seed drafts + in-progress branches)
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS story_drafts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'seed' for a new story, 'branch:<parent story id>' for a continuation
  draft_key text NOT NULL,
  title text,
  teaser text,
  content text,
  tags text[],
  seed_input jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, draft_key)
);

CREATE INDEX IF NOT EXISTS idx_story_drafts_user_updated ON story_drafts(user_id, updated_at DESC);

-- Only the API (service role, bypasses RLS) reads and writes drafts; users can read their own.
ALTER TABLE story_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_drafts_select_own" ON story_drafts FOR SELECT USING (auth.uid() = user_id);
