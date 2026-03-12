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

function Auth({ inviteUserId, inviterName }) {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + (inviteUserId ? `?invite=${inviteUserId}` : "") }
    });
  };
  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-plate"><span className="auth-plate-name">Vouch.</span></div>
        <div className="auth-tagline">Love it? Vouch for it.</div>
        <div style={{ marginBottom: 32, borderBottom: `1px solid ${T.paperDark}`, paddingBottom: 32 }}>
          <HowItWorks />
        </div>
        <button className="auth-google" onClick={signInWithGoogle}>Continue with Google</button>
      </div>
    </div>
  );
}

function PublicBoard({ inviteUserId, onSignUp }) {
  const [board, setBoard]       = useState(null);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: prof } = await supabase.from("profiles").select("id, username, display_name").eq("id", inviteUserId).single();
      if (!prof) { setLoading(false); return; }
      setProfile(prof);
      const { data: rows } = await supabase.from("endorsements").select("*").eq("user_id", inviteUserId).order("created_at", { ascending: true });
      if (rows) {
        const b = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
        rows.forEach(row => {
          if (b[row.category] && b[row.category].length < 5) {
            b[row.category].push({ id: row.item_id, title: row.title, sub: row.subtitle || "", poster: row.poster || null, comment: row.comment || "", vouched: row.vouched || false, sourceUrl: row.source_url || null });
          }
        });
        setBoard(b);
      }
      setLoading(false);
    };
    load();
  }, [inviteUserId]);

  if (loading) return <><Styles /><div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}><div className="loading">Loading…</div></div></>;
  if (!profile || !board) return <><Styles /><Auth inviteUserId={inviteUserId} /></>;

  const name = profile.display_name || profile.username;

  return (
    <>
      <Styles />
      <div className="app">
        {/* Banner */}
        <div style={{ background: T.ink, color: T.bg, padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14 }}>
            You're viewing <strong style={{ fontStyle: "normal" }}>{name}'s</strong> Vouch board.
          </div>
          <button onClick={onSignUp} style={{ background: T.bg, color: T.ink, border: "none", fontFamily: "'Spectral SC',serif", fontSize: "10px", letterSpacing: "0.15em", padding: "9px 18px", cursor: "pointer", whiteSpace: "nowrap" }}>
            Create Your Own →
          </button>
        </div>

        <header className="masthead">
          <div className="masthead-meta">
            <span>Vol. I &nbsp;·&nbsp; {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            <span className="masthead-meta-stars">✦ · ✦ · ✦</span>
            <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkMid }}>vouch5.com</span>
          </div>
          <div className="masthead-nameplate"><span className="nameplate-word">Vouch.</span></div>
          <div className="masthead-rule-ornament">— ✦ —</div>
          <div className="masthead-tagline">Love it? Vouch for it.</div>
        </header>

        <main className="page">
          <div className="board-header">
            <div>
              <div className="board-name">{name}</div>
              <div className="board-sub">@{profile.username}</div>
            </div>
            <button onClick={onSignUp} className="btn btn-solid">Create Your Own</button>
          </div>
          <div className="ornament">— ✦ —</div>

          <VouchSection board={board} isOwn={false} onCard={() => {}} onAdd={() => {}} onRemove={() => {}} onDudeSame={() => {}} myReactions={[]} />
          {CATEGORIES.map(cat => (
            <CatSection key={cat.key} catKey={cat.key} label={cat.label} items={board[cat.key] || []} isOwn={false} onCard={() => {}} onAdd={() => {}} onRemove={() => {}} onDudeSame={() => {}} myReactions={[]} />
          ))}

          <div style={{ marginTop: 48, padding: "32px 0", borderTop: `3px double ${T.ink}`, textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Make your own board.</div>
            <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: T.inkMid, marginBottom: 24 }}>What five things would you put your name behind right now?</div>
            <button onClick={onSignUp} className="btn btn-solid" style={{ fontSize: 13, padding: "12px 32px" }}>Get Started — It's Free</button>
          </div>
        </main>

        <footer style={{ borderTop: `3px double ${T.ink}`, padding: "24px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid }}>© {new Date().getFullYear()} Vouch. All Rights Reserved.</div>
        </footer>
      </div>
    </>
  );
}

function HowItWorks() {
  return (
    <div style={{ fontFamily: "'Spectral',serif", color: T.inkMid, maxWidth: 380, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", color: T.ink, marginBottom: 20 }}>How It Works</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.15em", color: T.ink, marginBottom: 5 }}>Vouch 5</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, fontStyle: "italic", color: T.inkMid }}>Pick the five things you'd put your name behind today. A movie, an album, a book, whatever. These are your top-of-the-fold picks.</div>
        </div>
        <div style={{ borderTop: `1px solid ${T.paperDark}` }} />
        <div>
          <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.15em", color: T.ink, marginBottom: 5 }}>Categories</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, fontStyle: "italic", color: T.inkMid }}>Go deeper. Add up to five per category across Film, Music, Books, and Television.</div>
        </div>
        <div style={{ borderTop: `1px solid ${T.paperDark}` }} />
        <div>
          <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.15em", color: T.ink, marginBottom: 5 }}>Buddies</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, fontStyle: "italic", color: T.inkMid }}>Connect with friends and see what they're vouching for. Hit "Dude, Same" on anything that resonates.</div>
        </div>
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
          const results = (data.results || []).slice(0, 8);
          const withImdb = await Promise.all(results.map(async r => {
            try {
              const ext = await fetch(`https://api.themoviedb.org/3/movie/${r.id}/external_ids?api_key=${TMDB}`).then(x => x.json());
              return { id: r.id, title: r.title, sub: r.release_date ? r.release_date.slice(0, 4) : "", poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null, sourceUrl: ext.imdb_id ? `https://www.imdb.com/title/${ext.imdb_id}/` : `https://www.imdb.com/find?q=${encodeURIComponent(r.title)}` };
            } catch { return { id: r.id, title: r.title, sub: r.release_date ? r.release_date.slice(0, 4) : "", poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null, sourceUrl: `https://www.imdb.com/find?q=${encodeURIComponent(r.title)}` }; }
          }));
          setResults(withImdb);
        } else if (catKey === "shows") {
          const res  = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB}&query=${encodeURIComponent(q)}&language=en-US`);
          const data = await res.json();
          const results = (data.results || []).slice(0, 8);
          const withImdb = await Promise.all(results.map(async r => {
            try {
              const ext = await fetch(`https://api.themoviedb.org/3/tv/${r.id}/external_ids?api_key=${TMDB}`).then(x => x.json());
              return { id: r.id, title: r.name, sub: r.first_air_date ? r.first_air_date.slice(0, 4) : "", poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null, sourceUrl: ext.imdb_id ? `https://www.imdb.com/title/${ext.imdb_id}/` : `https://www.imdb.com/find?q=${encodeURIComponent(r.name)}` };
            } catch { return { id: r.id, title: r.name, sub: r.first_air_date ? r.first_air_date.slice(0, 4) : "", poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null, sourceUrl: `https://www.imdb.com/find?q=${encodeURIComponent(r.name)}` }; }
          }));
          setResults(withImdb);
        } else if (catKey === "songs" || catKey === "albums" || catKey === "artists") {
          const typeMap = { songs: "track", albums: "album", artists: "artist" };
          const res = await fetch(`/api/spotify?q=${encodeURIComponent(q)}&type=${typeMap[catKey]}`);
          const data = await res.json();
          if (catKey === "songs") {
            setResults((data.tracks?.items || []).slice(0, 8).map(r => ({
              id: r.id, title: r.name,
              sub: r.artists?.[0]?.name || "",
              poster: r.album?.images?.[0]?.url || null,
              sourceUrl: `https://open.spotify.com/track/${r.id}`,
            })));
          } else if (catKey === "albums") {
            setResults((data.albums?.items || []).slice(0, 8).map(r => ({
              id: r.id, title: r.name,
              sub: r.artists?.[0]?.name || "",
              poster: r.images?.[0]?.url || null,
              sourceUrl: `https://open.spotify.com/album/${r.id}`,
            })));
          } else {
            setResults((data.artists?.items || []).slice(0, 8).map(r => ({
              id: r.id, title: r.name,
              sub: r.genres?.[0] || "",
              poster: r.images?.[0]?.url || null,
              sourceUrl: `https://open.spotify.com/artist/${r.id}`,
            })));
          }
        } else if (catKey === "books") {
          const res  = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&language=eng`);
          const data = await res.json();
          setResults((data.docs || []).slice(0, 8).map(r => {
            const coverId = r.cover_i;
            const isbn = (r.isbn || [])[0];
            const poster = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null;
            return {
              id: r.key || r.title,
              title: r.title,
              sub: (r.author_name || []).join(", "),
              poster,
              sourceUrl: `https://openlibrary.org${r.key}`,
            };
          }));
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
                    <img src={picked.poster} alt={picked.title} className="result-img" onError={e => { if (e.target.dataset.fallback && e.target.src !== e.target.dataset.fallback) { e.target.src = e.target.dataset.fallback; } else { e.target.style.background = T.paperDark; e.target.src = ''; } }} />
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
                      {r.poster ? <img src={r.poster} data-fallback={r.posterFallback} alt={r.title} className="result-img" onError={e => { if (e.target.dataset.fallback && e.target.src !== e.target.dataset.fallback) { e.target.src = e.target.dataset.fallback; } else { e.target.style.background = T.paperDark; e.target.src = ''; } }} /> : <div className="result-img" />}
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
  const [filter, setFilter]   = useState("all");
  const timer                 = useRef(null);
  const remaining             = 5 - used;

  const FILTERS = [
    { key: "all",     label: "All"       },
    { key: "movies",  label: "Film"      },
    { key: "shows",   label: "TV"        },
    { key: "songs",   label: "Songs"     },
    { key: "albums",  label: "Albums"    },
    { key: "artists", label: "Artists"   },
    { key: "books",   label: "Books"     },
  ];

  const visibleResults = filter === "all" ? results : results.filter(r => r.catKey === filter);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const [movieRes, tvRes, trackRes, albumRes, artistRes, booksRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB}&query=${encodeURIComponent(q)}&language=en-US`).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB}&query=${encodeURIComponent(q)}&language=en-US`).then(r => r.json()),
          fetch(`/api/spotify?q=${encodeURIComponent(q)}&type=track`).then(r => r.json()),
          fetch(`/api/spotify?q=${encodeURIComponent(q)}&type=album`).then(r => r.json()),
          fetch(`/api/spotify?q=${encodeURIComponent(q)}&type=artist`).then(r => r.json()),
          fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=3&language=eng`).then(r => r.json()),
        ]);

        const mixed = [];

        const movieResults = (movieRes.results || []).slice(0, 3);
        const tvResults = (tvRes.results || []).slice(0, 2);
        const [movieIds, tvIds] = await Promise.all([
          Promise.all(movieResults.map(r => fetch(`https://api.themoviedb.org/3/movie/${r.id}/external_ids?api_key=${TMDB}`).then(x => x.json()).catch(() => ({})))),
          Promise.all(tvResults.map(r => fetch(`https://api.themoviedb.org/3/tv/${r.id}/external_ids?api_key=${TMDB}`).then(x => x.json()).catch(() => ({})))),
        ]);

        movieResults.forEach((r, i) => mixed.push({
          id: r.id, title: r.title, catKey: "movies", catLabel: "Film",
          sub: r.release_date ? r.release_date.slice(0, 4) : "",
          poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
          sourceUrl: movieIds[i]?.imdb_id ? `https://www.imdb.com/title/${movieIds[i].imdb_id}/` : `https://www.imdb.com/find?q=${encodeURIComponent(r.title)}`,
        }));

        tvResults.forEach((r, i) => mixed.push({
          id: r.id, title: r.name, catKey: "shows", catLabel: "Television",
          sub: r.first_air_date ? r.first_air_date.slice(0, 4) : "",
          poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
          sourceUrl: tvIds[i]?.imdb_id ? `https://www.imdb.com/title/${tvIds[i].imdb_id}/` : `https://www.imdb.com/find?q=${encodeURIComponent(r.name)}`,
        }));

        (trackRes.tracks?.items || []).slice(0, 3).forEach(r => mixed.push({
          id: r.id, title: r.name, catKey: "songs", catLabel: "Songs",
          sub: r.artists?.[0]?.name || "",
          poster: r.album?.images?.[0]?.url || null,
          sourceUrl: `https://open.spotify.com/track/${r.id}`,
        }));

        (albumRes.albums?.items || []).slice(0, 2).forEach(r => mixed.push({
          id: r.id, title: r.name, catKey: "albums", catLabel: "Albums",
          sub: r.artists?.[0]?.name || "",
          poster: r.images?.[0]?.url || null,
          sourceUrl: `https://open.spotify.com/album/${r.id}`,
        }));

        (artistRes.artists?.items || []).slice(0, 2).forEach(r => mixed.push({
          id: r.id, title: r.name, catKey: "artists", catLabel: "Artists",
          sub: r.genres?.[0] || "",
          poster: r.images?.[0]?.url || null,
          sourceUrl: `https://open.spotify.com/artist/${r.id}`,
        }));

        (booksRes.docs || []).slice(0, 2).forEach(r => {
          const coverId = r.cover_i;
          const isbn = (r.isbn || [])[0];
          const poster = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null;
          mixed.push({
            id: r.key || r.title, title: r.title, catKey: "books", catLabel: "Book",
            sub: (r.author_name || []).join(", "),
            poster,
            sourceUrl: `https://openlibrary.org${r.key}`,
          });
        });

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
                    <img src={picked.poster} alt={picked.title} className="result-img" onError={e => { if (e.target.dataset.fallback && e.target.src !== e.target.dataset.fallback) { e.target.src = e.target.dataset.fallback; } else { e.target.style.background = T.paperDark; e.target.src = ''; } }} />
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
                  <input className="search-input" placeholder="Search films, shows, songs, albums, artists, books…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    {FILTERS.map(f => (
                      <button key={f.key} onClick={() => setFilter(f.key)} style={{
                        fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em",
                        padding: "4px 10px", border: `1px solid ${filter === f.key ? T.ink : T.paperDark}`,
                        background: filter === f.key ? T.ink : "transparent",
                        color: filter === f.key ? T.bg : T.inkMid,
                        cursor: "pointer", transition: "all 0.12s",
                      }}>{f.label}</button>
                    ))}
                  </div>
                  {busy && <div className="loading">Searching…</div>}
                  {!busy && q.trim() && visibleResults.length === 0 && <div className="no-results">No results found.</div>}
                  {visibleResults.map((r, i) => (
                    <div key={r.id + r.catKey + i} className="result-item" onClick={() => setPicked(r)}>
                      {r.poster ? <img src={r.poster} data-fallback={r.posterFallback} alt={r.title} className="result-img" onError={e => { if (e.target.dataset.fallback && e.target.src !== e.target.dataset.fallback) { e.target.src = e.target.dataset.fallback; } else { e.target.style.background = T.paperDark; e.target.src = ''; } }} /> : <div className="result-img" />}
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

function VouchSection({ board, isOwn, onCard, onAdd, onRemove, onDudeSame, myReactions }) {
  const allItems = [];
  CATEGORIES.forEach(cat => {
    (board[cat.key] || []).forEach(item => {
      if (item.vouched) allItems.push({ ...item, _cat: cat.key, _catLabel: cat.label });
    });
  });
  const slots = Array(5).fill(null).map((_, i) => allItems[i] || null);

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
            ? <div key={item.id + item._cat} className="card-large" style={{ position: "relative" }} onClick={() => item.sourceUrl ? window.open(item.sourceUrl, "_blank") : onCard(item._cat, (board[item._cat] || []).findIndex(x => x.id === item.id))}>
                {isOwn && <button onClick={e => { e.stopPropagation(); onRemove(item._cat, (board[item._cat] || []).findIndex(x => x.id === item.id)); }} style={{ position: "absolute", top: 6, right: 6, zIndex: 2, background: "rgba(17,16,8,0.7)", border: "none", color: "#C8C2B4", width: 26, height: 26, cursor: "pointer", fontSize: 15, lineHeight: "26px", textAlign: "center" }}>×</button>}
                {!isOwn && <button onClick={e => { e.stopPropagation(); onDudeSame(item); }} style={{ position: "absolute", top: 6, right: 6, zIndex: 2, background: myReactions?.includes(item.id) ? T.ink : "rgba(17,16,8,0.7)", border: "none", color: "#C8C2B4", cursor: "pointer", fontSize: "8px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.1em", padding: "4px 7px", whiteSpace: "nowrap" }}>{myReactions?.includes(item.id) ? "✓ Same" : "Dude, Same"}</button>}
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

function CatSection({ catKey, label, items, isOwn, onCard, onAdd, onRemove, onDudeSame, myReactions }) {
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
            ? <div key={item.id} className="card" style={{ position: "relative" }} onClick={() => item.sourceUrl ? window.open(item.sourceUrl, "_blank") : onCard(catKey, idx)}>
                {isOwn && <button onClick={e => { e.stopPropagation(); onRemove(catKey, idx); }} style={{ position: "absolute", top: 4, right: 4, zIndex: 2, background: "rgba(17,16,8,0.7)", border: "none", color: "#C8C2B4", width: 22, height: 22, cursor: "pointer", fontSize: 13, lineHeight: "22px", textAlign: "center" }}>×</button>}
                {!isOwn && <button onClick={e => { e.stopPropagation(); onDudeSame(item); }} style={{ position: "absolute", top: 4, right: 4, zIndex: 2, background: myReactions?.includes(item.id) ? T.ink : "rgba(17,16,8,0.7)", border: "none", color: "#C8C2B4", cursor: "pointer", fontSize: "7px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.08em", padding: "3px 5px", whiteSpace: "nowrap" }}>{myReactions?.includes(item.id) ? "✓" : "Same"}</button>}
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

function MutualMentions({ reactions, myReactions, isOwn, boardOwnerName }) {
  if (!reactions.length && !myReactions.length) return null;
  const items = isOwn ? myReactions : reactions;
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 52, borderTop: `1px solid ${T.paperDark}`, paddingTop: 28, opacity: 0.75 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
        <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", color: T.inkMid }}>Mutual Mentions</div>
        <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkFaint }}>
          {isOwn ? "Things you've said Dude, Same to" : `Things others said Dude, Same to on ${boardOwnerName}'s board`}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {items.map((item, i) => (
          <div key={item.id + i} style={{ width: 90, flexShrink: 0, cursor: item.sourceUrl ? "pointer" : "default", opacity: 0.85 }} onClick={() => item.sourceUrl && window.open(item.sourceUrl, "_blank")}>
            {item.poster
              ? <img src={item.poster} alt={item.title} style={{ width: 90, height: 124, objectFit: "cover", border: `1px solid ${T.paperDark}`, display: "block" }} onError={e => e.target.style.display = "none"} />
              : <div style={{ width: 90, height: 124, background: T.paperDark, border: `1px solid ${T.paperDark}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "'Spectral',serif", color: T.inkLight, textAlign: "center", padding: 6 }}>{item.title}</div>}
            <div style={{ fontFamily: "'Spectral',serif", fontSize: 10.5, fontWeight: 600, lineHeight: 1.3, marginTop: 5 }}>{item.title}</div>
            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: 8.5, color: T.inkFaint, marginTop: 1 }}>{item.subtitle || ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BuddyModal({ userId, onClose, onSendRequest, onGenerateLink, inviteLink, existingBuddyIds }) {
  const [q, setQ]           = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy]     = useState(false);
  const [sent, setSent]     = useState([]);
  const timer               = useRef(null);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      const { data } = await supabase.from("profiles").select("id, username, display_name").or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).neq("id", userId).limit(8);
      setResults(data || []);
      setBusy(false);
    }, 300);
  }, [q, userId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Add Buddy</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9.5px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 8 }}>Invite via Link</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-solid" style={{ flex: 1 }} onClick={onGenerateLink}>
                {inviteLink ? "Link Copied!" : "Copy Invite Link"}
              </button>
            </div>
            {inviteLink && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight, marginTop: 6, wordBreak: "break-all" }}>{inviteLink}</div>}
          </div>
          <div style={{ borderBottom: `1px solid ${T.paperDark}`, marginBottom: 16 }} />
          <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9.5px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 10 }}>Search by Username</div>
          <input className="search-input" placeholder="Search name or username…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
          {busy && <div className="loading">Searching…</div>}
          {!busy && q.trim() && results.length === 0 && <div className="no-results">No users found.</div>}
          {results.map(r => {
            const isAlready = existingBuddyIds.includes(r.id);
            const isSent    = sent.includes(r.id);
            return (
              <div key={r.id} className="result-item" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="result-title">{r.display_name}</div>
                  <div className="result-sub">@{r.username}</div>
                </div>
                {isAlready
                  ? <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkFaint }}>Buddies</span>
                  : isSent
                  ? <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkFaint }}>Sent</span>
                  : <button className="btn btn-solid" style={{ padding: "4px 12px" }} onClick={() => { onSendRequest(r.id); setSent(s => [...s, r.id]); }}>Add</button>
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const TERMS = `TERMS OF USE

Effective Date: March 11, 2026

Welcome to Vouch ("the Service"), operated by Vouch ("we," "us," or "our"). By accessing or using Vouch, you agree to be bound by these Terms of Use. If you do not agree, please do not use the Service.

1. USE OF THE SERVICE
Vouch is a personal endorsement platform that allows users to share cultural recommendations with friends. You must be at least 13 years of age to use this Service. You agree not to use the Service for any unlawful purpose or in any way that could harm Vouch or other users.

2. USER ACCOUNTS
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. We reserve the right to terminate accounts at our discretion.

3. CONTENT
You retain ownership of any content you submit to Vouch. By submitting content, you grant Vouch a non-exclusive, royalty-free license to display that content within the Service. You are solely responsible for the content you post.

4. THIRD-PARTY SERVICES
Vouch integrates with third-party services including Google, Spotify, and others. Your use of those services is governed by their respective terms and policies. Vouch is not responsible for the content, policies, or practices of third-party services.

5. INTELLECTUAL PROPERTY
The Vouch name, logo, design, and all associated content are the intellectual property of Vouch. All rights reserved. You may not reproduce, distribute, or create derivative works without our express written permission.

6. DISCLAIMERS
THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. VOUCH DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

7. LIMITATION OF LIABILITY
TO THE FULLEST EXTENT PERMITTED BY LAW, VOUCH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.

8. CHANGES TO TERMS
We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.

9. CONTACT
For questions about these Terms, contact us at legal@vouch5.com.`;

const PRIVACY = `PRIVACY POLICY

Effective Date: March 11, 2026

Vouch ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use the Vouch platform.

1. INFORMATION WE COLLECT
We collect the following information when you use Vouch:
- Account Information: Your name and email address, collected via Google Sign-In.
- Preference Data: Movies, TV shows, books, and music (artists, albums, songs) that you choose to endorse on your board.
- Social Data: Buddy connections and reactions ("Dude, Same") you make on other users' boards.
- Usage Data: Standard server logs including IP address, browser type, and pages visited.

2. HOW WE USE YOUR INFORMATION
We use your information to:
- Provide and operate the Vouch Service
- Display your board and endorsements to you and your approved Buddies
- Enable social features including Buddy connections and reactions
- Improve and develop the Service

3. THIRD-PARTY SERVICES
Vouch integrates with the following third-party services:
- Google: Used for authentication. Governed by Google's Privacy Policy.
- Spotify: Used to search and display music content. We do not store your Spotify credentials or access your private Spotify data.
- The Movie Database (TMDB): Used to search and display film and television content.
- Google Books / Open Library: Used to search and display book content.

4. DATA SHARING
We do not sell your personal information to third parties. Your board is visible to your approved Buddies. We do not share your data with advertisers.

5. DATA RETENTION
We retain your data for as long as your account is active. You may delete your account and associated data at any time by contacting us.

6. SECURITY
We use industry-standard security measures including Supabase row-level security to protect your data. No method of transmission over the Internet is 100% secure.

7. CHILDREN'S PRIVACY
Vouch is not directed at children under 13. We do not knowingly collect personal information from children under 13.

8. YOUR RIGHTS
Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data. Contact us at legal@vouch5.com to make a request.

9. CHANGES TO THIS POLICY
We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the effective date above.

10. CONTACT
For privacy-related questions, contact us at legal@vouch5.com.`;

function LegalModal({ page, onClose }) {
  if (page === "how") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-title">How It Works</div>
            <button className="modal-x" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <HowItWorks />
          </div>
        </div>
      </div>
    );
  }
  const content = page === "terms" ? TERMS : PRIVACY;
  const title   = page === "terms" ? "Terms of Use" : "Privacy Policy";
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>
          <pre style={{ fontFamily: "'Spectral',serif", fontSize: 12.5, lineHeight: 1.8, whiteSpace: "pre-wrap", color: T.inkMid }}>{content}</pre>
        </div>
      </div>
    </div>
  );
}

export default function Vouch() {
  const [user,        setUser]        = useState(null);
  const [userId,      setUserId]      = useState(null);
  const [tab,         setTab]         = useState("board");
  const [viewing,     setViewing]     = useState(null); // { userId, username, displayName }
  const [board,       setBoard]       = useState({ ...EMPTY_BOARD });
  const [viewBoard,   setViewBoard]   = useState({ ...EMPTY_BOARD });
  const [loading,     setLoading]     = useState(false);
  const [lightbox,    setLightbox]    = useState(null);
  const [addModal,    setAddModal]    = useState(null);
  const [vouchModal,  setVouchModal]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [buddies,     setBuddies]     = useState([]);
  const [pendingIn,   setPendingIn]   = useState([]);
  const [buddyModal,  setBuddyModal]  = useState(false);
  const [inviteLink,  setInviteLink]  = useState(null);
  const [myReactions, setMyReactions] = useState([]); // items I reacted to
  const [boardReactions, setBoardReactions] = useState([]); // reactions on viewed board

  const loadMyReactions = async (uid) => {
    const { data } = await supabase.from("reactions").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    setMyReactions(data || []);
  };

  const loadBoardReactions = async (ownerId) => {
    const { data } = await supabase.from("reactions").select("*").eq("item_owner_id", ownerId).order("created_at", { ascending: false });
    setBoardReactions(data || []);
  };

  const loadBoard = async (uid) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("endorsements").select("*").eq("user_id", uid).order("created_at", { ascending: true });
    if (!error && data) {
      const b = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
      data.forEach(row => {
        const cat = row.category;
        if (b[cat] && b[cat].length < 5) {
          b[cat].push({ id: row.item_id, title: row.title, sub: row.subtitle || "", poster: row.poster || null, comment: row.comment || "", vouched: row.vouched || false, sourceUrl: row.source_url || null, dbId: row.id });
        }
      });
      setBoard(b);
    }
    setLoading(false);
  };

  const loadViewBoard = async (uid) => {
    const { data, error } = await supabase
      .from("endorsements").select("*").eq("user_id", uid).order("created_at", { ascending: true });
    if (!error && data) {
      const b = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
      data.forEach(row => {
        const cat = row.category;
        if (b[cat] && b[cat].length < 5) {
          b[cat].push({ id: row.item_id, title: row.title, sub: row.subtitle || "", poster: row.poster || null, comment: row.comment || "", vouched: row.vouched || false, sourceUrl: row.source_url || null, dbId: row.id });
        }
      });
      setViewBoard(b);
    }
  };

  const loadBuddies = async (uid) => {
    const { data } = await supabase
      .from("buddies")
      .select("*, requester:requester_id(id, username, display_name), receiver:receiver_id(id, username, display_name)")
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`);
    if (data) {
      const accepted = data.filter(b => b.status === "accepted").map(b => {
        const other = b.requester_id === uid ? b.receiver : b.requester;
        return { buddyRowId: b.id, userId: other.id, username: other.username, displayName: other.display_name };
      });
      const incoming = data.filter(b => b.status === "pending" && b.receiver_id === uid).map(b => ({
        buddyRowId: b.id, userId: b.requester.id, username: b.requester.username, displayName: b.requester.display_name
      }));
      setBuddies(accepted);
      setPendingIn(incoming);
    }
  };

  useEffect(() => {
    const setUserFromSession = async (session) => {
      if (session?.user) {
        const uid = session.user.id;
        // Upsert profile on login
        await supabase.from("profiles").upsert({
          id: uid,
          username: session.user.email.split("@")[0],
          display_name: session.user.user_metadata?.full_name || session.user.email.split("@")[0],
        }, { onConflict: "id" });
        setUser({ username: session.user.email.split("@")[0], displayName: session.user.user_metadata?.full_name || session.user.email.split("@")[0] });
        setUserId(uid);
        loadBoard(uid);
        loadBuddies(uid);
        loadMyReactions(uid);
        // Handle invite token from URL
        const params = new URLSearchParams(window.location.search);
        const inviteFrom = params.get("invite");
        if (inviteFrom && inviteFrom !== uid) {
          await supabase.from("buddies").upsert({ requester_id: inviteFrom, receiver_id: uid, status: "accepted" }, { onConflict: "requester_id,receiver_id" });
          await supabase.from("buddies").upsert({ requester_id: uid, receiver_id: inviteFrom, status: "accepted" }, { onConflict: "requester_id,receiver_id" });
          window.history.replaceState({}, "", window.location.pathname);
          loadBuddies(uid);
        }
      } else {
        setUser(null); setUserId(null); setBoard({ ...EMPTY_BOARD });
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => setUserFromSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUserFromSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const [legalPage, setLegalPage] = useState(null); // "terms" | "privacy" | null

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); };

  const isOwn     = !viewing;
  const currBoard = isOwn ? board : viewBoard;
  const currName  = isOwn ? user?.displayName : viewing?.displayName || viewing?.username;

  const dudeSame = async (item) => {
    if (!userId || !viewing) return;
    const already = myReactions.find(r => r.item_id === String(item.id) && r.item_owner_id === viewing.userId);
    if (already) {
      await supabase.from("reactions").delete().eq("id", already.id);
    } else {
      await supabase.from("reactions").upsert({
        user_id: userId,
        item_owner_id: viewing.userId,
        item_id: String(item.id),
        title: item.title,
        subtitle: item.sub || item.artist || item.author || "",
        poster: item.poster || null,
        source_url: item.sourceUrl || null,
      }, { onConflict: "user_id,item_owner_id,item_id" });
    }
    loadMyReactions(userId);
    loadBoardReactions(viewing.userId);
  };

  const generateInviteLink = () => {
    const link = `${window.location.origin}?invite=${userId}`;
    setInviteLink(link);
    navigator.clipboard?.writeText(link);
  };

  const sendBuddyRequest = async (receiverId) => {
    await supabase.from("buddies").upsert({ requester_id: userId, receiver_id: receiverId, status: "pending" }, { onConflict: "requester_id,receiver_id" });
    loadBuddies(userId);
  };

  const acceptBuddy = async (buddyRowId) => {
    await supabase.from("buddies").update({ status: "accepted" }).eq("id", buddyRowId);
    loadBuddies(userId);
  };

  const removeBuddy = async (buddyRowId) => {
    await supabase.from("buddies").delete().eq("id", buddyRowId);
    loadBuddies(userId);
  };

  const viewBuddy = async (buddy) => {
    setViewing(buddy);
    setTab("board");
    await loadViewBoard(buddy.userId);
    await loadBoardReactions(buddy.userId);
  };

  const addItem = async (catKey, item) => {
    if (saving) return;
    setSaving(true);
    const timeout = setTimeout(() => setSaving(false), 8000); // safety reset
    try {
      await supabase.from("endorsements").upsert({
        user_id: userId,
        category: catKey,
        item_id: String(item.id),
        title: item.title,
        subtitle: item.sub || "",
        poster: item.poster || null,
        comment: item.comment || "",
        vouched: item.vouched || false,
        source_url: item.sourceUrl || null,
      }, { onConflict: "user_id,category,item_id" });
      await loadBoard(userId);
    } catch(e) { console.error(e); }
    clearTimeout(timeout);
    setSaving(false);
  };

  const removeItem = async (catKey, idx) => {
    if (saving) return;
    setSaving(true);
    const timeout = setTimeout(() => setSaving(false), 8000);
    try {
      const item = board[catKey]?.[idx];
      if (item?.dbId) {
        await supabase.from("endorsements").delete().eq("id", item.dbId);
      }
      await loadBoard(userId);
    } catch(e) { console.error(e); }
    clearTimeout(timeout);
    setSaving(false);
  };



  const inviteParam = new URLSearchParams(window.location.search).get("invite");

  if (!user) {
    if (inviteParam) {
      return <PublicBoard inviteUserId={inviteParam} onSignUp={() => {
        supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + `?invite=${inviteParam}` } });
      }} />;
    }
    return <><Styles /><Auth /></>;
  }
  if (loading) return <><Styles /><div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}><div className="loading">Loading…</div></div></>;


  return (
    <>
      <Styles />
      <div className="app">
        <header className="masthead">
          <div className="masthead-meta">
            <span>Vol. I &nbsp;·&nbsp; {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            <span className="masthead-meta-stars">✦ · ✦ · ✦</span>
            <span>
              <span className="clickable" onClick={() => setLegalPage("how")} style={{ marginRight: 16 }}>How it Works</span>
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
            <button className={`nav-btn${tab === "friends" ? " active" : ""}`} onClick={() => { setTab("friends"); setViewing(null); }}>
              Buddies {pendingIn.length > 0 && <span style={{ background: T.ink, color: T.bg, borderRadius: "50%", fontSize: 9, padding: "1px 5px", marginLeft: 4 }}>{pendingIn.length}</span>}
            </button>
            {viewing && <button className="nav-btn active">{currName}'s Board</button>}
          </nav>
        </header>

        <main className="page">
          {tab === "friends" && !viewing
            ? <>
                <div className="board-header">
                  <div>
                    <div className="board-name">Buddies</div>
                    <div className="board-sub">{buddies.length} connection{buddies.length !== 1 ? "s" : ""}</div>
                  </div>
                  <button className="btn btn-solid" onClick={() => setBuddyModal(true)}>+ Add Buddy</button>
                </div>
                <div className="ornament">· · ·</div>

                {pendingIn.length > 0 && <>
                  <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "10px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 12 }}>Pending Requests</div>
                  {pendingIn.map(b => (
                    <div key={b.buddyRowId} className="friend-row">
                      <div>
                        <div className="friend-name">{b.displayName}</div>
                        <div className="friend-handle">@{b.username}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-solid" style={{ padding: "5px 14px" }} onClick={() => acceptBuddy(b.buddyRowId)}>Accept</button>
                        <button className="btn btn-ghost" style={{ padding: "5px 14px" }} onClick={() => removeBuddy(b.buddyRowId)}>Decline</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderBottom: `1px solid ${T.paperDark}`, margin: "20px 0" }} />
                </>}

                {buddies.length === 0 && pendingIn.length === 0 && (
                  <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: T.inkLight, padding: "24px 0" }}>No buddies yet — add one or share your invite link.</div>
                )}

                {buddies.map(b => (
                  <div key={b.buddyRowId} className="friend-row" onClick={() => viewBuddy(b)}>
                    <div>
                      <div className="friend-name">{b.displayName}</div>
                      <div className="friend-handle">@{b.username}</div>
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
                      {viewing && <span style={{ fontWeight: 400, fontSize: 16, color: T.inkLight, marginLeft: 10 }}>@{viewing?.username}</span>}
                    </div>
                    <div className="board-sub">
                      {isOwn ? user.displayName : `${currName}'s board`}
                    </div>
                  </div>
                  {viewing && <button className="btn btn-ghost" onClick={() => { setViewing(null); setTab("friends"); }}>← Back</button>}
                </div>
                <div className="ornament">— ✦ —</div>

                <VouchSection board={currBoard} isOwn={isOwn} onCard={(k, i) => setLightbox({ catKey: k, idx: i })} onAdd={() => setVouchModal(true)} onRemove={removeItem} onDudeSame={dudeSame} myReactions={myReactions.filter(r => viewing && r.item_owner_id === viewing.userId).map(r => r.item_id)} />

                {CATEGORIES.map(cat => (
                  <CatSection key={cat.key} catKey={cat.key} label={cat.label} items={currBoard[cat.key] || []} isOwn={isOwn} onCard={(k, i) => setLightbox({ catKey: k, idx: i })} onAdd={setAddModal} onRemove={removeItem} onDudeSame={dudeSame} myReactions={myReactions.filter(r => viewing && r.item_owner_id === viewing.userId).map(r => r.item_id)} />
                ))}

                <MutualMentions
                  reactions={boardReactions}
                  myReactions={myReactions}
                  isOwn={isOwn}
                  boardOwnerName={currName}
                />
              </>
          }
        </main>

        {lightbox && (() => {
          const items = currBoard[lightbox.catKey] || [];
          if (!items.length) return null;
          return <Lightbox items={items} start={lightbox.idx} catLabel={CATEGORIES.find(c => c.key === lightbox.catKey)?.label} onClose={() => setLightbox(null)} />;
        })()}

        {buddyModal && (
          <BuddyModal
            userId={userId}
            onClose={() => { setBuddyModal(false); setInviteLink(null); }}
            onSendRequest={sendBuddyRequest}
            onGenerateLink={generateInviteLink}
            inviteLink={inviteLink}
            existingBuddyIds={buddies.map(b => b.userId)}
          />
        )}

        {vouchModal && (
          <UniversalSearchModal
            used={Math.min(Object.values(board).flat().length, 5)}
            onClose={() => setVouchModal(false)}
            onAdd={(catKey, item) => {
              addItem(catKey, { ...item, vouched: true });
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

        {legalPage && <LegalModal page={legalPage} onClose={() => setLegalPage(null)} />}

        <footer style={{ borderTop: `3px double ${T.ink}`, marginTop: 64, padding: "24px 28px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid }}>
            © {new Date().getFullYear()} Vouch. All Rights Reserved.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <button onClick={() => setLegalPage("terms")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkMid, textDecoration: "underline" }}>Terms of Use</button>
            <button onClick={() => setLegalPage("privacy")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkMid, textDecoration: "underline" }}>Privacy Policy</button>
          </div>
        </footer>
      </div>
    </>
  );
}