function parseSpotifyId(sourceUrl) {
  const match = String(sourceUrl || "").match(/open\.spotify\.com\/(track|album|artist|show)\/([a-zA-Z0-9]+)/);
  return match ? { type: match[1], id: match[2] } : null;
}

async function spotifyToken() {
  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = await res.json();
  return json.access_token;
}

async function spotifyGet(path, token) {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function firstPreview(tracks) {
  for (const track of tracks || []) {
    if (track?.preview_url) return track.preview_url;
  }
  return null;
}

async function spotifyPreview(sourceUrl, catKey) {
  const parsed = parseSpotifyId(sourceUrl);
  if (!parsed) return null;

  let token;
  try {
    token = await spotifyToken();
  } catch {
    return null;
  }
  if (!token) return null;

  if (parsed.type === "track" || catKey === "songs") {
    const track = await spotifyGet(`/tracks/${parsed.id}`, token);
    return track?.preview_url || null;
  }

  if (parsed.type === "album" || catKey === "albums") {
    const album = await spotifyGet(`/albums/${parsed.id}/tracks?limit=10`, token);
    if (!album?.items?.length) return null;
    for (const item of album.items) {
      const track = await spotifyGet(`/tracks/${item.id}`, token);
      if (track?.preview_url) return track.preview_url;
    }
    return null;
  }

  if (parsed.type === "artist" || catKey === "artists") {
    const top = await spotifyGet(`/artists/${parsed.id}/top-tracks?market=US`, token);
    return firstPreview(top?.tracks);
  }

  return null;
}

function itunesSearchTerm(title, sub, catKey) {
  if (catKey === "songs" && sub) return `${sub} ${title}`.trim();
  if (catKey === "albums" && sub) return `${title} ${sub}`.trim();
  if (catKey === "artists") return title;
  if (catKey === "podcasts") return title;
  return [title, sub].filter(Boolean).join(" ").trim();
}

function itunesEntity(catKey) {
  if (catKey === "podcasts") return "podcastEpisode";
  return "song";
}

async function itunesPreview(title, sub, catKey, country = "US") {
  const term = itunesSearchTerm(title, sub, catKey);
  if (!term) return null;

  const params = new URLSearchParams({
    term,
    entity: itunesEntity(catKey),
    limit: "8",
    country: String(country || "US").toUpperCase(),
  });

  try {
    const res = await fetch(`https://itunes.apple.com/search?${params}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Vouch/1.0)" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    for (const result of json?.results || []) {
      if (result.previewUrl) return result.previewUrl;
    }
  } catch {
    return null;
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { title, sub, cat, sourceUrl, country } = req.query;
  if (!title?.trim()) {
    return res.status(400).json({ error: "title required" });
  }

  const catKey = cat || "songs";

  try {
    const spotify = await spotifyPreview(sourceUrl, catKey);
    if (spotify) return res.status(200).json({ previewUrl: spotify });

    const itunes = await itunesPreview(title, sub, catKey, country);
    if (itunes) return res.status(200).json({ previewUrl: itunes });

    return res.status(404).json({ previewUrl: null });
  } catch {
    return res.status(500).json({ error: "preview lookup failed" });
  }
}
