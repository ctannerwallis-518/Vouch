import { supabase } from "./supabase";

export const RIBBON_STYLES = {
  gold:   { background: "#C9A820", color: "#111008", border: "1px solid #A07830" },
  silver: { background: "#C0C0C0", color: "#111008", border: "1px solid #8A8A88" },
  black:  { background: "#111008", color: "#C8C2B4", border: "1px solid #3a3830" },
};

export const BADGE_RIBBONS = {
  first_global: { label: "1st", style: RIBBON_STYLES.gold },
  first_circle: { label: "Circle 1st", style: RIBBON_STYLES.silver },
};

export function badgeKey(category, itemId) {
  return `${category}:${String(itemId)}`;
}

export async function badgesTablesReady() {
  const { error } = await supabase.from("vouch_badges").select("id", { head: true, count: "exact" });
  return !error;
}

export async function getBuddyIds(userId) {
  const { data } = await supabase.from("buddies")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq("status", "accepted");
  return (data || []).map(b => (b.requester_id === userId ? b.receiver_id : b.requester_id));
}

async function getActiveClaimsForTitle(category, itemId) {
  const { data, error } = await supabase.from("vouch_title_claims")
    .select("*")
    .eq("category", category)
    .eq("item_id", String(itemId))
    .is("revoked_at", null)
    .order("vouched_at", { ascending: true });
  if (error) return null;
  return data || [];
}

export async function recomputeBadgesForTitle(category, itemId) {
  const { error } = await supabase.rpc("recompute_badges_for_title", {
    p_category: category,
    p_item_id: String(itemId),
  });
  if (error) {
    // Fallback for older schema without RPC
    await recomputeBadgesForTitleClient(category, itemId);
  }
}

async function revokeBadgesForTitle(category, itemId, badgeType) {
  await supabase.from("vouch_badges").update({ revoked_at: new Date().toISOString() })
    .eq("category", category)
    .eq("item_id", String(itemId))
    .eq("badge_type", badgeType)
    .is("revoked_at", null);
}

async function recomputeBadgesForTitleClient(category, itemId) {
  const claims = await getActiveClaimsForTitle(category, itemId);
  if (claims === null) return;

  if (!claims.length) {
    await supabase.from("vouch_badges").update({ revoked_at: new Date().toISOString() })
      .eq("category", category)
      .eq("item_id", String(itemId))
      .is("revoked_at", null);
    return;
  }

  const globalWinner = claims[0];
  await revokeBadgesForTitle(category, itemId, "first_global");
  await supabase.from("vouch_badges").insert({
    user_id: globalWinner.user_id,
    badge_type: "first_global",
    category,
    item_id: String(itemId),
    title: globalWinner.title,
    claim_id: globalWinner.id,
  });

  await revokeBadgesForTitle(category, itemId, "first_circle");
  for (const claim of claims) {
    const buddyIds = await getBuddyIds(claim.user_id);
    const circleIds = new Set([claim.user_id, ...buddyIds]);
    const circleClaims = claims.filter(c => circleIds.has(c.user_id));
    if (circleClaims[0]?.user_id === claim.user_id) {
      await supabase.from("vouch_badges").insert({
        user_id: claim.user_id,
        badge_type: "first_circle",
        category,
        item_id: String(itemId),
        title: claim.title,
        claim_id: claim.id,
      });
    }
  }
}

export async function syncClaimsAfterPublish(userId, boardId, items, vouchedAt) {
  if (!(await badgesTablesReady())) return;

  const touched = new Set();
  for (const item of items) {
    const category = item.catKey || item.category;
    const itemId = String(item.id || item.item_id);
    if (!category || !itemId || !item.title) continue;

    const { data: existing } = await supabase.from("vouch_title_claims")
      .select("id")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("item_id", itemId)
      .is("revoked_at", null)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from("vouch_title_claims").insert({
        user_id: userId,
        board_id: boardId,
        category,
        item_id: itemId,
        title: item.title,
        vouched_at: vouchedAt || new Date().toISOString(),
      });
      if (!error) touched.add(badgeKey(category, itemId));
    }
  }

  for (const key of touched) {
    const sep = key.indexOf(":");
    await recomputeBadgesForTitle(key.slice(0, sep), key.slice(sep + 1));
  }
}

export async function revokeBoardItemClaims(boardId, userId, keepItems) {
  if (!(await badgesTablesReady())) return;

  const keepSet = new Set(
    keepItems.map(i => badgeKey(i.catKey || i.category, i.id || i.item_id))
  );
  const { data: boardClaims } = await supabase.from("vouch_title_claims")
    .select("*")
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .is("revoked_at", null);

  for (const claim of boardClaims || []) {
    if (keepSet.has(badgeKey(claim.category, claim.item_id))) continue;
    await supabase.from("vouch_title_claims").update({ revoked_at: new Date().toISOString() }).eq("id", claim.id);
    await recomputeBadgesForTitle(claim.category, claim.item_id);
  }
}

export async function revokeClaimsForBoard(boardId) {
  if (!(await badgesTablesReady())) return;

  const { data: claims } = await supabase.from("vouch_title_claims")
    .select("*")
    .eq("board_id", boardId)
    .is("revoked_at", null);

  const titles = new Set();
  for (const claim of claims || []) {
    await supabase.from("vouch_title_claims").update({ revoked_at: new Date().toISOString() }).eq("id", claim.id);
    titles.add(badgeKey(claim.category, claim.item_id));
  }
  for (const key of titles) {
    const sep = key.indexOf(":");
    await recomputeBadgesForTitle(key.slice(0, sep), key.slice(sep + 1));
  }
}

export async function loadBadgesForUser(userId) {
  const { data, error } = await supabase.from("vouch_badges")
    .select("badge_type, category, item_id")
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (error) return {};
  const map = {};
  for (const b of data || []) {
    const k = badgeKey(b.category, b.item_id);
    if (!map[k]) map[k] = [];
    if (!map[k].includes(b.badge_type)) map[k].push(b.badge_type);
  }
  return map;
}

export async function backfillVouchBadges() {
  if (!(await badgesTablesReady())) {
    console.warn("[Vouch badges] Database tables missing — run supabase/badges.sql in the Supabase SQL editor.");
    return { ok: false, reason: "no_tables" };
  }

  const { count: claimCount } = await supabase.from("vouch_title_claims").select("*", { count: "exact", head: true });
  const { count: badgeCount } = await supabase.from("vouch_badges").select("*", { count: "exact", head: true }).is("revoked_at", null);

  if ((claimCount || 0) > 0 && (badgeCount || 0) > 0) {
    return { ok: true, reason: "already_done", claims: claimCount, badges: badgeCount };
  }

  const { data, error } = await supabase.rpc("backfill_vouch_badges");
  if (!error && data?.ok) {
    return { ok: true, reason: "rpc", ...data };
  }

  // Client fallback if RPC not deployed yet (tables exist but functions missing)
  const { data: boards, error: boardsErr } = await supabase.from("vouch_boards")
    .select("id, user_id, published_at, vouch_board_items(*)")
    .not("published_at", "is", null)
    .order("published_at", { ascending: true });
  if (boardsErr) return { ok: false, reason: "backfill_failed", error: boardsErr.message };

  for (const board of boards || []) {
    const items = (board.vouch_board_items || []).sort((a, b) => a.position - b.position);
    for (const item of items) {
      const { data: existing } = await supabase.from("vouch_title_claims")
        .select("id")
        .eq("user_id", board.user_id)
        .eq("category", item.category)
        .eq("item_id", String(item.item_id))
        .is("revoked_at", null)
        .maybeSingle();
      if (!existing) {
        await supabase.from("vouch_title_claims").insert({
          user_id: board.user_id,
          board_id: board.id,
          category: item.category,
          item_id: String(item.item_id),
          title: item.title,
          vouched_at: board.published_at,
        });
      }
    }
  }

  const { data: allClaims } = await supabase.from("vouch_title_claims").select("category, item_id").is("revoked_at", null);
  const seen = new Set();
  for (const c of allClaims || []) {
    const k = badgeKey(c.category, c.item_id);
    if (seen.has(k)) continue;
    seen.add(k);
    await recomputeBadgesForTitle(c.category, c.item_id);
  }

  return { ok: true, reason: "client_fallback", titles: seen.size };
}
