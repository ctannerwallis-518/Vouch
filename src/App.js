import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const TMDB = "24f3b03466f2f7db2d54a0f53607da4f";

const CATEGORIES = [
  { key: "movies",  label: "Film"       },
  { key: "albums",  label: "Albums"     },
  { key: "artists", label: "Artists"    },
  { key: "songs",   label: "Songs"      },
  { key: "books",   label: "Books"      },
  { key: "shows",   label: "Television" },
];

const EMPTY_BOARD = {
  movies: [], albums: [], artists: [], songs: [], books: [], shows: [],
};

const T = {
  bg:        "#C8C2B4",
  ink:       "#111008",
  inkMid:    "#3a3830",
  inkLight:  "#7a7568",
  inkFaint:  "#a09890",
  paperDark: "#b3ada0",
};

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,600;1,700&family=Spectral+SC:wght@300;400;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body, #root { font-family: 'Spectral', serif; background: ${T.bg}; color: ${T.ink}; -webkit-font-smoothing: antialiased; }

    body::before {
      content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.04;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 180px 180px;
    }

    .app { min-height: 100vh; background: ${T.bg}; }

    /* MASTHEAD */
    .masthead { background: ${T.bg}; border-bottom: 3px double ${T.ink}; user-select: none; }
    .masthead-meta {
      display: flex; justify-content: space-between; align-items: center;
      padding: 7px 28px; border-bottom: 1px solid ${T.ink};
      font-family: 'Spectral SC', serif; font-size: 9px; letter-spacing: 0.18em;
      color: ${T.inkMid}; text-transform: uppercase;
    }
    .masthead-meta .clickable { cursor: pointer; }
    .masthead-meta .clickable:hover { color: ${T.ink}; }
    .masthead-meta-stars { font-size: 7px; letter-spacing: 0.3em; opacity: 0.6; }

    .masthead-nameplate { text-align: center; padding: 18px 28px 6px; cursor: pointer; }
    .nameplate-word {
      font-family: 'Times New Roman', Times, serif; font-weight: 900;
      font-size: clamp(58px, 11vw, 104px); letter-spacing: 0.02em;
      line-height: 0.92; color: ${T.ink};
    }

    .masthead-rule-ornament { text-align: center; font-family: 'Spectral', serif; font-size: 11px; letter-spacing: 0.6em; color: ${T.inkLight}; padding: 4px 0 2px; }
    .masthead-tagline { text-align: center; font-family: 'Spectral', serif; font-style: italic; font-weight: 300; font-size: 12.5px; letter-spacing: 0.12em; color: ${T.inkLight}; padding-bottom: 12px; }



    /* NAV */
    .nav { display: flex; overflow-x: auto; scrollbar-width: none; border-top: 1px solid ${T.ink}; }
    .nav::-webkit-scrollbar { display: none; }
    .nav-btn {
      flex-shrink: 0; padding: 9px 22px; font-family: 'Spectral SC', serif; font-size: 10px;
      font-weight: 600; letter-spacing: 0.22em; color: ${T.inkMid}; background: transparent;
      border: none; border-right: 1px solid ${T.paperDark}; cursor: pointer;
      transition: background 0.14s, color 0.14s; white-space: nowrap;
    }
    .nav-btn:hover  { background: ${T.paperDark}; color: ${T.ink}; }
    .nav-btn.active { background: ${T.ink}; color: ${T.bg}; }

    /* PAGE */
    .page { max-width: 1380px; margin: 0 auto; padding: 0 28px 80px; }

    .board-header { display: flex; justify-content: space-between; align-items: flex-end; padding: 30px 0 18px; border-bottom: 1px solid ${T.ink}; margin-bottom: 32px; }
    .board-name { font-family: 'Spectral', serif; font-weight: 700; font-size: 26px; }
    .board-sub  { font-family: 'Spectral SC', serif; font-size: 10px; letter-spacing: 0.16em; color: ${T.inkLight}; margin-top: 5px; }

    .btn { font-family: 'Spectral SC', serif; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; padding: 8px 20px; border: 1px solid ${T.ink}; cursor: pointer; transition: background 0.14s, color 0.14s; }
    .btn-solid { background: ${T.ink}; color: ${T.bg}; }
    .btn-solid:hover { background: ${T.inkMid}; }
    .btn-ghost { background: transparent; color: ${T.ink}; }
    .btn-ghost:hover { background: ${T.ink}; color: ${T.bg}; }

    .ornament { text-align: center; font-family: 'Spectral', serif; font-size: 13px; letter-spacing: 0.5em; color: ${T.inkFaint}; margin: 4px 0 28px; }

    /* VOUCH SECTION (top 5 across all categories) */
    .vouch-section {
      margin-bottom: 52px;
      border: 2px solid ${T.ink};
      background: rgba(17,16,8,0.04);
      padding: 24px 24px 28px;
    }
    .vouch-section-header {
      display: flex; align-items: baseline; gap: 14px;
      border-bottom: 2px solid ${T.ink}; padding-bottom: 10px; margin-bottom: 22px;
    }
    .vouch-section-label { font-family: 'Spectral SC', serif; font-weight: 700; font-size: 20px; letter-spacing: 0.08em; }
    .vouch-section-sub   { font-family: 'Spectral', serif; font-style: italic; font-size: 11px; color: ${T.inkLight}; }
    .vouch-section-add   { margin-left: auto; font-family: 'Spectral SC', serif; font-size: 9.5px; font-weight: 600; letter-spacing: 0.2em; padding: 4px 14px; border: 1px solid ${T.ink}; background: transparent; color: ${T.inkMid}; cursor: pointer; transition: all 0.14s; }
    .vouch-section-add:hover { background: ${T.ink}; color: ${T.bg}; }

    /* LARGE CARDS (Vouch section) */
    .cards-row-large { display: flex; gap: 12px; flex-wrap: nowrap; }
    .card-large { flex: 1; min-width: 0; cursor: pointer; }
    .card-large:hover .card-poster-large { transform: translateY(-4px); box-shadow: 0 10px 28px rgba(17,16,8,0.2); }
    .card-poster-large { width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block; border: 1px solid ${T.paperDark}; transition: transform 0.2s, box-shadow 0.2s; }
    .card-poster-placeholder-large { width: 100%; aspect-ratio: 2/3; background: ${T.paperDark}; border: 1px solid ${T.paperDark}; display: flex; align-items: center; justify-content: center; font-family: 'Spectral', serif; font-style: italic; font-size: 12px; color: ${T.inkLight}; text-align: center; padding: 14px; }
    .card-cat-badge { display: inline-block; font-family: 'Spectral SC', serif; font-size: 8.5px; letter-spacing: 0.2em; color: ${T.inkFaint}; margin-top: 8px; text-transform: uppercase; }
    .card-title-large   { font-family: 'Spectral', serif; font-weight: 600; font-size: 13px; line-height: 1.35; margin-top: 3px; }
    .card-sub-large     { font-family: 'Spectral SC', serif; font-size: 9.5px; letter-spacing: 0.06em; color: ${T.inkLight}; margin-top: 2px; }
    .card-comment-large { font-family: 'Spectral', serif; font-style: italic; font-size: 10.5px; line-height: 1.5; color: ${T.inkMid}; margin-top: 5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .slot-empty-large { flex: 1; min-width: 0; aspect-ratio: 2/3; border: 1px dashed ${T.ink}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.14s, background 0.14s; }
    .slot-empty-large:hover { background: rgba(17,16,8,0.04); }
    .slot-empty-inner { text-align: center; font-family: 'Spectral SC', serif; font-size: 9.5px; letter-spacing: 0.18em; color: ${T.inkFaint}; }
    .slot-empty-plus  { display: block; font-size: 22px; margin-bottom: 6px; color: ${T.paperDark}; }

    /* MENTION SECTIONS (per-category, smaller) */
    .cat-section { margin-bottom: 44px; }
    .cat-header { display: flex; align-items: baseline; gap: 14px; border-bottom: 2px solid ${T.ink}; padding-bottom: 10px; margin-bottom: 18px; }
    .cat-label { font-family: 'Spectral SC', serif; font-weight: 700; font-size: 17px; letter-spacing: 0.08em; }
    .cat-sublabel { font-family: 'Spectral', serif; font-style: italic; font-size: 11px; color: ${T.inkLight}; }
    .cat-count { font-family: 'Spectral SC', serif; font-size: 9.5px; letter-spacing: 0.18em; color: ${T.inkFaint}; }
    .cat-add { margin-left: auto; font-family: 'Spectral SC', serif; font-size: 9.5px; font-weight: 600; letter-spacing: 0.2em; padding: 4px 14px; border: 1px solid ${T.inkLight}; background: transparent; color: ${T.inkMid}; cursor: pointer; transition: all 0.14s; }
    .cat-add:hover { border-color: ${T.ink}; color: ${T.ink}; }

    /* SMALLER CARDS (Mentions) */
    .cards-row { display: flex; gap: 14px; flex-wrap: wrap; }
    .card { width: 150px; flex-shrink: 0; cursor: pointer; }
    .card:hover .card-poster { transform: translateY(-3px); box-shadow: 0 7px 20px rgba(17,16,8,0.16); }
    .card-poster { width: 150px; height: 206px; object-fit: cover; display: block; border: 1px solid ${T.paperDark}; transition: transform 0.2s, box-shadow 0.2s; }
    .card-poster-placeholder { width: 150px; height: 206px; background: ${T.paperDark}; border: 1px solid ${T.paperDark}; display: flex; align-items: center; justify-content: center; font-family: 'Spectral', serif; font-style: italic; font-size: 11px; color: ${T.inkLight}; text-align: center; padding: 10px; }
    .card-title   { font-family: 'Spectral', serif; font-weight: 600; font-size: 12.5px; line-height: 1.35; margin-top: 7px; }
    .card-sub     { font-family: 'Spectral SC', serif; font-size: 9.5px; letter-spacing: 0.06em; color: ${T.inkLight}; margin-top: 2px; }
    .card-comment { font-family: 'Spectral', serif; font-style: italic; font-size: 10.5px; line-height: 1.5; color: ${T.inkMid}; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .slot-empty-sm { width: 150px; height: 206px; border: 1px dashed ${T.paperDark}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.14s, background 0.14s; flex-shrink: 0; }
    .slot-empty-sm:hover { border-color: ${T.ink}; background: rgba(17,16,8,0.03); }

    /* LIGHTBOX */
    .lb-overlay { position: fixed; inset: 0; background: rgba(17,16,8,0.96); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .lb-close { position: fixed; top: 22px; right: 26px; background: transparent; border: none; color: ${T.bg}; font-family: 'Spectral', serif; font-size: 30px; line-height: 1; cursor: pointer; opacity: 0.6; transition: opacity 0.14s; }
    .lb-close:hover { opacity: 1; }
    .lb-body { text-align: center; color: ${T.bg}; padding: 32px 24px; max-width: 480px; width: 100%; }
    .lb-category { font-family: 'Spectral SC', serif; font-size: 9.5px; letter-spacing: 0.3em; color: rgba(200,194,180,0.45); margin-bottom: 16px; }
    .lb-poster   { width: 200px; height: 280px; object-fit: cover; display: block; margin: 0 auto 22px; box-shadow: 0 24px 64px rgba(0,0,0,0.7); }
    .lb-title    { font-family: 'Spectral', serif; font-weight: 700; font-size: 24px; line-height: 1.2; margin-bottom: 5px; }
    .lb-sub      { font-family: 'Spectral SC', serif; font-size: 11px; letter-spacing: 0.1em; color: rgba(200,194,180,0.55); margin-bottom: 20px; }
    .lb-comment  { font-family: 'Spectral', serif; font-style: italic; font-weight: 300; font-size: 15px; line-height: 1.75; color: rgba(200,194,180,0.88); border-left: 2px solid rgba(200,194,180,0.2); text-align: left; padding: 0 0 0 18px; margin: 0 auto 28px; max-width: 360px; }
    .lb-nav      { display: flex; align-items: center; justify-content: center; gap: 20px; }
    .lb-nav-btn  { font-family: 'Spectral SC', serif; font-size: 9.5px; letter-spacing: 0.2em; padding: 7px 18px; border: 1px solid rgba(200,194,180,0.25); background: transparent; color: ${T.bg}; cursor: pointer; transition: background 0.14s; }
    .lb-nav-btn:hover:not(:disabled) { background: rgba(200,194,180,0.08); }
    .lb-nav-btn:disabled { opacity: 0.25; cursor: default; }
    .lb-dots { display: flex; gap: 8px; }
    .lb-dot    { width: 5px; height: 5px; border-radius: 50%; background: rgba(200,194,180,0.25); cursor: pointer; transition: background 0.14s; }
    .lb-dot.on { background: ${T.bg}; }

    /* MODAL */
    .modal-overlay { position: fixed; inset: 0; background: rgba(17,16,8,0.82); z-index: 900; display: flex; align-items: flex-start; justify-content: center; padding-top: 72px; }
    .modal       { background: ${T.bg}; width: 100%; max-width: 540px; max-height: 82vh; overflow-y: auto; border: 1px solid ${T.ink}; }
    .modal-head  { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 2px solid ${T.ink}; }
    .modal-title { font-family: 'Spectral', serif; font-weight: 700; font-size: 17px; }
    .modal-x     { font-family: 'Spectral', serif; font-size: 22px; background: transparent; border: none; cursor: pointer; color: ${T.ink}; opacity: 0.6; }
    .modal-x:hover { opacity: 1; }
    .modal-body  { padding: 20px 22px; }

    .search-input { width: 100%; font-family: 'Spectral', serif; font-size: 15px; padding: 11px 14px; border: 1px solid ${T.ink}; background: transparent; color: ${T.ink}; outline: none; margin-bottom: 14px; }
    .search-input::placeholder { color: ${T.inkFaint}; }
    .search-input:focus { box-shadow: 0 0 0 2px rgba(17,16,8,0.1); }

    .result-item { display: flex; gap: 12px; align-items: center; padding: 9px; border: 1px solid transparent; cursor: pointer; transition: border-color 0.13s, background 0.13s; }
    .result-item:hover { border-color: ${T.ink}; background: rgba(17,16,8,0.03); }
    .result-img   { width: 40px; height: 56px; object-fit: cover; border: 1px solid ${T.paperDark}; flex-shrink: 0; background: ${T.paperDark}; }
    .result-title { font-family: 'Spectral', serif; font-weight: 600; font-size: 14px; }
    .result-sub   { font-family: 'Spectral SC', serif; font-size: 10px; letter-spacing: 0.06em; color: ${T.inkLight}; margin-top: 2px; }

    .selected-preview { display: flex; gap: 12px; align-items: center; padding: 11px; border: 1px solid ${T.ink}; background: rgba(17,16,8,0.03); margin-bottom: 14px; }
    .comment-label { display: block; font-family: 'Spectral SC', serif; font-size: 9.5px; letter-spacing: 0.18em; color: ${T.inkMid}; margin-bottom: 7px; }
    .comment-area  { width: 100%; font-family: 'Spectral', serif; font-style: italic; font-size: 13.5px; line-height: 1.6; padding: 11px 13px; border: 1px solid ${T.ink}; background: transparent; color: ${T.ink}; resize: none; height: 78px; outline: none; }
    .comment-area::placeholder { color: ${T.inkFaint}; }
    .char-count { font-family: 'Spectral SC', serif; font-size: 9.5px; color: ${T.inkFaint}; text-align: right; margin: 4px 0 12px; }

    /* FRIENDS */
    .friend-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid ${T.paperDark}; cursor: pointer; }
    .friend-row:hover .friend-name { text-decoration: underline; }
    .friend-name   { font-family: 'Spectral', serif; font-weight: 600; font-size: 15px; }
    .friend-handle { font-family: 'Spectral SC', serif; font-size: 10px; letter-spacing: 0.1em; color: ${T.inkLight}; margin-top: 2px; }
    .friend-arrow  { font-size: 13px; color: ${T.inkFaint}; }

    /* AUTH */
    .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: ${T.bg}; padding: 24px; }
    .auth-box  { width: 100%; max-width: 400px; }
    .auth-plate { text-align: center; border-top: 3px double ${T.ink}; border-bottom: 3px double ${T.ink}; padding: 14px 0 10px; margin-bottom: 10px; }
    .auth-plate-name { font-family: 'Times New Roman', Times, serif; font-weight: 900; font-size: 72px; letter-spacing: 0.02em; line-height: 0.92; }
    .auth-tagline { font-family: 'Spectral', serif; font-style: italic; font-weight: 300; font-size: 12px; letter-spacing: 0.1em; color: ${T.inkLight}; text-align: center; margin-bottom: 32px; }
    .auth-google { font-family: 'Spectral SC', serif; font-size: 10.5px; font-weight: 600; letter-spacing: 0.25em; padding: 13px; width: 100%; background: transparent; color: ${T.ink}; border: 1px solid ${T.ink}; cursor: pointer; transition: all 0.14s; }
    .auth-google:hover { background: ${T.ink}; color: ${T.bg}; }

    .loading    { text-align: center; padding: 18px 0; font-family: 'Spectral SC', serif; font-size: 10px; letter-spacing: 0.2em; color: ${T.inkFaint}; }
    .no-results { text-align: center; padding: 18px 0; font-family: 'Spectral', serif; font-style: italic; font-size: 13px; color: ${T.inkLight}; }

    @media (max-width: 640px) {
      /* Vouch 5: single column full width */
      .cards-row-large { flex-direction: column; gap: 0; }
      .card-large { width: 100%; }
      .card-poster-large { width: 100%; height: auto; aspect-ratio: 2/3; }
      .card-poster-placeholder-large { width: 100%; aspect-ratio: 2/3; height: auto; }
      .slot-empty-large { width: 100%; aspect-ratio: 2/3; height: auto; margin-bottom: 0; }

      /* Category mentions: single column */
      .cards-row { flex-direction: column; gap: 0; }
      .card { width: 100%; display: flex; flex-direction: row; gap: 14px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid ${T.paperDark}; }
      .card-poster { width: 72px; height: 100px; flex-shrink: 0; }
      .card-poster-placeholder { width: 72px; height: 100px; flex-shrink: 0; font-size: 10px; }
      .card:hover .card-poster { transform: none; box-shadow: none; }
      .slot-empty-sm { width: 100%; height: 56px; aspect-ratio: unset; border-style: dashed; margin: 4px 0; }

      .page { padding: 0 16px 60px; }
      .masthead-meta { padding: 7px 16px; }
      .vouch-section { padding: 16px 14px 20px; }
    }
  `}</style>
);

function Auth() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  };
  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-plate"><span className="auth-plate-name">Vouch.</span></div>
        <div className="auth-tagline">Love it? Vouch for it.</div>
        <button className="auth-google" onClick={signInWithGoogle}>Continue with Google</button>
      </div>
    </div>
  );
}

function Lightbox({ items, start, catLabel, onClose }) {
  const [i, setI] = useState(start);
  const item = items[i];
  useEffect(() => {
    const h = e => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setI(x => Math.min(x + 1, items.length - 1));
      if (e.key === "ArrowLeft")  setI(x => Math.max(x - 1, 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [items.length, onClose]);
  return (
    <div className="lb-overlay" onClick={onClose}>
      <button className="lb-close" onClick={onClose}>×</button>
      <div className="lb-body" onClick={e => e.stopPropagation()}>
        <div className="lb-category">{catLabel}</div>
        <img src={item.poster} alt={item.title} className="lb-poster" onError={e => e.target.style.display = "none"} />
        <div className="lb-title">{item.title}</div>
        <div className="lb-sub">{item.artist || item.author || item.year || ""}</div>
        {item.comment && <div className="lb-comment">"{item.comment}"</div>}
        <div className="lb-nav">
          <button className="lb-nav-btn" disabled={i === 0} onClick={() => setI(x => x - 1)}>← Prev</button>
          <div className="lb-dots">{items.map((_, d) => <div key={d} className={`lb-dot${d === i ? " on" : ""}`} onClick={() => setI(d)} />)}</div>
          <button className="lb-nav-btn" disabled={i === items.length - 1} onClick={() => setI(x => x + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ catKey, catLabel, used, onClose, onAdd }) {
  const [q, setQ]             = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked]   = useState(null);
  const [note, setNote]       = useState("");
  const [busy, setBusy]       = useState(false);
  const timer                 = useRef(null);
  const remaining             = 5 - used;

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        if (catKey === "movies") {
          const res  = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB}&query=${encodeURIComponent(q)}&language=en-US`);
          const data = await res.json();
          setResults((data.results || []).slice(0, 8).map(r => ({
            id: r.id, title: r.title,
            sub: r.release_date ? r.release_date.slice(0, 4) : "",
            poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
          })));
        } else if (catKey === "shows") {
          const res  = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB}&query=${encodeURIComponent(q)}&language=en-US`);
          const data = await res.json();
          setResults((data.results || []).slice(0, 8).map(r => ({
            id: r.id, title: r.name,
            sub: r.first_air_date ? r.first_air_date.slice(0, 4) : "",
            poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
          })));
        } else if (catKey === "songs" || catKey === "albums" || catKey === "artists") {
          const typeMap = { songs: "track", albums: "album", artists: "artist" };
          const res = await fetch(`/api/spotify?q=${encodeURIComponent(q)}&type=${typeMap[catKey]}`);
          const data = await res.json();
          if (catKey === "songs") {
            setResults((data.tracks?.items || []).slice(0, 8).map(r => ({
              id: r.id, title: r.name,
              sub: r.artists?.[0]?.name || "",
              poster: r.album?.images?.[0]?.url || null,
            })));
          } else if (catKey === "albums") {
            setResults((data.albums?.items || []).slice(0, 8).map(r => ({
              id: r.id, title: r.name,
              sub: r.artists?.[0]?.name || "",
              poster: r.images?.[0]?.url || null,
            })));
          } else {
            setResults((data.artists?.items || []).slice(0, 8).map(r => ({
              id: r.id, title: r.name,
              sub: r.genres?.[0] || "",
              poster: r.images?.[0]?.url || null,
            })));
          }
        } else {
          setResults([]);
        }
      } catch (e) { console.error(e); }
      setBusy(false);
    }, 350);
  }, [q, catKey]);

  const confirm = () => { if (!picked) return; onAdd(catKey, { ...picked, comment: note }); onClose(); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Add to {catLabel}</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {remaining <= 0
            ? <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: T.inkLight, padding: "12px 0" }}>You've used all 5 {catLabel} vouches.</div>
            : picked
              ? <>
                  <div className="selected-preview">
                    <img src={picked.poster} alt={picked.title} className="result-img" onError={e => e.target.style.background = T.paperDark} />
                    <div style={{ flex: 1 }}>
                      <div className="result-title">{picked.title}</div>
                      <div className="result-sub">{picked.sub || ""}</div>
                    </div>
                    <button onClick={() => setPicked(null)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: T.inkFaint }}>×</button>
                  </div>
                  <span className="comment-label">Why are you vouching for this? <span style={{ fontStyle: "italic", fontFamily: "'Spectral',serif", textTransform: "none", letterSpacing: 0, fontWeight: 300 }}>(optional)</span></span>
                  <textarea className="comment-area" placeholder="Say something about it…" value={note} onChange={e => setNote(e.target.value)} maxLength={200} />
                  <div className="char-count">{note.length} / 200</div>
                  <button className="btn btn-solid" style={{ width: "100%" }} onClick={confirm}>Vouch for This</button>
                </>
              : <>
                  <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9.5px", letterSpacing: "0.16em", color: T.inkFaint, marginBottom: 12 }}>
                    {remaining} slot{remaining !== 1 ? "s" : ""} remaining
                  </div>
                  <input className="search-input" placeholder={`Search ${catLabel.toLowerCase()}…`} value={q} onChange={e => setQ(e.target.value)} autoFocus />
                  {busy && <div className="loading">Searching…</div>}
                  {!busy && q.trim() && results.length === 0 && <div className="no-results">No results found.</div>}
                  {results.map(r => (
                    <div key={r.id} className="result-item" onClick={() => setPicked(r)}>
                      {r.poster ? <img src={r.poster} alt={r.title} className="result-img" onError={e => e.target.style.background = T.paperDark} /> : <div className="result-img" />}
                      <div>
                        <div className="result-title">{r.title}</div>
                        <div className="result-sub">{r.sub || ""}</div>
                      </div>
                    </div>
                  ))}
                </>
          }
        </div>
      </div>
    </div>
  );
}

function UniversalSearchModal({ used, onClose, onAdd }) {
  const [q, setQ]             = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked]   = useState(null);
  const [note, setNote]       = useState("");
  const [busy, setBusy]       = useState(false);
  const timer                 = useRef(null);
  const remaining             = 5 - used;

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const [movieRes, tvRes, trackRes, albumRes, artistRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB}&query=${encodeURIComponent(q)}&language=en-US`).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB}&query=${encodeURIComponent(q)}&language=en-US`).then(r => r.json()),
          fetch(`/api/spotify?q=${encodeURIComponent(q)}&type=track`).then(r => r.json()),
          fetch(`/api/spotify?q=${encodeURIComponent(q)}&type=album`).then(r => r.json()),
          fetch(`/api/spotify?q=${encodeURIComponent(q)}&type=artist`).then(r => r.json()),
        ]);

        const mixed = [];

        (movieRes.results || []).slice(0, 3).forEach(r => mixed.push({
          id: r.id, title: r.title, catKey: "movies", catLabel: "Film",
          sub: r.release_date ? r.release_date.slice(0, 4) : "",
          poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
        }));

        (tvRes.results || []).slice(0, 2).forEach(r => mixed.push({
          id: r.id, title: r.name, catKey: "shows", catLabel: "Television",
          sub: r.first_air_date ? r.first_air_date.slice(0, 4) : "",
          poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
        }));

        (trackRes.tracks?.items || []).slice(0, 3).forEach(r => mixed.push({
          id: r.id, title: r.name, catKey: "songs", catLabel: "Songs",
          sub: r.artists?.[0]?.name || "",
          poster: r.album?.images?.[0]?.url || null,
        }));

        (albumRes.albums?.items || []).slice(0, 2).forEach(r => mixed.push({
          id: r.id, title: r.name, catKey: "albums", catLabel: "Albums",
          sub: r.artists?.[0]?.name || "",
          poster: r.images?.[0]?.url || null,
        }));

        (artistRes.artists?.items || []).slice(0, 2).forEach(r => mixed.push({
          id: r.id, title: r.name, catKey: "artists", catLabel: "Artists",
          sub: r.genres?.[0] || "",
          poster: r.images?.[0]?.url || null,
        }));

        setResults(mixed);
      } catch(e) { console.error(e); }
      setBusy(false);
    }, 400);
  }, [q]);

  const confirm = () => {
    if (!picked) return;
    onAdd(picked.catKey, { ...picked, comment: note });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Add to Vouch</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {remaining <= 0
            ? <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: T.inkLight, padding: "12px 0" }}>Your Vouch 5 is full.</div>
            : picked
              ? <>
                  <div className="selected-preview">
                    <img src={picked.poster} alt={picked.title} className="result-img" onError={e => e.target.style.background = T.paperDark} />
                    <div style={{ flex: 1 }}>
                      <div className="result-title">{picked.title}</div>
                      <div className="result-sub">{picked.sub} · {picked.catLabel}</div>
                    </div>
                    <button onClick={() => setPicked(null)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: T.inkFaint }}>×</button>
                  </div>
                  <span className="comment-label">Why are you vouching for this? <span style={{ fontStyle: "italic", fontFamily: "'Spectral',serif", textTransform: "none", letterSpacing: 0, fontWeight: 300 }}>(optional)</span></span>
                  <textarea className="comment-area" placeholder="Say something about it…" value={note} onChange={e => setNote(e.target.value)} maxLength={200} />
                  <div className="char-count">{note.length} / 200</div>
                  <button className="btn btn-solid" style={{ width: "100%" }} onClick={confirm}>Vouch for This</button>
                </>
              : <>
                  <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9.5px", letterSpacing: "0.16em", color: T.inkFaint, marginBottom: 12 }}>
                    {remaining} slot{remaining !== 1 ? "s" : ""} remaining
                  </div>
                  <input className="search-input" placeholder="Search films, shows, songs, albums, artists…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
                  {busy && <div className="loading">Searching…</div>}
                  {!busy && q.trim() && results.length === 0 && <div className="no-results">No results found.</div>}
                  {results.map((r, i) => (
                    <div key={r.id + r.catKey + i} className="result-item" onClick={() => setPicked(r)}>
                      {r.poster ? <img src={r.poster} alt={r.title} className="result-img" onError={e => e.target.style.background = T.paperDark} /> : <div className="result-img" />}
                      <div style={{ flex: 1 }}>
                        <div className="result-title">{r.title}</div>
                        <div className="result-sub">{r.sub}</div>
                      </div>
                      <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8.5px", letterSpacing: "0.15em", color: T.inkFaint, flexShrink: 0 }}>{r.catLabel}</div>
                    </div>
                  ))}
                </>
          }
        </div>
      </div>
    </div>
  );
}

function VouchSection({ board, isOwn, onCard, onAdd }) {
  const allItems = [];
  CATEGORIES.forEach(cat => {
    (board[cat.key] || []).forEach(item => {
      allItems.push({ ...item, _cat: cat.key, _catLabel: cat.label });
    });
  });
  const top = allItems.slice(0, 5);
  const slots = Array(5).fill(null).map((_, i) => top[i] || null);

  return (
    <div className="vouch-section">
      <div className="vouch-section-header">
        <div className="vouch-section-label">Vouch</div>
        <div className="vouch-section-sub">The five that define this moment</div>
        {isOwn && <button className="vouch-section-add" onClick={onAdd}>+ Add</button>}
      </div>
      <div className="cards-row-large">
        {slots.map((item, idx) =>
          item
            ? <div key={item.id + item._cat} className="card-large" onClick={() => onCard(item._cat, (board[item._cat] || []).findIndex(x => x.id === item.id))}>
                {item.poster
                  ? <img src={item.poster} alt={item.title} className="card-poster-large" onError={e => { e.target.style.display = "none"; }} />
                  : <div className="card-poster-placeholder-large">{item.title}</div>}
                <div className="card-cat-badge">{item._catLabel}</div>
                <div className="card-title-large">{item.title}</div>
                <div className="card-sub-large">{item.artist || item.author || item.year || item.sub || ""}</div>
                {item.comment && <div className="card-comment-large">"{item.comment}"</div>}
              </div>
            : isOwn
              ? <div key={`ve${idx}`} className="slot-empty-large" onClick={onAdd}>
                  <div className="slot-empty-inner"><span className="slot-empty-plus">+</span>Vouch</div>
                </div>
              : <div key={`ve${idx}`} className="slot-empty-large" style={{ cursor: "default", opacity: 0.35 }}>
                  <div className="slot-empty-inner"><span className="slot-empty-plus">—</span></div>
                </div>
        )}
      </div>
    </div>
  );
}

function CatSection({ catKey, label, items, isOwn, onCard, onAdd }) {
  const [open, setOpen] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;
  const slots = Array(5).fill(null).map((_, i) => items[i] || null);
  const collapsed = isMobile && !open;
  return (
    <div className="cat-section">
      <div className="cat-header" style={{ cursor: isMobile ? "pointer" : "default" }} onClick={() => isMobile && setOpen(o => !o)}>
        <div className="cat-label">{label}</div>
        <div className="cat-sublabel">Mentions</div>
        <div className="cat-count">{items.length} of 5</div>
        {isMobile && <span style={{ marginLeft: "auto", fontFamily: "'Spectral SC',serif", fontSize: "11px", color: T.inkFaint, paddingLeft: 8 }}>{open ? "▴" : "▾"}</span>}
        {isOwn && !isMobile && <button className="cat-add" onClick={() => onAdd(catKey)}>+ Vouch</button>}
        {isOwn && isMobile && open && <button className="cat-add" style={{ marginLeft: 8 }} onClick={e => { e.stopPropagation(); onAdd(catKey); }}>+ Vouch</button>}
      </div>
      {!collapsed && <div className="cards-row">
        {slots.map((item, idx) =>
          item
            ? <div key={item.id} className="card" onClick={() => onCard(catKey, idx)}>
                {item.poster
                  ? <img src={item.poster} alt={item.title} className="card-poster" onError={e => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }} />
                  : null}
                <div className="card-poster-placeholder" style={{ display: item.poster ? "none" : "flex" }}>{item.title}</div>
                <div style={{ flex: 1 }}>
                  <div className="card-title">{item.title}</div>
                  <div className="card-sub">{item.artist || item.author || item.year || item.sub || ""}</div>
                  {item.comment && <div className="card-comment">"{item.comment}"</div>}
                </div>
              </div>
            : isOwn
              ? <div key={`e${idx}`} className="slot-empty-sm" onClick={() => onAdd(catKey)}>
                  <div className="slot-empty-inner"><span className="slot-empty-plus">+</span>Vouch</div>
                </div>
              : <div key={`e${idx}`} className="slot-empty-sm" style={{ cursor: "default", opacity: 0.4 }}>
                  <div className="slot-empty-inner"><span className="slot-empty-plus">—</span></div>
                </div>
        )}
      </div>}
    </div>
  );
}

const MOCK_FRIENDS = [
  { username: "sarah_m",  displayName: "Sarah M."  },
  { username: "jake_r",   displayName: "Jake R."   },
  { username: "priya_k",  displayName: "Priya K."  },
];

export default function Vouch() {
  const [user,      setUser]      = useState(null);
  const [tab,       setTab]       = useState("board");
  const [viewing,   setViewing]   = useState(null);
  const [board,     setBoard]     = useState({ ...EMPTY_BOARD });
  const [lightbox,  setLightbox]  = useState(null);
  const [addModal,  setAddModal]  = useState(null);
  const [vouchModal, setVouchModal] = useState(false);


  useEffect(() => {
    const setUserFromSession = (session) => {
      if (session?.user) {
        setUser({
          username: session.user.email.split("@")[0],
          displayName: session.user.user_metadata?.full_name || session.user.email.split("@")[0]
        });
      } else {
        setUser(null);
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => setUserFromSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUserFromSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); };

  const isOwn     = !viewing;
  const currBoard = isOwn ? board : { ...EMPTY_BOARD };
  const currName  = isOwn ? user?.displayName : MOCK_FRIENDS.find(f => f.username === viewing)?.displayName || viewing;

  const addItem = (catKey, item) => setBoard(prev => ({
    ...prev,
    [catKey]: [...(prev[catKey] || []), item].slice(0, 5)
  }));



  if (!user) return <><Styles /><Auth /></>;

  return (
    <>
      <Styles />
      <div className="app">
        <header className="masthead">
          <div className="masthead-meta">
            <span>Vol. I &nbsp;·&nbsp; {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            <span className="masthead-meta-stars">✦ · ✦ · ✦</span>
            <span>
              <span className="clickable" onClick={() => { setTab("board"); setViewing(null); }}>@{user.username}</span>
              <span className="clickable" onClick={signOut} style={{ marginLeft: 16 }}>Sign out</span>
            </span>
          </div>
          <div className="masthead-nameplate" onClick={() => { setTab("board"); setViewing(null); }}>
            <span className="nameplate-word">Vouch.</span>
          </div>
          <div className="masthead-rule-ornament">— ✦ —</div>
          <div className="masthead-tagline">Love it? Vouch for it.</div>

          <nav className="nav">
            <button className={`nav-btn${tab === "board" && !viewing ? " active" : ""}`} onClick={() => { setTab("board"); setViewing(null); }}>My Board</button>
            <button className={`nav-btn${tab === "friends" ? " active" : ""}`} onClick={() => { setTab("friends"); setViewing(null); }}>Friends</button>
            {viewing && <button className="nav-btn active">{currName}'s Board</button>}
          </nav>
        </header>

        <main className="page">
          {tab === "friends" && !viewing
            ? <>
                <div className="board-header">
                  <div>
                    <div className="board-name">Friends</div>
                    <div className="board-sub">{MOCK_FRIENDS.length} connections</div>
                  </div>
                  <button className="btn btn-solid">+ Add Friend</button>
                </div>
                <div className="ornament">· · ·</div>
                {MOCK_FRIENDS.map(f => (
                  <div key={f.username} className="friend-row" onClick={() => { setViewing(f.username); setTab("board"); }}>
                    <div>
                      <div className="friend-name">{f.displayName}</div>
                      <div className="friend-handle">@{f.username}</div>
                    </div>
                    <span className="friend-arrow">→</span>
                  </div>
                ))}
              </>
            : <>
                <div className="board-header">
                  <div>
                    <div className="board-name">
                      {currName}
                      {viewing && <span style={{ fontWeight: 400, fontSize: 16, color: T.inkLight, marginLeft: 10 }}>@{viewing}</span>}
                    </div>
                    <div className="board-sub">
                      {isOwn ? user.displayName : `${currName}'s board`}
                    </div>
                  </div>
                  {viewing && <button className="btn btn-ghost" onClick={() => { setViewing(null); setTab("friends"); }}>← Back</button>}
                </div>
                <div className="ornament">— ✦ —</div>

                <VouchSection board={currBoard} isOwn={isOwn} onCard={(k, i) => setLightbox({ catKey: k, idx: i })} onAdd={() => setVouchModal(true)} />

                {CATEGORIES.map(cat => (
                  <CatSection key={cat.key} catKey={cat.key} label={cat.label} items={currBoard[cat.key] || []} isOwn={isOwn} onCard={(k, i) => setLightbox({ catKey: k, idx: i })} onAdd={setAddModal} />
                ))}
              </>
          }
        </main>

        {lightbox && (() => {
          const items = currBoard[lightbox.catKey] || [];
          if (!items.length) return null;
          return <Lightbox items={items} start={lightbox.idx} catLabel={CATEGORIES.find(c => c.key === lightbox.catKey)?.label} onClose={() => setLightbox(null)} />;
        })()}

        {vouchModal && (
          <UniversalSearchModal
            used={Math.min(Object.values(board).flat().length, 5)}
            onClose={() => setVouchModal(false)}
            onAdd={(catKey, item) => {
              addItem(catKey, item);
              setVouchModal(false);
            }}
          />
        )}

        {addModal && (
          <AddModal
            catKey={addModal}
            catLabel={CATEGORIES.find(c => c.key === addModal)?.label}
            used={(board[addModal] || []).length}
            onClose={() => setAddModal(null)}
            onAdd={addItem}
          />
        )}
      </div>
    </>
  );
}