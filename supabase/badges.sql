-- Vouch badge system: run once in Supabase SQL editor
-- Tracks who vouched for a title first (global + circle), retroactive via client backfill

create table if not exists vouch_title_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid references vouch_boards(id) on delete set null,
  category text not null,
  item_id text not null,
  title text not null,
  vouched_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, category, item_id)
);

create table if not exists vouch_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_type text not null check (badge_type in ('first_global', 'first_circle')),
  category text not null,
  item_id text not null,
  title text not null,
  claim_id uuid references vouch_title_claims(id) on delete set null,
  earned_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists vouch_title_claims_title_idx
  on vouch_title_claims (category, item_id)
  where revoked_at is null;

create index if not exists vouch_badges_user_idx
  on vouch_badges (user_id)
  where revoked_at is null;

create index if not exists vouch_badges_title_idx
  on vouch_badges (category, item_id, badge_type)
  where revoked_at is null;

alter table vouch_title_claims enable row level security;
alter table vouch_badges enable row level security;

drop policy if exists "vouch_claims_public_read" on vouch_title_claims;
create policy "vouch_claims_public_read" on vouch_title_claims
  for select using (true);

drop policy if exists "vouch_claims_auth_write" on vouch_title_claims;
create policy "vouch_claims_auth_write" on vouch_title_claims
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "vouch_badges_public_read" on vouch_badges;
create policy "vouch_badges_public_read" on vouch_badges
  for select using (true);

drop policy if exists "vouch_badges_auth_write" on vouch_badges;
create policy "vouch_badges_auth_write" on vouch_badges
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
