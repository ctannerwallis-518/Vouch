const TMDB_KEY = process.env.TMDB_API_KEY || "24f3b03466f2f7db2d54a0f53607da4f";

function pickYoutubeKey(videos) {
  const yt = (videos || []).filter((v) => v.site === "YouTube" && v.key);
  const trailer = yt.find((v) => v.type === "Trailer");
  if (trailer) return trailer.key;
  const teaser = yt.find((v) => v.type === "Teaser");
  if (teaser) return teaser.key;
  const clip = yt.find((v) => v.type === "Clip");
  if (clip) return clip.key;
  return yt[0]?.key || null;
}

function looksLikeTmdbId(id) {
  const s = String(id || "").trim();
  if (!/^\d+$/.test(s)) return false;
  const n = parseInt(s, 10);
  return n > 0;
}

function yearFromSub(sub) {
  const match = String(sub || "").match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

function normTitle(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function pickSearchResult(results, title, year) {
  if (!results?.length) return null;
  const want = normTitle(title);
  const wantYear = year || "";

  const ranked = [...results].sort((a, b) => {
    const score = (r) => {
      let s = 0;
      const name = normTitle(r.title || r.name || "");
      if (name === want) s += 5;
      else if (name.includes(want) || want.includes(name)) s += 2;
      const date = (r.release_date || r.first_air_date || "").slice(0, 4);
      if (wantYear && date === wantYear) s += 4;
      else if (wantYear && date.startsWith(wantYear.slice(0, 3))) s += 1;
      return s;
    };
    return score(b) - score(a);
  });

  return ranked[0];
}

async function tmdbFetch(path) {
  const res = await fetch(`https://api.themoviedb.org/3/${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function videosForId(type, tmdbId) {
  const media = type === "shows" ? "tv" : "movie";
  const data = await tmdbFetch(`${media}/${tmdbId}/videos?api_key=${TMDB_KEY}&language=en-US`);
  return pickYoutubeKey(data?.results);
}

async function searchAndGetTrailer(type, title, year) {
  const media = type === "shows" ? "tv" : "movie";
  const data = await tmdbFetch(
    `search/${media}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=en-US&include_adult=false`
  );
  const picked = pickSearchResult(data?.results || [], title, year);
  if (!picked?.id) return null;
  return videosForId(type, picked.id);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { title, sub, cat, tmdbId } = req.query;
  if (!title?.trim()) {
    return res.status(400).json({ error: "title required" });
  }

  const type = cat === "shows" ? "shows" : "movies";
  const year = yearFromSub(sub);

  try {
    let youtubeKey = null;
    if (tmdbId && looksLikeTmdbId(tmdbId)) {
      youtubeKey = await videosForId(type, tmdbId);
    }
    if (!youtubeKey) {
      youtubeKey = await searchAndGetTrailer(type, title.trim(), year);
    }

    if (youtubeKey) {
      return res.status(200).json({ youtubeKey });
    }
    return res.status(404).json({ youtubeKey: null });
  } catch {
    return res.status(500).json({ error: "trailer lookup failed" });
  }
}
