import { supabase } from "./supabase";

export const RIBBON_STYLES = {
  gold:   { background: "linear-gradient(180deg, #D4B030 0%, #C9A820 60%, #9A7820 100%)", color: "#111008" },
  silver: { background: "linear-gradient(180deg, #E0E0E0 0%, #C0C0C0 60%, #909090 100%)", color: "#111008" },
  cream:  { background: "linear-gradient(180deg, #E8E2D4 0%, #C8C2B4 60%, #A8A296 100%)", color: "#111008" },
  black:  { background: "#111008", color: "#C8C2B4" },
};

export const BADGE_RIBBONS = {
  first_global: { label: "1st", style: RIBBON_STYLES.gold, title: "First on Vouch globally" },
  first_circle: { label: "1st", style: RIBBON_STYLES.silver, title: "First in friend group" },
};

export function primaryBadge(badges) {
  if (!badges?.length) return [];
  if (badges.includes("first_global")) return ["first_global"];
  if (badges.includes("first_circle")) return ["first_circle"];
  return [];
}

export function badgeKey(category, itemId) {
  return `${category}:${String(itemId)}`;
}

export function ownerBadgeKey(userId, category, itemId) {
  return `${userId}:${badgeKey(category, itemId)}`;
}

export function badgesForOwner(allMap, userId, category, itemId) {
  if (!allMap || !userId) return [];
  return allMap[ownerBadgeKey(userId, category, itemId)] || [];
}

export function itemBadgesForOwner(allMap, userId) {
  if (!allMap || !userId) return {};
  const prefix = `${userId}:`;
  const out = {};
  Object.entries(allMap).forEach(([k, v]) => {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  });
  return out;
}

export async function loadBadgesForUsers(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase.from("vouch_badges")
    .select("user_id, badge_type, category, item_id")
    .in("user_id", ids)
    .is("revoked_at", null);
  if (error) return {};
  const map = {};
  for (const b of data || []) {
    const k = ownerBadgeKey(b.user_id, b.category, b.item_id);
    if (!map[k]) map[k] = [];
    if (!map[k].includes(b.badge_type)) map[k].push(b.badge_type);
  }
  return map;
}

export async function loadTitleBadges(pairs) {
  const unique = [...new Map((pairs || []).filter(p => p.category && p.item_id).map(p => [badgeKey(p.category, p.item_id), p])).values()];
  if (!unique.length) return {};
  const map = {};
  await Promise.all(unique.map(async (p) => {
    const { data } = await supabase.from("vouch_badges")
      .select("badge_type")
      .eq("category", p.category)
      .eq("item_id", String(p.item_id))
      .is("revoked_at", null);
    const types = [...new Set((data || []).map(b => b.badge_type))];
    if (types.length) map[badgeKey(p.category, p.item_id)] = types;
  }));
  return map;
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

/** Group Vouch: one attribution + silver ribbon (circle context). */
export async function enrichGroupVouchItems(circleIds, items) {
  if (!items?.length) return items;
  const circleSet = new Set((circleIds || []).filter(Boolean));
  const unique = [...new Map(items.map(i => [badgeKey(i.category, i.item_id), i])).values()];
  const meta = {};

  await Promise.all(unique.map(async (item) => {
    const key = badgeKey(item.category, item.item_id);
    const claims = await getActiveClaimsForTitle(item.category, item.item_id);
    if (!claims?.length) {
      meta[key] = { firstVouchedBy: null, groupBadge: [] };
      return;
    }
    const globalFirst = claims[0];
    const circleFirst = claims.find(c => circleSet.has(c.user_id));
    const pick =
      globalFirst && circleSet.has(globalFirst.user_id)
        ? globalFirst
        : circleFirst || null;
    meta[key] = {
      firstVouchedByUserId: pick?.user_id || null,
      groupBadge: pick ? ["first_circle"] : [],
    };
  }));

  const nameIds = [...new Set(Object.values(meta).map(m => m.firstVouchedByUserId).filter(Boolean))];
  const nameMap = {};
  if (nameIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", nameIds);
    (profiles || []).forEach(p => { nameMap[p.id] = p.display_name; });
  }

  return items.map(item => {
    const m = meta[badgeKey(item.category, item.item_id)] || {};
    return {
      ...item,
      groupBadge: m.groupBadge || [],
      firstVouchedBy: m.firstVouchedByUserId ? (nameMap[m.firstVouchedByUserId] || null) : null,
    };
  });
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

  // Claims exist but badges missing (e.g. backfill RPC bug) — recompute only
  if ((claimCount || 0) > 0 && (badgeCount || 0) === 0) {
    const { data: allClaims } = await supabase.from("vouch_title_claims").select("category, item_id").is("revoked_at", null);
    const seen = new Set();
    for (const c of allClaims || []) {
      const k = badgeKey(c.category, c.item_id);
      if (seen.has(k)) continue;
      seen.add(k);
      await recomputeBadgesForTitle(c.category, c.item_id);
    }
    const { count: after } = await supabase.from("vouch_badges").select("*", { count: "exact", head: true }).is("revoked_at", null);
    return { ok: true, reason: "recompute_only", titles: seen.size, badges: after };
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
