const ENTITY = {
  song: "song",
  album: "album",
  artist: "musicArtist",
  podcast: "podcast",
};

function cleanAppleUrl(url) {
  if (!url) return null;
  return url.replace(/([?&])uo=\d+&?/g, "$1").replace(/[?&]$/, "");
}

function searchTerm(title, sub, type) {
  if (type === "song" && sub) return `${sub} ${title}`.trim();
  if (type === "album" && sub) return `${title} ${sub}`.trim();
  return [title, sub].filter(Boolean).join(" ").trim();
}

function pickResult(results, type, title, sub) {
  if (!results?.length) return null;
  const norm = (s) => String(s || "").toLowerCase().trim();
  const wantTitle = norm(title);
  const wantSub = norm(sub);

  const ranked = [...results].sort((a, b) => {
    const score = (r) => {
      let s = 0;
      const track = norm(r.trackName || r.collectionName || r.artistName);
      const artist = norm(r.artistName);
      if (wantTitle && track === wantTitle) s += 4;
      else if (wantTitle && track.includes(wantTitle)) s += 2;
      if (wantSub && artist === wantSub) s += 3;
      else if (wantSub && artist.includes(wantSub)) s += 1;
      return s;
    };
    return score(b) - score(a);
  });

  return ranked[0];
}

function resultUrl(result, type) {
  if (!result) return null;
  if (type === "artist") return cleanAppleUrl(result.artistLinkUrl);
  if (type === "album") return cleanAppleUrl(result.collectionViewUrl);
  if (type === "podcast") return cleanAppleUrl(result.collectionViewUrl);
  return cleanAppleUrl(result.trackViewUrl || result.collectionViewUrl);
}

function fallbackSearchUrl(title, sub, type, countryWeb) {
  const cc = countryWeb || "us";
  if (type === "podcast") {
    return `https://podcasts.apple.com/${cc}/search?term=${encodeURIComponent(title)}`;
  }
  const term = searchTerm(title, sub, type);
  return `https://music.apple.com/${cc}/search?term=${encodeURIComponent(term)}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { title, sub, type, country } = req.query;
  if (!title?.trim()) {
    return res.status(400).json({ error: "title required" });
  }

  const lookupType = ENTITY[type] ? type : "song";
  const entity = ENTITY[lookupType];
  const cc = String(country || "US").toUpperCase();
  const countryWeb = cc === "GB" ? "uk" : cc.toLowerCase();
  const term = searchTerm(title, sub, lookupType);

  try {
    const params = new URLSearchParams({
      term,
      entity,
      limit: "8",
      country: cc,
    });
    const response = await fetch(`https://itunes.apple.com/search?${params}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Vouch/1.0)" },
    });
    if (!response.ok) {
      return res.status(502).json({ url: fallbackSearchUrl(title, sub, lookupType, countryWeb) });
    }

    const json = await response.json();
    const chosen = pickResult(json?.results || [], lookupType, title, sub);
    const url = resultUrl(chosen, lookupType);
    if (url) return res.status(200).json({ url });

    return res.status(200).json({ url: fallbackSearchUrl(title, sub, lookupType, countryWeb) });
  } catch {
    return res.status(500).json({ error: "lookup failed" });
  }
}
