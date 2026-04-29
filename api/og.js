const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || "https://bkbpetcyyuyqudlvbojo.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  const username = (req.query.username || "").replace(/^@/, "");
  if (!username) {
    return res.status(400).send("Missing username");
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("username", username)
      .maybeSingle();

    if (!profile) return res.status(404).send("Not found");

    const { data: activeBoard } = await supabase
      .from("vouch_boards")
      .select("name, theme, vouch_board_items(poster, title, position)")
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .maybeSingle();

    const firstName = (profile.display_name || username).split(" ")[0];
    const boardName = activeBoard?.theme && activeBoard.theme !== "Other"
      ? activeBoard.theme
      : (activeBoard?.name || "Vouch Board");
    const coverItem = (activeBoard?.vouch_board_items || [])
      .sort((a, b) => a.position - b.position)[0];
    const posterUrl = coverItem?.poster || "https://vouch5.com/og-image.png";
    const title = `${firstName}'s Vouch — ${boardName}`;
    const description = coverItem
      ? `${firstName} is vouching for ${coverItem.title}. See what else they put their name behind.`
      : `See what ${firstName} is putting their name behind on Vouch.`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${posterUrl}" />
  <meta property="og:image:width" content="500" />
  <meta property="og:image:height" content="750" />
  <meta property="og:url" content="https://vouch5.com/@${username}" />
  <meta property="og:type" content="profile" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${posterUrl}" />
</head>
<body>
  <p>Redirecting to <a href="https://vouch5.com/@${username}">vouch5.com/@${username}</a>...</p>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.status(200).send(html);
  } catch (e) {
    console.error(e);
    res.status(500).send("Error");
  }
};
