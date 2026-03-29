export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url" });

  // Only allow known image hosts
  const allowed = ["image.tmdb.org", "i.scdn.co", "covers.openlibrary.org", "cdn.last.fm"];
  let hostname;
  try { hostname = new URL(url).hostname; } catch { return res.status(400).json({ error: "Invalid url" }); }
  if (!allowed.some(h => hostname.endsWith(h))) return res.status(403).json({ error: "Host not allowed" });

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch image" });
  }
}
