/** Pick the vouch board to show on a profile (handles duplicate is_active rows). */
export function pickDisplayVouchBoard(boards) {
  const list = (boards || []).filter(Boolean);
  if (!list.length) return null;

  const hasItems = (b) => (b.vouch_board_items || []).length > 0;
  const byPublished = (a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0);

  const activePublished = list.filter((b) => b.is_active && b.published_at);
  if (activePublished.length) {
    const sorted = [...activePublished].sort(byPublished);
    return sorted.find(hasItems) || sorted[0];
  }

  const published = list.filter((b) => b.published_at).sort(byPublished);
  return published.find(hasItems) || published[0] || null;
}

export async function fetchDisplayVouchBoard(supabase, userId) {
  const { data, error } = await supabase
    .from("vouch_boards")
    .select("*, vouch_board_items(*)")
    .eq("user_id", userId)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) return { board: null, boards: [], error, hasDuplicateActive: false };

  const boards = data || [];
  const board = pickDisplayVouchBoard(boards);
  const activePublished = boards.filter((b) => b.is_active && b.published_at);
  return {
    board,
    boards,
    error: null,
    hasDuplicateActive: activePublished.length > 1,
  };
}

/** Keep one active published board; demote extra is_active rows (data repair). */
export async function healDuplicateActiveBoards(supabase, userId, keepBoardId) {
  if (!userId || !keepBoardId) return;
  await supabase
    .from("vouch_boards")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true)
    .neq("id", keepBoardId);
  await supabase
    .from("vouch_boards")
    .update({ is_active: true })
    .eq("id", keepBoardId);
}
