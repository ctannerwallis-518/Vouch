-- Run this if backfill created claims but no badges (fixes ambiguous "title" column bug)
-- Safe to run anytime — replaces the backfill function only

create or replace function backfill_vouch_badges()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  board record;
  item record;
  title_row record;
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

  for title_row in
    select distinct category, item_id
    from vouch_title_claims
    where revoked_at is null
  loop
    perform recompute_badges_for_title(title_row.category, title_row.item_id);
  end loop;

  return json_build_object(
    'ok', true,
    'claims', (select count(*) from vouch_title_claims where revoked_at is null),
    'badges', (select count(*) from vouch_badges where revoked_at is null)
  );
end;
$$;

-- Recompute all badges now
select backfill_vouch_badges();
