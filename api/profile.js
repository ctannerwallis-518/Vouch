const { createClient } = require("@supabase/supabase-js");
const {
  fetchProfileOgMeta,
  readAppIndexHtml,
  injectOgMeta,
  buildOgHtml,
} = require("./_ogHelpers");

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
    const meta = await fetchProfileOgMeta(supabase, username);
    if (!meta) return res.status(404).send("Not found");

    const indexHtml = readAppIndexHtml();
    const html = indexHtml ? injectOgMeta(indexHtml, meta) : buildOgHtml(meta);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).send(html);
  } catch (e) {
    console.error("profile og error:", e);
    return res.status(500).send("Error");
  }
};
