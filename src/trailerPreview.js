import { normalizeTileItem } from "./tileLinks";

const trailerCache = new Map();

export function isFilmCategory(catKey) {
  return catKey === "movies" || catKey === "shows";
}

export function trailerItemKey(item, catKey) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile) return "";
  return `${tile.category}:${tile.id || tile.title}:${tile.sub || ""}`;
}

export function getCachedTrailer(item, catKey) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile) return undefined;
  const cacheKey = trailerItemKey(tile, catKey);
  if (!trailerCache.has(cacheKey)) return undefined;
  return trailerCache.get(cacheKey);
}

export async function fetchTrailer(item, catKey) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile || !isFilmCategory(tile.category)) return null;

  const cacheKey = trailerItemKey(tile, catKey);
  if (trailerCache.has(cacheKey)) return trailerCache.get(cacheKey);

  const params = new URLSearchParams({
    title: tile.title,
    cat: tile.category,
  });
  if (tile.sub) params.set("sub", tile.sub);
  if (tile.id) params.set("tmdbId", String(tile.id));

  try {
    const res = await fetch(`/api/trailer?${params}`);
    if (!res.ok) {
      trailerCache.set(cacheKey, null);
      return null;
    }
    const data = await res.json();
    const key = data.youtubeKey || null;
    trailerCache.set(cacheKey, key);
    return key;
  } catch {
    trailerCache.set(cacheKey, null);
    return null;
  }
}

export function tileMediaActionStyle(size = "md", label = "preview") {
  const inset = size === "sm" ? 4 : 6;
  const bottom = size === "sm" ? 26 : size === "lg" ? 36 : 30;
  const isLong = label === "trailer";
  const fontSize = size === "sm" ? (isLong ? 5.5 : 6.5) : size === "lg" ? (isLong ? 7.5 : 8.5) : (isLong ? 6.5 : 7.5);
  const iconSize = size === "sm" ? 7 : size === "lg" ? 9 : 8;
  const padY = size === "sm" ? 3 : size === "lg" ? 5 : 4;
  const padX = size === "sm" ? 4 : size === "lg" ? 8 : 6;
  const gap = size === "sm" ? 3 : 4;
  return { inset, bottom, fontSize, iconSize, padY, padX, gap };
}
