import { NextResponse } from "next/server";

// One-time migration endpoint — runs DDL via Supabase Management API
// Uses the project's direct database connection through Supabase's internal pg-meta API
// Protected by a simple token check to prevent abuse

const MIGRATION_SQL = `
-- Add CYOA columns to stories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stories' AND column_name='story_type') THEN
    ALTER TABLE stories ADD COLUMN story_type text NOT NULL DEFAULT 'seed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stories' AND column_name='is_ending') THEN
    ALTER TABLE stories ADD COLUMN is_ending boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stories' AND column_name='tags') THEN
    ALTER TABLE stories ADD COLUMN tags text[] DEFAULT NULL;
  END IF;
END $$;

-- Allow null titles for branches
ALTER TABLE stories ALTER COLUMN title DROP NOT NULL;

-- Backfill
UPDATE stories SET story_type = 'branch' WHERE parent_id IS NOT NULL AND story_type = 'seed';

-- Chronicles table
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

-- Reading progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  root_story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, root_story_id)
);

-- RLS for chronicles
DO $$ BEGIN
  ALTER TABLE chronicles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "chronicles_select_own" ON chronicles FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "chronicles_insert_own" ON chronicles FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "chronicles_update_own" ON chronicles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "chronicles_delete_own" ON chronicles FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS for reading_progress
DO $$ BEGIN
  ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "rp_select_own" ON reading_progress FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "rp_insert_own" ON reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "rp_update_own" ON reading_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC: get story ancestors
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
`;

export async function POST(req: Request) {
  // Simple auth check — only allow with service role key
  const auth = req.headers.get("authorization");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!auth || !serviceKey || auth !== `Bearer ${serviceKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use pg module to connect directly to the database
    // Supabase exposes DATABASE_URL or we construct it
    const dbUrl =
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DB_URL ||
      null;

    if (dbUrl) {
      // Direct pg connection
      const { Client } = require("pg");
      const client = new Client({ connectionString: dbUrl });
      await client.connect();
      await client.query(MIGRATION_SQL);
      await client.end();
      return NextResponse.json({ ok: true, method: "pg" });
    }

    // Fallback: use Supabase's internal pg-meta endpoint if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // Try Supabase pg-meta SQL execution endpoint
    const res = await fetch(`${supabaseUrl}/pg/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        apikey: serviceKey,
      },
      body: JSON.stringify({ query: MIGRATION_SQL }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ok: true, method: "pg-meta", data });
    }

    // If pg-meta doesn't work, try running individual statements via rpc
    // by first creating a helper function through a workaround
    return NextResponse.json(
      {
        error: "No direct database access available",
        hint: "Set DATABASE_URL env var or run supabase-migration-cyoa.sql in Supabase SQL editor",
        pgMetaStatus: res.status,
        pgMetaBody: await res.text(),
      },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, stack: err.stack?.split("\n").slice(0, 3) },
      { status: 500 }
    );
  }
}
