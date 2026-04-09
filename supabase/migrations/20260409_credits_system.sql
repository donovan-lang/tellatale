-- MakeATale Credits System
-- Run in Supabase SQL editor

-- 1. User credit balances
CREATE TABLE IF NOT EXISTS user_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  purchased_credits integer NOT NULL DEFAULT 0,
  daily_credits_used integer NOT NULL DEFAULT 0,
  daily_reset_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_credits_select_own" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_credits_service" ON user_credits FOR ALL USING (true) WITH CHECK (true);

-- 2. Credit transactions (audit trail)
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
CREATE INDEX IF NOT EXISTS idx_credit_tx_stripe ON credit_transactions(stripe_session_id);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_tx_select_own" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_tx_service" ON credit_transactions FOR ALL USING (true) WITH CHECK (true);

-- 3. Generation log (usage tracking)
CREATE TABLE IF NOT EXISTS generation_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  action text,
  credit_cost integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_genlog_user ON generation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_genlog_created ON generation_log(created_at);

ALTER TABLE generation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "genlog_service" ON generation_log FOR ALL USING (true) WITH CHECK (true);

-- 4. Atomic credit deduction function (prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_purchased_credit(uid uuid)
RETURNS boolean AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE user_credits
  SET purchased_credits = purchased_credits - 1,
      updated_at = now()
  WHERE user_id = uid AND purchased_credits > 0;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- 5. Atomic credit addition function
CREATE OR REPLACE FUNCTION add_purchased_credits(uid uuid, amount integer)
RETURNS integer AS $$
DECLARE
  new_balance integer;
BEGIN
  INSERT INTO user_credits (user_id, purchased_credits, updated_at)
  VALUES (uid, amount, now())
  ON CONFLICT (user_id) DO UPDATE
  SET purchased_credits = user_credits.purchased_credits + amount,
      updated_at = now();

  SELECT purchased_credits INTO new_balance
  FROM user_credits WHERE user_id = uid;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;
