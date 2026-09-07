const fs = require("fs");
const path = require("path");

const SITE_ORIGIN = "https://vouch5.com";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;
const IMGPROXY_HOSTS = ["image.tmdb.org", "i.scdn.co", "covers.openlibrary.org", "cdn.last.fm"];

function escHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pickDisplayVouchBoard(boards) {
  const list = (boards || []).filter(Boolean);
  if (!list.length) return null;

  const hasItems = (b) => (b.vouch_board_items || []).length > 0;
  const byPublished = (a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0);

  const activePublished = list.filter((b) => b.is_active && b.published_at);
  if (activePublished.length) {
    const sorted = [...activePublished].sort(byPublished);
    return sorted.find(hasItems) || sorted[0];
  }

  const published = list.filter((b) => b.published_at).sort(byPublished);
  return published.find(hasItems) || published[0] || null;
}

function ogImageUrl(poster) {
  if (!poster) return DEFAULT_OG_IMAGE;
  try {
    const hostname = new URL(poster).hostname;
    if (IMGPROXY_HOSTS.some((h) => hostname.endsWith(h))) {
      return `${SITE_ORIGIN}/api/imgproxy?url=${encodeURIComponent(poster)}`;
    }
  } catch { /* fall through */ }
  if (poster.startsWith("http://") || poster.startsWith("https://")) return poster;
  return DEFAULT_OG_IMAGE;
}

async function fetchProfileOgMeta(supabase, username) {
  const clean = String(username || "").replace(/^@/, "").trim();
  if (!clean) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("username", clean)
    .maybeSingle();

  if (!profile) return null;

  const { data: boards } = await supabase
    .from("vouch_boards")
    .select("name, theme, published_at, is_active, vouch_board_items(poster, title, position)")
    .eq("user_id", profile.id)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  const activeBoard = pickDisplayVouchBoard(boards || []);
  const firstName = (profile.display_name || clean).split(" ")[0];
  const boardName = activeBoard?.theme && activeBoard.theme !== "Other"
    ? activeBoard.theme
    : (activeBoard?.name || "Vouch");
  const coverItem = (activeBoard?.vouch_board_items || [])
    .sort((a, b) => a.position - b.position)[0];
  const posterUrl = ogImageUrl(coverItem?.poster);
  const profileUrl = `${SITE_ORIGIN}/@${clean}`;
  const title = activeBoard
    ? `${firstName}'s Vouch — ${boardName}`
    : `${firstName}'s Vouch on Vouch5`;
  const description = coverItem
    ? `${firstName} is vouching for ${coverItem.title}. See what else they put their name behind.`
    : `See what ${firstName} is putting their name behind on Vouch5.`;

  return { username: clean, title, description, posterUrl, profileUrl, coverItem, boardName, firstName };
}

function readAppIndexHtml() {
  const candidates = [
    path.join(process.cwd(), "build", "index.html"),
    path.join(process.cwd(), "public", "index.html"),
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
    } catch { /* try next */ }
  }
  return null;
}

function injectOgMeta(html, meta) {
  const title = escHtml(meta.title);
  const description = escHtml(meta.description);
  const image = escHtml(meta.posterUrl);
  const url = escHtml(meta.profileUrl);

  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  out = out.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`
  );
  out = out.replace(
    /<meta property="og:type" content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="profile" />`
  );
  out = out.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${url}" />`
  );
  out = out.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${title}" />`
  );
  out = out.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${description}" />`
  );
  out = out.replace(
    /<meta property="og:image" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${image}" />`
  );
  out = out.replace(
    /<meta property="og:image:width" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:width" content="500" />`
  );
  out = out.replace(
    /<meta property="og:image:height" content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:height" content="750" />`
  );
  out = out.replace(
    /<meta name="twitter:url" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:url" content="${url}" />`
  );
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${title}" />`
  );
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${description}" />`
  );
  out = out.replace(
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${image}" />`
  );

  if (!out.includes('property="og:site_name"')) {
    out = out.replace(
      /<meta property="og:type"/i,
      `<meta property="og:site_name" content="Vouch5" />\n    <meta property="og:type"`
    );
  }

  return out;
}

function buildOgHtml(meta) {
  const title = escHtml(meta.title);
  const description = escHtml(meta.description);
  const image = escHtml(meta.posterUrl);
  const url = escHtml(meta.profileUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:site_name" content="Vouch5" />
  <meta property="og:type" content="profile" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="500" />
  <meta property="og:image:height" content="750" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${url}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <p>Redirecting to <a href="${url}">${url}</a>...</p>
</body>
</html>`;
}

module.exports = {
  SITE_ORIGIN,
  DEFAULT_OG_IMAGE,
  escHtml,
  pickDisplayVouchBoard,
  ogImageUrl,
  fetchProfileOgMeta,
  readAppIndexHtml,
  injectOgMeta,
  buildOgHtml,
};
