import json, subprocess, sys

sqls = [
    "CREATE TABLE IF NOT EXISTS api_keys (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid NOT NULL, key_hash text NOT NULL UNIQUE, key_prefix text NOT NULL, name text NOT NULL DEFAULT 'default', tier text NOT NULL DEFAULT 'free', scopes text[] NOT NULL DEFAULT '{read}', is_active boolean NOT NULL DEFAULT true, rate_limit_rpm int NOT NULL DEFAULT 30, last_used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()); CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);",
    "CREATE TABLE IF NOT EXISTS webhooks (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid NOT NULL, url text NOT NULL, secret text NOT NULL, events text[] NOT NULL DEFAULT '{branch,vote}', is_active boolean NOT NULL DEFAULT true, failure_count int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());",
    "CREATE TABLE IF NOT EXISTS tips (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE, sender_wallet text NOT NULL, recipient_wallet text NOT NULL, amount_lamports bigint NOT NULL, token text NOT NULL DEFAULT 'SOL', tx_signature text NOT NULL UNIQUE, verified boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()); CREATE INDEX IF NOT EXISTS idx_tips_tx ON tips(tx_signature);",
    "ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY; ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY; ALTER TABLE tips ENABLE ROW LEVEL SECURITY;",
    "DO $$ BEGIN CREATE POLICY api_keys_all ON api_keys FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;",
    "DO $$ BEGIN CREATE POLICY webhooks_all ON webhooks FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;",
    "DO $$ BEGIN CREATE POLICY tips_all ON tips FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;",
]

token = "sbp_26457d6a2834e945270b28efe523e6e7f27b90df"
api = "https://api.supabase.com/v1/projects/pnufyhorwltjagbklpwx/database/query"

for i, sql in enumerate(sqls):
    payload = json.dumps({"query": sql})
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", api, "-H", f"Authorization: Bearer {token}", "-H", "Content-Type: application/json", "-d", payload],
        capture_output=True, text=True
    )
    out = result.stdout.strip()
    if "error" in out.lower() and out != "[]":
        print(f"Step {i+1} ERROR: {out[:200]}")
    else:
        print(f"Step {i+1}: OK")
