-- Writer profiles, MySpace-style (Phase 1): per-profile theme/layout + a pinned featured tale.
-- customization is written only by PUT /api/profile/customization, which whitelists every field
-- (see sanitizeCustomization in src/lib/profile-theme.ts). Safe to run more than once.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customization jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_story_id uuid REFERENCES stories(id) ON DELETE SET NULL;
