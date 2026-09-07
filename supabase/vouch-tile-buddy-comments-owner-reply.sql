-- Run this if you already applied vouch-tile-buddy-comments.sql with the old insert policy.
-- Lets the vouch owner reply on their own tiles (in addition to buddies).

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
