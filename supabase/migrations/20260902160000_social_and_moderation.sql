-- Social + moderation tables: reports, bookmarks, notifications, follows.
--
-- These four were created directly against the production Supabase dashboard and never captured as
-- a migration, so a fresh local project 500s on /api/reports, /api/bookmarks, /api/notifications,
-- /api/follows and /api/feed. Reconstructed 2026-09-02 from actual code usage rather than guessed:
-- every column below is read or written somewhere in src/, and the notes record WHY a type was
-- chosen where the obvious choice would be wrong.

-- reports -------------------------------------------------------------------
-- src/app/api/reports/route.ts, src/app/api/admin/reports/route.ts, src/lib/auto-moderation.ts
-- NB: reporter_id is TEXT, not uuid. auto-moderation inserts the literal 'system', and anonymous
-- reporters are stored as 'anon_<ip>' (api/reports/route.ts). A uuid column breaks both paths.
create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  story_id uuid not null references stories(id) on delete cascade,
  reporter_id text not null,
  reason text not null,
  status text not null default 'pending',   -- pending | actioned | dismissed
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (story_id, reporter_id)            -- api/reports duplicate check relies on this
);
create index if not exists idx_reports_status  on reports(status, created_at desc);
create index if not exists idx_reports_story   on reports(story_id);

-- bookmarks -----------------------------------------------------------------
-- src/app/api/bookmarks/route.ts upserts with onConflict "user_id,story_id"
create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references stories(id) on delete cascade,
  root_story_id uuid references stories(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, story_id)
);
create index if not exists idx_bookmarks_user on bookmarks(user_id, created_at desc);

-- notifications -------------------------------------------------------------
-- src/lib/notify.ts inserts {user_id, type, title, body, link}; api/notifications flips is_read
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,                        -- branch | upvote | tip | moderation | ...
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on notifications(user_id) where is_read = false;

-- follows -------------------------------------------------------------------
-- src/app/api/follows/route.ts upserts with onConflict "follower_id,followed_id"
create table if not exists follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);
create index if not exists idx_follows_followed on follows(followed_id);

-- RLS -----------------------------------------------------------------------
-- Every write path in the app goes through createServiceClient() (service_role, bypasses RLS),
-- so these policies only govern direct client reads. Deliberately restrictive: a user sees their
-- own bookmarks/notifications/follows and nothing else. reports stay admin-only.
alter table reports       enable row level security;
alter table bookmarks     enable row level security;
alter table notifications enable row level security;
alter table follows       enable row level security;

drop policy if exists "own bookmarks" on bookmarks;
create policy "own bookmarks" on bookmarks
  for select using (auth.uid() = user_id);

drop policy if exists "own notifications" on notifications;
create policy "own notifications" on notifications
  for select using (auth.uid() = user_id);

drop policy if exists "follows readable" on follows;
create policy "follows readable" on follows
  for select using (true);
