-- Buddy comments on published vouch tiles (per tile, not author captions)

create table if not exists vouch_tile_buddy_comments (
  id uuid primary key default gen_random_uuid(),
  board_item_id uuid not null references vouch_board_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists vouch_tile_buddy_comments_board_item_idx
  on vouch_tile_buddy_comments (board_item_id, created_at);

create index if not exists vouch_tile_buddy_comments_user_idx
  on vouch_tile_buddy_comments (user_id);

-- Optional: author caption column from earlier migration (unused by app)
-- alter table vouch_board_items drop column if exists comment;

create or replace function vouch_board_item_owner(p_board_item_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.user_id
  from vouch_board_items i
  join vouch_boards b on b.id = i.board_id
  where i.id = p_board_item_id
  limit 1;
$$;

create or replace function is_buddy_with(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from buddies
    where status = 'accepted'
      and (
        (requester_id = auth.uid() and receiver_id = p_other_user_id)
        or (receiver_id = auth.uid() and requester_id = p_other_user_id)
      )
  );
$$;

alter table vouch_tile_buddy_comments enable row level security;

drop policy if exists "read vouch tile buddy comments" on vouch_tile_buddy_comments;
create policy "read vouch tile buddy comments"
  on vouch_tile_buddy_comments for select
  to authenticated
  using (
    auth.uid() = vouch_board_item_owner(board_item_id)
    or is_buddy_with(vouch_board_item_owner(board_item_id))
  );

drop policy if exists "buddies insert vouch tile comments" on vouch_tile_buddy_comments;
drop policy if exists "owner or buddy insert vouch tile comments" on vouch_tile_buddy_comments;
create policy "owner or buddy insert vouch tile comments"
  on vouch_tile_buddy_comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      auth.uid() = vouch_board_item_owner(board_item_id)
      or is_buddy_with(vouch_board_item_owner(board_item_id))
    )
  );

drop policy if exists "users delete own vouch tile comments" on vouch_tile_buddy_comments;
create policy "users delete own vouch tile comments"
  on vouch_tile_buddy_comments for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on vouch_tile_buddy_comments to authenticated;
