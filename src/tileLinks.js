/** Where published tiles link when clicked — separate from metadata APIs (TMDB, Open Library). */

const MUSIC_CATS = new Set(["songs", "albums", "artists", "podcasts"]);
const jwCache = new Map();
const bookCache = new Map();

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

function isDirectJustWatchUrl(url) {
  return !!url && url.includes("justwatch.com/") && !url.includes("/search");
}

export async function fetchJustWatchTitleUrl(title, yearOrSub, category, sourceUrl) {
  if (isDirectJustWatchUrl(sourceUrl)) return sourceUrl;

  const type = category === "shows" ? "show" : "movie";
  const year = String(yearOrSub || "").match(/^\d{4}$/) ? yearOrSub : "";
  const apiCountry = justWatchApiCountry();
  const cacheKey = `${apiCountry}:${type}:${title}:${year}`;
  const cached = jwCache.get(cacheKey);
  if (cached && isDirectJustWatchUrl(cached)) return cached;

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

  return justWatchSearchUrl(title, year);
}

export function pickBookIsbn(isbns) {
  const list = (isbns || []).map(String).map(s => s.replace(/-/g, "")).filter(Boolean);
  return list.find(i => /^978\d{10}$/.test(i))
    || list.find(i => /^979\d{10}$/.test(i))
    || list.find(i => /^\d{13}$/.test(i))
    || list.find(i => /^\d{10}$/.test(i))
    || null;
}

export function bnBookSearchUrl(title, author = "") {
  const q = [title, author].filter(Boolean).join(" ");
  return `https://www.barnesandnoble.com/search?q=${encodeURIComponent(q)}`;
}

function isDirectBookStoreUrl(url) {
  return !!url && /barnesandnoble\.com\/w\/[^/]+\/\d+/.test(url);
}

export async function fetchBookStoreUrl(title, author, isbn, sourceUrl) {
  if (isDirectBookStoreUrl(sourceUrl)) return sourceUrl;

  const cacheKey = `${title}:${author || ""}:${isbn || ""}`;
  const cached = bookCache.get(cacheKey);
  if (cached && isDirectBookStoreUrl(cached)) return cached;

  const params = new URLSearchParams({ title: String(title).trim() });
  if (author) params.set("author", String(author).trim());
  if (isbn) params.set("isbn", String(isbn).trim());

  try {
    const res = await fetch(`/api/booklink?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (data.url && isDirectBookStoreUrl(data.url)) {
        bookCache.set(cacheKey, data.url);
        return data.url;
      }
      if (data.url) return data.url;
    }
  } catch { /* fall through */ }

  return bnBookSearchUrl(title, author);
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
    if (isDirectJustWatchUrl(tile.sourceUrl)) return tile.sourceUrl;
    return justWatchSearchUrl(tile.title, tile.sub);
  }
  if (cat === "books") {
    if (isDirectBookStoreUrl(tile.sourceUrl)) return tile.sourceUrl;
    return bnBookSearchUrl(tile.title, tile.sub);
  }
  if (isMusicCategory(cat)) {
    return tile.sourceUrl;
  }
  return tile.sourceUrl;
}

export function tileActionHint(catKey) {
  const cat = catKey || "";
  if (cat === "movies" || cat === "shows") return "STREAM →";
  if (cat === "books") return "BUY →";
  if (isMusicCategory(cat)) return "LISTEN →";
  return null;
}

export function tileIsClickable(item, catKey) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile) return false;
  const cat = tile.category;
  if (cat === "movies" || cat === "shows" || cat === "books") return !!tile.title;
  return !!resolveTileLink(tile, catKey);
}

export async function openTileLink(item, { catKey, onMusicOpen } = {}) {
  const tile = normalizeTileItem(item, catKey);
  if (!tile) return false;
  const cat = tile.category;

  if (cat === "movies" || cat === "shows") {
    const url = await fetchJustWatchTitleUrl(tile.title, tile.sub, cat, tile.sourceUrl);
    window.open(url, "_blank");
    return true;
  }

  if (cat === "books") {
    const url = await fetchBookStoreUrl(tile.title, tile.sub, tile.isbn, tile.sourceUrl);
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
