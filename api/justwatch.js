const SEARCH_QUERY = `query($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
  popularTitles(country: $country, first: $first, filter: $filter) {
    edges { node {
      objectType
      content(country: $country, language: $language) { originalReleaseYear fullPath }
    } }
  }
}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { title, year, type, country } = req.query;
  if (!title?.trim()) {
    return res.status(400).json({ error: "title required" });
  }

  const jwCountry = String(country || "US").toUpperCase();
  const wantType = type === "show" ? "SHOW" : "MOVIE";
  const yearNum = year && /^\d{4}$/.test(String(year)) ? parseInt(String(year), 10) : null;

  try {
    const response = await fetch("https://apis.justwatch.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; Vouch/1.0)",
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: {
          country: jwCountry,
          language: "en",
          first: 8,
          filter: { searchQuery: String(title).trim() },
        },
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "justwatch unavailable" });
    }

    const json = await response.json();
    const nodes = (json?.data?.popularTitles?.edges || [])
      .map(e => e.node)
      .filter(n => n?.objectType === wantType);

    const chosen =
      (yearNum ? nodes.find(n => n.content?.originalReleaseYear === yearNum) : null)
      || nodes[0];

    const fullPath = chosen?.content?.fullPath;
    if (!fullPath) {
      return res.status(404).json({ url: null });
    }

    return res.status(200).json({ url: `https://www.justwatch.com${fullPath}` });
  } catch {
    return res.status(500).json({ error: "lookup failed" });
  }
}
