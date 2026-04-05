import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const AVATAR_OPTIONS = [
  { file: "book",               label: "Book" },
  { file: "cassette",           label: "Cassette" },
  { file: "cassette-deck",      label: "Cassette Deck" },
  { file: "cd",                 label: "CD" },
  { file: "clapper",            label: "Clapper" },
  { file: "drums",              label: "Drums" },
  { file: "dvds",               label: "DVDs" },
  { file: "earbuds",            label: "Earbuds" },
  { file: "film-camera",        label: "Film Camera" },
  { file: "gameboy",            label: "Game Boy" },
  { file: "guitar",             label: "Guitar" },
  { file: "headphones",         label: "Headphones" },
  { file: "microphone-studio",  label: "Studio Mic" },
  { file: "microphone-vintage", label: "Vintage Mic" },
  { file: "pen",                label: "Pen & Paper" },
  { file: "sheet-music",        label: "Sheet Music" },
  { file: "stone-tablet",       label: "Vintage TV" },
  { file: "typewriter",         label: "Typewriter" },
  { file: "vhs",                label: "VHS" },
  { file: "vinyl",              label: "Vinyl" },
];

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

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

const BOARD_THEMES = [
  "Seasonal", "All-Timers", "Feelin Lately", "Nostalgic",
  "New Releases", "Deep Cuts", "Underrated", "No Boundaries",
  "Locals Only", "Other"
];

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

    .masthead { background: ${T.bg}; border-bottom: 3px double ${T.ink}; user-select: none; }
    .masthead-meta {
      display: flex; justify-content: space-between; align-items: center;
      padding: 7px 14px; border-bottom: 1px solid ${T.ink};
      font-family: 'Spectral SC', serif; font-size: 8px; letter-spacing: 0.12em;
      color: ${T.inkMid}; text-transform: uppercase; white-space: nowrap; gap: 8px;
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
    .masthead-rule-ornament { text-align: center; font-family: 'Spectral', serif; font-size: 11px; color: ${T.inkLight}; padding: 4px 0 2px; display: flex; align-items: center; justify-content: center; gap: 10px; letter-spacing: 0; }
    .masthead-tagline { text-align: center; font-family: 'Spectral', serif; font-style: italic; font-weight: 300; font-size: 12.5px; letter-spacing: 0.12em; color: ${T.inkLight}; padding-bottom: 12px; }

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

    .page { max-width: 1380px; margin: 0 auto; padding: 0 28px 80px; }
    .board-header { display: flex; justify-content: space-between; align-items: flex-end; padding: 30px 0 18px; border-bottom: 1px solid ${T.ink}; margin-bottom: 32px; }
    .board-name { font-family: 'Spectral', serif; font-weight: 700; font-size: 26px; }
    .board-sub  { font-family: 'Spectral SC', serif; font-size: 10px; letter-spacing: 0.16em; color: ${T.inkLight}; margin-top: 5px; }

    .btn { font-family: 'Spectral SC', serif; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; padding: 8px 20px; border: 1px solid ${T.ink}; cursor: pointer; transition: background 0.14s, color 0.14s; }
    .btn-solid { background: ${T.ink}; color: ${T.bg}; }
    .btn-solid:hover { background: ${T.inkMid}; }
    .btn-ghost { background: transparent; color: ${T.ink}; }
    .btn-ghost:hover { background: ${T.ink}; color: ${T.bg}; }

    .ornament { text-align: center; font-family: 'Spectral', serif; font-size: 13px; color: ${T.inkFaint}; margin: 4px 0 28px; display: flex; align-items: center; justify-content: center; gap: 8px; }

    .vouch-section { margin-bottom: 52px; border: 3px double ${T.ink}; background: ${T.ink}; padding: 28px 28px 32px; position: relative; }
    .vouch-section-header { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; border-bottom: 1px solid rgba(200,194,180,0.25); padding-bottom: 12px; margin-bottom: 24px; }
    .vouch-section-label { font-family: 'Times New Roman', Times, serif; font-weight: 900; font-size: 22px; letter-spacing: 0.04em; white-space: nowrap; color: ${T.bg}; }
    .vouch-section-sub   { font-family: 'Spectral', serif; font-style: italic; font-size: 11px; color: rgba(200,194,180,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vouch-section-add   { margin-left: auto; font-family: 'Spectral SC', serif; font-size: 9.5px; font-weight: 600; letter-spacing: 0.2em; padding: 4px 14px; border: 1px solid rgba(200,194,180,0.4); background: transparent; color: ${T.bg}; cursor: pointer; transition: all 0.14s; }
    .vouch-section-add:hover { background: rgba(200,194,180,0.15); }

    .cards-row-large { display: flex; gap: 12px; flex-wrap: nowrap; }
    .card-large { flex: 1; min-width: 0; cursor: pointer; }
    .card-poster-large { width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block; border: 1px solid ${T.paperDark}; transition: transform 0.2s, box-shadow 0.2s; }
    .card-poster-placeholder-large { width: 100%; aspect-ratio: 2/3; background: ${T.paperDark}; border: 1px solid ${T.paperDark}; display: flex; align-items: center; justify-content: center; font-family: 'Spectral', serif; font-style: italic; font-size: 12px; color: ${T.inkLight}; text-align: center; padding: 14px; }
    .slot-empty-large { flex: 1; min-width: 0; aspect-ratio: 2/3; border: 1px dashed rgba(200,194,180,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.14s, background 0.14s; }
    .slot-empty-large:hover { background: rgba(200,194,180,0.06); }
    .slot-empty-inner { text-align: center; font-family: 'Spectral SC', serif; font-size: 9.5px; letter-spacing: 0.18em; color: rgba(200,194,180,0.4); }
    .slot-empty-plus  { display: block; font-size: 22px; margin-bottom: 6px; color: ${T.paperDark}; }

    .cat-section { margin-bottom: 44px; }
    .cat-header { display: flex; align-items: baseline; gap: 14px; border-bottom: 2px solid ${T.ink}; padding-bottom: 10px; margin-bottom: 18px; }
    .cat-label { font-family: 'Spectral SC', serif; font-weight: 700; font-size: 17px; letter-spacing: 0.08em; }
    .cat-sublabel { font-family: 'Spectral', serif; font-style: italic; font-size: 11px; color: ${T.inkLight}; }
    .cat-count { font-family: 'Spectral SC', serif; font-size: 9.5px; letter-spacing: 0.18em; color: ${T.inkFaint}; }
    .cat-add { margin-left: auto; font-family: 'Spectral SC', serif; font-size: 9.5px; font-weight: 600; letter-spacing: 0.2em; padding: 4px 14px; border: 1px solid ${T.inkLight}; background: transparent; color: ${T.inkMid}; cursor: pointer; transition: all 0.14s; }
    .cat-add:hover { border-color: ${T.ink}; color: ${T.ink}; }

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

    .friend-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid ${T.paperDark}; cursor: pointer; }
    .friend-row:hover .friend-name { text-decoration: underline; }
    .friend-name   { font-family: 'Spectral', serif; font-weight: 600; font-size: 15px; }
    .friend-handle { font-family: 'Spectral SC', serif; font-size: 10px; letter-spacing: 0.1em; color: ${T.inkLight}; margin-top: 2px; }
    .friend-arrow  { font-size: 13px; color: ${T.inkFaint}; }

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
      .cards-row-large { flex-direction: column; gap: 0; }
      .card-large { width: 100%; }
      .card-poster-large { width: 100%; height: auto; aspect-ratio: 2/3; }
      .card-poster-placeholder-large { width: 100%; aspect-ratio: 2/3; height: auto; }
      .slot-empty-large { width: 100%; aspect-ratio: 2/3; height: auto; margin-bottom: 0; }
      .cards-row { flex-direction: row; flex-wrap: nowrap; overflow-x: auto; gap: 10px; padding-bottom: 8px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
      .cards-row::-webkit-scrollbar { display: none; }
      .card { width: 90px; flex-shrink: 0; }
      .card-poster { width: 90px; height: 124px; flex-shrink: 0; }
      .card-poster-placeholder { width: 90px; height: 124px; flex-shrink: 0; font-size: 9px; }
      .card:hover .card-poster { transform: none; box-shadow: none; }
      .slot-empty-sm { width: 90px; height: 124px; flex-shrink: 0; }
      .page { padding: 0 16px 60px; }
      .masthead-meta { padding: 7px 16px; }
      .vouch-section { padding: 16px 14px 20px; }
    }
  `}</style>
);

function Auth({ inviteUserId }) {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + `?invite=${inviteUserId}` }
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
  const [board, setBoard]           = useState(null);
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showSignupNudge, setShowSignupNudge] = useState(false);
  const [publicBuddies, setPublicBuddies] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: prof } = await supabase
          .from("profiles").select("id, username, display_name").eq("id", inviteUserId).maybeSingle();
        if (prof) setProfile(prof);
        // Load buddies for public display
        const { data: buddyRows } = await supabase
          .from("buddies")
          .select("requester_id, receiver_id")
          .or(`requester_id.eq.${inviteUserId},receiver_id.eq.${inviteUserId}`)
          .eq("status", "accepted");
        if (buddyRows && buddyRows.length > 0) {
          const buddyIds = buddyRows.map(b =>
            b.requester_id === inviteUserId ? b.receiver_id : b.requester_id
          ).filter(Boolean);
          const { data: profiles } = await supabase
            .from("profiles").select("id, display_name, avatar_url").in("id", buddyIds);
          if (profiles) setPublicBuddies(profiles);
        }
        const { data: rows } = await supabase
          .from("endorsements").select("*").eq("user_id", inviteUserId).order("created_at", { ascending: true });
        if (rows && rows.length > 0) {
          const b = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
          rows.forEach(row => {
            if (b[row.category] && b[row.category].length < 5) {
              b[row.category].push({
                id: row.item_id, title: row.title, sub: row.subtitle || "",
                poster: row.poster || null, comment: row.comment || "",
                vouched: row.vouched || false, sourceUrl: row.source_url || null,
              });
            }
          });
          setBoard(b);
        } else {
          setBoard({ movies: [], albums: [], artists: [], songs: [], books: [], shows: [] });
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [inviteUserId]);

  if (loading) return <><Styles /><div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}><div className="loading">Loading…</div></div></>;
  if (!board) return <><Styles /><Auth inviteUserId={inviteUserId} /></>;

  const name = profile?.display_name || profile?.username || "Someone";

  return (
    <>
      <Styles />
      <div className="app">
        <div style={{ background: T.ink, color: T.bg, padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14 }}>
            You're viewing <strong style={{ fontStyle: "normal" }}>{name}'s</strong> Vouch board.
          </div>
          <button onClick={onSignUp} style={{ background: T.bg, color: T.ink, border: "none", fontFamily: "'Spectral SC',serif", fontSize: "10px", letterSpacing: "0.15em", padding: "10px 18px", cursor: "pointer", width: "100%" }}>
            Create Your Own →
          </button>
        </div>
        <header className="masthead">
          <div className="masthead-meta">
            <span style={{ flex: 1 }}>Est. 2026</span>
            <span className="masthead-meta-stars" style={{ flex: "0 0 auto" }}>✦ · ✦ · ✦</span>
            <span style={{ flex: 1, display: "flex", justifyContent: "flex-end", fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkMid }}>vouch5.com</span>
          </div>
          <div className="masthead-nameplate"><span className="nameplate-word">Vouch.</span></div>
          <div className="masthead-rule-ornament"><span>—</span><span>✦</span><span>—</span></div>
          <div className="masthead-tagline">Love it? Vouch for it.</div>
        </header>
        <main className="page">
          <div style={{ marginBottom: 20 }}>
            <div className="board-name" style={{ fontSize: 28, marginBottom: 2 }}>{name}</div>
            <div className="board-sub" style={{ marginBottom: 14 }}>@{profile?.username || ""}</div>
            <button onClick={onSignUp} className="btn btn-solid" style={{ width: "100%", padding: "12px", fontSize: 13 }}>Create Your Own Vouch Board →</button>
          </div>
          <div style={{ marginBottom: 24, borderTop: `1px solid ${T.paperDark}`, borderBottom: `1px solid ${T.paperDark}`, padding: "14px 0", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 8 }}>
            {[{label: "Vouch 5", desc: "Your top 5 picks across all media"},{label: "Categories", desc: "Up to 5 per Film, Music, Books, TV"},{label: "Buddies", desc: "See what friends are vouching for"}].map(item => (
              <div key={item.label} style={{ textAlign: "center", flex: "1 1 100px" }}>
                <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.15em", color: T.ink }}>{item.label}</div>
                <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkMid, marginTop: 3 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="ornament"><span>—</span><span>✦</span><span>—</span></div>
          <VouchSection board={board} isOwn={false} onCard={() => {}} onAdd={() => {}} onRemove={() => {}} onDudeSame={() => setShowSignupNudge(true)} myReactions={[]} />
          {publicBuddies.length > 0 && (
            <div style={{ margin: "32px 0", borderTop: `1px solid ${T.paperDark}`, paddingTop: 24 }}>
              <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", color: T.inkMid, marginBottom: 16 }}>Also on Vouch</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {publicBuddies.map((b, i) => (
                  <div key={i} onClick={() => setShowSignupNudge(true)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <Avatar name={b.display_name} size={56} avatarUrl={b.avatar_url} />
                    <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: T.inkMid, borderBottom: `1px solid transparent` }}
                      onMouseEnter={e => e.currentTarget.style.borderBottomColor = T.inkLight}
                      onMouseLeave={e => e.currentTarget.style.borderBottomColor = "transparent"}>
                      {b.display_name}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkFaint, marginTop: 14 }}>
                Sign up to see their boards →
              </div>
            </div>
          )}
          {[...CATEGORIES].sort((a, b) => (board[b.key] || []).length - (board[a.key] || []).length).map(cat => {
            const items = board[cat.key] || [];
            if (items.length === 0) return null;
            return <CatSection key={cat.key} catKey={cat.key} label={cat.label} items={items} isOwn={false} onCard={() => {}} onAdd={() => {}} onRemove={() => {}} onDudeSame={() => setShowSignupNudge(true)} myReactions={[]} />;
          })}
          <div style={{ marginTop: 48, padding: "32px 0", borderTop: `3px double ${T.ink}`, textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Make your own board.</div>
            <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: T.inkMid, marginBottom: 24 }}>What would you put your name behind right now?</div>
            <button onClick={onSignUp} className="btn btn-solid" style={{ fontSize: 13, padding: "12px 32px" }}>Get Started — It's Free</button>
          </div>
        </main>
        <footer style={{ borderTop: `3px double ${T.ink}`, padding: "24px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid }}>© {new Date().getFullYear()} Vouch. All Rights Reserved.</div>
        </footer>

        {showSignupNudge && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(17,16,8,0.82)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowSignupNudge(false)}>
            <div style={{ background: T.bg, maxWidth: 420, width: "100%", border: `2px solid ${T.ink}`, padding: "32px 28px" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily: "'Times New Roman',Times,serif", fontWeight: 900, fontSize: 36, marginBottom: 4 }}>Vouch.</div>
              <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight, marginBottom: 24 }}>Love it? Vouch for it.</div>
              <div style={{ marginBottom: 28, borderBottom: `1px solid ${T.paperDark}`, paddingBottom: 28 }}>
                <HowItWorks />
              </div>
              <button onClick={onSignUp} style={{ width: "100%", fontFamily: "'Spectral SC',serif", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.25em", padding: 13, background: T.ink, color: T.bg, border: "none", cursor: "pointer" }}>
                Create Your Account →
              </button>
              <button onClick={() => setShowSignupNudge(false)} style={{ width: "100%", fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", padding: "10px", background: "transparent", color: T.inkFaint, border: "none", cursor: "pointer", marginTop: 8 }}>
                Maybe later
              </button>
            </div>
          </div>
        )}
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
          <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.15em", color: T.ink, marginBottom: 5 }}>Collection</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, fontStyle: "italic", color: T.inkMid }}>Your shelf — films, albums, books, shows you'd put your name behind. Add freely, no pressure.</div>
        </div>
        <div style={{ borderTop: `1px solid ${T.paperDark}` }} />
        <div>
          <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.15em", color: T.ink, marginBottom: 5 }}>Buddies</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, fontStyle: "italic", color: T.inkMid }}>Connect with friends and see what they're vouching for. Hit "Agree" on anything that resonates.</div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, size = 36, avatarUrl }) {
  const parts = (name || "?").trim().split(" ");
  const initials = parts.length >= 2
    ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
  const [imgFailed, setImgFailed] = useState(false);
  if (avatarUrl && !imgFailed) {
    return (
      <img src={avatarUrl} alt={name} onError={() => setImgFailed(true)}
        style={{ width: size, height: size, objectFit: "cover", flexShrink: 0, display: "block", border: `1px solid ${T.paperDark}`, filter: "grayscale(100%)" }} />
    );
  }
  return (
    <div style={{
      width: size, height: size,
      background: T.ink, color: T.bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Times New Roman', Times, serif", fontWeight: 900,
      fontSize: size * 0.33, letterSpacing: "0.04em", userSelect: "none"
    }}>
      {initials}
    </div>
  );
}

function IOSInstallBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone;
    const dismissed = localStorage.getItem("vouch-install-dismissed");
    if (isIOS && !isStandalone && !dismissed) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, background: T.ink, color: T.bg, padding: "14px 20px 28px", display: "flex", alignItems: "flex-start", gap: 14, boxShadow: "0 -4px 20px rgba(0,0,0,0.3)" }}>
      <div style={{ width: 44, height: 44, background: T.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Times New Roman',Times,serif", fontWeight: 900, fontSize: 22, color: T.ink, fontStyle: "italic" }}>V.</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", marginBottom: 4 }}>Add Vouch to your Home Screen</div>
        <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: "rgba(200,194,180,0.7)", lineHeight: 1.5 }}>
          Tap <strong style={{ fontStyle: "normal" }}>Share</strong> in your browser then <strong style={{ fontStyle: "normal" }}>"Add to Home Screen"</strong> for the full app experience.
        </div>
      </div>
      <button onClick={() => { setShow(false); localStorage.setItem("vouch-install-dismissed", "1"); }} style={{ background: "transparent", border: "none", color: "rgba(200,194,180,0.5)", fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
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
          const list = (data.results || []).slice(0, 8);
          const withImdb = await Promise.all(list.map(async r => {
            try {
              const ext = await fetch(`https://api.themoviedb.org/3/movie/${r.id}/external_ids?api_key=${TMDB}`).then(x => x.json());
              return { id: r.id, title: r.title, sub: r.release_date ? r.release_date.slice(0, 4) : "", poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null, sourceUrl: ext.imdb_id ? `https://www.imdb.com/title/${ext.imdb_id}/` : `https://www.imdb.com/find?q=${encodeURIComponent(r.title)}` };
            } catch { return { id: r.id, title: r.title, sub: r.release_date ? r.release_date.slice(0, 4) : "", poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null, sourceUrl: `https://www.imdb.com/find?q=${encodeURIComponent(r.title)}` }; }
          }));
          setResults(withImdb);
        } else if (catKey === "shows") {
          const res  = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB}&query=${encodeURIComponent(q)}&language=en-US`);
          const data = await res.json();
          const list = (data.results || []).slice(0, 8);
          const withImdb = await Promise.all(list.map(async r => {
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
            setResults((data.tracks?.items || []).slice(0, 8).map(r => ({ id: r.id, title: r.name, sub: r.artists?.[0]?.name || "", poster: r.album?.images?.[0]?.url || null, sourceUrl: `https://open.spotify.com/track/${r.id}` })));
          } else if (catKey === "albums") {
            setResults((data.albums?.items || []).slice(0, 8).map(r => ({ id: r.id, title: r.name, sub: r.artists?.[0]?.name || "", poster: r.images?.[0]?.url || null, sourceUrl: `https://open.spotify.com/album/${r.id}` })));
          } else {
            setResults((data.artists?.items || []).slice(0, 8).map(r => ({ id: r.id, title: r.name, sub: r.genres?.[0] || "", poster: r.images?.[0]?.url || null, sourceUrl: `https://open.spotify.com/artist/${r.id}` })));
          }
        } else if (catKey === "books") {
          const res  = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&language=eng`);
          const data = await res.json();
          setResults((data.docs || []).slice(0, 8).map(r => {
            const coverId = r.cover_i;
            const isbn = (r.isbn || [])[0];
            const poster = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null;
            return { id: r.key || r.title, title: r.title, sub: (r.author_name || []).join(", "), poster, sourceUrl: `https://openlibrary.org${r.key}` };
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
            ? <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: T.inkLight, padding: "12px 0" }}>You've added 5 {catLabel} picks — remove one to swap it out.</div>
            : picked
              ? <>
                  <div className="selected-preview">
                    <img src={picked.poster} alt={picked.title} className="result-img" onError={e => { e.target.style.background = T.paperDark; e.target.src = ""; }} />
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
                    {remaining > 0 ? `${remaining} more can be added` : ""}
                  </div>
                  <input className="search-input" placeholder={`Search ${catLabel.toLowerCase()}…`} value={q} onChange={e => setQ(e.target.value)} autoFocus />
                  {busy && <div className="loading">Searching…</div>}
                  {!busy && q.trim() && results.length === 0 && <div className="no-results">No results found.</div>}
                  {results.map(r => (
                    <div key={r.id} className="result-item" onClick={() => setPicked(r)}>
                      {r.poster ? <img src={r.poster} alt={r.title} className="result-img" onError={e => { e.target.style.background = T.paperDark; e.target.src = ""; }} /> : <div className="result-img" />}
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
    { key: "all",     label: "All"     },
    { key: "movies",  label: "Film"    },
    { key: "shows",   label: "TV"      },
    { key: "songs",   label: "Songs"   },
    { key: "albums",  label: "Albums"  },
    { key: "artists", label: "Artists" },
    { key: "books",   label: "Books"   },
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
        const tvResults    = (tvRes.results || []).slice(0, 2);
        const [movieIds, tvIds] = await Promise.all([
          Promise.all(movieResults.map(r => fetch(`https://api.themoviedb.org/3/movie/${r.id}/external_ids?api_key=${TMDB}`).then(x => x.json()).catch(() => ({})))),
          Promise.all(tvResults.map(r => fetch(`https://api.themoviedb.org/3/tv/${r.id}/external_ids?api_key=${TMDB}`).then(x => x.json()).catch(() => ({})))),
        ]);
        movieResults.forEach((r, i) => mixed.push({ id: r.id, title: r.title, catKey: "movies", catLabel: "Film", sub: r.release_date ? r.release_date.slice(0, 4) : "", poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null, sourceUrl: movieIds[i]?.imdb_id ? `https://www.imdb.com/title/${movieIds[i].imdb_id}/` : `https://www.imdb.com/find?q=${encodeURIComponent(r.title)}` }));
        tvResults.forEach((r, i) => mixed.push({ id: r.id, title: r.name, catKey: "shows", catLabel: "Television", sub: r.first_air_date ? r.first_air_date.slice(0, 4) : "", poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null, sourceUrl: tvIds[i]?.imdb_id ? `https://www.imdb.com/title/${tvIds[i].imdb_id}/` : `https://www.imdb.com/find?q=${encodeURIComponent(r.name)}` }));
        (trackRes.tracks?.items || []).slice(0, 3).forEach(r => mixed.push({ id: r.id, title: r.name, catKey: "songs", catLabel: "Songs", sub: r.artists?.[0]?.name || "", poster: r.album?.images?.[0]?.url || null, sourceUrl: `https://open.spotify.com/track/${r.id}` }));
        (albumRes.albums?.items || []).slice(0, 2).forEach(r => mixed.push({ id: r.id, title: r.name, catKey: "albums", catLabel: "Albums", sub: r.artists?.[0]?.name || "", poster: r.images?.[0]?.url || null, sourceUrl: `https://open.spotify.com/album/${r.id}` }));
        (artistRes.artists?.items || []).slice(0, 2).forEach(r => mixed.push({ id: r.id, title: r.name, catKey: "artists", catLabel: "Artists", sub: r.genres?.[0] || "", poster: r.images?.[0]?.url || null, sourceUrl: `https://open.spotify.com/artist/${r.id}` }));
        (booksRes.docs || []).slice(0, 2).forEach(r => {
          const coverId = r.cover_i;
          const isbn = (r.isbn || [])[0];
          const poster = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null;
          mixed.push({ id: r.key || r.title, title: r.title, catKey: "books", catLabel: "Book", sub: (r.author_name || []).join(", "), poster, sourceUrl: `https://openlibrary.org${r.key}` });
        });
        setResults(mixed);
      } catch(e) { console.error(e); }
      setBusy(false);
    }, 400);
  }, [q]);

  const confirm = async () => {
    if (!picked) return;
    await onAdd(picked.catKey, { ...picked, comment: note });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Add to Vouch 5</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {remaining <= 0
            ? <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: T.inkLight, padding: "12px 0" }}>Your Vouch 5 is full.</div>
            : picked
              ? <>
                  <div className="selected-preview">
                    <img src={picked.poster} alt={picked.title} className="result-img" onError={e => { e.target.style.background = T.paperDark; e.target.src = ""; }} />
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
                    {remaining > 0 ? `${remaining} more can be added` : ""}
                  </div>
                  <input className="search-input" placeholder="Search films, shows, songs, albums, artists, books…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    {FILTERS.map(f => (
                      <button key={f.key} onClick={() => setFilter(f.key)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", padding: "4px 10px", border: `1px solid ${filter === f.key ? T.ink : T.paperDark}`, background: filter === f.key ? T.ink : "transparent", color: filter === f.key ? T.bg : T.inkMid, cursor: "pointer", transition: "all 0.12s" }}>{f.label}</button>
                    ))}
                  </div>
                  {busy && <div className="loading">Searching…</div>}
                  {!busy && q.trim() && visibleResults.length === 0 && <div className="no-results">No results found.</div>}
                  {visibleResults.map((r, i) => (
                    <div key={r.id + r.catKey + i} className="result-item" onClick={() => setPicked(r)}>
                      {r.poster ? <img src={r.poster} alt={r.title} className="result-img" onError={e => { e.target.style.background = T.paperDark; e.target.src = ""; }} /> : <div className="result-img" />}
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

function VouchSection({ board, isOwn, onCard, onAdd, onRemove, onDudeSame, myReactions, buddyCounts }) {
  const [idx, setIdx]      = useState(0);
  const touchStartX        = useRef(null);
  const touchStartY        = useRef(null);
  const currentOffsetX     = useRef(0);
  const isHoriz            = useRef(false);
  const containerRef       = useRef(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;

  const allItems = [];
  CATEGORIES.forEach(cat => {
    (board[cat.key] || []).forEach(item => {
      if (item.vouched) allItems.push({ ...item, _cat: cat.key, _catLabel: cat.label });
    });
  });
  const total = allItems.length;

  useEffect(() => { if (idx >= total && total > 0) setIdx(total - 1); }, [total, idx]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isMobile) return;
    const handleStart = e => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; currentOffsetX.current = 0; isHoriz.current = false; };
    const handleMove = e => {
      if (touchStartX.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;
      if (!isHoriz.current && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      if (!isHoriz.current) isHoriz.current = Math.abs(dx) > Math.abs(dy);
      if (!isHoriz.current) return;
      e.preventDefault();
      const w = el.offsetWidth;
      const bounded = (idx === 0 && dx > 0) || (idx === total - 1 && dx < 0) ? dx * 0.15 : dx;
      currentOffsetX.current = bounded;
      const track = el.querySelector(".swipe-track");
      if (track) track.style.transform = `translateX(${-(idx * w) - bounded * -1}px)`;
    };
    const handleEnd = () => {
      if (!isHoriz.current) return;
      const w = el.offsetWidth;
      const dx = currentOffsetX.current;
      let newIdx = idx;
      if (dx < -(w * 0.22) && idx < total - 1) newIdx = idx + 1;
      else if (dx > (w * 0.22) && idx > 0) newIdx = idx - 1;
      const track = el.querySelector(".swipe-track");
      if (track) { track.style.transition = "transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)"; track.style.transform = `translateX(${-(newIdx * w)}px)`; setTimeout(() => { if (track) track.style.transition = ""; }, 350); }
      currentOffsetX.current = 0; setIdx(newIdx); touchStartX.current = null;
    };
    el.addEventListener("touchstart", handleStart, { passive: true });
    el.addEventListener("touchmove", handleMove, { passive: false });
    el.addEventListener("touchend", handleEnd, { passive: true });
    return () => { el.removeEventListener("touchstart", handleStart); el.removeEventListener("touchmove", handleMove); el.removeEventListener("touchend", handleEnd); };
  }, [idx, total, isMobile]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isMobile) return;
    const track = el.querySelector(".swipe-track");
    if (!track) return;
    const w = el.offsetWidth;
    track.style.transition = "transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    track.style.transform = `translateX(${-(idx * w)}px)`;
    setTimeout(() => { if (track) track.style.transition = ""; }, 350);
  }, [idx, isMobile]);

  const CardFace = ({ it }) => (
    <div style={{ position: "relative", cursor: it.sourceUrl ? "pointer" : "default" }}
      onClick={() => {
        if (Math.abs(currentOffsetX.current) > 8) return;
        it.sourceUrl ? window.open(it.sourceUrl, "_blank") : onCard(it._cat, (board[it._cat] || []).findIndex(x => x.id === it.id));
      }}>
      {it.poster
        ? <img src={it.poster} alt={it.title} style={{ width: "100%", height: 340, objectFit: "cover", display: "block", border: `1px solid ${T.paperDark}` }} onError={e => e.target.style.display = "none"} />
        : <div style={{ width: "100%", height: 340, background: T.paperDark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Spectral',serif", fontSize: 18, color: T.inkLight, padding: 24, textAlign: "center" }}>{it.title}</div>}
      <div style={{ padding: "14px 4px 4px" }}>
        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.45)", marginBottom: 4 }}>{it._catLabel}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18, lineHeight: 1.2, marginBottom: 4, color: T.bg }}>{it.title}</div>
        <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: "rgba(200,194,180,0.7)" }}>{it.artist || it.author || it.sub || ""}</div>
        {it.comment && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: "rgba(200,194,180,0.55)", marginTop: 6 }}>"{it.comment}"</div>}
      </div>
      {isOwn && (
        <button onClick={e => { e.stopPropagation(); onRemove(it._cat, (board[it._cat] || []).findIndex(x => x.id === it.id), true); }}
          style={{ position: "absolute", top: 8, right: 8, zIndex: 2, background: "rgba(17,16,8,0.85)", border: "none", color: "#C8C2B4", width: 36, height: 36, cursor: "pointer", fontSize: 20, lineHeight: "36px", textAlign: "center", borderRadius: 2 }}>×</button>
      )}
      {!isOwn && (
        <button onClick={e => { e.stopPropagation(); onDudeSame(it); }}
          style={{ position: "absolute", top: 8, right: 8, zIndex: 2, background: myReactions?.includes(String(it.id)) ? T.ink : "rgba(17,16,8,0.7)", border: "none", color: "#C8C2B4", cursor: "pointer", fontSize: "8px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.1em", padding: "5px 8px", whiteSpace: "nowrap" }}>
          {myReactions?.includes(String(it.id)) ? "✓ Agreed" : "Agree"}
        </button>
      )}
      {buddyCounts?.[String(it.id)] > 0 && (
        <div title="Total Buddy Vouches" style={{ position: "absolute", top: 8, left: 8, zIndex: 2, background: "rgba(200,194,180,0.9)", color: "#111008", fontFamily: "'Spectral SC',serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", padding: "3px 8px", cursor: "default" }}>{buddyCounts[String(it.id)]} {buddyCounts[String(it.id)] === 1 ? "Vouch" : "Vouches"}</div>
      )}
    </div>
  );

  return (
    <div className="vouch-section">
      <div className="vouch-section-header">
        <div className="vouch-section-label">Vouch 5</div>
        <div className="vouch-section-sub">1 to 5 — your choice, your moment</div>
        {isOwn && <button className="vouch-section-add" onClick={onAdd}>+ Add</button>}
      </div>
      {isMobile ? (
        <div ref={containerRef} style={{ overflow: "hidden", userSelect: "none" }}>
          {allItems.length === 0 && isOwn ? (
            <div style={{ height: 280, border: `1px dashed ${T.paperDark}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, cursor: "pointer" }} onClick={onAdd}>
              <span style={{ fontSize: 28, color: T.inkFaint }}>+</span>
              <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "10px", letterSpacing: "0.18em", color: T.inkFaint }}>Add to Vouch 5</span>
            </div>
          ) : (
            <div className="swipe-track" style={{ display: "flex", willChange: "transform" }}>
              {allItems.map((it) => (
                <div key={it.id + it._cat} style={{ flex: "0 0 100%", width: "100%" }}>
                  <CardFace it={it} />
                </div>
              ))}
            </div>
          )}
          {total > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
              {allItems.map((_, i) => (
                <div key={i} onClick={() => setIdx(i)} style={{ width: 6, height: 6, borderRadius: "50%", background: i === idx ? T.ink : T.paperDark, cursor: "pointer", transition: "background 0.2s" }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="cards-row-large">
          {Array(5).fill(null).map((_, i) => {
            const it = allItems[i] || null;
            return it ? (
              <div key={it.id + it._cat} className="card-large" style={{ position: "relative" }}>
                <CardFace it={it} />
              </div>
            ) : isOwn ? (
              <div key={`ve${i}`} className="slot-empty-large" onClick={onAdd}>
                <div className="slot-empty-inner"><span className="slot-empty-plus">+</span>Vouch</div>
              </div>
            ) : (
              <div key={`ve${i}`} className="slot-empty-large" style={{ cursor: "default", opacity: 0.35 }}>
                <div className="slot-empty-inner"><span className="slot-empty-plus">—</span></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CatSection({ catKey, label, items, isOwn, onCard, onAdd, onRemove, onDudeSame, myReactions, buddyCounts }) {
  const [open, setOpen] = useState(true);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;
  const slots = Array(5).fill(null).map((_, i) => items[i] || null);
  const collapsed = isMobile && !open;
  return (
    <div className="cat-section">
      <div className="cat-header" style={{ cursor: isMobile ? "pointer" : "default" }} onClick={() => isMobile && setOpen(o => !o)}>
        <div className="cat-label">{label}</div>
        <div className="cat-sublabel">Collection</div>
        <div className="cat-count">{items.length > 0 ? items.length : ""}</div>
        {isMobile && <span style={{ marginLeft: "auto", fontFamily: "'Spectral SC',serif", fontSize: "11px", color: T.inkFaint, paddingLeft: 8 }}>{open ? "▴" : "▾"}</span>}
        {isOwn && !isMobile && <button className="cat-add" onClick={() => onAdd(catKey)}>+ Vouch</button>}
        {isOwn && isMobile && open && <button className="cat-add" style={{ marginLeft: 8 }} onClick={e => { e.stopPropagation(); onAdd(catKey); }}>+ Vouch</button>}
      </div>
      {!collapsed && (
        <div className="cards-row">
          {slots.map((item, idx) =>
            item
              ? <div key={item.id} className="card" style={{ position: "relative" }} onClick={() => item.sourceUrl ? window.open(item.sourceUrl, "_blank") : onCard(catKey, idx)}>
                  {isOwn && <button onClick={e => { e.stopPropagation(); onRemove(catKey, idx, false); }} style={{ position: "absolute", top: 4, right: 4, zIndex: 2, background: "rgba(17,16,8,0.85)", border: "none", color: "#C8C2B4", width: 30, height: 30, cursor: "pointer", fontSize: 16, lineHeight: "30px", textAlign: "center", borderRadius: 2 }}>×</button>}
                  {!isOwn && <button onClick={e => { e.stopPropagation(); onDudeSame(item); }} style={{ position: "absolute", top: 4, right: 4, zIndex: 2, background: myReactions?.includes(String(item.id)) ? "#C8C2B4" : "rgba(17,16,8,0.7)", border: "none", color: myReactions?.includes(String(item.id)) ? T.ink : "#C8C2B4", cursor: "pointer", fontSize: "7px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.08em", padding: "3px 5px", whiteSpace: "nowrap", fontWeight: myReactions?.includes(String(item.id)) ? 700 : 400 }}>{myReactions?.includes(String(item.id)) ? "✓ Agreed" : "Agree"}</button>}
                {buddyCounts?.[String(item.id)] > 0 && (
                  <div title="Total Buddy Vouches" style={{ position: "absolute", top: 4, left: 4, zIndex: 2, background: "rgba(17,16,8,0.75)", color: "#C8C2B4", fontFamily: "'Spectral SC',serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 6px", cursor: "default" }}>{buddyCounts[String(item.id)]} {buddyCounts[String(item.id)] === 1 ? "Vouch" : "Vouches"}</div>
                )}
                  {item.poster ? <img src={item.poster} alt={item.title} className="card-poster" onError={e => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }} /> : null}
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
                : null
          )}
        </div>
      )}
    </div>
  );
}

function MutualMentions({ reactions, myReactions, isOwn, boardOwnerName, buddies, onViewBuddy }) {
  if (!reactions.length && !myReactions.length) return null;
  const items = isOwn ? myReactions : reactions;
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 52, borderTop: `1px solid ${T.paperDark}`, paddingTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
        <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.08em", color: T.inkMid }}>
          {isOwn ? "Agreed With" : "Others Agreed"}
        </div>
        <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkFaint }}>
          {isOwn ? "Things you've agreed with on buddy boards" : `Things others agreed with on ${boardOwnerName}'s board`}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {items.map((item, i) => {
          const url = item.source_url || item.sourceUrl;
          const sourceBuddy = isOwn && buddies ? buddies.find(b => b.userId === item.item_owner_id) : null;
          return (
            <div key={(item.id || item.item_id) + i} style={{ width: 100, flexShrink: 0 }}>
              <div style={{ cursor: url ? "pointer" : "default" }} onClick={() => url && window.open(url, "_blank")}>
                {item.poster
                  ? <img src={item.poster} alt={item.title} style={{ width: 100, height: 138, objectFit: "cover", border: `1px solid ${T.paperDark}`, display: "block" }} onError={e => e.target.style.display = "none"} />
                  : <div style={{ width: 100, height: 138, background: T.paperDark, border: `1px solid ${T.paperDark}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "'Spectral',serif", color: T.inkLight, textAlign: "center", padding: 6 }}>{item.title}</div>}
                <div style={{ fontFamily: "'Spectral',serif", fontSize: 11, fontWeight: 600, lineHeight: 1.3, marginTop: 5 }}>{item.title}</div>
                <div style={{ fontFamily: "'Spectral SC',serif", fontSize: 8.5, color: T.inkFaint, marginTop: 1 }}>{item.subtitle || ""}</div>
              </div>
              {sourceBuddy && (
                <div onClick={() => onViewBuddy && onViewBuddy(sourceBuddy)} style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 9.5, color: T.inkLight, marginTop: 3, cursor: "pointer" }}>
                  from {sourceBuddy.displayName} →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BuddyModal({ userId, onClose, onSendRequest, onGenerateLink, inviteLink, existingBuddyIds }) {
  const [q, setQ]               = useState("");
  const [results, setResults]   = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [busy, setBusy]         = useState(false);
  const [sent, setSent]         = useState([]);
  const timer                   = useRef(null);

  // Load all users as suggestions on mount
  useEffect(() => {
    supabase.from("profiles").select("id, username, display_name, avatar_url")
      .neq("id", userId).order("display_name").limit(50)
      .then(({ data }) => setSuggested(data || []));
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url").or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).neq("id", userId).limit(8);
      setResults(data || []);
      setBusy(false);
    }, 300);
  }, [q, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const UserRow = ({ r }) => {
    const isAlready = existingBuddyIds.includes(r.id);
    const isSent    = sent.includes(r.id);
    return (
      <div key={r.id} className="result-item" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={r.display_name} size={52} avatarUrl={r.avatar_url} />
          <div>
            <div className="result-title">{r.display_name}</div>
            <div className="result-sub">@{r.username}</div>
          </div>
        </div>
        {isAlready
          ? <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkFaint }}>Buddies</span>
          : isSent
          ? <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkFaint }}>Sent</span>
          : <button className="btn btn-solid" style={{ padding: "4px 12px" }} onClick={() => { onSendRequest(r.id); setSent(s => [...s, r.id]); }}>Add</button>
        }
      </div>
    );
  };

  const displayList = q.trim() ? results : suggested;

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
            <button className="btn btn-solid" style={{ width: "100%" }} onClick={onGenerateLink}>
              {inviteLink ? "Link Copied!" : "Copy Invite Link"}
            </button>
            {inviteLink && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight, marginTop: 6, wordBreak: "break-all" }}>{inviteLink}</div>}
          </div>
          <div style={{ borderBottom: `1px solid ${T.paperDark}`, marginBottom: 16 }} />
          <input className="search-input" placeholder="Search name or username…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
          {!q.trim() && suggested.length > 0 && (
            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkFaint, margin: "12px 0 8px" }}>On Vouch</div>
          )}
          {busy && <div className="loading">Searching…</div>}
          {!busy && q.trim() && results.length === 0 && <div className="no-results">No users found.</div>}
          {!busy && displayList.map(r => <UserRow key={r.id} r={r} />)}
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
- Social Data: Buddy connections and reactions you make on other users' boards.
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
- Open Library: Used to search and display book content.

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
          <div className="modal-body"><HowItWorks /></div>
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

function BoardEditorModal({ onClose, onPublish, existing, categories, themes, userId }) {
  const [name, setName]               = useState(existing?.name || "");
  const [theme, setTheme]             = useState(existing?.theme || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [singleCat, setSingleCat]     = useState(existing?.single_category || "");
  const [items, setItems]             = useState(existing?.vouch_board_items?.sort((a,b)=>a.position-b.position).map(i => ({ ...i, id: i.item_id, sub: i.subtitle, catKey: i.category })) || []);
  const [addingItem, setAddingItem]   = useState(false);
  const [q, setQ]                     = useState("");
  const [results, setResults]         = useState([]);
  const [busy, setBusy]               = useState(false);
  const timer                         = useRef(null);
  const TMDB_KEY                      = "24f3b03466f2f7db2d54a0f53607da4f";

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const fetches = [];
        if (!singleCat || singleCat === "movies") fetches.push(fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`).then(r=>r.json()).then(d=>(d.results||[]).slice(0,3).map(r=>({ id:r.id, title:r.title, sub:r.release_date?.slice(0,4)||"", poster:r.poster_path?`https://image.tmdb.org/t/p/w500${r.poster_path}`:null, catKey:"movies" }))));
        if (!singleCat || singleCat === "shows") fetches.push(fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`).then(r=>r.json()).then(d=>(d.results||[]).slice(0,2).map(r=>({ id:r.id, title:r.name, sub:r.first_air_date?.slice(0,4)||"", poster:r.poster_path?`https://image.tmdb.org/t/p/w500${r.poster_path}`:null, catKey:"shows" }))));
        if (!singleCat || ["albums","songs","artists"].includes(singleCat)) {
          const type = singleCat === "albums" ? "album" : singleCat === "songs" ? "track" : singleCat === "artists" ? "artist" : "track,album,artist";
          fetches.push(fetch(`/api/spotify?q=${encodeURIComponent(q)}&type=${type}`).then(r=>r.json()).then(d=>{
            const res = [];
            if (!singleCat || singleCat==="songs") (d.tracks?.items||[]).slice(0,2).forEach(r=>res.push({ id:r.id, title:r.name, sub:r.artists?.[0]?.name||"", poster:r.album?.images?.[0]?.url||null, catKey:"songs" }));
            if (!singleCat || singleCat==="albums") (d.albums?.items||[]).slice(0,2).forEach(r=>res.push({ id:r.id, title:r.name, sub:r.artists?.[0]?.name||"", poster:r.images?.[0]?.url||null, catKey:"albums" }));
            if (!singleCat || singleCat==="artists") (d.artists?.items||[]).slice(0,2).forEach(r=>res.push({ id:r.id, title:r.name, sub:r.genres?.[0]||"", poster:r.images?.[0]?.url||null, catKey:"artists" }));
            return res;
          }));
        }
        if (!singleCat || singleCat === "books") fetches.push(fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=3`).then(r=>r.json()).then(d=>(d.docs||[]).slice(0,2).map(r=>({ id:r.key||r.title, title:r.title, sub:(r.author_name||[]).join(", "), poster:r.cover_i?`https://covers.openlibrary.org/b/id/${r.cover_i}-L.jpg`:null, catKey:"books" }))));
        const all = (await Promise.all(fetches)).flat();
        setResults(all);
      } catch(e) { console.error(e); }
      setBusy(false);
    }, 400);
  }, [q, singleCat]);

  const addItem = (item) => {
    if (items.length >= 5) return;
    if (items.find(i => String(i.id) === String(item.id))) return;
    setItems(prev => [...prev, item]);
    setQ(""); setResults([]); setAddingItem(false);
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handlePublish = () => {
    if (!name.trim()) { alert("Give your Vouch a name — like 'Summer of 2009' or 'Scorsese's Best'"); return; }
    if (!theme) { alert("Pick a theme for your Vouch."); return; }
    if (items.length === 0) { alert("Add at least one title to your Vouch."); return; }
    onPublish({ name, theme, description, singleCategory: singleCat, items });
  };

  const catLabel = (key) => categories.find(c => c.key === key)?.label || key;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: "88vh" }}>
        <div className="modal-head">
          <div className="modal-title">Create Your Vouch 5</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 6 }}>Name Your Vouch</div>
            <input className="search-input" style={{ marginBottom: 4 }} placeholder="e.g. Summer of 2009, Scorsese's Best…" value={name} onChange={e => setName(e.target.value)} maxLength={60} />
          </div>

          {/* Theme */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 6 }}>Theme</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {themes.map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.14em", padding: "4px 10px", border: `1px solid ${theme === t ? T.ink : T.paperDark}`, background: theme === t ? T.ink : "transparent", color: theme === t ? T.bg : T.inkMid, cursor: "pointer" }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Single category toggle */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 6 }}>Single Category (optional)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <button onClick={() => setSingleCat("")} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.14em", padding: "4px 10px", border: `1px solid ${!singleCat ? T.ink : T.paperDark}`, background: !singleCat ? T.ink : "transparent", color: !singleCat ? T.bg : T.inkMid, cursor: "pointer" }}>All</button>
              {categories.map(c => (
                <button key={c.key} onClick={() => setSingleCat(c.key)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.14em", padding: "4px 10px", border: `1px solid ${singleCat === c.key ? T.ink : T.paperDark}`, background: singleCat === c.key ? T.ink : "transparent", color: singleCat === c.key ? T.bg : T.inkMid, cursor: "pointer" }}>{c.label}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 6 }}>One Line About This Vouch (optional)</div>
            <input className="search-input" style={{ marginBottom: 0 }} placeholder="e.g. These artists remind me of the summer…" value={description} onChange={e => setDescription(e.target.value)} maxLength={120} />
          </div>

          {/* Current items */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 8 }}>Titles ({items.length}/5)</div>
            {items.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ position: "relative", width: 70 }}>
                    {item.poster
                      ? <img src={item.poster} alt={item.title} style={{ width: 70, height: 96, objectFit: "cover", border: `1px solid ${T.paperDark}`, display: "block" }} onError={e => e.target.style.display="none"} />
                      : <div style={{ width: 70, height: 96, background: T.paperDark, border: `1px solid ${T.paperDark}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "'Spectral',serif", color: T.inkLight, textAlign: "center", padding: 4 }}>{item.title}</div>}
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "7px", color: T.inkFaint, marginTop: 2, textAlign: "center" }}>{catLabel(item.catKey || item.category)}</div>
                    <button onClick={() => removeItem(i)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(17,16,8,0.85)", border: "none", color: "#C8C2B4", width: 20, height: 20, cursor: "pointer", fontSize: 14, lineHeight: "20px", textAlign: "center" }}>×</button>
                  </div>
                ))}
              </div>
            )}
            {items.length < 5 && (
              addingItem ? (
                <div>
                  <input className="search-input" placeholder="Search to add a title…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
                  {busy && <div className="loading">Searching…</div>}
                  {results.map((r, i) => (
                    <div key={i} className="result-item" onClick={() => addItem(r)}>
                      {r.poster ? <img src={r.poster} alt={r.title} className="result-img" /> : <div className="result-img" />}
                      <div style={{ flex: 1 }}>
                        <div className="result-title">{r.title}</div>
                        <div className="result-sub">{r.sub}</div>
                      </div>
                      <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", color: T.inkFaint }}>{catLabel(r.catKey)}</div>
                    </div>
                  ))}
                  <button className="btn btn-ghost" style={{ marginTop: 8, width: "100%" }} onClick={() => { setAddingItem(false); setQ(""); setResults([]); }}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => setAddingItem(true)}>+ Add Title</button>
              )
            )}
          </div>

          <button className="btn btn-solid" style={{ width: "100%", padding: "12px" }} onClick={handlePublish}>Publish Vouch 5</button>
          <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight, marginTop: 8, textAlign: "center" }}>Once published, you can update again in 7 days.</div>
        </div>
      </div>
    </div>
  );
}

function GroupVouchSlideshow({ items, isMobile }) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(null);
  const currentOffsetX = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isMobile) return;
    const handleStart = e => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; currentOffsetX.current = 0; };
    const touchStartY = { current: null };
    const handleMove = e => {
      if (touchStartX.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - (touchStartY.current || 0);
      if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
      currentOffsetX.current = dx;
      const track = el.querySelector(".gv-track");
      if (track) track.style.transform = `translateX(${-(idx * el.offsetWidth) + dx}px)`;
    };
    const handleEnd = () => {
      const w = el.offsetWidth;
      const dx = currentOffsetX.current;
      let newIdx = idx;
      if (dx < -(w * 0.22) && idx < items.length - 1) newIdx = idx + 1;
      else if (dx > (w * 0.22) && idx > 0) newIdx = idx - 1;
      const track = el.querySelector(".gv-track");
      if (track) { track.style.transition = "transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)"; track.style.transform = `translateX(${-(newIdx * w)}px)`; setTimeout(() => { if (track) track.style.transition = ""; }, 350); }
      setIdx(newIdx); touchStartX.current = null; touchStartY.current = null;
    };
    el.addEventListener("touchstart", handleStart, { passive: true });
    el.addEventListener("touchmove", handleMove, { passive: false });
    el.addEventListener("touchend", handleEnd, { passive: true });
    return () => { el.removeEventListener("touchstart", handleStart); el.removeEventListener("touchmove", handleMove); el.removeEventListener("touchend", handleEnd); };
  }, [idx, items.length, isMobile]);

  const CardFace = ({ item }) => (
    <div style={{ cursor: item.source_url ? "pointer" : "default" }} onClick={() => item.source_url && window.open(item.source_url, "_blank")}>
      <div style={{ position: "relative" }}>
        {item.poster
          ? <img src={item.poster} alt={item.title} style={{ width: "100%", height: isMobile ? 340 : "auto", aspectRatio: isMobile ? "unset" : "2/3", objectFit: "cover", display: "block", border: "1px solid rgba(200,194,180,0.2)" }} onError={e => e.target.style.display = "none"} />
          : <div style={{ width: "100%", aspectRatio: "2/3", background: "rgba(200,194,180,0.1)", border: "1px solid rgba(200,194,180,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Spectral',serif", fontSize: 14, color: "rgba(200,194,180,0.5)", padding: 12, textAlign: "center" }}>{item.title}</div>}
        <div title="Total Buddy Vouches" style={{ position: "absolute", top: 8, left: 8, background: "rgba(200,194,180,0.9)", color: "#111008", fontFamily: "'Spectral SC',serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", padding: "3px 8px", cursor: "default" }}>{item.count} {item.count === 1 ? "Vouch" : "Vouches"}</div>
      </div>
      <div style={{ padding: "12px 4px 4px" }}>
        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.45)", marginBottom: 3 }}>{item.category}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18, lineHeight: 1.2, marginBottom: 4, color: "#C8C2B4" }}>{item.title}</div>
        <div style={{ fontFamily: "'Spectral',serif", fontSize: 11, color: "rgba(200,194,180,0.6)", marginBottom: 2 }}>{item.subtitle || ""}</div>
        <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 10, color: "rgba(200,194,180,0.45)", marginTop: 4 }}>
          {item.count === 1 ? "Vouched by" : `Vouched by ${item.count}`}{item.vouchers?.length > 0 ? " · " + item.vouchers.join(", ") : ""}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom: 40, border: "3px double #111008", background: "#111008", padding: "24px 24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(200,194,180,0.25)", paddingBottom: 12, marginBottom: 22 }}>
        <div style={{ fontFamily: "'Times New Roman',Times,serif", fontWeight: 900, fontSize: 22, color: "#C8C2B4", letterSpacing: "0.04em" }}>Group Vouch</div>
        <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: "rgba(200,194,180,0.55)" }}>Most vouched across your circle</div>
      </div>
      {isMobile ? (
        <div ref={containerRef} style={{ overflow: "hidden", userSelect: "none" }}>
          <div className="gv-track" style={{ display: "flex", willChange: "transform" }}>
            {items.map((item, i) => (
              <div key={i} style={{ flex: "0 0 100%", width: "100%" }}>
                <CardFace item={item} />
              </div>
            ))}
          </div>
          {items.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
              {items.map((_, i) => (
                <div key={i} onClick={() => setIdx(i)} style={{ width: 6, height: 6, borderRadius: "50%", background: i === idx ? "#C8C2B4" : "rgba(200,194,180,0.25)", cursor: "pointer", transition: "background 0.2s" }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, flexWrap: "nowrap" }}>
          {items.map((item, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0 }}>
              <CardFace item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Vouch() {
  const [user,           setUser]           = useState(null);
  const [userId,         setUserId]         = useState(null);
  const [tab,            setTab]            = useState("board");
  const [viewing,        setViewing]        = useState(null);
  const [board,          setBoard]          = useState({ ...EMPTY_BOARD });
  const [viewBoard,      setViewBoard]      = useState({ ...EMPTY_BOARD });
  const [loading,        setLoading]        = useState(false);
  const [lightbox,       setLightbox]       = useState(null);
  const [addModal,       setAddModal]       = useState(null);
  const [vouchModal,     setVouchModal]     = useState(false);
  const [saving, setSaving] = useState(false); // eslint-disable-line no-unused-vars
  const [buddies,        setBuddies]        = useState([]);
  const [pendingIn,      setPendingIn]      = useState([]);
  const [buddyModal,     setBuddyModal]     = useState(false);
  const [inviteLink,     setInviteLink]     = useState(null);
  const [myReactions,    setMyReactions]    = useState([]);
  const [boardReactions, setBoardReactions] = useState([]);
  const [legalPage,      setLegalPage]      = useState(null);
  const [allBuddyBoards, setAllBuddyBoards] = useState([]);
  const [viewBuddies,    setViewBuddies]    = useState([]);
  const [showBuddyList,  setShowBuddyList]  = useState(false);
  const [shareModal,     setShareModal]     = useState(false);
  const [avatarPicker,   setAvatarPicker]   = useState(false);
  const [avatarLightbox, setAvatarLightbox] = useState(null);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "instant" });
  const [sentRequests,   setSentRequests]   = useState([]);
  const [activeBoard,    setActiveBoard]    = useState(null);
  const [boardArchive,   setBoardArchive]   = useState([]);
  const [boardEditor,    setBoardEditor]    = useState(false);
  const [archivePage,    setArchivePage]    = useState(false);
  const [editingBoard,   setEditingBoard]   = useState(null);
  const [suggested,      setSuggested]      = useState([]);

  const loadMyReactions = async (uid) => {
    const { data } = await supabase.from("reactions").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    setMyReactions(data || []);
  };

  const loadVouchBoards = async (uid) => {
    const { data } = await supabase
      .from("vouch_boards")
      .select("*, vouch_board_items(*)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data) {
      const active = data.find(b => b.is_active) || null;
      setActiveBoard(active);
      setBoardArchive(data);
    }
  };

  const publishBoard = async (boardData) => {
    const { name, theme, description, singleCategory, items } = boardData;
    // Deactivate current active board
    await supabase.from("vouch_boards").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
    // Create new board
    const { data: newBoard } = await supabase.from("vouch_boards").insert({
      user_id: userId,
      name,
      theme,
      description,
      single_category: singleCategory || null,
      published_at: new Date().toISOString(),
      is_active: true,
    }).select().single();
    if (!newBoard) return;
    // Insert items
    if (items.length > 0) {
      await supabase.from("vouch_board_items").insert(
        items.map((item, i) => ({
          board_id: newBoard.id,
          item_id: String(item.id),
          title: item.title,
          subtitle: item.sub || item.subtitle || "",
          poster: item.poster || null,
          source_url: item.sourceUrl || item.source_url || null,
          category: item.catKey || item.category || "",
          position: i,
        }))
      );
    }
    await loadVouchBoards(userId);
    setBoardEditor(false);
    setEditingBoard(null);
  };

  const republishBoard = async (archivedBoard) => {
    // Deactivate current
    await supabase.from("vouch_boards").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
    // Reactivate archived board with new published_at
    await supabase.from("vouch_boards").update({ is_active: true, published_at: new Date().toISOString() }).eq("id", archivedBoard.id);
    await loadVouchBoards(userId);
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
    if (error) { console.error("loadViewBoard error:", error); return; }
    const b = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
    (data || []).forEach(row => {
      const cat = row.category;
      if (b[cat] && b[cat].length < 5) {
        b[cat].push({ id: row.item_id, title: row.title, sub: row.subtitle || "", poster: row.poster || null, comment: row.comment || "", vouched: row.vouched || false, sourceUrl: row.source_url || null, dbId: row.id });
      }
    });
    setViewBoard(b);
    // Always fetch fresh profile data including avatar
    const { data: profile } = await supabase.from("profiles").select("id, display_name, avatar_url, username").eq("id", uid).maybeSingle();
    if (profile) {
      setViewing(prev => ({ ...(prev || {}), userId: uid, avatarUrl: profile.avatar_url, displayName: profile.display_name, username: profile.username }));
      if (profile.username !== user?.username) {
        window.history.replaceState({}, "", `/@${profile.username}`);
      }
      scrollToTop();
    }
    // Also load this person's buddies
    const { data: buddyRows } = await supabase.from("buddies")
      .select("requester_id, receiver_id")
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
      .eq("status", "accepted");
    if (buddyRows && buddyRows.length > 0) {
      const ids = buddyRows.map(b => b.requester_id === uid ? b.receiver_id : b.requester_id);
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url, username").in("id", ids);
      setViewBuddies(profiles || []);
    } else {
      setViewBuddies([]);
    }
  };

  const loadAllBuddyBoards = async (buddyList, uid) => {
    const allBoards = await Promise.all(buddyList.map(async b => {
      const { data } = await supabase.from("endorsements").select("*").eq("user_id", b.userId);
      return data || [];
    }));
    // Also include own board
    const ownId = uid || userId;
    const { data: ownData } = await supabase.from("endorsements").select("*").eq("user_id", ownId);
    const allRows = [...(ownData || []), ...allBoards.flat()];
    setAllBuddyBoards(allRows);
  };

  const loadBuddies = async (uid) => {
    const { data } = await supabase
      .from("buddies")
      .select("*, requester:requester_id(id, username, display_name, avatar_url), receiver:receiver_id(id, username, display_name, avatar_url)")
      .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`);
    if (data) {
      const accepted = data.filter(b => b.status === "accepted").map(b => {
        const other = b.requester_id === uid ? b.receiver : b.requester;
        return { buddyRowId: b.id, userId: other.id, username: other.username, displayName: other.display_name, avatarUrl: other.avatar_url || null };
      });
      const incoming = data.filter(b => b.status === "pending" && b.receiver_id === uid).map(b => ({
        buddyRowId: b.id, userId: b.requester.id, username: b.requester.username, displayName: b.requester.display_name, avatarUrl: b.requester.avatar_url || null
      }));
      setBuddies(accepted);
      setPendingIn(incoming);
      if (accepted.length > 0) loadAllBuddyBoards(accepted, uid);
      // Load suggested users (not already buddies or pending)
      const allIds = [...accepted.map(b => b.userId), ...incoming.map(b => b.userId), uid];
      const { data: suggestedData } = await supabase.from("profiles")
        .select("id, username, display_name, avatar_url")
        .not("id", "in", `(${allIds.join(",")})`)
        .order("display_name").limit(20);
      setSuggested(suggestedData || []);
    }
  };

  useEffect(() => {
    const setUserFromSession = async (session) => {
      if (session?.user) {
        const uid = session.user.id;
        const googleAvatar = session.user.user_metadata?.avatar_url || null;
        // Check if profile already exists with a custom avatar
        const { data: existingProfile } = await supabase.from("profiles").select("avatar_url, username, display_name").eq("id", uid).maybeSingle();
        // Prefer stored avatar unless it is a Google URL (googleusercontent = Google photo)
        const storedAvatar = existingProfile?.avatar_url;
        const isGoogleUrl = storedAvatar && (storedAvatar.includes("googleusercontent") || storedAvatar.includes("google"));
        const avatarUrl = (storedAvatar && !isGoogleUrl) ? storedAvatar : googleAvatar;
        // Only upsert without overwriting avatar if profile exists
        if (!existingProfile) {
          await supabase.from("profiles").upsert({
            id: uid,
            username: session.user.email.split("@")[0],
            display_name: session.user.user_metadata?.full_name || session.user.email.split("@")[0],
            avatar_url: googleAvatar,
          }, { onConflict: "id" });
        }
        setUser({ username: existingProfile?.username || session.user.email.split("@")[0], displayName: existingProfile?.display_name || session.user.user_metadata?.full_name || session.user.email.split("@")[0], avatarUrl });
        setUserId(uid);
        loadBoard(uid);
        loadBuddies(uid);
        loadMyReactions(uid);
        loadVouchBoards(uid);
        const params = new URLSearchParams(window.location.search);
        const inviteFrom = params.get("invite");
        if (inviteFrom && inviteFrom !== uid) {
          // Check if connection already exists in either direction before auto-buddying
          const { data: existingBuddy } = await supabase.from("buddies")
            .select("id")
            .or(`and(requester_id.eq.${inviteFrom},receiver_id.eq.${uid}),and(requester_id.eq.${uid},receiver_id.eq.${inviteFrom})`)
            .maybeSingle();
          if (!existingBuddy) {
            await supabase.from("buddies").insert({ requester_id: inviteFrom, receiver_id: uid, status: "accepted" });
          } else {
            await supabase.from("buddies").update({ status: "accepted" }).eq("id", existingBuddy.id);
          }
          window.history.replaceState({}, "", window.location.pathname);
          loadBuddies(uid);
        }
      } else {
        setUser(null); setUserId(null); setBoard({ ...EMPTY_BOARD });
      }
    };
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession();
          setUserFromSession(refreshed);
        } else {
          setUserFromSession(session);
        }
      } else {
        setUserFromSession(null);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") { setUser(null); setUserId(null); setBoard({ ...EMPTY_BOARD }); return; }
      setUserFromSession(session);
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); };

  const isOwn     = !viewing;
  const currBoard = isOwn ? board : viewBoard;
  const currName  = isOwn ? user?.displayName : viewing?.displayName || viewing?.username;

  const dudeSame = async (item) => {
    if (!userId || !viewing) return;
    const ownerId = viewing.userId;
    const already = myReactions.find(r => r.item_id === String(item.id) && r.item_owner_id === ownerId);
    if (already) {
      await supabase.from("reactions").delete().eq("id", already.id);
    } else {
      await supabase.from("reactions").upsert({
        user_id: userId,
        item_owner_id: ownerId,
        item_id: String(item.id),
        category: item._cat || item.catKey || "",
        title: item.title,
        subtitle: item.sub || item.artist || item.author || "",
        poster: item.poster || null,
        source_url: item.sourceUrl || null,
      }, { onConflict: "user_id,item_owner_id,item_id" });
    }
    await loadMyReactions(userId);
    await loadBoardReactions(ownerId);
  };

  const generateInviteLink = () => {
    const link = `${window.location.origin}/@${user.username}`;
    setInviteLink(link);
    navigator.clipboard?.writeText(link);
  };

  const shareBoard = async () => {
    const shareUsername = viewing ? viewing.username : user.username;
    const shareName = viewing ? viewing.displayName : user.displayName;
    const shareUrl = `${window.location.origin}/@${shareUsername}`;
    const vouchedCount = Object.values(currBoard).flat().filter(i => i.vouched).length;
    const topItem = Object.values(currBoard).flat().find(i => i.vouched) || Object.values(currBoard).flat()[0];

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");

    const drawCard = (posterImg) => {
      // Background
      ctx.fillStyle = "#C8C2B4";
      ctx.fillRect(0, 0, 1080, 1920);

      // Top rule
      ctx.fillStyle = "#111008";
      ctx.fillRect(0, 0, 1080, 5);

      // Est / vouch5.com
      ctx.fillStyle = "#888";
      ctx.font = "400 30px Georgia";
      ctx.fillText("Est. 2026", 72, 110);
      ctx.textAlign = "right";
      ctx.fillText("vouch5.com", 1008, 110);
      ctx.textAlign = "left";

      // Vouch. wordmark
      ctx.fillStyle = "#111008";
      ctx.font = "900 200px 'Times New Roman', serif";
      ctx.textAlign = "center";
      ctx.fillText("Vouch.", 540, 310);
      ctx.textAlign = "left";

      // Tagline
      ctx.fillStyle = "#555";
      ctx.font = "italic 400 40px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("Love it? Vouch for it.", 540, 370);
      ctx.textAlign = "left";

      // Double rule
      ctx.strokeStyle = "#111008";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(72, 400); ctx.lineTo(1008, 400); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(72, 412); ctx.lineTo(1008, 412); ctx.stroke();

      // Byline
      ctx.fillStyle = "#444";
      ctx.font = "italic 400 40px Georgia";
      ctx.fillText((shareName || shareUsername).split(" ")[0] + " is vouching for", 72, 468);

      // Poster - takes up most of middle
      const posterX = 72, posterY = 490, posterW = 936, posterH = 1050;
      ctx.fillStyle = "#111008";
      ctx.fillRect(posterX, posterY, posterW, posterH);

      if (posterImg) {
        const imgRatio = posterImg.naturalWidth / posterImg.naturalHeight;
        const cardRatio = posterW / posterH;
        let sx, sy, sw, sh;
        if (imgRatio > cardRatio) {
          sh = posterImg.naturalHeight; sw = sh * cardRatio;
          sx = (posterImg.naturalWidth - sw) / 2; sy = 0;
        } else {
          sw = posterImg.naturalWidth; sh = sw / cardRatio;
          sx = 0; sy = (posterImg.naturalHeight - sh) / 2;
        }
        ctx.drawImage(posterImg, sx, sy, sw, sh, posterX, posterY, posterW, posterH);
        const grad = ctx.createLinearGradient(0, posterY + posterH * 0.45, 0, posterY + posterH);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.88)");
        ctx.fillStyle = grad;
        ctx.fillRect(posterX, posterY, posterW, posterH);
      }

      if (topItem) {
        ctx.fillStyle = "rgba(200,194,180,0.45)";
        ctx.font = "400 28px Georgia";
        ctx.fillText((topItem._cat || "").toUpperCase(), posterX + 32, posterY + 56);
        ctx.fillStyle = "#C8C2B4";
        ctx.font = "900 78px 'Times New Roman', serif";
        const title = topItem.title || "";
        const shortTitle = title.length > 22 ? title.slice(0, 22) + "…" : title;
        ctx.fillText(shortTitle, posterX + 32, posterY + posterH - 90);
        ctx.fillStyle = "rgba(200,194,180,0.65)";
        ctx.font = "400 44px Georgia";
        ctx.fillText(topItem.sub || "", posterX + 32, posterY + posterH - 34);
      }

      // More vouches
      const moreCount = vouchedCount > 1 ? vouchedCount - 1 : 4;
      ctx.strokeStyle = "rgba(17,16,8,0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(72, 1592); ctx.lineTo(380, 1592); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(700, 1592); ctx.lineTo(1008, 1592); ctx.stroke();
      ctx.fillStyle = "#666";
      ctx.font = "italic 400 36px Georgia";
      ctx.textAlign = "center";
      ctx.fillText(`+ ${moreCount} more vouch${moreCount !== 1 ? "es" : ""}`, 540, 1604);
      ctx.textAlign = "left";

      // CTA question
      ctx.fillStyle = "#333";
      ctx.font = "italic 400 38px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("What would you put your name behind right now?", 540, 1660);
      ctx.textAlign = "left";

      // Divider
      ctx.strokeStyle = "rgba(17,16,8,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(72, 1690); ctx.lineTo(1008, 1690); ctx.stroke();

      // Clean URL - prominent
      ctx.fillStyle = "#111008";
      ctx.font = "900 48px 'Times New Roman', serif";
      ctx.textAlign = "center";
      ctx.fillText("vouch5.com/@" + shareUsername, 540, 1760);
      ctx.textAlign = "left";

      // Link in bio label
      ctx.fillStyle = "#C8C2B4";
      ctx.fillRect(72, 1785, 936, 72);
      ctx.fillStyle = "#111008";
      ctx.font = "400 30px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("See " + (shareName || shareUsername).split(" ")[0] + "'s Vouch Board - Link in Bio", 540, 1832);
      ctx.textAlign = "left";

      // Bottom rule
      ctx.fillStyle = "#111008";
      ctx.fillRect(0, 1915, 1080, 5);
    };

    if (topItem?.poster) {
      // Use image proxy to avoid CORS
      try {
        const proxyUrl = `/api/imgproxy?url=${encodeURIComponent(topItem.poster)}`;
        const response = await fetch(proxyUrl);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = async () => {
          drawCard(img);
          URL.revokeObjectURL(objectUrl);
          await doShare(canvas, shareUrl, shareName);
        };
        img.onerror = async () => {
          drawCard(null);
          URL.revokeObjectURL(objectUrl);
          await doShare(canvas, shareUrl, shareName);
        };
        img.src = objectUrl;
      } catch {
        drawCard(null);
        await doShare(canvas, shareUrl, shareName);
      }
    } else {
      drawCard(null);
      await doShare(canvas, shareUrl, shareName);
    }
  };

  const doShare = async (canvas, shareUrl, shareName) => {
    try { await navigator.clipboard.writeText(shareUrl); } catch(e) {}
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "vouch-board.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `${shareName}'s Vouch Board`, text: shareUrl });
          setTimeout(() => {
            try { navigator.clipboard.writeText(shareUrl); } catch(e) {}
          }, 800);
        } catch (e) {
          if (e.name !== "AbortError") {
            const a = document.createElement("a");
            a.href = canvas.toDataURL("image/png");
            a.download = "vouch-board.png";
            a.click();
          }
        }
      } else {
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "vouch-board.png";
        a.click();
        try { navigator.clipboard.writeText(shareUrl); } catch(e) {}
      }
    }, "image/png");
  };

  const saveAvatar = async (file) => {
    const url = `/avatars/${file}.jpg`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    setUser(prev => ({ ...prev, avatarUrl: url }));
    setAvatarPicker(false);
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${userId}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { console.error("Avatar upload error:", error); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    setUser(prev => ({ ...prev, avatarUrl: url }));
    setAvatarPicker(false);
  };

  const sendBuddyRequest = async (receiverId) => {
    // Check if connection already exists in either direction
    const { data: existing } = await supabase.from("buddies")
      .select("id")
      .or(`and(requester_id.eq.${userId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${userId})`)
      .maybeSingle();
    if (existing) return; // already connected, skip
    await supabase.from("buddies").insert({ requester_id: userId, receiver_id: receiverId, status: "pending" });
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
    window.scrollTo(0, 0);
    setViewing(buddy);
    setTab("board");
    await loadViewBoard(buddy.userId);
    await loadBoardReactions(buddy.userId);
    // Load this buddy's own buddies for display at bottom of their board
    const { data } = await supabase.from("buddies")
      .select("requester_id, receiver_id")
      .or(`requester_id.eq.${buddy.userId},receiver_id.eq.${buddy.userId}`)
      .eq("status", "accepted");
    if (data && data.length > 0) {
      const ids = data.map(b => b.requester_id === buddy.userId ? b.receiver_id : b.requester_id);
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
      setViewBuddies(profiles || []);
    } else {
      setViewBuddies([]);
    }
  };

  const addItem = async (catKey, item) => {
    const catLabel = { movies: "Film", albums: "Albums", artists: "Artists", songs: "Songs", books: "Books", shows: "Television" }[catKey] || catKey;

    // Check for duplicate vouch
    const alreadyVouched = board[catKey]?.find(i => String(i.id) === String(item.id) && i.vouched);
    if (alreadyVouched && item.vouched) {
      alert(item.title + " is already in your Vouch 5."); return;
    }

    // Check category limit (non-vouched only)
    const existingInCat = board[catKey]?.find(i => String(i.id) === String(item.id));
    if (!existingInCat) {
      const nonVouchedCount = (board[catKey] || []).filter(i => !i.vouched).length;
      if (nonVouchedCount >= 5) {
        alert(catLabel + " is full — you can have up to 5 mentions. Remove one to make room."); return;
      }
    }

    // Optimistically update UI immediately
    const optimisticItem = {
      id: item.id, title: item.title, sub: item.sub || "",
      poster: item.poster || null, comment: item.comment || "",
      vouched: item.vouched === true, sourceUrl: item.sourceUrl || null,
      dbId: null, // will be filled after DB save
    };

    if (existingInCat) {
      // Update existing item vouched flag
      setBoard(prev => ({
        ...prev,
        [catKey]: prev[catKey].map(i => String(i.id) === String(item.id) ? { ...i, vouched: item.vouched === true, comment: item.comment || i.comment } : i)
      }));
    } else {
      // Add new item
      setBoard(prev => ({
        ...prev,
        [catKey]: [...(prev[catKey] || []), optimisticItem]
      }));
    }

    // Sync with DB in background
    try {
      const { data: existing } = await supabase.from("endorsements")
        .select("id")
        .eq("user_id", userId)
        .eq("category", catKey)
        .eq("item_id", String(item.id))
        .maybeSingle();

      if (existing) {
        await supabase.from("endorsements")
          .update({ vouched: item.vouched === true, comment: item.comment || "" })
          .eq("id", existing.id);
      } else {
        await supabase.from("endorsements").insert({
          user_id: userId, category: catKey, item_id: String(item.id),
          title: item.title, subtitle: item.sub || "",
          poster: item.poster || null, comment: item.comment || "",
          vouched: item.vouched === true, source_url: item.sourceUrl || null,
        });
      }
      // Reload to get real dbId
      await loadBoard(userId);
    } catch(e) { console.error("addItem error:", e); await loadBoard(userId); }
  };

  // fromVouch5=true just un-vouches the item (keeps it in category section)
  // fromVouch5=false fully deletes it
  const removeItem = async (catKey, idx, fromVouch5 = false) => {
    const item = board[catKey]?.[idx];
    if (!item) return;

    // Optimistically update UI immediately
    if (fromVouch5) {
      setBoard(prev => ({
        ...prev,
        [catKey]: prev[catKey].map((it, i) => i === idx ? { ...it, vouched: false } : it)
      }));
    } else {
      setBoard(prev => ({
        ...prev,
        [catKey]: prev[catKey].filter((_, i) => i !== idx)
      }));
    }

    // Sync with DB in background
    try {
      if (!item.dbId) { await loadBoard(userId); return; }
      if (fromVouch5) {
        await supabase.from("endorsements").update({ vouched: false }).eq("id", item.dbId);
      } else {
        await supabase.from("endorsements").delete().eq("id", item.dbId);
      }
    } catch(e) { console.error("removeItem error:", e); await loadBoard(userId); }
  };

  const vouchedCount = Object.values(board).flat().filter(item => item.vouched).length;

  const canPublish = (() => {
    if (!activeBoard?.published_at) return true;
    const publishedAt = new Date(activeBoard.published_at);
    const daysSince = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 7;
  })();

  const nextPublishDate = (() => {
    if (!activeBoard?.published_at || canPublish) return null;
    const d = new Date(activeBoard.published_at);
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })();

  // Build a map of item_id -> unique user count across all buddy boards (for badges)
  const buddyCounts = {};
  const seenBadge = new Set();
  allBuddyBoards.forEach(row => {
    const key = row.user_id + ":" + row.item_id;
    if (seenBadge.has(key)) return;
    seenBadge.add(key);
    buddyCounts[String(row.item_id)] = (buddyCounts[String(row.item_id)] || 0) + 1;
  });
  const inviteParam  = new URLSearchParams(window.location.search).get("invite");
  // Support /@username clean URLs
  const pathUsername = window.location.pathname.startsWith("/@") ? window.location.pathname.slice(2) : null;

  const [pathUserId, setPathUserId] = useState(null);
  useEffect(() => {
    if (pathUsername) {
      supabase.from("profiles").select("id").eq("username", pathUsername).maybeSingle()
        .then(({ data }) => { if (data) setPathUserId(data.id); });
    }
  }, [pathUsername]);

  const resolvedInviteId = inviteParam || pathUserId;

  // When logged in and visiting /@username, auto-load that person's board
  useEffect(() => {
    if (user && pathUserId && pathUserId !== userId) {
      supabase.from("profiles").select("id, display_name, avatar_url, username").eq("id", pathUserId).maybeSingle()
        .then(({ data }) => {
          if (data) {
            setViewing({ userId: data.id, username: data.username, displayName: data.display_name, avatarUrl: data.avatar_url });
            setTab("board");
            loadViewBoard(data.id);
            loadBoardReactions(data.id);
            scrollToTop();
          }
        });
    }
  }, [user, pathUserId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    if (resolvedInviteId) {
      return <PublicBoard inviteUserId={resolvedInviteId} onSignUp={() => {
        supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + `?invite=${resolvedInviteId}` } });
      }} />;
    }
    if (pathUsername && !pathUserId) return <><Styles /><div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#C8C2B4" }}><div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#666" }}>Loading...</div></div></>;
    return <><Styles /><Auth /></>;
  }
  if (loading) return <><Styles /><div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}><div className="loading">Loading…</div></div></>;

  return (
    <>
      <Styles />
      <div className="app">
        <header className="masthead">
          <div className="masthead-meta">
            <span style={{ flex: 1 }}>Est. 2026</span>
            <span className="masthead-meta-stars" style={{ flex: "0 0 auto" }}>✦ · ✦ · ✦</span>
            <span style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 16 }}>
              <span className="clickable" onClick={() => setLegalPage("how")}>How it Works</span>
              <span className="clickable" onClick={() => { setTab("board"); setViewing(null); window.history.replaceState({}, "", "/"); scrollToTop(); }}>@{user.username}</span>
              <span className="clickable" onClick={signOut}>Sign out</span>
            </span>
          </div>
          <div className="masthead-nameplate" onClick={() => { setTab("board"); setViewing(null); window.history.replaceState({}, "", "/"); scrollToTop(); }}>
            <span className="nameplate-word">Vouch.</span>
          </div>
          <div className="masthead-rule-ornament"><span>—</span><span>✦</span><span>—</span></div>
          <div className="masthead-tagline">Love it? Vouch for it.</div>
          <nav className="nav">
            <button className={`nav-btn${tab === "board" && !viewing ? " active" : ""}`} onClick={() => { setTab("board"); setViewing(null); window.history.replaceState({}, "", "/"); scrollToTop(); }}>My Board</button>
            <button className={`nav-btn${tab === "friends" ? " active" : ""}`} onClick={() => { setTab("friends"); setViewing(null); window.history.replaceState({}, "", "/"); scrollToTop(); }}>
              Buddies {pendingIn.length > 0 && <span style={{ background: T.ink, color: T.bg, borderRadius: "50%", fontSize: 9, padding: "1px 5px", marginLeft: 4 }}>{pendingIn.length}</span>}
            </button>
            {viewing && <button className="nav-btn active">{currName}</button>}
          </nav>
        </header>

        <main className="page">
          {tab === "board" && !viewing && pendingIn.length > 0 && (
            <div onClick={() => setTab("friends")} style={{ background: T.ink, color: T.bg, padding: "12px 16px", marginBottom: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14 }}>
                <strong style={{ fontStyle: "normal", fontFamily: "'Spectral SC',serif", fontSize: 11, letterSpacing: "0.12em" }}>{pendingIn.length} buddy request{pendingIn.length > 1 ? "s" : ""}</strong> waiting for you
              </div>
              <span style={{ fontFamily: "'Spectral SC',serif", fontSize: 10, letterSpacing: "0.12em" }}>Review →</span>
            </div>
          )}

          {tab === "friends" && !viewing
            ? <>
                <div className="board-header">
                  <div>
                    <div className="board-name" style={{ fontSize: 32 }}>Buddies</div>
                    <div className="board-sub">{buddies.length} connection{buddies.length !== 1 ? "s" : ""}</div>
                  </div>
                  <button className="btn btn-solid" onClick={() => setBuddyModal(true)}>+ Add Buddy</button>
                </div>

                {/* GROUP VOUCH - top of page */}
                {allBuddyBoards.length > 0 && (() => {
                  // Dedupe by user+item first, then count unique users per item
                  const seenUserItem = new Set();
                  const itemCount = {};
                  allBuddyBoards.forEach(row => {
                    const userItemKey = row.user_id + ":" + row.item_id;
                    if (seenUserItem.has(userItemKey)) return; // skip dupes from same user
                    seenUserItem.add(userItemKey);
                    const key = row.category + ":" + row.item_id;
                    if (!itemCount[key]) itemCount[key] = { ...row, count: 0, vouchers: [] };
                    itemCount[key].count++;
                    const voucher = [...buddies, { userId, displayName: user?.displayName }].find(b => b.userId === row.user_id);
                    if (voucher && !itemCount[key].vouchers.includes(voucher.displayName)) {
                      itemCount[key].vouchers.push(voucher.displayName);
                    }
                  });
                  // Add reactions as bonus votes (max 1 per reacter)
                  myReactions.forEach(r => {
                    const matchKey = Object.keys(itemCount).find(k => k.endsWith(":" + r.item_id));
                    if (matchKey) {
                      itemCount[matchKey].count += 1;
                      if (!itemCount[matchKey].vouchers.includes("You agreed")) {
                        itemCount[matchKey].vouchers.push("You agreed");
                      }
                    }
                  });
                  const top5 = Object.values(itemCount).sort((a, b) => b.count - a.count).slice(0, 5);
                  if (top5.length === 0) return null;
                  const isMobile = window.innerWidth <= 640;
                  return (
                    <GroupVouchSlideshow items={top5} isMobile={isMobile} />
                  );
                })()}

                {/* PENDING REQUESTS */}
                {pendingIn.length > 0 && <>
                  <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "10px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 12 }}>Pending Requests</div>
                  {pendingIn.map(b => (
                    <div key={b.buddyRowId} className="friend-row">
                      <div>
                        <div className="friend-name" style={{ fontSize: 18 }}>{b.displayName}</div>
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

                {/* BUDDY LIST */}
                {buddies.length === 0 && pendingIn.length === 0 && (
                  <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: T.inkLight, padding: "24px 0" }}>No buddies yet — add one or share your invite link.</div>
                )}
                {buddies.map(b => {
                  const bPreviews = allBuddyBoards.filter(r => r.user_id === b.userId && r.vouched).slice(0, 5);
                  return (
                    <div key={b.buddyRowId} style={{ borderBottom: `1px solid ${T.paperDark}`, padding: "16px 0", cursor: "pointer" }} onClick={() => viewBuddy(b)}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: bPreviews.length > 0 ? 12 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar name={b.displayName} size={52} avatarUrl={b.avatarUrl} />
                          <div>
                            <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 20 }}>{b.displayName}</div>
                            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "10px", letterSpacing: "0.1em", color: T.inkLight, marginTop: 2 }}>@{b.username}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 13, color: T.inkFaint }}>→</span>
                      </div>
                      {bPreviews.length > 0 && (
                        <div style={{ display: "flex", gap: 8 }}>
                          {bPreviews.map((item, i) => (
                            <div key={i} style={{ width: 52, flexShrink: 0 }}>
                              {item.poster
                                ? <img src={item.poster} alt={item.title} style={{ width: 52, height: 72, objectFit: "cover", border: `1px solid ${T.paperDark}`, display: "block" }} onError={e => e.target.style.display = "none"} />
                                : <div style={{ width: 52, height: 72, background: T.paperDark, border: `1px solid ${T.paperDark}` }} />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* SUGGESTED BUDDIES */}
                {suggested.length > 0 && (
                  <div style={{ marginTop: 36, borderTop: `1px solid ${T.paperDark}`, paddingTop: 24 }}>
                    <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", color: T.inkMid, marginBottom: 16 }}>People on Vouch</div>
                    {suggested.map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.paperDark}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => { setViewing({ userId: s.id, username: s.username, displayName: s.display_name, avatarUrl: s.avatar_url }); setTab("board"); loadViewBoard(s.id); loadBoardReactions(s.id); window.scrollTo(0, 0); }}>
                          <Avatar name={s.display_name} size={56} avatarUrl={s.avatar_url} />
                          <div>
                            <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 16, borderBottom: `1px solid ${T.paperDark}` }}>{s.display_name}</div>
                            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.1em", color: T.inkLight }}>@{s.username}</div>
                          </div>
                        </div>
                        <button className="btn btn-solid" style={{ padding: "4px 14px" }} onClick={() => sendBuddyRequest(s.id).then(() => setSuggested(prev => prev.filter(x => x.id !== s.id)))}>Add</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            : <>
                <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingTop: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      {!viewing && (
                        <div onClick={() => setAvatarPicker(true)} style={{ cursor: "pointer", flexShrink: 0, position: "relative", display: "inline-block" }}>
                          <Avatar name={user.displayName} size={56} avatarUrl={user.avatarUrl} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(17,16,8,0.55)", fontFamily: "'Spectral SC',serif", fontSize: "7px", letterSpacing: "0.12em", color: "rgba(200,194,180,0.9)", textAlign: "center", padding: "3px 0", pointerEvents: "none" }}>edit</div>
                        </div>
                      )}
                      {viewing && viewing.avatarUrl && (
                        <div onClick={() => setAvatarLightbox(viewing.avatarUrl)} style={{ cursor: "zoom-in", flexShrink: 0 }}>
                          <Avatar name={viewing.displayName} size={56} avatarUrl={viewing.avatarUrl} />
                        </div>
                      )}
                      {viewing && !viewing.avatarUrl && (
                        <Avatar name={viewing.displayName} size={56} avatarUrl={null} />
                      )}
                      <div className="board-name" style={{ fontSize: 28, marginBottom: 0 }}>{viewing ? currName : currName}</div>
                    </div>
                    <div className="board-sub" style={{ marginBottom: 10 }}>@{viewing ? viewing.username : user.username}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.12em", color: T.inkLight }}>
                        <span style={{ fontWeight: 700, color: T.ink, fontSize: "12px", fontFamily: "'Spectral',serif" }}>{Object.values(currBoard).flat().length}</span> {" vouches"}
                      </div>
                      {(isOwn ? buddies.length : viewBuddies.length) > 0 && (
                        <div onClick={() => setShowBuddyList(true)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.12em", color: T.inkLight, cursor: "pointer" }}>
                          <span style={{ fontWeight: 700, color: T.ink, fontSize: "12px", fontFamily: "'Spectral',serif" }}>{isOwn ? buddies.length : viewBuddies.length}</span>
                          {" "}{(isOwn ? buddies.length : viewBuddies.length) === 1 ? "buddy" : "buddies"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexShrink: 0 }}>
                    {viewing && !buddies.find(b => b.userId === viewing.userId) && (
                      <button onClick={() => sendBuddyRequest(viewing.userId)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", padding: "6px 14px", background: "transparent", color: T.ink, border: `1px solid ${T.ink}`, cursor: "pointer", whiteSpace: "nowrap" }}>+ Add Buddy</button>
                    )}
                    {!viewing && (
                      <button onClick={() => setShareModal(true)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", padding: "6px 14px", background: T.ink, color: T.bg, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Share</button>
                    )}
                  </div>
                </div>
                {viewing && (
                  <div style={{ marginBottom: 16 }}>
                    <button className="btn btn-ghost" onClick={() => { setViewing(null); setTab("friends"); window.history.replaceState({}, "", "/"); scrollToTop(); }}>← Back to Buddies</button>
                  </div>
                )}
                <div className="ornament"><span>—</span><span>✦</span><span>—</span></div>

                {isOwn ? (
                  <div className="vouch-section" style={{ marginBottom: 52 }}>
                    <div className="vouch-section-header">
                      <div>
                        <div className="vouch-section-label">Vouch 5</div>
                        {activeBoard?.name && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: "rgba(200,194,180,0.7)", marginTop: 2 }}>{activeBoard.name}{activeBoard.theme ? ` · ${activeBoard.theme}` : ""}</div>}
                        {activeBoard?.description && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: "rgba(200,194,180,0.45)", marginTop: 2 }}>{activeBoard.description}</div>}
                        {activeBoard?.published_at && <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.12em", color: "rgba(200,194,180,0.35)", marginTop: 4 }}>Published {new Date(activeBoard.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "flex-start" }}>
                        {canPublish
                          ? <button className="vouch-section-add" onClick={() => { setEditingBoard(null); setBoardEditor(true); }}>+ New Vouch</button>
                          : <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.1em", color: "rgba(200,194,180,0.4)", paddingTop: 6 }}>Next: {nextPublishDate}</div>
                        }
                        {boardArchive.length > 1 && <button className="vouch-section-add" onClick={() => setArchivePage(true)}>Archive</button>}
                      </div>
                    </div>
                    {activeBoard?.vouch_board_items?.length > 0 ? (
                      <VouchSection board={(() => {
                        const b = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
                        (activeBoard.vouch_board_items || []).sort((a,b) => a.position - b.position).forEach(item => {
                          if (b[item.category]) b[item.category].push({ id: item.item_id, title: item.title, sub: item.subtitle || "", poster: item.poster, comment: "", vouched: true, sourceUrl: item.source_url, _cat: item.category, _catLabel: CATEGORIES.find(c=>c.key===item.category)?.label || item.category });
                        });
                        return b;
                      })()} isOwn={true} onCard={(k, i) => {}} onAdd={() => { setEditingBoard(null); setBoardEditor(true); }} onRemove={() => {}} onDudeSame={() => {}} myReactions={[]} buddyCounts={buddyCounts} hideHeader={true} />
                    ) : (
                      <div style={{ height: 220, border: "1px dashed rgba(200,194,180,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, cursor: "pointer" }} onClick={() => { setEditingBoard(null); setBoardEditor(true); }}>
                        <span style={{ fontSize: 28, color: "rgba(200,194,180,0.4)" }}>+</span>
                        <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "10px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.4)" }}>Create Your Vouch 5</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <VouchSection board={currBoard} isOwn={false} onCard={(k, i) => setLightbox({ catKey: k, idx: i })} onAdd={() => {}} onRemove={() => {}} onDudeSame={dudeSame} myReactions={myReactions.filter(r => viewing && r.item_owner_id === viewing.userId).map(r => r.item_id)} buddyCounts={buddyCounts} />
                )}

                {(() => {
                  // On own board show all categories; on others' boards hide empty ones and sort filled first
                  const cats = isOwn
                    ? CATEGORIES
                    : [...CATEGORIES].sort((a, b) => {
                        const aLen = (currBoard[a.key] || []).length;
                        const bLen = (currBoard[b.key] || []).length;
                        return bLen - aLen;
                      });
                  return cats.map(cat => {
                    const items = currBoard[cat.key] || [];
                    if (!isOwn && items.length === 0) return null;
                    return <CatSection key={cat.key} catKey={cat.key} label={cat.label} items={items} isOwn={isOwn} onCard={(k, i) => setLightbox({ catKey: k, idx: i })} onAdd={setAddModal} onRemove={removeItem} onDudeSame={dudeSame} myReactions={myReactions.filter(r => viewing && r.item_owner_id === viewing.userId).map(r => r.item_id)} buddyCounts={buddyCounts} />;
                  });
                })()}

                <MutualMentions reactions={boardReactions} myReactions={myReactions} isOwn={isOwn} boardOwnerName={currName} buddies={buddies} onViewBuddy={(b) => { setViewing(b); setTab("board"); loadViewBoard(b.userId); loadBoardReactions(b.userId); window.scrollTo(0, 0); }} />

                {/* BUDDIES LIST at bottom of every board */}
                {(() => {
                  const displayBuddies = isOwn
                    ? buddies.map(b => ({ id: b.userId, display_name: b.displayName, avatar_url: b.avatarUrl, buddyRowId: b.buddyRowId, ...b }))
                    : viewBuddies;
                  if (!displayBuddies.length) return null;
                  return (
                    <div style={{ marginTop: 52, borderTop: `1px solid ${T.paperDark}`, paddingTop: 28 }}>
                      <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", color: T.inkMid, marginBottom: 16 }}>Buddies</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
                        {displayBuddies.map((b, i) => {
                          const name = b.displayName || b.display_name;
                          const avatarUrl = b.avatarUrl || b.avatar_url;
                          const bid = b.id || b.userId;
                          const buser = b.username;
                          const handleClick = async () => {
                            const buddyObj = isOwn ? b : { userId: bid, username: buser, displayName: name, avatarUrl };
                            setViewing(buddyObj);
                            setTab("board");
                            await loadViewBoard(bid);
                            await loadBoardReactions(bid);
                            window.scrollTo(0, 0);
                          };
                          return (
                            <div key={b.buddyRowId || bid || i} onClick={handleClick} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 0" }}>
                              <Avatar name={name} size={56} avatarUrl={avatarUrl} />
                              <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: T.ink, borderBottom: `1px solid ${T.paperDark}`, lineHeight: 1.3 }}>{name}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </>
          }
        </main>

        {lightbox && (() => {
          const items = currBoard[lightbox.catKey] || [];
          if (!items.length) return null;
          return <Lightbox items={items} start={lightbox.idx} catLabel={CATEGORIES.find(c => c.key === lightbox.catKey)?.label} onClose={() => setLightbox(null)} />;
        })()}

        {buddyModal && (
          <BuddyModal userId={userId} onClose={() => { setBuddyModal(false); setInviteLink(null); }} onSendRequest={sendBuddyRequest} onGenerateLink={generateInviteLink} inviteLink={inviteLink} existingBuddyIds={buddies.map(b => b.userId)} />
        )}

        {vouchModal && (
          <UniversalSearchModal
            used={vouchedCount}
            onClose={() => setVouchModal(false)}
            onAdd={(catKey, item) => {
              return addItem(catKey, { ...item, vouched: true });
            }}
          />
        )}

        {addModal && (
          <AddModal catKey={addModal} catLabel={CATEGORIES.find(c => c.key === addModal)?.label} used={(board[addModal] || []).filter(i => !i.vouched).length} onClose={() => setAddModal(null)} onAdd={addItem} />
        )}

        {legalPage && <LegalModal page={legalPage} onClose={() => setLegalPage(null)} />}

        {showBuddyList && (
          <div className="modal-overlay" onClick={() => setShowBuddyList(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title">{isOwn ? "Your Buddies" : currName + "'s Buddies"}</div>
                <button className="modal-x" onClick={() => setShowBuddyList(false)}>×</button>
              </div>
              <div className="modal-body">
                {(isOwn ? buddies : viewBuddies).length === 0 && (
                  <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight }}>No buddies yet.</div>
                )}
                {(isOwn ? buddies.map(b => ({ id: b.userId, display_name: b.displayName, username: b.username, avatar_url: b.avatarUrl, buddyRowId: b.buddyRowId })) : viewBuddies).map((b, i) => {
                  const bid = b.id || b.userId;
                  const bname = b.display_name || b.displayName;
                  const buser = b.username;
                  const bavatar = b.avatar_url || b.avatarUrl;
                  const isAlreadyBuddy = buddies.find(x => x.userId === bid);
                  const isSelf = bid === userId;
                  const isSent = sentRequests.includes(bid);
                  return (
                    <div key={bid || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.paperDark}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => { setShowBuddyList(false); setViewing({ userId: bid, username: buser, displayName: bname, avatarUrl: bavatar }); setTab("board"); loadViewBoard(bid); loadBoardReactions(bid); window.scrollTo(0, 0); }}>
                        <Avatar name={bname} size={56} avatarUrl={bavatar} />
                        <div>
                          <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 15, borderBottom: `1px solid ${T.paperDark}` }}>{bname}</div>
                          <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.1em", color: T.inkLight }}>@{buser}</div>
                        </div>
                      </div>
                      {!isSelf && !isAlreadyBuddy && (
                        isSent
                          ? <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.12em", color: T.inkFaint }}>Sent</span>
                          : <button className="btn btn-solid" style={{ padding: "4px 12px" }} onClick={() => { sendBuddyRequest(bid); setSentRequests(prev => [...prev, bid]); }}>Add</button>
                      )}
                      {isAlreadyBuddy && <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.12em", color: T.inkFaint }}>Buddies</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <IOSInstallBanner />

        {avatarLightbox && (
          <div onClick={() => setAvatarLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
            <img src={avatarLightbox} alt="avatar" style={{ width: "min(90vw, 90vh)", height: "min(90vw, 90vh)", objectFit: "cover", filter: "grayscale(100%)" }} onClick={e => e.stopPropagation()} />
          </div>
        )}

        {avatarPicker && (
          <div className="modal-overlay" onClick={() => setAvatarPicker(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title">Choose Your Avatar</div>
                <button className="modal-x" onClick={() => setAvatarPicker(false)}>×</button>
              </div>
              <div className="modal-body">

                {/* Upload own photo */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9.5px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 10 }}>Upload a Photo</div>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <div style={{ width: 56, height: 56, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {user.avatarUrl
                        ? <img src={user.avatarUrl} alt="avatar" style={{ width: 56, height: 56, objectFit: "cover", filter: "grayscale(100%)" }} />
                        : <span style={{ fontFamily: "'Times New Roman',serif", fontWeight: 900, fontSize: 20, color: T.bg }}>{(user.displayName || "").split(" ").map(w => w[0]).join("").slice(0,2)}</span>
                      }
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: T.ink, borderBottom: `1px solid ${T.paperDark}` }}>Choose from camera roll</div>
                      <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight, marginTop: 4 }}>JPG or PNG</div>
                    </div>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { uploadAvatar(e); }} />
                  </label>
                </div>

                <div style={{ borderBottom: `1px solid ${T.paperDark}`, marginBottom: 16 }} />

                {/* Stock photo options */}
                <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9.5px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 10 }}>Or Pick One</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {AVATAR_OPTIONS.map(av => (
                    <div key={av.file} onClick={() => saveAvatar(av.file)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <img
                        src={`/avatars/${av.file}.jpg`}
                        alt={av.label}
                        style={{ width: "100%", aspectRatio: "1", objectFit: "cover", border: user.avatarUrl === `/avatars/${av.file}.jpg` ? `2px solid ${T.ink}` : `1px solid ${T.paperDark}` }}
                      />
                      <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "7px", letterSpacing: "0.1em", color: T.inkMid, textAlign: "center" }}>{av.label}</div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        )}

        {boardEditor && (
          <BoardEditorModal
            onClose={() => { setBoardEditor(false); setEditingBoard(null); }}
            onPublish={publishBoard}
            existing={editingBoard}
            categories={CATEGORIES}
            themes={BOARD_THEMES}
            userId={userId}
          />
        )}

        {archivePage && (
          <div className="modal-overlay" onClick={() => setArchivePage(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title">Your Vouch Archive</div>
                <button className="modal-x" onClick={() => setArchivePage(false)}>×</button>
              </div>
              <div className="modal-body">
                {boardArchive.length === 0 && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight }}>No archived boards yet.</div>}
                {boardArchive.map(b => (
                  <div key={b.id} style={{ borderBottom: `1px solid ${T.paperDark}`, padding: "14px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontFamily: "'Spectral',serif", fontWeight: 700, fontSize: 15 }}>{b.name || "Untitled Vouch"}</div>
                        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.12em", color: T.inkLight, marginTop: 2 }}>
                          {b.theme}{b.published_at ? ` · ${new Date(b.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                          {b.is_active && <span style={{ marginLeft: 8, color: T.ink, fontWeight: 700 }}>· Active</span>}
                        </div>
                        {b.description && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkMid, marginTop: 3 }}>{b.description}</div>}
                      </div>
                      {!b.is_active && canPublish && (
                        <button className="btn btn-solid" style={{ padding: "4px 12px", fontSize: 10 }} onClick={() => { republishBoard(b); setArchivePage(false); }}>Republish</button>
                      )}
                    </div>
                    {b.vouch_board_items?.length > 0 && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {b.vouch_board_items.sort((a,b) => a.position - b.position).slice(0,5).map((item, i) => (
                          item.poster
                            ? <img key={i} src={item.poster} alt={item.title} style={{ width: 44, height: 60, objectFit: "cover", border: `1px solid ${T.paperDark}` }} onError={e => e.target.style.display = "none"} />
                            : <div key={i} style={{ width: 44, height: 60, background: T.paperDark, border: `1px solid ${T.paperDark}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontFamily: "'Spectral',serif", color: T.inkLight, textAlign: "center", padding: 3 }}>{item.title}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {shareModal && (() => {
          const shareUsername = user.username;
          const shareUrl = `${window.location.origin}/@${shareUsername}`;
          return (
            <div className="modal-overlay" onClick={() => setShareModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-head">
                  <div className="modal-title">Share Your Board</div>
                  <button className="modal-x" onClick={() => setShareModal(false)}>×</button>
                </div>
                <div className="modal-body">

                  {/* Copy link section */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9.5px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 8 }}>Your Vouch Link</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1, fontFamily: "'Spectral',serif", fontSize: 13, background: T.paperDark, padding: "10px 12px", color: T.ink, letterSpacing: "0.02em" }}>{shareUrl}</div>
                      <button className="btn btn-solid" style={{ padding: "0 16px", whiteSpace: "nowrap" }} onClick={() => { navigator.clipboard.writeText(shareUrl); }}>Copy</button>
                    </div>
                    <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: T.ink, marginTop: 10, lineHeight: 1.7, borderLeft: `3px solid ${T.ink}`, paddingLeft: 12 }}>
                      <strong>Add this link to your Instagram bio.</strong> Your followers can tap straight to your Vouch board — it's the easiest way to grow your circle.
                    </div>
                  </div>

                  <div style={{ borderBottom: `1px solid ${T.paperDark}`, marginBottom: 20 }} />

                  {/* Instagram story */}
                  <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9.5px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 8 }}>Share to Instagram Story</div>
                  <button className="btn btn-solid" style={{ width: "100%", padding: "12px", fontSize: 13 }} onClick={() => { setShareModal(false); shareBoard(); }}>
                    Share Story Card →
                  </button>
                  <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight, marginTop: 8, lineHeight: 1.6 }}>
                    Generates a story card with your top vouch. Post it to your story, then add your Vouch link to your bio.
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

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