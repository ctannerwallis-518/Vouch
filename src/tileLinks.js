/** Where published tiles link when clicked — separate from metadata APIs (TMDB, Open Library). */

const MUSIC_CATS = new Set(["songs", "albums", "artists", "podcasts"]);

export function isMusicCategory(cat) {
  return MUSIC_CATS.has(cat);
}

export function justWatchCountry() {
  if (typeof navigator === "undefined") return "us";
  const code = (navigator.language || "en-US").split("-")[1]?.toLowerCase();
  const map = { us: "us", gb: "uk", uk: "uk", ca: "ca", au: "au", de: "de", fr: "fr", es: "es", it: "it", nl: "nl", br: "br", mx: "mx" };
  return map[code] || "us";
}

export function justWatchSearchUrl(title, yearOrSub = "") {
  const country = justWatchCountry();
  const year = String(yearOrSub || "").match(/^\d{4}$/) ? yearOrSub : "";
  const q = [title, year].filter(Boolean).join(" ");
  return `https://www.justwatch.com/${country}/search?q=${encodeURIComponent(q)}`;
}

export function libbySearchUrl(title, author = "") {
  const q = [title, author].filter(Boolean).join(" ");
  return `https://libbyapp.com/search/query-${encodeURIComponent(q)}`;
}

export function normalizeTileItem(item, catKey) {
  if (!item) return null;
  return {
    ...item,
    category: item.category || item._cat || catKey || "",
    title: item.title || "",
    sub: item.sub || item.subtitle || "",
    sourceUrl: item.sourceUrl || item.source_url || null,
  };
}

export function resolveTileLink(item, catKey) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile) return null;
  const cat = tile.category;

  if (cat === "movies" || cat === "shows") {
    return justWatchSearchUrl(tile.title, tile.sub);
  }
  if (cat === "books") {
    return libbySearchUrl(tile.title, tile.sub);
  }
  if (isMusicCategory(cat)) {
    return tile.sourceUrl;
  }
  return tile.sourceUrl;
}

export function tileIsClickable(item, catKey) {
  return !!resolveTileLink(item, catKey);
}

export function openTileLink(item, { catKey, onMusicOpen } = {}) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile) return false;
  const cat = tile.category;
  const url = resolveTileLink(tile, catKey);
  if (!url) return false;

  if (isMusicCategory(cat) && onMusicOpen) {
    onMusicOpen(url, tile.title, tile.sub, cat);
    return true;
  }
  window.open(url, "_blank");
  return true;
}
