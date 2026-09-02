function pickIsbn(isbns) {
  const list = (isbns || []).map(String).map(s => s.replace(/-/g, "")).filter(Boolean);
  return list.find(i => /^978\d{10}$/.test(i))
    || list.find(i => /^979\d{10}$/.test(i))
    || list.find(i => /^\d{13}$/.test(i))
    || list.find(i => /^\d{10}$/.test(i))
    || null;
}

function bnBookUrl(isbn) {
  const clean = String(isbn || "").replace(/-/g, "");
  if (!clean) return null;
  if (/^\d{13}$/.test(clean)) {
    return `https://www.barnesandnoble.com/w/?ean=${clean}`;
  }
  return null;
}

function bnBookSearchUrl(title, author = "") {
  const q = [title, author].filter(Boolean).join(" ");
  return `https://www.barnesandnoble.com/search?q=${encodeURIComponent(q)}`;
}

async function lookupIsbn(title, author) {
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
  if (!res.ok) return null;

  const json = await res.json();
  for (const doc of json?.docs || []) {
    const isbn = pickIsbn(doc.isbn);
    if (isbn) return isbn;
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { title, author, isbn } = req.query;
  if (!title?.trim() && !isbn?.trim()) {
    return res.status(400).json({ error: "title or isbn required" });
  }

  try {
    const directIsbn = pickIsbn(isbn ? [isbn] : []);
    const resolved = directIsbn || await lookupIsbn(title, author);
    const url = bnBookUrl(resolved) || (title?.trim() ? bnBookSearchUrl(title, author) : null);
    if (!url) return res.status(404).json({ url: null });
    return res.status(200).json({ url, isbn: resolved || null });
  } catch {
    return res.status(500).json({ error: "lookup failed" });
  }
}
