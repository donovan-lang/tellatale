-- Branch routes (api/branches/generate, cron/auto-branch) insert a `metadata` object,
-- but the column was never created, so every AI branch insert failed.
-- Also home for the story bible / original prompt on seed stories.
ALTER TABLE stories ADD COLUMN IF NOT EXISTS metadata jsonb;
