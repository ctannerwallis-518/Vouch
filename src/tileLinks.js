/** Where published tiles link when clicked — separate from metadata APIs (TMDB, Open Library). */

const MUSIC_CATS = new Set(["songs", "albums", "artists", "podcasts"]);
const jwCache = new Map();

export function isMusicCategory(cat) {
  return MUSIC_CATS.has(cat);
}

export function justWatchCountry() {
  if (typeof navigator === "undefined") return "us";
  const code = (navigator.language || "en-US").split("-")[1]?.toLowerCase();
  const map = { us: "us", gb: "uk", uk: "uk", ca: "ca", au: "au", de: "de", fr: "fr", es: "es", it: "it", nl: "nl", br: "br", mx: "mx" };
  return map[code] || "us";
}

export function justWatchApiCountry() {
  const web = justWatchCountry();
  const map = { us: "US", uk: "GB", ca: "CA", au: "AU", de: "DE", fr: "FR", es: "ES", it: "IT", nl: "NL", br: "BR", mx: "MX" };
  return map[web] || "US";
}

export function justWatchSearchUrl(title, yearOrSub = "") {
  const country = justWatchCountry();
  const year = String(yearOrSub || "").match(/^\d{4}$/) ? yearOrSub : "";
  const q = [title, year].filter(Boolean).join(" ");
  return `https://www.justwatch.com/${country}/search?q=${encodeURIComponent(q)}`;
}

export async function fetchJustWatchTitleUrl(title, yearOrSub, category) {
  const type = category === "shows" ? "show" : "movie";
  const year = String(yearOrSub || "").match(/^\d{4}$/) ? yearOrSub : "";
  const apiCountry = justWatchApiCountry();
  const cacheKey = `${apiCountry}:${type}:${title}:${year}`;
  if (jwCache.has(cacheKey)) return jwCache.get(cacheKey);

  const params = new URLSearchParams({
    title: String(title).trim(),
    type,
    country: apiCountry,
  });
  if (year) params.set("year", year);

  try {
    const res = await fetch(`/api/justwatch?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        jwCache.set(cacheKey, data.url);
        return data.url;
      }
    }
  } catch { /* fall through */ }

  const fallback = justWatchSearchUrl(title, year);
  jwCache.set(cacheKey, fallback);
  return fallback;
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
    if (tile.sourceUrl && tile.sourceUrl.includes("justwatch.com/") && !tile.sourceUrl.includes("/search")) {
      return tile.sourceUrl;
    }
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
  const tile = normalizeTileItem(item, catKey);
  if (!tile) return false;
  const cat = tile.category;
  if (cat === "movies" || cat === "shows") return !!tile.title;
  return !!resolveTileLink(tile, catKey);
}

export async function openTileLink(item, { catKey, onMusicOpen } = {}) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile) return false;
  const cat = tile.category;

  if (cat === "movies" || cat === "shows") {
    const url = await fetchJustWatchTitleUrl(tile.title, tile.sub, cat);
    window.open(url, "_blank");
    return true;
  }

  const url = resolveTileLink(tile, catKey);
  if (!url) return false;

  if (isMusicCategory(cat) && onMusicOpen) {
    onMusicOpen(url, tile.title, tile.sub, cat);
    return true;
  }
  window.open(url, "_blank");
  return true;
}
