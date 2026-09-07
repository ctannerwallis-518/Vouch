import { isMusicCategory, normalizeTileItem } from "./tileLinks";

const previewCache = new Map();
let audio = null;
let currentKey = null;
let loadingKey = null;
const listeners = new Set();

function getAudio() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio();
    audio.preload = "none";
    audio.addEventListener("ended", () => notify());
    audio.addEventListener("pause", () => notify());
    audio.addEventListener("play", () => notify());
  }
  return audio;
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeMusicPreview(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function previewItemKey(item, catKey) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile) return "";
  return `${tile.category}:${tile.id || tile.title}:${tile.sub || ""}`;
}

export function getMusicPreviewState() {
  const el = getAudio();
  return {
    currentKey,
    loadingKey,
    playing: !!(el && currentKey && !el.paused && !el.ended),
  };
}

export function getCachedMusicPreview(item, catKey) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile) return undefined;
  const cacheKey = previewItemKey(tile, catKey);
  if (!previewCache.has(cacheKey)) return undefined;
  return previewCache.get(cacheKey);
}

export async function fetchMusicPreview(item, catKey) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile || !isMusicCategory(tile.category)) return null;

  const cacheKey = previewItemKey(tile, catKey);
  if (previewCache.has(cacheKey)) return previewCache.get(cacheKey);

  const params = new URLSearchParams({
    title: tile.title,
    cat: tile.category,
  });
  if (tile.sub) params.set("sub", tile.sub);
  if (tile.sourceUrl) params.set("sourceUrl", tile.sourceUrl);

  try {
    const res = await fetch(`/api/musicpreview?${params}`);
    if (!res.ok) {
      previewCache.set(cacheKey, null);
      return null;
    }
    const data = await res.json();
    const url = data.previewUrl || null;
    previewCache.set(cacheKey, url);
    return url;
  } catch {
    previewCache.set(cacheKey, null);
    return null;
  }
}

export async function toggleMusicPreview(item, catKey) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile || !isMusicCategory(tile.category)) return { ok: false, reason: "not_music" };

  const key = previewItemKey(tile, catKey);
  const el = getAudio();

  if (currentKey === key && el && !el.paused) {
    el.pause();
    notify();
    return { ok: true, playing: false };
  }

  if (el) el.pause();

  loadingKey = key;
  notify();

  const previewUrl = await fetchMusicPreview(tile, catKey);
  loadingKey = null;

  if (!previewUrl) {
    notify();
    return { ok: false, reason: "no_preview" };
  }

  currentKey = key;
  el.src = previewUrl;
  try {
    await el.play();
    notify();
    return { ok: true, playing: true };
  } catch {
    notify();
    return { ok: false, reason: "play_failed" };
  }
}

export function stopMusicPreview() {
  const el = getAudio();
  if (el) el.pause();
  currentKey = null;
  loadingKey = null;
  notify();
}
