-- ============================================================
-- OCEAN Platform — Supabase Schema
-- Run this in the Supabase SQL editor (Settings → SQL Editor)
-- ============================================================

-- User display names (extends Supabase Auth users)
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- All OCEAN profiles in a user's library
-- source: 'test' = own paid quiz, 'upload' = imported JSON, 'shared' = from friend invite
create table if not exists ocean_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'ไม่ระบุชื่อ',
  source text not null check (source in ('test', 'upload', 'shared')),
  test_type text not null check (test_type in ('50', '120', '300')),
  scores jsonb not null,       -- { raw: {...}, pct: {...}, facets?: {...} }
  answers jsonb,               -- full answers map (nullable for shared/upload)
  profile jsonb,               -- { age, sex, occupation, goal }
  metadata jsonb,              -- testId, itemSource, etc.
  session_id text,
  ai_report text,              -- cached AI report from interpret-deep (saved after streaming)
  created_at timestamptz default now()
);

-- Cached AI comparison results
create table if not exists comparisons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_a_id uuid not null references ocean_profiles(id) on delete cascade,
  profile_b_id uuid not null references ocean_profiles(id) on delete cascade,
  method text not null default 'general',
  ai_report text,
  created_at timestamptz default now()
);

-- Friend invite links (paid user → friend takes free test → results go to owner)
create table if not exists friend_invites (
  code text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_label text,            -- owner's display name shown to friend
  status text default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '7 days'
);

-- Stripe payment records
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_session_id text unique,
  stripe_status text not null default 'pending',
  amount integer not null,     -- in smallest currency unit (satang for THB: 4900 = ฿49)
  created_at timestamptz default now()
);

-- Quiz drafts for resumable paid quizzes
create table if not exists quiz_drafts (
  user_id uuid not null references auth.users(id) on delete cascade,
  test_type text not null check (test_type in ('120', '300')),
  answers jsonb not null default '{}',
  current_page integer not null default 0,
  response_times jsonb,
  page_durations jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, test_type)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table user_profiles enable row level security;
alter table ocean_profiles enable row level security;
alter table comparisons enable row level security;
alter table friend_invites enable row level security;
alter table payments enable row level security;
alter table quiz_drafts enable row level security;

-- user_profiles: own row only
create policy "own_user_profile" on user_profiles
  for all using (id = auth.uid());

-- ocean_profiles: own rows only
create policy "own_profiles" on ocean_profiles
  for all using (owner_id = auth.uid());

-- comparisons: own rows only
create policy "own_comparisons" on comparisons
  for all using (owner_id = auth.uid());

-- friend_invites: owner can manage; anyone can read (for /invite/[code] page)
create policy "own_invites_write" on friend_invites
  for all using (owner_id = auth.uid());
create policy "anyone_reads_invites" on friend_invites
  for select using (true);

-- payments: own rows only
create policy "own_payments" on payments
  for all using (user_id = auth.uid());

-- quiz_drafts: own rows only
create policy "own_drafts" on quiz_drafts
  for all using (user_id = auth.uid());

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_ocean_profiles_owner on ocean_profiles(owner_id);
create index if not exists idx_comparisons_owner on comparisons(owner_id);
create unique index if not exists idx_comparisons_unique_pair_method
  on comparisons(owner_id, profile_a_id, profile_b_id, method);
create index if not exists idx_payments_user on payments(user_id);
create index if not exists idx_quiz_drafts_user on quiz_drafts(user_id);
create index if not exists idx_friend_invites_code on friend_invites(code);
