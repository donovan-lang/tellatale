-- TellATale — Supabase Schema
-- Run this in the Supabase SQL editor to set up the database.

-- Stories table (tree structure via parent_id)
create table if not exists stories (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references stories(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Anonymous',
  title text not null,
  content text not null,
  image_url text,
  image_prompt text,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  depth integer not null default 0,
  created_at timestamptz not null default now()
);

-- Votes table (one vote per user per story)
create table if not exists votes (
  id uuid default gen_random_uuid() primary key,
  story_id uuid not null references stories(id) on delete cascade,
  user_id text not null, -- wallet address or session ID for anon users
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  unique(story_id, user_id)
);

-- Donations table (on-chain record)
create table if not exists donations (
  id uuid default gen_random_uuid() primary key,
  story_id uuid not null references stories(id) on delete cascade,
  donor_wallet text not null,
  amount_raw bigint not null, -- raw token amount (lamports or USDC micro-units)
  token text not null default 'USDC',
  tx_signature text not null unique,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_stories_parent on stories(parent_id);
create index if not exists idx_stories_created on stories(created_at desc);
create index if not exists idx_votes_story on votes(story_id);
create index if not exists idx_donations_story on donations(story_id);

-- RPC functions for atomic vote increments
create or replace function increment_upvote(story_id uuid)
returns void as $$
  update stories set upvotes = upvotes + 1 where id = story_id;
$$ language sql;

create or replace function increment_downvote(story_id uuid)
returns void as $$
  update stories set downvotes = downvotes + 1 where id = story_id;
$$ language sql;

-- Row Level Security
alter table stories enable row level security;
alter table votes enable row level security;
alter table donations enable row level security;

-- Public read access
create policy "stories_read" on stories for select using (true);
create policy "votes_read" on votes for select using (true);
create policy "donations_read" on donations for select using (true);

-- Public insert (MVP — no auth required)
create policy "stories_insert" on stories for insert with check (true);
create policy "votes_insert" on votes for insert with check (true);
create policy "donations_insert" on donations for insert with check (true);

-- ============================================================
-- Profiles table (linked to auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  pen_name text not null default 'Anonymous',
  avatar_url text,
  bio text,
  wallet_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_pen_name on profiles(pen_name);

-- RLS for profiles
alter table profiles enable row level security;

-- Anyone can read profiles
create policy "profiles_read" on profiles for select using (true);

-- Users can insert their own profile
create policy "profiles_insert" on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "profiles_update" on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup via trigger
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, pen_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'pen_name', 'Anonymous'),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
