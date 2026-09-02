import { supabase } from "./supabase";
import { RIBBON_STYLES } from "./badges";

export const STREAK_WINDOW_DAYS = 14;
export const SCOUT_MIN_GLOBAL = 3;
export const REGULAR_MIN_VOUCHES = 5;
export const REGULAR_GOLD_MIN = 10;
const FOUNDING_YEAR = 2026;

export const USER_BADGE_RIBBONS = {
  founding: { label: "2026", style: RIBBON_STYLES.cream, title: "Founding Voucher" },
  scout: { label: "SCOUT", style: RIBBON_STYLES.gold, title: "Scout" },
};

export function vouchCountRibbonStyle(count) {
  if (count >= REGULAR_GOLD_MIN) return RIBBON_STYLES.gold;
  return RIBBON_STYLES.cream;
}

export function streakRibbonStyle(streak) {
  if (streak >= 8) return RIBBON_STYLES.gold;
  if (streak >= 4) return RIBBON_STYLES.cream;
  return RIBBON_STYLES.black;
}

export function computePublishStreak(dates) {
  const sorted = [...(dates || [])]
    .map(d => new Date(d).getTime())
    .filter(t => !Number.isNaN(t))
    .sort((a, b) => a - b);
  if (sorted.length < 2) return sorted.length ? 1 : 0;

  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const gapDays = (sorted[i] - sorted[i - 1]) / 86400000;
    if (gapDays <= STREAK_WINDOW_DAYS) streak++;
    else break;
  }
  return streak;
}

export function isFoundingMember(createdAt) {
  if (!createdAt) return false;
  return new Date(createdAt).getFullYear() === FOUNDING_YEAR;
}

export function countGlobalFirsts(itemBadgeMap) {
  return Object.values(itemBadgeMap || {}).filter(badges => badges.includes("first_global")).length;
}

export function buildUserBadges({ createdAt, publishedDates, itemBadgeMap }) {
  const badges = [];
  if (isFoundingMember(createdAt)) badges.push({ type: "founding" });

  const publishCount = (publishedDates || []).length;
  if (publishCount >= REGULAR_MIN_VOUCHES) badges.push({ type: "vouches", value: publishCount });

  const streak = computePublishStreak(publishedDates);
  if (streak >= 2) badges.push({ type: "streak", value: streak });

  if (countGlobalFirsts(itemBadgeMap) >= SCOUT_MIN_GLOBAL) badges.push({ type: "scout" });

  return badges;
}

export function userBadgeExplain(type, ownerName, value) {
  const who = ownerName || "They";
  if (type === "founding") {
    return `${who} joined Vouch in 2026 — here since the start.`;
  }
  if (type === "streak") {
    const n = value || 2;
    return `${who} has published ${n} consecutive Vouches, each within ${STREAK_WINDOW_DAYS} days of the last.`;
  }
  if (type === "vouches") {
    const n = value || REGULAR_MIN_VOUCHES;
    return `${who} has published ${n} Vouches — a regular on Vouch.`;
  }
  if (type === "scout") {
    return `${who} has been first to Vouch globally for ${SCOUT_MIN_GLOBAL}+ picks — a true Scout.`;
  }
  return "";
}

export function userBadgeRibbon(type, value) {
  if (type === "streak") {
    return {
      label: String(value || ""),
      style: streakRibbonStyle(value || 2),
      title: `${value || 2}-Vouch streak`,
    };
  }
  if (type === "vouches") {
    return {
      label: String(value || ""),
      style: vouchCountRibbonStyle(value || REGULAR_MIN_VOUCHES),
      title: `${value || REGULAR_MIN_VOUCHES} published Vouches`,
    };
  }
  return USER_BADGE_RIBBONS[type] || null;
}

export function userBadgeTailColor(type, value) {
  if (type === "founding") return "#A8A296";
  if (type === "scout") return "#9A7820";
  if (type === "streak") {
    if ((value || 0) >= 8) return "#9A7820";
    if ((value || 0) >= 4) return "#A8A296";
    return "#111008";
  }
  if (type === "vouches") {
    return (value || 0) >= REGULAR_GOLD_MIN ? "#9A7820" : "#A8A296";
  }
  return "#111008";
}

export async function loadUserBadges(userId, itemBadgeMap) {
  if (!userId) return [];

  const [{ data: profile }, { data: boards }] = await Promise.all([
    supabase.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
    supabase.from("vouch_boards").select("published_at").eq("user_id", userId).not("published_at", "is", null),
  ]);

  return buildUserBadges({
    createdAt: profile?.created_at,
    publishedDates: (boards || []).map(b => b.published_at),
    itemBadgeMap: itemBadgeMap || {},
  });
}
