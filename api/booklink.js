function rankIsbns(isbns) {
  const list = [...new Set((isbns || []).map(s => String(s).replace(/-/g, "")).filter(Boolean))];
  const is13 = list.filter(i => /^\d{13}$/.test(i));
  const score = (isbn) => {
    if (/^9780/.test(isbn)) return 0;
    if (/^9781/.test(isbn)) return 1;
    if (/^978/.test(isbn)) return 2;
    if (/^979/.test(isbn)) return 3;
    return 4;
  };
  return [...is13].sort((a, b) => score(a) - score(b) || a.localeCompare(b)).slice(0, 15);
}

function bnBookSearchUrl(title, author = "") {
  const q = [title, author].filter(Boolean).join(" ");
  return `https://www.barnesandnoble.com/search?q=${encodeURIComponent(q)}`;
}

function isResolvedBnUrl(url) {
  return !!url && /barnesandnoble\.com\/w\/[^/]+\/\d+/.test(url);
}

async function resolveBnProductUrl(isbn) {
  const clean = String(isbn || "").replace(/-/g, "");
  if (!/^\d{13}$/.test(clean)) return null;

  try {
    const res = await fetch(`https://www.barnesandnoble.com/w/?ean=${clean}`, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Vouch/1.0)" },
    });
    if (res.ok && isResolvedBnUrl(res.url)) {
      return res.url;
    }
  } catch { /* try next isbn */ }
  return null;
}

async function resolveBnFromIsbns(isbns) {
  const candidates = rankIsbns(isbns);
  for (let i = 0; i < candidates.length; i += 5) {
    const batch = candidates.slice(i, i + 5);
    const hits = await Promise.all(batch.map(async (isbn) => {
      const url = await resolveBnProductUrl(isbn);
      return url ? { url, isbn } : null;
    }));
    const hit = hits.find(Boolean);
    if (hit) return hit;
  }
  return null;
}

async function lookupIsbns(title, author) {
  const params = new URLSearchParams({
    limit: "3",
    fields: "title,isbn,author_name",
    language: "eng",
  });
  if (title && author) {
    params.set("title", String(title).trim());
    params.set("author", String(author).trim());
  } else {
    params.set("q", [title, author].filter(Boolean).join(" "));
  }

  const res = await fetch(`https://openlibrary.org/search.json?${params}`);
  if (!res.ok) return [];

  const json = await res.json();
  const isbns = [];
  for (const doc of json?.docs || []) {
    isbns.push(...(doc.isbn || []));
  }
  return rankIsbns(isbns);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { title, author, isbn } = req.query;
  if (!title?.trim() && !isbn?.trim()) {
    return res.status(400).json({ error: "title or isbn required" });
  }

  try {
    const seedIsbns = isbn ? rankIsbns([isbn]) : [];
    const lookedUp = title?.trim() ? await lookupIsbns(title, author) : [];
    const candidates = rankIsbns([...seedIsbns, ...lookedUp]);

    const resolved = await resolveBnFromIsbns(candidates);
    if (resolved) {
      return res.status(200).json(resolved);
    }

    if (title?.trim()) {
      return res.status(200).json({ url: bnBookSearchUrl(title, author), isbn: null });
    }
    return res.status(404).json({ url: null });
  } catch {
    return res.status(500).json({ error: "lookup failed" });
  }
}
