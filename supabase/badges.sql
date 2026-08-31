-- Vouch badge system — run this entire file once in Supabase SQL editor
-- https://supabase.com/dashboard/project/bkbpetcyyuyqudlvbojo/sql

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

-- Server-side recompute (handles cross-user global badge transfers)
create or replace function recompute_badges_for_title(p_category text, p_item_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  winner record;
  claim record;
  circle_first uuid;
begin
  update vouch_badges
  set revoked_at = now()
  where category = p_category
    and item_id = p_item_id
    and revoked_at is null;

  select * into winner
  from vouch_title_claims
  where category = p_category
    and item_id = p_item_id
    and revoked_at is null
  order by vouched_at asc
  limit 1;

  if winner.id is not null then
    insert into vouch_badges (user_id, badge_type, category, item_id, title, claim_id)
    values (winner.user_id, 'first_global', p_category, p_item_id, winner.title, winner.id);
  end if;

  for claim in
    select *
    from vouch_title_claims
    where category = p_category
      and item_id = p_item_id
      and revoked_at is null
    order by vouched_at asc
  loop
    select c.user_id into circle_first
    from vouch_title_claims c
    where c.category = p_category
      and c.item_id = p_item_id
      and c.revoked_at is null
      and (
        c.user_id = claim.user_id
        or exists (
          select 1 from buddies b
          where b.status = 'accepted'
            and (
              (b.requester_id = claim.user_id and b.receiver_id = c.user_id)
              or (b.receiver_id = claim.user_id and b.requester_id = c.user_id)
            )
        )
      )
    order by c.vouched_at asc
    limit 1;

    if circle_first = claim.user_id then
      insert into vouch_badges (user_id, badge_type, category, item_id, title, claim_id)
      values (claim.user_id, 'first_circle', p_category, p_item_id, claim.title, claim.id);
    end if;
  end loop;
end;
$$;

-- Retroactive backfill from all published boards
create or replace function backfill_vouch_badges()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  board record;
  item record;
  title record;
begin
  for board in
    select id, user_id, published_at
    from vouch_boards
    where published_at is not null
    order by published_at asc
  loop
    for item in
      select category, item_id, title
      from vouch_board_items
      where board_id = board.id
      order by position
    loop
      insert into vouch_title_claims (user_id, board_id, category, item_id, title, vouched_at)
      values (
        board.user_id,
        board.id,
        item.category,
        item.item_id::text,
        item.title,
        board.published_at
      )
      on conflict (user_id, category, item_id) do nothing;
    end loop;
  end loop;

  for title in
    select distinct category, item_id
    from vouch_title_claims
    where revoked_at is null
  loop
    perform recompute_badges_for_title(title.category, title.item_id);
  end loop;

  return json_build_object(
    'ok', true,
    'claims', (select count(*) from vouch_title_claims where revoked_at is null),
    'badges', (select count(*) from vouch_badges where revoked_at is null)
  );
end;
$$;

grant execute on function recompute_badges_for_title(text, text) to authenticated;
grant execute on function backfill_vouch_badges() to authenticated;
