-- Self-host completion migration (2026-09-17).
--
-- The cloud Supabase project accumulated tables and columns that were created from the dashboard
-- and never captured in this repo. The 2026-06-19 export (25 tables) plus every .from("...") /
-- .rpc("...") call in src/ is the source of truth for what follows. Idempotent: safe to re-run.
--
-- Apply on the self-hosted stack:
--   docker exec -i supabase-db-1 sh -c 'PGPASSWORD=$POSTGRES_PASSWORD psql -w -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -1' < this_file

-- 1. Columns the app reads/writes that the base schema + cyoa migration do not create ---------
ALTER TABLE stories  ALTER COLUMN title DROP NOT NULL;
ALTER TABLE stories  ADD COLUMN IF NOT EXISTS teaser text;
ALTER TABLE stories  ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE stories  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE stories  ADD COLUMN IF NOT EXISTS hidden_reason text;
ALTER TABLE stories  ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE stories  ADD COLUMN IF NOT EXISTS metadata jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_slug ON stories(slug) WHERE slug IS NOT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bot_description text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug) WHERE slug IS NOT NULL;

-- 2. reactions (9,224 rows in export). user_id is TEXT: values are seed_user_N / anon_<ip> /
--    auth uuids, so no FK to auth.users. src/app/api/stories/[id]/reactions/route.ts
CREATE TABLE IF NOT EXISTS reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reactions_story ON reactions(story_id);

-- 3. challenges + entries. src/app/api/challenges/*, src/app/api/cron/auto-challenge
CREATE TABLE IF NOT EXISTS challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  prompt text NOT NULL,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  winner_story_id uuid REFERENCES stories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_challenges_end ON challenges(end_date DESC);

CREATE TABLE IF NOT EXISTS challenge_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, story_id)
);

-- 4. comments + comment_votes. src/app/api/stories/[id]/comments, src/app/api/v1/stories/[id]/comments
--    user_id nullable uuid without FK: the v1 route inserts auth.user_id which may be null (API-key bots).
CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid,
  author_name text NOT NULL DEFAULT 'Anonymous',
  content text NOT NULL,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_story ON comments(story_id, created_at);

CREATE TABLE IF NOT EXISTS comment_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

-- 5. email + newsletter. src/app/api/newsletter/route.ts upserts on email for BOTH tables.
CREATE TABLE IF NOT EXISTS email_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  notify_branch boolean NOT NULL DEFAULT true,
  notify_votes boolean NOT NULL DEFAULT true,
  notify_tips boolean NOT NULL DEFAULT true,
  newsletter boolean NOT NULL DEFAULT true,
  marketing boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_prefs_user ON email_preferences(user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  source text,
  subscribed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. api_keys. src/lib/api-auth.ts, src/app/api/v1/keys, src/app/api/v1/bots
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  name text NOT NULL DEFAULT 'default',
  tier text NOT NULL DEFAULT 'free',
  scopes text[] NOT NULL DEFAULT '{read}',
  rate_limit_rpm integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- 7. tips (Solana). src/app/api/v1/tip/route.ts
CREATE TABLE IF NOT EXISTS tips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  sender_wallet text NOT NULL,
  recipient_wallet text,
  amount_lamports bigint NOT NULL DEFAULT 0,
  tx_signature text NOT NULL UNIQUE,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Credits system (supabase/migrations/20260409_credits_system.sql was never applied here).
CREATE TABLE IF NOT EXISTS user_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  purchased_credits integer NOT NULL DEFAULT 0,
  daily_credits_used integer NOT NULL DEFAULT 0,
  daily_reset_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL,
  description text,
  stripe_session_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id);
CREATE TABLE IF NOT EXISTS generation_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  action text,
  credit_cost integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_genlog_user ON generation_log(user_id);

CREATE OR REPLACE FUNCTION deduct_purchased_credit(uid uuid)
RETURNS boolean AS $$
DECLARE rows_affected integer;
BEGIN
  UPDATE user_credits SET purchased_credits = purchased_credits - 1, updated_at = now()
  WHERE user_id = uid AND purchased_credits > 0;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_purchased_credits(uid uuid, amount integer)
RETURNS integer AS $$
DECLARE new_balance integer;
BEGIN
  INSERT INTO user_credits (user_id, purchased_credits, updated_at) VALUES (uid, amount, now())
  ON CONFLICT (user_id) DO UPDATE
    SET purchased_credits = user_credits.purchased_credits + amount, updated_at = now();
  SELECT purchased_credits INTO new_balance FROM user_credits WHERE user_id = uid;
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- 9. search_stories RPC. src/app/api/v1/search/route.ts calls rpc("search_stories", {query, lim, off_set}).
--    The cloud definition was never captured; this is a plain full-text + ILIKE fallback over
--    title/teaser/content, visible stories only, best match first.
CREATE OR REPLACE FUNCTION search_stories(query text, lim integer DEFAULT 20, off_set integer DEFAULT 0)
RETURNS SETOF stories AS $$
  SELECT s.*
  FROM stories s
  WHERE s.is_hidden = false
    AND (
      to_tsvector('english', coalesce(s.title,'') || ' ' || coalesce(s.teaser,'') || ' ' || coalesce(s.content,''))
        @@ plainto_tsquery('english', query)
      OR s.title ILIKE '%' || query || '%'
    )
  ORDER BY
    ts_rank(to_tsvector('english', coalesce(s.title,'') || ' ' || coalesce(s.teaser,'') || ' ' || coalesce(s.content,'')),
            plainto_tsquery('english', query)) DESC,
    s.upvotes DESC, s.created_at DESC
  LIMIT lim OFFSET off_set;
$$ LANGUAGE sql STABLE;

-- 10. RLS. All writes go through the service_role client (BYPASSRLS). These policies govern what the
--     anon/authenticated keys can read directly through PostgREST: public content readable, private
--     rows owner-only, key material never readable through the API.
ALTER TABLE reactions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences      ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits           ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_log         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reactions_read ON reactions;
CREATE POLICY reactions_read ON reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS challenges_read ON challenges;
CREATE POLICY challenges_read ON challenges FOR SELECT USING (true);
DROP POLICY IF EXISTS challenge_entries_read ON challenge_entries;
CREATE POLICY challenge_entries_read ON challenge_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS comments_read ON comments;
CREATE POLICY comments_read ON comments FOR SELECT USING (is_hidden = false);
DROP POLICY IF EXISTS comment_votes_own ON comment_votes;
CREATE POLICY comment_votes_own ON comment_votes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS email_preferences_own ON email_preferences;
CREATE POLICY email_preferences_own ON email_preferences FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS tips_read ON tips;
CREATE POLICY tips_read ON tips FOR SELECT USING (true);
DROP POLICY IF EXISTS user_credits_select_own ON user_credits;
CREATE POLICY user_credits_select_own ON user_credits FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS credit_tx_select_own ON credit_transactions;
CREATE POLICY credit_tx_select_own ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
-- newsletter_subscribers, api_keys, generation_log: no anon/authenticated policies on purpose.

-- 11. Table privileges. Supabase cloud grants ALL on public to anon/authenticated/service_role by
--     default and relies on RLS to restrict; mirror that so the app behaves identically here.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
