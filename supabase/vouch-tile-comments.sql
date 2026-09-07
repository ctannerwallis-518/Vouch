-- Per-tile comments on published vouches
alter table vouch_board_items
  add column if not exists comment text;
