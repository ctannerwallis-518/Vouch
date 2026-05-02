// build: 2026-04-05T16:17:10.789151
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
  "Feelin' Lately", "All-Timers", "Nostalgic", "Deep Cuts",
  "New Releases", "Underrated", "Seasonal", "No Boundaries",
  "Locals Only", "Old School", "Classics", "Guilty Pleasures", "Other"
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
      flex-shrink: 0; flex: 1; padding: 9px 10px; font-family: 'Spectral SC', serif; font-size: 10px;
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

    .vouch-section { margin-bottom: 52px; border: 3px double #C9A84C; box-shadow: 0 0 0 1px #A07830; background: ${T.ink}; padding: 22px 22px 22px; position: relative; }
    .vouch-section-header { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; border-bottom: 1px solid rgba(200,194,180,0.25); padding-bottom: 12px; margin-bottom: 24px; }
    .vouch-section-label { font-family: 'Times New Roman', Times, serif; font-weight: 900; font-size: 22px; letter-spacing: 0.04em; white-space: nowrap; color: ${T.bg}; }
    .vouch-section-sub   { font-family: 'Spectral', serif; font-style: italic; font-size: 11px; color: rgba(200,194,180,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vouch-section-add   { margin-left: auto; font-family: 'Spectral SC', serif; font-size: 9.5px; font-weight: 600; letter-spacing: 0.2em; padding: 4px 14px; border: 1px solid rgba(200,194,180,0.4); background: transparent; color: ${T.bg}; cursor: pointer; transition: all 0.14s; }
    .vouch-section-add:hover { background: rgba(200,194,180,0.15); }

    .cards-row-large { display: flex; gap: 12px; flex-wrap: nowrap; }
    .card-large { flex: 1; min-width: 0; max-width: 320px; cursor: pointer; }
    .card-poster-large { width: 100%; aspect-ratio: 2/3; object-fit: cover; display: block; border: 1px solid ${T.paperDark}; transition: transform 0.2s, box-shadow 0.2s; max-height: 400px; }
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
    .card { width: 180px; flex-shrink: 0; cursor: pointer; }
    .card:hover .card-poster { transform: translateY(-3px); box-shadow: 0 7px 20px rgba(17,16,8,0.16); }
    .card-poster { width: 180px; height: 248px; object-fit: cover; display: block; border: 1px solid ${T.paperDark}; transition: transform 0.2s, box-shadow 0.2s; }
    .card-poster-placeholder { width: 180px; height: 248px; background: ${T.paperDark}; border: 1px solid ${T.paperDark}; display: flex; align-items: center; justify-content: center; font-family: 'Spectral', serif; font-style: italic; font-size: 11px; color: ${T.inkLight}; text-align: center; padding: 10px; }
    .card-title   { font-family: 'Spectral', serif; font-weight: 600; font-size: 12.5px; line-height: 1.35; margin-top: 7px; }
    .card-sub     { font-family: 'Spectral SC', serif; font-size: 9.5px; letter-spacing: 0.06em; color: ${T.inkLight}; margin-top: 2px; }
    .card-comment { font-family: 'Spectral', serif; font-style: italic; font-size: 10.5px; line-height: 1.5; color: ${T.inkMid}; margin-top: 4px; white-space: normal; word-break: break-word; }
    .slot-empty-sm { width: 180px; height: 248px; border: 2px dashed ${T.inkLight}; background: rgba(17,16,8,0.06); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.14s, background 0.14s; flex-shrink: 0; }
    .slot-empty-sm:hover { border-color: ${T.ink}; background: rgba(17,16,8,0.12); }

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
      .card { width: 95px; flex-shrink: 0; }
      .card-poster { width: 95px; height: 130px; flex-shrink: 0; }
      .card-poster-placeholder { width: 95px; height: 130px; flex-shrink: 0; font-size: 9px; }
      .card:hover .card-poster { transform: none; box-shadow: none; }
      .slot-empty-sm { width: 95px; height: 130px; flex-shrink: 0; border: 2px dashed rgba(17,16,8,0.3); background: rgba(17,16,8,0.06); }
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
  const [showPublicBuddies, setShowPublicBuddies] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: prof } = await supabase
          .from("profiles").select("id, username, display_name, avatar_url").eq("id", inviteUserId).maybeSingle();
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
            .from("profiles").select("id, display_name, avatar_url, created_at").in("id", buddyIds).order("created_at", { ascending: false });
          if (profiles) setPublicBuddies(profiles);
        }
        const { data: activeVouchBoard } = await supabase
          .from("vouch_boards")
          .select("*, vouch_board_items(*)")
          .eq("user_id", inviteUserId)
          .eq("is_active", true)
          .maybeSingle();
        const { data: rows } = await supabase
          .from("endorsements").select("*").eq("user_id", inviteUserId).order("created_at", { ascending: true });
        const b = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
        (rows || []).forEach(row => {
          if (b[row.category] && b[row.category].length < 5) {
            b[row.category].push({
              id: row.item_id, title: row.title, sub: row.subtitle || "",
              poster: row.poster || null, comment: row.comment || "",
              vouched: row.vouched || false, sourceUrl: row.source_url || null,
            });
          }
        });
        setBoard({ shelf: b, activeVouchBoard: activeVouchBoard || null });
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
          <div style={{ marginBottom: 24, borderTop: `1px solid ${T.paperDark}`, borderBottom: `1px solid ${T.paperDark}`, padding: "14px 0", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 8 }}>
            {[{label: "Your Vouch", desc: "Up to 5 tiles, one board at a time, updated once a week"},{label: "Your Shelf", desc: "Up to 5 per category — change it whenever you like"},{label: "Buddies", desc: "See what your friends are vouching for. Agree with anything that resonates, or add it to your Queue."}].map(item => (
              <div key={item.label} style={{ textAlign: "center", flex: "1 1 100px" }}>
                <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.15em", color: T.ink }}>{item.label}</div>
                <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkMid, marginTop: 3 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <button onClick={onSignUp} className="btn btn-solid" style={{ width: "100%", padding: "12px", fontSize: 13, marginBottom: 28 }}>Create Your Own Vouch Board →</button>
          <div className="ornament"><span>—</span><span>✦</span><span>—</span></div>
          {/* Profile header - looks like signed-in view */}
          <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Avatar name={name} size={56} avatarUrl={profile?.avatar_url} />
                <div className="board-name" style={{ fontSize: 28, marginBottom: 0 }}>{name}</div>
              </div>
              <div className="board-sub" style={{ marginBottom: 8 }}>@{profile?.username || ""}</div>
              <div style={{ display: "flex", gap: 16 }}>
                {(() => {
                  const shelfCount = Object.values(board?.shelf || {}).flat().length;
                  const vouchCount = (board?.activeVouchBoard?.vouch_board_items || []).length;
                  const total = shelfCount + vouchCount;
                  return total > 0 ? (
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.12em", color: T.inkLight }}>
                      <span style={{ fontWeight: 700, color: T.ink, fontSize: "12px", fontFamily: "'Spectral',serif" }}>{total}</span>{" vouches"}
                    </div>
                  ) : null;
                })()}
                {publicBuddies.length > 0 && (
                  <div onClick={() => setShowPublicBuddies(true)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.12em", color: T.inkLight, cursor: "pointer" }}>
                    <span style={{ fontWeight: 700, color: T.ink, fontSize: "12px", fontFamily: "'Spectral',serif" }}>{publicBuddies.length}</span> {" buddies"}
                  </div>
                )}
              </div>
            </div>
          </div>
          {board?.activeVouchBoard && (() => {
            const avb = board.activeVouchBoard;
            const vbBoard = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
            (avb.vouch_board_items || []).sort((a,b) => a.position - b.position).slice(0,5).forEach(item => {
              if (vbBoard[item.category]) vbBoard[item.category].push({ id: item.item_id, title: item.title, sub: item.subtitle || "", poster: item.poster, comment: "", vouched: true, sourceUrl: item.source_url, _cat: item.category, _catLabel: CATEGORIES.find(c=>c.key===item.category)?.label || item.category });
            });
            const theme = (avb.theme && avb.theme !== "Other") ? avb.theme : (avb.name || "Vouch");
            return (
              <div className="vouch-section" style={{ marginBottom: 52 }}>
                <div className="vouch-section-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="vouch-section-label">{theme}</div>
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.4)", marginTop: 3 }}>Vouch</div>
                    {avb.description && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: "rgba(200,194,180,0.45)", marginTop: 4 }}>{avb.description}</div>}
                    {avb.published_at && <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "7px", letterSpacing: "0.1em", color: "rgba(200,194,180,0.3)", marginTop: 4 }}>Published {new Date(avb.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>}
                  </div>
                </div>
                <VouchSection board={vbBoard} isOwn={false} onCard={()=>{}} onAdd={()=>{}} onRemove={()=>{}} onDudeSame={() => setShowSignupNudge(true)} myReactions={[]} hideHeader={true} />
              </div>
            );
          })()}
          {publicBuddies.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", color: T.inkMid }}>Also on Vouch</div>
                <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkFaint, cursor: "pointer" }} onClick={() => setShowSignupNudge(true)}>Sign up to see their boards →</div>
              </div>
              <div style={{ display: "flex", gap: 16, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
                {publicBuddies.map((b, i) => (
                  <div key={i} onClick={() => setShowSignupNudge(true)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0, width: 72 }}>
                    <Avatar name={b.display_name} size={64} avatarUrl={b.avatar_url} />
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.06em", color: T.inkMid, textAlign: "center", lineHeight: 1.3, width: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.display_name.split(" ")[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {[...CATEGORIES].sort((a, b) => ((board?.shelf?.[b.key] || []).length - (board?.shelf?.[a.key] || []).length)).map(cat => {
            const items = board?.shelf?.[cat.key] || [];
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

        {showPublicBuddies && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(17,16,8,0.82)", zIndex: 900, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 72 }} onClick={() => setShowPublicBuddies(false)}>
            <div style={{ background: T.bg, width: "100%", maxWidth: 540, maxHeight: "82vh", overflow: "hidden", border: `1px solid ${T.ink}`, display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `2px solid ${T.ink}` }}>
                <div style={{ fontFamily: "'Spectral',serif", fontWeight: 700, fontSize: 17 }}>{name}'s Buddies</div>
                <button onClick={() => setShowPublicBuddies(false)} style={{ fontFamily: "'Spectral',serif", fontSize: 22, background: "transparent", border: "none", cursor: "pointer", color: T.ink, opacity: 0.6 }}>×</button>
              </div>
              <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>
                {publicBuddies.map((b, i) => (
                  <div key={i} onClick={() => setShowSignupNudge(true)} style={{ display: "flex", lignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.paperDark}`, cursor: "pointer" }}>
                    <Avatar name={b.display_name} size={48} avatarUrl={b.avatar_url} />
                    <div>
                      <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 15 }}>{b.display_name}</div>
                      <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", color: T.inkLight }}>Sign in to view →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
          <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.15em", color: T.ink, marginBottom: 5 }}>Your Vouch</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, fontStyle: "italic", color: T.inkMid }}>Publish up to 5 tiles — a movie, album, book, show, artist, whatever you would put your name behind right now. You can only have one Vouch published at a time, and you can update it once a week.</div>
        </div>
        <div style={{ borderTop: `1px solid ${T.paperDark}` }} />
        <div>
          <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.15em", color: T.ink, marginBottom: 5 }}>Your Shelf</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, fontStyle: "italic", color: T.inkMid }}>Up to 5 picks per category across Film, Albums, Artists, Songs, Books, and Television. Change it whenever you like — and choose which categories appear on your shelf.</div>
        </div>
        <div style={{ borderTop: `1px solid ${T.paperDark}` }} />
        <div>
          <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.15em", color: T.ink, marginBottom: 5 }}>Buddies</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, fontStyle: "italic", color: T.inkMid }}>Connect with friends and see what they are vouching for. Agree with anything that resonates, or add it to your Queue to revisit later.</div>
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
                  <button className="btn btn-solid" style={{ width: "100%" }} onClick={confirm}>Add to Shelf</button>
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
                  <button className="btn btn-solid" style={{ width: "100%" }} onClick={confirm}>Add to Shelf</button>
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

function VouchSection({ board, isOwn, onCard, onAdd, onRemove, onDudeSame, myReactions, buddyCounts, hideHeader, hideEmptySlots, onAddToQueue, queue, ownerId }) {
  const [idx, setIdx]      = useState(0);
  const touchStartX        = useRef(null);
  const touchStartY        = useRef(null);
  const currentOffsetX     = useRef(0);
  const isHoriz            = useRef(false);
  const containerRef       = useRef(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640; // eslint-disable-line

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

  const prevIdxRef = useRef(idx);
  useEffect(() => {
    if (prevIdxRef.current === idx) return;
    prevIdxRef.current = idx;
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
    <div style={{ position: "relative" }}>
      {it.poster
        ? <img src={it.poster} alt={it.title} style={{ width: "100%", height: 340, objectFit: "cover", display: "block", border: `1px solid ${T.paperDark}`, cursor: it.sourceUrl ? "pointer" : "default" }} onClick={() => { if (Math.abs(currentOffsetX.current) > 8) return; it.sourceUrl ? window.open(it.sourceUrl, "_blank") : onCard(it._cat, (board[it._cat] || []).findIndex(x => x.id === it.id)); }} onError={e => e.target.style.display = "none"} />
        : <div style={{ width: "100%", height: 340, background: T.paperDark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Spectral',serif", fontSize: 18, color: T.inkLight, padding: 24, textAlign: "center", cursor: it.sourceUrl ? "pointer" : "default" }} onClick={() => { if (Math.abs(currentOffsetX.current) > 8) return; it.sourceUrl ? window.open(it.sourceUrl, "_blank") : onCard(it._cat, (board[it._cat] || []).findIndex(x => x.id === it.id)); }}>{it.title}</div>}
      <div style={{ padding: "14px 4px 4px" }}>
        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.45)", marginBottom: 4 }}>{it._catLabel}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18, lineHeight: 1.2, marginBottom: 4, color: T.bg }}>{it.title}</div>
        <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: "rgba(200,194,180,0.7)" }}>{it.artist || it.author || it.sub || ""}</div>
        {it.comment && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: "rgba(200,194,180,0.55)", marginTop: 6 }}>"{it.comment}"</div>}
        {!isOwn && (
          <div style={{ display: "flex", marginTop: 8 }}>
            <button onClick={e => { e.stopPropagation(); onDudeSame(it, ownerId); }} style={{ flex: 1, background: myReactions?.includes(String(it.id)) ? "rgba(200,194,180,0.25)" : "rgba(200,194,180,0.1)", border: "1px solid rgba(200,194,180,0.2)", color: "rgba(200,194,180,0.7)", cursor: "pointer", fontSize: "8px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.1em", padding: "5px 4px", fontWeight: 700 }}>{myReactions?.includes(String(it.id)) ? "✓ Agreed" : "Agree"}</button>
            {onAddToQueue && <button onClick={e => { e.stopPropagation(); onAddToQueue(it); }} style={{ flex: 1, background: queue?.find(q => String(q.id) === String(it.id)) ? "rgba(200,194,180,0.25)" : "rgba(200,194,180,0.1)", border: "1px solid rgba(200,194,180,0.2)", borderLeft: "none", color: "rgba(2,194,180,0.7)", cursor: "pointer", fontSize: "8px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.1em", padding: "5px 4px", fontWeight: 700 }}>{queue?.find(q => String(q.id) === String(it.id)) ? "✓ Queue" : "+ Queue"}</button>}
          </div>
        )}
      </div>

      {buddyCounts?.[String(it.id)] > 0 && (
        <div title="Total Buddy Vouches" style={{ position: "absolute", top: 8, left: 8, zIndex: 2, background: "rgba(17,16,8,0.82)", color: "rgba(200,194,180,0.95)", fontFamily: "'Spectral SC',serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", padding: "3px 8px", cursor: "default" }}>{buddyCounts[String(it.id)]} {buddyCounts[String(it.id)] === 1 ? "Vouch" : "Vouches"}</div>
      )}
    </div>
  );

  return (
    <div className="vouch-section">
      {!hideHeader && (
        <div className="vouch-section-header">
          <div className="vouch-section-label">Vouch 5</div>
          <div className="vouch-section-sub">1 to 5 — your choice, your moment</div>
          {isOwn && <button className="vouch-section-add" onClick={onAdd}>+ Add</button>}
        </div>
      )}
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
        <div style={{ display: "flex", gap: 12, justifyContent: isOwn ? "flex-start" : "center" }}>
          {allItems.map((it, i) => (
            <div key={it.id + it._cat} className="card-large" style={{ position: "relative", flex: isOwn ? "1" : "0 0 auto", width: isOwn ? undefined : 280, maxWidth: 320 }}>
              <CardFace it={it} />
            </div>
          ))}
          {isOwn && Array(Math.max(0, 5 - allItems.length)).fill(null).map((_, i) => (
            <div key={`ve${i}`} className="slot-empty-large" style={{ flex: "1", maxWidth: 320 }} onClick={onAdd}>
              <div className="slot-empty-inner"><span className="slot-empty-plus">+</span>Vouch</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CatSection({ catKey, label, items, isOwn, onCard, onAdd, onRemove, onDudeSame, myReactions, buddyCounts, onAddToQueue, queue }) {
  const [open, setOpen] = useState(true);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640; // eslint-disable-line
  const slots = Array(5).fill(null).map((_, i) => items[i] || null);
  const collapsed = isMobile && !open;
  return (
    <div className="cat-section">
      <div className="cat-header" style={{ cursor: isMobile ? "pointer" : "default" }} onClick={() => isMobile && setOpen(o => !o)}>
        <div className="cat-label">{label}</div>
        <div className="cat-sublabel">My Shelf</div>
        <div className="cat-count">{items.length > 0 ? items.length : ""}</div>
        {isMobile && <span style={{ marginLeft: "auto", fontFamily: "'Spectral SC',serif", fontSize: "11px", color: T.inkFaint, paddingLeft: 8 }}>{open ? "▴" : "▾"}</span>}

      </div>
      {!collapsed && (
        <div className="cards-row">
          {slots.map((item, idx) =>
            item
              ? <div key={item.id} className="card" style={{ position: "relative" }} onClick={() => item.sourceUrl ? window.open(item.sourceUrl, "_blank") : onCard(catKey, idx)}>
                  {isOwn && <button onClick={e => { e.stopPropagation(); onRemove(catKey, idx, false); }} style={{ position: "absolute", top: 4, right: 4, zIndex: 2, background: "rgba(17,16,8,0.85)", border: "none", color: "#C8C2B4", width: 26, height: 26, cursor: "pointer", fontSize: 15, lineHeight: "26px", textAlign: "center", borderRadius: 2 }}>×</button>}
                  {item.poster ? <img src={item.poster} alt={item.title} className="card-poster" onError={e => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }} /> : null}
                  <div className="card-poster-placeholder" style={{ display: item.poster ? "none" : "flex" }}>{item.title}</div>
                  <div style={{ flex: 1 }}>
                    <div className="card-title">{item.title}</div>
                    <div className="card-sub">{item.artist || item.author || item.year || item.sub || ""}</div>
                    {item.comment && <div className="card-comment" style={{ fontSize: item.comment.length > 80 ? "9px" : item.comment.length > 40 ? "10px" : "10.5px" }}>"{item.comment}"</div>}
                    {!isOwn && (
                      <div style={{ display: "flex", marginTop: 6, gap: 0 }}>
                        <button onClick={e => { e.stopPropagation(); onDudeSame(item); }} style={{ flex: 1, background: myReactions?.includes(String(item.id)) ? T.ink : "transparent", border: `1px solid ${T.paperDark}`, color: myReactions?.includes(String(item.id)) ? T.bg : T.inkMid, cursor: "pointer", fontSize: "7px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.08em", padding: "3px 2px", fontWeight: 700 }}>{myReactions?.includes(String(item.id)) ? "✓ Agreed" : "Agree"}</button>
                        {onAddToQueue && <button onClick={e => { e.stopPropagation(); onAddToQueue({ ...item, _cat: catKey }); }} style={{ flex: 1, background: queue?.find(q => String(q.id) === String(item.id)) ? T.ink : "transparent", border: `1px solid ${T.paperDark}`, borderLeft: "none", color: queue?.find(q => String(q.id) === String(item.id)) ? T.bg : T.inkMid, cursor: "pointer", fontSize: "7px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.08em", padding: "3px 2px", fontWeight: 700 }}>{queue?.find(q => String(q.id) === String(item.id)) ? "✓ Queue" : "+ Queue"}</button>}
                      </div>
                    )}
                  </div>
                </div>
              : isOwn
                ? <div key={`e${idx}`} className="slot-empty-sm" onClick={() => items.length < 5 && onAdd(catKey)} style={{ cursor: items.length >= 5 ? 'not-allowed' : 'pointer', opacity: items.length >= 5 ? 0.4 : 1 }}>
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
  const [showAll, setShowAll] = useState(false);
  if (!reactions.length && !myReactions.length) return null;
  const items = isOwn ? myReactions : reactions;
  if (!items.length) return null;
  const preview = showAll ? items : items.slice(0, 9);
  return (
    <div style={{ marginTop: 52, borderTop: `1px solid ${T.paperDark}`, paddingTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.08em", color: T.inkMid }}>
            {isOwn ? "Agreed With" : `${(boardOwnerName || "").split(" ")[0]} Agrees With`}
          </div>
          <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkFaint }}>
            {isOwn ? "Things you've agreed with on buddy boards" : `Things ${(boardOwnerName || "").split(" ")[0]} has agreed with`}
          </div>
        </div>
        {items.length > 9 && <button onClick={() => setShowAll(s => !s)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", background: "transparent", border: "none", color: T.inkLight, cursor: "pointer", padding: 0, flexShrink: 0 }}>{showAll ? "Show Less" : `See All (${items.length})`}</button>}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {preview.map((item, i) => {
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

function BuddyModal({ userId, onClose, onSendRequest, onGenerateLink, inviteLink, existingBuddyIds, onViewProfile }) {
  const [q, setQ]               = useState("");
  const [results, setResults]   = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [busy, setBusy]         = useState(false);
  const [sent, setSent]         = useState([]);
  const timer                   = useRef(null);

  // Load all users as suggestions on mount
  useEffect(() => {
    // Load already-sent requests
    supabase.from("buddies").select("receiver_id").eq("requester_id", userId).eq("status", "pending")
      .then(({ data }) => { if (data) setSent(data.map(r => r.receiver_id)); });
    supabase.from("profiles").select("id, username, display_name, avatar_url")
      .neq("id", userId).not("id", "in", `(${existingBuddyIds.length > 0 ? existingBuddyIds.join(",") : userId})`).order("display_name").limit(50)
      .then(async ({ data }) => {
        if (!data) return setSuggested([]);
        // Calculate mutual buddies for each suggested user
        const { data: myBuddyRows } = await supabase.from("buddies")
          .select("requester_id, receiver_id")
          .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
          .eq("status", "accepted");
        const myBuddyIds = (myBuddyRows || []).map(b => b.requester_id === userId ? b.receiver_id : b.requester_id); // eslint-disable-line no-unused-vars
        const withMutual = data.map(u => {
          // We'd need their buddy list to count mutuals - approximate with shared ids
          return { ...u, mutual_count: 0 };
        });
        setSuggested(withMutual);
      });
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
    const mutualCount = r.mutual_count || 0;
    return (
      <div key={r.id} className="result-item" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }} onClick={() => onViewProfile && onViewProfile(r)}>
          <Avatar name={r.display_name} size={52} avatarUrl={r.avatar_url} />
          <div>
            <div className="result-title">{r.display_name}</div>
            <div className="result-sub">@{r.username}</div>
            {mutualCount > 0 && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight, marginTop: 2 }}>{mutualCount} mutual {mutualCount === 1 ? "buddy" : "buddies"}</div>}
          </div>
        </div>
        {isAlready
          ? <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkFaint }}>Buddies</span>
          : isSent
          ? <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkFaint }}>Sent</span>
          : <button className="btn btn-solid" style={{ padding: "4px 12px" }} onClick={e => { e.stopPropagation(); onSendRequest(r.id); setSent(s => [...s, r.id]); }}>Add</button>
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
          <input className="search-input" placeholder="Search name or username…" value={q} onChange={e => setQ(e.target.value)} />
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

By using Vouch, you agree to these terms.

You must be 13 or older to use Vouch. You're responsible for your account and what you post. Don't use Vouch for anything unlawful or harmful to others.

You own your content. By posting it, you allow us to display it on the platform. You can remove it at any time.

Vouch uses Google, Spotify, TMDB, and Open Library to power certain features. Your use of those services is subject to their own terms.

The Vouch name, design, and code are ours. Please don't reproduce or redistribute them without permission.

Vouch is provided as-is. We're not liable for issues that arise from your use of the service.

We may update these terms occasionally. Continued use means you accept any changes.`;

const PRIVACY = `PRIVACY POLICY

Effective Date: March 11, 2026

We keep it simple.

We collect your name and email via Google Sign-In, the titles you add to your shelf and boards, your buddy connections, and basic usage data.

We use this only to run Vouch. We don't sell your data, show ads, or share anything with third parties. Your board is visible to your approved Buddies only.

We use Google for login, Spotify for music, TMDB for film and TV, and Open Library for books. We don't store credentials for any of these services.

Your data is kept as long as your account is active. To delete your account and all associated data, use the contact form in Settings.

We may update this policy occasionally. Continued use means you accept any changes.`;

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
  const DRAFT_KEY = "vouch-board-draft-v2";
  const loadDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch(e) { return null; } };
  const savedDraft = !existing ? loadDraft() : null;
  const [name, setName]               = useState(savedDraft?.name ?? existing?.name ?? "");
  const [theme, setTheme]             = useState(savedDraft?.theme ?? existing?.theme ?? "");
  const [description, setDescription] = useState(savedDraft?.description ?? existing?.description ?? "");
  const [singleCat, setSingleCat]     = useState(savedDraft?.singleCat ?? existing?.single_category ?? "");
  const [items, setItems]             = useState(savedDraft?.items ?? existing?.vouch_board_items?.sort((a,b)=>a.position-b.position).map(i => ({ ...i, id: i.item_id, sub: i.subtitle, catKey: i.category })) ?? []);
  const [addingItem, setAddingItem]   = useState(false);
  const [q, setQ]                     = useState("");
  const [results, setResults]         = useState([]);
  const [busy, setBusy]               = useState(false);
  const timer                         = useRef(null);
  const TMDB_KEY                      = "24f3b03466f2f7db2d54a0f53607da4f";

  // Auto-save draft to localStorage whenever state changes
  useEffect(() => {
    if (existing) return;
    const draft = { name, theme, description, singleCat, items };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [name, theme, description, singleCat, items, existing]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const fetches = [];
        if (!singleCat || singleCat === "movies") fetches.push(fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`).then(r=>r.json()).then(d=>(d.results||[]).slice(0,3).map(r=>({ id:r.id, title:r.title, sub:r.release_date?.slice(0,4)||"", poster:r.poster_path?`https://image.tmdb.org/t/p/w500${r.poster_path}`:null, catKey:"movies", sourceUrl:`https://www.imdb.com/find?q=${encodeURIComponent(r.title)}` }))));
        if (!singleCat || singleCat === "shows") fetches.push(fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`).then(r=>r.json()).then(d=>(d.results||[]).slice(0,2).map(r=>({ id:r.id, title:r.name, sub:r.first_air_date?.slice(0,4)||"", poster:r.poster_path?`https://image.tmdb.org/t/p/w500${r.poster_path}`:null, catKey:"shows", sourceUrl:`https://www.imdb.com/find?q=${encodeURIComponent(r.name)}` }))));
        if (!singleCat || ["albums","songs","artists"].includes(singleCat)) {
          const type = singleCat === "albums" ? "album" : singleCat === "songs" ? "track" : singleCat === "artists" ? "artist" : "track,album,artist";
          fetches.push(fetch(`/api/spotify?q=${encodeURIComponent(q)}&type=${type}`).then(r=>r.json()).then(d=>{
            const res = [];
            if (!singleCat || singleCat==="songs") (d.tracks?.items||[]).slice(0,2).forEach(r=>res.push({ id:r.id, title:r.name, sub:r.artists?.[0]?.name||"", poster:r.album?.images?.[0]?.url||null, catKey:"songs", sourceUrl:`https://open.spotify.com/track/${r.id}` }));
            if (!singleCat || singleCat==="albums") (d.albums?.items||[]).slice(0,2).forEach(r=>res.push({ id:r.id, title:r.name, sub:r.artists?.[0]?.name||"", poster:r.images?.[0]?.url||null, catKey:"albums", sourceUrl:`https://open.spotify.com/album/${r.id}` }));
            if (!singleCat || singleCat==="artists") (d.artists?.items||[]).slice(0,2).forEach(r=>res.push({ id:r.id, title:r.name, sub:r.genres?.[0]||"", poster:r.images?.[0]?.url||null, catKey:"artists", sourceUrl:`https://open.spotify.com/artist/${r.id}` }));
            return res;
          }));
        }
        if (!singleCat || singleCat === "books") fetches.push(fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=3`).then(r=>r.json()).then(d=>(d.docs||[]).slice(0,2).map(r=>({ id:r.key||r.title, title:r.title, sub:(r.author_name||[]).join(", "), poster:r.cover_i?`https://covers.openlibrary.org/b/id/${r.cover_i}-L.jpg`:null, catKey:"books", sourceUrl:`https://openlibrary.org${r.key}` }))));
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
    if (!theme) { alert("Pick a title for your Vouch."); return; }
    if (theme === "Other" && !name.trim()) { alert("Give your custom Vouch a name — like 'Summer of 2009' or 'Scorsese’s Best'"); return; }
    if (items.length === 0) { alert("Add at least one title to your Vouch."); return; }
    const finalName = theme === "Other" ? name : theme;
    localStorage.removeItem(DRAFT_KEY);
    onPublish({ name: finalName, theme, description, singleCategory: singleCat, items });
  };

  const catLabel = (key) => categories.find(c => c.key === key)?.label || key;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: "88vh" }}>
        <div className="modal-head">
          <div className="modal-title">Create Your Vouch</div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">

          {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}><div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid }}>Tile</div><div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 10, color: T.inkFaint }}>— up to 5 tiles</div></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {themes.map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.14em", padding: "4px 10px", border: `1px solid ${theme === t ? T.ink : T.paperDark}`, background: theme === t ? T.ink : "transparent", color: theme === t ? T.bg : T.inkMid, cursor: "pointer" }}>{t === "Other" ? "Other — Create Your Own" : t}</button>
              ))}
            </div>
            {theme === "Other" && (
              <input className="search-input" style={{ marginTop: 10, marginBottom: 0 }} placeholder="e.g. Summer of 2009, Scorsese's Best…" value={name} onChange={e => setName(e.target.value)} maxLength={60} />
            )}
          </div>

          {/* Current items + Add */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 8 }}>Tiles ({items.length}/5)</div>
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
                  {/* Category filter inside search */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                    <button onClick={() => setSingleCat("")} style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.12em", padding: "3px 8px", border: `1px solid ${!singleCat ? "#c9a820" : T.paperDark}`, background: !singleCat ? T.ink : "transparent", color: !singleCat ? "#c9a820" : T.inkMid, cursor: "pointer" }}>All</button>
                    {categories.map(c => (
                      <button key={c.key} onClick={() => setSingleCat(c.key)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.12em", padding: "3px 8px", border: `1px solid ${singleCat === c.key ? "#c9a820" : T.paperDark}`, background: singleCat === c.key ? T.ink : "transparent", color: singleCat === c.key ? "#c9a820" : T.inkMid, cursor: "pointer" }}>{c.label}</button>
                    ))}
                  </div>
                  <input className="search-input" placeholder={singleCat ? `Search ${catLabel(singleCat)}…` : "Search to add a title…"} value={q} onChange={e => setQ(e.target.value)} autoFocus />
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
                <div>
                  <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight, marginBottom: 8 }}>First tile is your cover — it shows when sharing.</div>
                  <button onClick={() => setAddingItem(true)} style={{ width: "100%", padding: "12px", background: T.ink, border: `1px solid ${T.paperDark}`, color: T.bg, fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpa: "0.18em", cursor: "pointer" }}>+ Add Tile</button>
                </div>
              )
            )}
          </div>

          {/* Description — below titles */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 6 }}>One Line About This Vouch (optional)</div>
            <input className="search-input" style={{ marginBottom: 0 }} placeholder="e.g. These artists remind me of the summer…" value={description} onChange={e => setDescription(e.target.value)} maxLength={120} />
          </div>

          <button onClick={handlePublish} disabled={items.length === 0} style={{ width: "100%", padding: "12px", background: items.length > 0 ? T.ink : "transparent", border: `2px solid ${items.length > 0 ? "#c9a820" : T.paperDark}`, color: items.length > 0 ? "#c9a820" : T.inkFaint, fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", cursor: items.length > 0 ? "pointer" : "not-allowed", transition: "all 0.2s" }}>Publish Vouch</button>
          <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight, marginTop: 8, textAlign: "center" }}>Once published, you can update again in 7 days.</div>
        </div>
      </div>
    </div>
  );
}

function CategoryPicker({ selected, all, onSave, isOnboarding }) {
  const [cats, setCats] = useState(selected || all.map(c => c.key));
  const toggle = (key) => setCats(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  const moveUp = (i) => { if (i === 0) return; const next = [...cats]; [next[i-1], next[i]] = [next[i], next[i-1]]; setCats(next); };
  const moveDown = (i) => { if (i === cats.length - 1) return; const next = [...cats]; [next[i], next[i+1]] = [next[i+1], next[i]]; setCats(next); };
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 10 }}>Your categories — tap arrows to reorder</div>
        {cats.map((key, i) => {
          const cat = all.find(c => c.key === key);
          if (!cat) return null;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.paperDark}` }}>
              <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 15, flex: 1 }}>{cat.label}</div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => moveUp(i)} disabled={i === 0} style={{ background: "transparent", border: `1px solid ${T.paperDark}`, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.3 : 1, width: 28, height: 28, fontFamily: "monospace", fontSize: 14 }}>↑</button>
                <button onClick={() => moveDown(i)} disabled={i === cats.length - 1} style={{ background: "transparent", border: `1px solid ${T.paperDark}`, cursor: i === cats.length - 1 ? "default" : "pointer", opacity: i === cats.length - 1 ? 0.3 : 1, width: 28, height: 28, fontFamily: "monospace", fontSize: 14 }}>↓</button>
                <button onClick={() => toggle(key)} style={{ background: T.ink, border: "none", color: T.bg, cursor: "pointer", width: 28, height: 28, fontSize: 16 }}>×</button>
              </div>
            </div>
          );
        })}
      </div>
      {all.filter(c => !cats.includes(c.key)).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkFaint, marginBottom: 10 }}>Add more</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {all.filter(c => !cats.includes(c.key)).map(cat => (
              <button key={cat.key} onClick={() => toggle(cat.key)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.14em", padding: "6px 14px", border: `1px solid ${T.paperDark}`, background: "transparent", color: T.inkMid, cursor: "pointer" }}>+ {cat.label}</button>
            ))}
          </div>
        </div>
      )}
      <button className="btn btn-solid" style={{ width: "100%", padding: "12px" }} onClick={() => onSave(cats)}>
        {isOnboarding ? "Set Up My Shelf →" : "Save Changes"}
      </button>
      {isOnboarding && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight, marginTop: 8, textAlign: "center" }}>You can always change this later in Settings.</div>}
    </div>
  );
}

function EditMetaForm({ board, themes, onSave, onClose }) {
  const [name, setName]               = useState(board.name || "");
  const [theme, setTheme]             = useState(board.theme || "");
  const [description, setDescription] = useState(board.description || "");
  const handleSave = () => {
    const finalName = theme === "Other" ? name : (theme || name);
    if (!finalName.trim()) { alert("Give your Vouch a name."); return; }
    onSave({ name: finalName, theme: theme || null, description: description || null });
  };
  return (
    <div className="modal-body">
      <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: T.inkLight, marginBottom: 20 }}>Change the name, theme, or description. Titles cannot be changed after publishing.</div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 6 }}>Theme</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {themes.map(t => (
            <button key={t} onClick={() => setTheme(t)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.14em", padding: "4px 10px", border: `1px solid ${theme === t ? T.ink : T.paperDark}`, background: theme === t ? T.ink : "transparent", color: theme === t ? T.bg : T.inkMid, cursor: "pointer" }}>{t === "Other" ? "Other — Create Your Own" : t}</button>
          ))}
        </div>
        {theme === "Other" && <input className="search-input" style={{ marginTop: 10, marginBottom: 0 }} placeholder="e.g. Summer of 2009…" value={name} onChange={e => setName(e.target.value)} maxLength={60} />}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 6 }}>One Line Description (optional)</div>
        <input className="search-input" style={{ marginBottom: 0 }} placeholder="e.g. These artists remind me of the summer…" value={description} onChange={e => setDescription(e.target.value)} maxLength={120} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-solid" style={{ flex: 1, padding: "12px" }} onClick={handleSave}>Save Changes</button>
        <button className="btn btn-ghost" style={{ flex: 1, padding: "12px" }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function GroupVouchSlideshow({ items, isMobile, onAddToQueue, queue, onDudeSame }) {
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

  const CardFaceNoButtons = ({ item }) => (
    <div style={{ position: "relative" }}>
      {item.poster
        ? <img src={item.poster} alt={item.title} style={{ width: "100%", height: 340, objectFit: "cover", display: "block", border: "1px solid rgba(200,194,180,0.2)", cursor: item.source_url ? "pointer" : "default" }} onClick={() => item.source_url && window.open(item.source_url, "_blank")} onError={e => e.target.style.display = "none"} />
        : <div style={{ width: "100%", height: 340, background: "rgba(200,194,180,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Spectral',serif", fontSize: 14, color: "rgba(200,194,180,0.5)", padding: 12, textAlign: "center", cursor: item.source_url ? "pointer" : "default" }} onClick={() => item.source_url && window.open(item.source_url, "_blank")}>{item.title}</div>}
      <div title="Total Buddy Vouches" style={{ position: "absolute", top: 8, left: 8, background: "rgba(17,16,8,0.82)", color: "rgba(200,194,180,0.95)", fontFamily: "'Spectral SC',serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", padding: "3px 8px" }}>{item.count} {item.count === 1 ? "Vouch" : "Vouches"}</div>
      <div style={{ padding: "10px 4px 4px" }}>
        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.45)", marginBottom: 4 }}>{item.category}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18, lineHeight: 1.2, marginBottom: 4, color: "#C8C2B4" }}>{item.title}</div>
        <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: "rgba(200,194,180,0.7)" }}>{item.subtitle || ""}</div>
        <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 10, color: "rgba(200,194,180,0.4)", marginTop: 4 }}>{item.vouchers?.length > 0 ? item.vouchers.join(", ") : ""}</div>
      </div>
    </div>
  );

  const CardFace = ({ item }) => {
    const isQueued = queue?.find(q => String(q.id) === String(item.item_id || item.id));
    return (
      <div style={{ position: "relative" }}>
        {item.poster
          ? <img src={item.poster} alt={item.title} style={{ width: "100%", height: 340, objectFit: "cover", display: "block", border: "1px solid rgba(200,194,180,0.2)", cursor: item.source_url ? "pointer" : "default" }} onClick={() => item.source_url && window.open(item.source_url, "_blank")} onError={e => e.target.style.display = "none"} />
          : <div style={{ width: "100%", height: 340, background: "rgba(200,194,180,0.1)", border: "1px solid rgba(200,194,180,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Spectral',serif", fontSize: 14, color: "rgba(200,194,180,0.5)", padding: 12, textAlign: "center", cursor: item.source_url ? "pointer" : "default" }} onClick={() => item.source_url && window.open(item.source_url, "_blank")}>{item.title}</div>}
        <div title="Total Buddy Vouches" style={{ position: "absolute", top: 8, left: 8, background: "rgba(17,16,8,0.82)", color: "rgba(200,194,180,0.95)", fontFamily: "'Spectral SC',serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", padding: "3px 8px" }}>{item.count} {item.count === 1 ? "Vouch" : "Vouches"}</div>
        <div style={{ padding: "10px 4px 4px" }}>
          <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.45)", marginBottom: 4 }}>{item.category}</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18, lineHeight: 1.2, marginBottom: 4, color: "#C8C2B4" }}>{item.title}</div>
          <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: "rgba(200,194,180,0.7)" }}>{item.subtitle || ""}</div>
          <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 10, color: "rgba(200,194,180,0.4)", marginTop: 4 }}>
            {item.vouchers?.length > 0 ? item.vouchers.join(", ") : ""}
          </div>
          <div style={{ display: "flex", marginTop: 10 }}>
            {onAddToQueue && <button onClick={e => { e.stopPropagation(); onAddToQueue(item); }} style={{ flex: 1, background: isQueued ? "rgba(200,194,180,0.25)" : "rgba(200,194,180,0.1)", border: "1px solid rgba(200,194,180,0.2)", color: isQueued ? "rgba(200,194,180,0.95)" : "rgba(200,194,180,0.6)", cursor: "pointer", fontSize: "8px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.1em", padding: "6px 4px", fontWeight: 700, transition: "all 0.15s" }}>{isQueued ? "✓ Queued" : "+ Queue"}</button>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="vouch-section" style={{ marginBottom: 40, border: "3px double #999", boxShadow: "0 0 0 1px #666" }}>
      <div className="vouch-section-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="vouch-section-label">Group Vouch</div>
          <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.4)", marginTop: 3 }}>Most vouched across your circle</div>
        </div>
      </div>
      {isMobile ? (
        <div>
          <div ref={containerRef} style={{ overflow: "hidden", userSelect: "none" }}>
            <div className="gv-track" style={{ display: "flex", willChange: "transform" }}>
              {items.map((item, i) => (
                <div key={i} style={{ flex: "0 0 100%", width: "100%" }}>
                  <CardFaceNoButtons item={item} />
                </div>
              ))}
            </div>
          </div>
          {items.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14, marginBottom: 10 }}>
              {items.map((_, i) => (
                <div key={i} onClick={() => setIdx(i)} style={{ width: 6, height: 6, borderRadius: "50%", background: i === idx ? "#C8C2B4" : "rgba(200,194,180,0.25)", cursor: "pointer", transition: "background 0.2s" }} />
              ))}
            </div>
          )}
          {items[idx] && (() => {
            const item = items[idx];
            const isQueued = queue?.find(q => String(q.id) === String(item.item_id || item.id));
            return (
              <div style={{ display: "flex", marginTop: 8 }}>
                {onAddToQueue && <button onClick={() => onAddToQueue(item)} style={{ flex: 1, background: isQueued ? "rgba(200,194,180,0.25)" : "rgba(200,194,180,0.1)", border: "1px solid rgba(200,194,180,0.2)", color: isQueued ? "rgba(200,194,180,0.95)" : "rgba(200,194,180,0.6)", cursor: "pointer", fontSize: "8px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.1em", padding: "8px 4px", fontWeight: 700, transition: "all 0.15s" }}>{isQueued ? "✓ Queued" : "+ Queue"}</button>}
              </div>
            );
          })()}
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

function BuddiesBin({ allBuddyBoards, buddies, onViewBuddy, onAddToQueue, queue, onDudeSame, myReactions, userId }) {
  const [modalCat, setModalCat] = useState(null);
  const isMobile = window.innerWidth <= 640;

  // Build per-category tile lists - stable, shuffled once
  const catItemsRef = useRef(null);
  const prevBoardsLen = useRef(0);
  if (!catItemsRef.current || prevBoardsLen.current !== allBuddyBoards.length) {
    prevBoardsLen.current = allBuddyBoards.length;
    const built = {};
    CATEGORIES.forEach(cat => { built[cat.key] = []; });
    const seen = new Set();
    allBuddyBoards.forEach(row => {
      if (!row.user_id || buddies.every(b => b.userId !== row.user_id)) return;
      const key = row.category + ":" + row.item_id;
      if (seen.has(key)) {
        const existing = built[row.category]?.find(i => i.item_id === row.item_id);
        if (existing) {
          const buddy = buddies.find(b => b.userId === row.user_id);
          if (buddy && !existing.owners.find(o => o.userId === buddy.userId)) existing.owners.push(buddy);
        }
        return;
      }
      seen.add(key);
      if (!built[row.category]) return;
      const buddy = buddies.find(b => b.userId === row.user_id);
      built[row.category].push({ item_id: row.item_id, title: row.title, poster: row.poster, subtitle: row.subtitle || "", source_url: row.source_url, user_id: row.user_id, owners: buddy ? [buddy] : [] });
    });
    Object.keys(built).forEach(key => {
      const arr = built[key];
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    });
    catItemsRef.current = built;
  }
  const catItems = catItemsRef.current || {};

  const visibleCats = CATEGORIES.filter(cat => catItems[cat.key]?.length > 0);
  if (visibleCats.length === 0) return null;

  const TileCard = ({ item }) => (
    <div style={{ flexShrink: 0, width: isMobile ? 95 : 150, cursor: item.source_url ? "pointer" : "default" }}
      onClick={() => item.source_url && window.open(item.source_url, "_blank")}>
      {item.poster
        ? <img src={item.poster} alt={item.title} style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", border: "1px solid " + T.paperDark, display: "block" }} onError={e => e.target.style.display = "none"} />
        : <div style={{ width: "100%", aspectRatio: "2/3", background: T.paperDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "'Spectral',serif", color: T.inkLight, textAlign: "center", padding: 6 }}>{item.title}</div>}
      <div style={{ fontFamily: "'Spectral',serif", fontSize: 11, fontWeight: 600, color: T.ink, marginTop: 5, lineHeight: 1.3 }}>{item.title}</div>
      {item.owners.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: onAddToQueue ? 6 : 0 }}>
            {item.owners.slice(0,3).map((o, i) => {
              const parts = (o.displayName || "").trim().split(" ");
              const shortName = parts[0] + (parts[1] ? " " + parts[1][0] + "." : "");
              return (
                <div key={i} onClick={e => { e.stopPropagation(); onViewBuddy(o); }} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <Avatar name={o.displayName} size={18} avatarUrl={o.avatarUrl} />
                  <span style={{ fontFamily: "'Spectral',serif", fontSize: 10, color: T.inkMid }}>{shortName}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", marginTop: 4, gap: 0 }}>
            {(() => {
              const isAgreed = myReactions?.find(r => String(r.item_id) === String(item.item_id) && r.item_owner_id === item.user_id);
              return onDudeSame && item.user_id && item.user_id !== userId && <button onClick={e => { e.stopPropagation(); onDudeSame({ ...item, id: item.item_id, _cat: item.category }, item.user_id); }} style={{ flex: 1, background: isAgreed ? T.ink : "transparent", border: `1px solid ${T.paperDark}`, color: isAgreed ? T.bg : T.inkMid, cursor: "pointer", fontSize: "7px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.08em", padding: "3px 2px", fontWeight: 700 }}>{isAgreed ? "✓ Agreed" : "Agree"}</button>;
            })()}
            {onAddToQueue && <button onClick={e => { e.stopPropagation(); onAddToQueue(item); }} style={{ flex: 1, background: queue?.find(q => String(q.id) === String(item.item_id)) ? T.ink : "transparent", border: `1px solid ${T.paperDark}`, borderLeft: "none", color: queue?.find(q => String(q.id) === String(item.item_id)) ? T.bg : T.inkMid, cursor: "pointer", fontSize: "7px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.08em", padding: "3px 2px", fontWeight: 700 }}>{queue?.find(q => String(q.id) === String(item.item_id)) ? "✓ Queue" : "+ Queue"}</button>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ fontFamily: "'Times New Roman',Times,serif", fontWeight: 900, fontSize: 22, color: T.ink, letterSpacing: "0.04em", marginBottom: 4 }}>Group Shelf</div>
      <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: T.inkLight, marginBottom: 28 }}>Everything your circle is vouching for</div>
      {visibleCats.map(cat => (
        <div key={cat.key} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "2px solid " + T.ink, paddingBottom: 8, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.08em" }}>{cat.label}</div>
            {catItems[cat.key].length > 5 && (
              <button onClick={() => setModalCat(cat.key)} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", background: "transparent", border: "none", color: T.inkLight, cursor: "pointer", padding: 0 }}>See All →</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {catItems[cat.key].slice(0, 5).map((item, i) => <TileCard key={i} item={item} />)}
          </div>
        </div>
      ))}

      {modalCat && (
        <div className="modal-overlay" onClick={() => setModalCat(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
            <div className="modal-head">
              <div className="modal-title">{CATEGORIES.find(c => c.key === modalCat)?.label} — Your Circle</div>
              <button className="modal-x" onClick={() => setModalCat(null)}>×</button>
            </div>
            <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {catItems[modalCat].map((item, i) => <TileCard key={i} item={item} />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BuddyFeed({ buddies, selfId, selfName, selfAvatar, onViewBuddy, onDudeSame, onAddToQueue, queue, myReactions, onShelfExtras }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!buddies.length) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const buddyIds = [...buddies.map(b => b.userId), selfId].filter(Boolean);
        // Load buddy vouch boards
        const { data: boards } = await supabase
          .from("vouch_boards")
          .select("*, vouch_board_items(*)")
          .in("user_id", buddyIds)
          .eq("is_active", true)
          .order("published_at", { ascending: false })
          .limit(30);
        // Load buddy reactions
        const { data: reactions } = await supabase
          .from("reactions")
          .select("*")
          .in("user_id", buddyIds)
          .order("created_at", { ascending: false })
          .limit(30);
        // Shelf additions from buddies
        const { data: shelfAdds } = await supabase
          .from("endorsements")
          .select("*")
          .in("user_id", buddyIds)
          .order("created_at", { ascending: false })
          .limit(30);
        // Fetch owner profiles separately
        const ownerIds = [...new Set((reactions || []).map(r => r.item_owner_id).filter(Boolean))];
        const ownerProfiles = {};
        if (ownerIds.length > 0) {
          const { data: owners } = await supabase.from("profiles").select("id, display_name, username, avatar_url").in("id", ownerIds);
          (owners || []).forEach(p => { ownerProfiles[p.id] = p; });
        }
        (reactions || []).forEach(r => { r.owner = ownerProfiles[r.item_owner_id] || null; });
        const items = [];
        const allPeople = [...buddies, { userId: selfId, displayName: selfName || "You", avatarUrl: selfAvatar || null }];
        (boards || []).forEach(b => {
          if (!b.published_at) return;
          const buddy = allPeople.find(x => x.userId === b.user_id);
          items.push({ type: "vouch", date: new Date(b.published_at), board: b, buddy });
        });
        (reactions || []).forEach(r => {
          const buddy = allPeople.find(x => x.userId === r.user_id);
          items.push({ type: "agree", date: new Date(r.created_at), reaction: r, buddy });
        });
        // Group shelf adds by user within 20 minutes
        const shelfGroups = {};
        (shelfAdds || []).forEach(s => {
          if (!s.created_at) return;
          const buddy = allPeople.find(x => x.userId === s.user_id);
          const date = new Date(s.created_at);
          const key = s.user_id + ":" + Math.floor(date.getTime() / (20 * 60 * 1000));
          if (!shelfGroups[key]) {
            shelfGroups[key] = { type: "shelf", date, shelves: [s], buddy };
            items.push(shelfGroups[key]);
          } else {
            shelfGroups[key].shelves.push(s);
            if (date > shelfGroups[key].date) shelfGroups[key].date = date;
          }
        });
        items.sort((a, b) => b.date - a.date);
        // Group agrees by item_id + item_owner_id
        const grouped = [];
        const agreeGroups = {};
        items.forEach(item => {
          if (item.type === "agree") {
            const key = item.reaction.item_id + ":" + item.reaction.item_owner_id;
            if (!agreeGroups[key]) {
              agreeGroups[key] = { ...item, buddies: [item.buddy] };
              grouped.push(agreeGroups[key]);
            } else {
              agreeGroups[key].buddies.push(item.buddy);
              // Keep most recent date
              if (item.date > agreeGroups[key].date) agreeGroups[key].date = item.date;
            }
          } else {
            grouped.push(item);
          }
        });
        grouped.sort((a, b) => b.date - a.date);
        setFeed(grouped.slice(0, 40));
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [buddies, selfId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="loading">Loading…</div>;
  if (!feed.length && buddies.length > 0) return <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: "#7a7568", padding: "24px 0" }}>No activity yet — check back soon.</div>;

  return (
    <div>
      {feed.map((item, i) => {
        if (item.type === "vouch") {
          const b = item.board;
          const buddy = item.buddy;
          const theme = (b.theme && b.theme !== "Other") ? b.theme : (b.name || "Vouch");
          const items = (b.vouch_board_items || []).sort((a,x) => a.position - x.position).slice(0,5);
          return (
            <div key={i} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div onClick={() => buddy && onViewBuddy(buddy)} style={{ cursor: "pointer", flexShrink: 0 }}>
                  <Avatar name={buddy?.displayName || "?"} size={28} avatarUrl={buddy?.avatarUrl} />
                </div>
                <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: "#3a3830" }}>
                  <span onClick={() => buddy && onViewBuddy(buddy)} style={{ fontWeight: 600, cursor: "pointer" }}>{buddy?.displayName}</span>
                  <span style={{ fontStyle: "italic", color: "#7a7568" }}> published a Vouch</span>
                  <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.1em", color: "#a09890", marginLeft: 8 }}>{item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
              <div className="vouch-section" style={{ marginBottom: 32 }}>
                <div className="vouch-section-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="vouch-section-label">{theme}</div>
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.4)", marginTop: 3 }}>Vouch</div>
                    {b.description && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: "rgba(200,194,180,0.45)", marginTop: 4 }}>{b.description}</div>}
                  </div>
                </div>
                {items.length > 0 && (() => {
                  const vbBoard = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
                  items.forEach(it => {
                    if (vbBoard[it.category]) vbBoard[it.category].push({ id: it.item_id, title: it.title, sub: it.subtitle || "", poster: it.poster, comment: "", vouched: true, sourceUrl: it.source_url, _cat: it.category, _catLabel: it.category });
                  });
                  const isSelfBoard = b.user_id === selfId; return <VouchSection board={vbBoard} isOwn={isSelfBoard} onCard={()=>{}} onAdd={()=>{}} onRemove={()=>{}} onDudeSame={onDudeSame || (()=>{})} myReactions={(myReactions || []).filter(r => r.item_owner_id === b.user_id).map(r => r.item_id)} hideHeader={true} hideEmptySlots={true} onAddToQueue={isSelfBoard ? null : (onAddToQueue || null)} queue={queue} ownerId={b.user_id} />;
                })()}
              </div>
            </div>
          );
        }
        if (item.type === "shelf") {
          const shelves = item.shelves || [item.shelf];
          const primary = shelves[0];
          const extras = shelves.slice(1);
          const buddy = item.buddy;
          if (!primary) return null;
          return (
            <div key={i} style={{ borderBottom: "1px solid #b3ada0", paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div onClick={() => buddy && onViewBuddy(buddy)} style={{ cursor: "pointer", flexShrink: 0 }}>
                  <Avatar name={buddy?.displayName || "?"} size={28} avatarUrl={buddy?.avatarUrl} />
                </div>
                <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: "#3a3830" }}>
                  <span onClick={() => buddy && onViewBuddy(buddy)} style={{ fontWeight: 600, cursor: "pointer" }}>{buddy?.displayName}</span>
                  <span style={{ fontStyle: "italic", color: "#7a7568" }}> added </span>
                  {extras.length > 0
                    ? <span><strong style={{ fontStyle: "normal" }}>{primary.title}</strong><span style={{ fontStyle: "italic", color: "#7a7568" }}> and </span><span style={{ fontWeight: 600, color: "#7a7568", cursor: "pointer", borderBottom: "1px dashed #7a7568" }} onClick={e => { e.stopPropagation(); onShelfExtras && onShelfExtras(extras); }}>{extras.length} other tile{extras.length > 1 ? "s" : ""}</span><span style={{ fontStyle: "italic", color: "#7a7568" }}> to their shelf</span></span>
                    : <span><span style={{ fontStyle: "italic", color: "#7a7568" }}></span><strong style={{ fontStyle: "normal" }}>{primary.title}</strong><span style={{ fontStyle: "italic", color: "#7a7568" }}> to their shelf</span></span>
                  }
                  <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.1em", color: "#a09890", marginLeft: 8 }}>{item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
              <div style={{ width: "100%", maxWidth: 300, margin: "0 auto", cursor: primary.source_url ? "pointer" : "default" }} onClick={() => primary.source_url && window.open(primary.source_url, "_blank")}>
                {primary.poster && <img src={primary.poster} alt={primary.title} style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", border: "1px solid #b3ada0", display: "block" }} onError={e => e.target.style.display = "none"} />}
                <div style={{ fontFamily: "'Spectral',serif", fontSize: "14px", fontWeight: 600, color: "#111008", marginTop: 8, lineHeight: 1.3 }}>{primary.title}</div>
                {primary.subtitle && <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", color: "#a09890", marginTop: 2 }}>{primary.subtitle}</div>}
                {onDudeSame && buddy && buddy.userId !== selfId && (
                  <div style={{ display: "flex", marginTop: 8 }}>
                    <button onClick={e => { e.stopPropagation(); onDudeSame({ id: primary.item_id, title: primary.title, poster: primary.poster, _cat: primary.category }, buddy.userId); }} style={{ flex: 1, background: (myReactions||[]).find(r => r.item_id === String(primary.item_id) && r.item_owner_id === buddy.userId) ? "#111008" : "transparent", border: "1px solid #b3ada0", color: (myReactions||[]).find(r => r.item_id === String(primary.item_id) && r.item_owner_id === buddy.userId) ? "#C8C2B4" : "#3a3830", cursor: "pointer", fontSize: "8px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.1em", padding: "6px 4px", fontWeight: 700 }}>{(myReactions||[]).find(r => r.item_id === String(primary.item_id) && r.item_owner_id === buddy.userId) ? "✓ Agreed" : "Agree"}</button>
                    {onAddToQueue && <button onClick={e => { e.stopPropagation(); onAddToQueue({ id: primary.item_id, title: primary.title, poster: primary.poster, source_url: primary.source_url, category: primary.category, user_id: buddy.userId }); }} style={{ flex: 1, background: (queue||[]).find(q => String(q.id) === String(primary.item_id)) ? "#111008" : "transparent", border: "1px solid #b3ada0", borderLeft: "none", color: (queue||[]).find(q => String(q.id) === String(primary.item_id)) ? "#C8C2B4" : "#3a3830", cursor: "pointer", fontSize: "8px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.1em", padding: "6px 4px", fontWeight: 700 }}>{(queue||[]).find(q => String(q.id) === String(primary.item_id)) ? "✓ Queued" : "+ Queue"}</button>}
                  </div>
                )}
              </div>
            </div>
          );
        }
        if (item.type === "agree") {
          const r = item.reaction;
          const buddies = item.buddies || [item.buddy];
          const shown = buddies.slice(0, 2).filter(Boolean);
          const rest = buddies.slice(2).filter(Boolean);
          return (
            <div key={i} style={{ borderBottom: "1px solid #b3ada0", paddingBottom: 24, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: -6, flexShrink: 0 }}>
                  {shown.map((b, j) => (
                    <div key={j} onClick={() => b && onViewBuddy(b)} style={{ cursor: "pointer", marginLeft: j > 0 ? -8 : 0 }}>
                      <Avatar name={b?.displayName || "?"} size={28} avatarUrl={b?.avatarUrl} />
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: "'Spectral',serif", fontSize: 13, color: "#3a3830", flex: 1 }}>
                  {shown.map((b, j) => (
                    <span key={j}>
                      {j > 0 && <span style={{ fontStyle: "italic", color: "#7a7568" }}> and </span>}
                      <span onClick={() => b && onViewBuddy(b)} style={{ fontWeight: 600, cursor: "pointer" }}>{b?.displayName}</span>
                    </span>
                  ))}
                  {rest.length > 0 && (
                    <span>
                      <span style={{ fontStyle: "italic", color: "#7a7568" }}> and </span>
                      <span style={{ fontWeight: 600, color: "#7a7568" }}>{rest.map(b => b?.displayName).filter(Boolean).join(", ")}</span>
                    </span>
                  )}
                  <span style={{ fontStyle: "italic", color: "#7a7568" }}> agreed with </span>
                  {r.owner
                    ? <span onClick={() => r.owner && onViewBuddy({ userId: r.owner.id, displayName: r.owner.display_name, username: r.owner.username, avatarUrl: r.owner.avatar_url })} style={{ fontWeight: 600, cursor: "pointer" }}>{r.owner.display_name}</span>
                    : null}
                  <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.1em", color: "#a09890", marginLeft: 8 }}>{item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
              {r.poster && (
                <div style={{ width: "100%", maxWidth: 300, margin: "0 auto" }}>
                  <div style={{ cursor: r.source_url ? "pointer" : "default" }} onClick={() => r.source_url && window.open(r.source_url, "_blank")}>
                    <img src={r.poster} alt={r.title} style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", border: "1px solid #b3ada0", display: "block" }} onError={e => e.target.style.display = "none"} />
                    <div style={{ fontFamily: "'Spectral',serif", fontSize: "14px", fontWeight: 600, color: "#111008", marginTop: 8, lineHeight: 1.3 }}>{r.title}</div>
                    {r.subtitle && <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", color: "#a09890", marginTop: 2 }}>{r.subtitle}</div>}
                  </div>
                  {onDudeSame && r.item_owner_id && r.item_owner_id !== selfId && (
                    <div style={{ display: "flex", marginTop: 8 }}>
                      <button onClick={() => onDudeSame({ id: r.item_id, title: r.title, poster: r.poster, _cat: r.category }, r.item_owner_id)} style={{ flex: 1, background: (myReactions||[]).find(x => x.item_id === r.item_id && x.item_owner_id === r.item_owner_id) ? "#111008" : "transparent", border: "1px solid #b3ada0", color: (myReactions||[]).find(x => x.item_id === r.item_id && x.item_owner_id === r.item_owner_id) ? "#C8C2B4" : "#3a3830", cursor: "pointer", fontSize: "8px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.1em", padding: "6px 4px", fontWeight: 700 }}>
                        {(myReactions||[]).find(x => x.item_id === r.item_id && x.item_owner_id === r.item_owner_id) ? "✓ Agreed" : "Agree"}
                      </button>
                      {onAddToQueue && <button onClick={() => onAddToQueue({ id: r.item_id, title: r.title, poster: r.poster, source_url: r.source_url, category: r.category })} style={{ flex: 1, background: (queue||[]).find(q => q.id === r.item_id) ? "#111008" : "transparent", border: "1px solid #b3ada0", borderLeft: "none", color: (queue||[]).find(q => q.id === r.item_id) ? "#C8C2B4" : "#3a3830", cursor: "pointer", fontSize: "8px", fontFamily: "'Spectral SC',serif", letterSpacing: "0.1em", padding: "6px 4px", fontWeight: 700 }}>
                        {(queue||[]).find(q => q.id === r.item_id) ? "✓ Queued" : "+ Queue"}
                      </button>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

function ContactForm({ userId, userEmail, onSent }) {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      await fetch("https://formsubmit.co/ajax/ctanner.wallis@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          message: msg,
          _subject: "Vouch Feedback",
          userId: userId || "unknown",
          username: userEmail || "unknown",
        })
      });
      setSent(true);
      setMsg("");
      if (onSent) setTimeout(onSent, 1500);
    } catch(e) { console.error(e); }
    setBusy(false);
  };

  if (sent) return <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight }}>Thanks — we got it.</div>;

  return (
    <div>
      <textarea
        className="comment-area"
        style={{ height: 100, marginBottom: 10 }}
        placeholder="Your message…"
        value={msg}
        onChange={e => setMsg(e.target.value)}
        maxLength={1000}
      />
      <button className="btn btn-solid" onClick={send} disabled={busy || !msg.trim()} style={{ width: "100%" }}>
        {busy ? "Sending…" : "Send Message"}
      </button>
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
  const [buddySearch,    setBuddySearch]    = useState("");
  const [shareModal,     setShareModal]     = useState(false);
  const [avatarPicker,   setAvatarPicker]   = useState(false);
  const [avatarLightbox, setAvatarLightbox] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "instant" });
  const isMobileGlobal = typeof window !== "undefined" && window.innerWidth <= 640;


  // Save and restore scroll position when leaving/returning to page
  // Removed scroll save/restore - was causing flicker on tab switch
  const profileCache = useRef({});

  useEffect(() => {
    const handlePop = (e) => {
      const path = window.location.pathname;
      if (path === "/" || path === "") {
        setViewing(null);
        const state = e.state;
        if (state?.tab) setTab(state.tab);
        else setTab("board");
        scrollToTop();
      } else if (path.startsWith("/@")) {
        const username = path.slice(2);
        supabase.from("profiles").select("id, display_name, avatar_url, username").eq("username", username).maybeSingle()
          .then(({ data }) => {
            if (data) {
              setViewing({ userId: data.id, username: data.username, displayName: data.display_name, avatarUrl: data.avatar_url });
              setTab("board");
              loadViewBoard(data.id);
              loadBoardReactions(data.id, true);
            }
          });
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [sentRequests,   setSentRequests]   = useState([]);
  const [acceptedBuddies, setAcceptedBuddies] = useState([]);
  const [userCategories, setUserCategories] = useState(null);
  const [onboarding,     setOnboarding]     = useState(false);
  const [activeBoard,    setActiveBoard]    = useState(null);
  const [boardArchive,   setBoardArchive]   = useState([]);
  const [boardEditor,    setBoardEditor]    = useState(false);
  const [archivePage,    setArchivePage]    = useState(false);
  const [editingBoard,   setEditingBoard]   = useState(null);
  const [editingMeta,    setEditingMeta]    = useState(false);
  const [newAgreements,  setNewAgreements]  = useState([]);
  const [newBuddies,     setNewBuddies]     = useState([]);
  const [showAgreements, setShowAgreements] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showShareNudge,   setShowShareNudge]   = useState(false);
  const [shelfExtras,     setShelfExtras]     = useState(null);
  const [pastNotifications, setPastNotifications] = useState([]);
  const [viewerReactions,setViewerReactions]= useState([]);
  const [viewActiveBoard,setViewActiveBoard]= useState(null);
  const [suggested, setSuggested] = useState([]); // eslint-disable-line no-unused-vars
  const [queue,          setQueue]          = useState([]);
  const queueRef = useRef([]);
  const [shelfView,      setShelfView]      = useState("shelf"); // "shelf" | "queue"
  useEffect(() => { queueRef.current = queue; }, [queue]);

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
          item_id: String(item.id || item.item_id),
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
    setTimeout(() => setShareModal(true), 300);
  };

  const unpublishBoard = async () => { // eslint-disable-line no-unused-vars
    if (!activeBoard) return;
    if (!window.confirm("Unpublish your current Vouch? It will be removed from public view. You can republish or create a new one immediately.")) return;
    await supabase.from("vouch_boards").update({ is_active: false, published_at: null }).eq("id", activeBoard.id);
    await loadVouchBoards(userId);
  };

  const republishBoard = async (archivedBoard) => {
    // Deactivate current
    await supabase.from("vouch_boards").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
    // Reactivate archived board with new published_at
    await supabase.from("vouch_boards").update({ is_active: true, published_at: new Date().toISOString() }).eq("id", archivedBoard.id);
    await loadVouchBoards(userId);
  };

  const loadBoardReactions = async (ownerId, isViewing = false) => {
    const { data } = await supabase.from("reactions").select("*").eq("item_owner_id", ownerId).order("created_at", { ascending: false });
    setBoardReactions(data || []);
    if (isViewing) {
      const { data: theirAgreements } = await supabase.from("reactions").select("*").eq("user_id", ownerId).order("created_at", { ascending: false });
      setViewerReactions(theirAgreements || []);
    }
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
    // Use cache if available - refresh reactions but skip board/shelf refetch
    if (profileCache.current[uid]) {
      const cached = profileCache.current[uid];
      setViewBoard(cached.board);
      setViewActiveBoard(cached.activeBoard);
      setViewing(prev => ({ ...(prev || {}), ...cached.profile }));
      setViewBuddies(cached.buddies || []);
      return;
    }
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
    const { data: activeBoardData } = await supabase.from("vouch_boards").select("*, vouch_board_items(*)").eq("user_id", uid).eq("is_active", true).maybeSingle();
    setViewActiveBoard(activeBoardData || null);
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

  const [groupVouchItems, setGroupVouchItems] = useState([]);

  const loadGroupVouch = async (buddyIds, excludeId) => {
    if (!buddyIds.length) return;
    try {
      // Vouch board items from all buddy boards (active + archived)
      // Get vouch board ids for buddies first
      const { data: buddyBoards } = await supabase
        .from("vouch_boards")
        .select("id, user_id")
        .in("user_id", buddyIds)
        .eq("is_active", true);
      const boardMap = {};
      (buddyBoards || []).forEach(b => { boardMap[b.id] = b.user_id; });
      const boardIds = Object.keys(boardMap);
      const { data: vbItems } = boardIds.length > 0 ? await supabase
        .from("vouch_board_items")
        .select("item_id, title, category, poster, source_url, board_id")
        .in("board_id", boardIds) : { data: [] };
      // Attach user_id from boardMap
      (vbItems || []).forEach(r => { r.user_id = boardMap[r.board_id] || null; });

      // Shelf items from buddies
      const { data: shelfItems } = await supabase
        .from("endorsements")
        .select("item_id, title, category, poster, source_url, user_id")
        .in("user_id", buddyIds);

      // Agrees from buddies (not self)
      const { data: agreeItems } = await supabase
        .from("reactions")
        .select("item_id, title, category, poster, source_url, item_owner_id")
        .in("user_id", buddyIds);

      const counts = {};
      const addRow = (row) => {
        if (!row.item_id || !row.title) return;
        const key = (row.category || "") + ":" + row.item_id;
        if (!counts[key]) counts[key] = { item_id: row.item_id, title: row.title, category: row.category || "", poster: row.poster || null, source_url: row.source_url || null, count: 0, user_id: row.user_id || null };
        counts[key].count++;
      };
      (vbItems || []).forEach(r => addRow(r));
      (shelfItems || []).forEach(r => addRow(r));
      (agreeItems || []).forEach(r => addRow({ ...r, user_id: r.item_owner_id }));

      const top5 = Object.values(counts)
        .filter(i => i.category)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(i => ({ ...i, vouchers: [], source_url: i.source_url }));

      setGroupVouchItems(top5);
    } catch(e) { console.error("loadGroupVouch error:", e); }
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
      if (accepted.length > 0) {
        loadAllBuddyBoards(accepted, uid);
        loadGroupVouch(accepted.map(b => b.userId), uid);
      }
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
        // Always use stored avatar if it exists - never override with Google
        const avatarUrl = storedAvatar || googleAvatar;
        if (!existingProfile) {
          await supabase.from("profiles").upsert({
            id: uid,
            username: session.user.email.split("@")[0],
            display_name: session.user.user_metadata?.full_name || session.user.email.split("@")[0],
            avatar_url: googleAvatar,
          }, { onConflict: "id" });
          // Auto-buddy with Christian (founder) on signup
          if (uid !== "bd7a4b83-c56c-438a-8ad0-d188f810fe70") {
            const { data: existing } = await supabase.from("buddies")
              .select("id")
              .or(`and(requester_id.eq.${uid},receiver_id.eq.bd7a4b83-c56c-438a-8ad0-d188f810fe70),and(requester_id.eq.bd7a4b83-c56c-438a-8ad0-d188f810fe70,receiver_id.eq.${uid})`)
              .maybeSingle();
            if (!existing) {
              await supabase.from("buddies").insert({ requester_id: "bd7a4b83-c56c-438a-8ad0-d188f810fe70", receiver_id: uid, status: "accepted" });
              await supabase.from("buddies").insert({ requester_id: uid, receiver_id: "bd7a4b83-c56c-438a-8ad0-d188f810fe70", status: "accepted" }).catch(() => {});
              // Store flag so we can show the welcome notification on first login
              localStorage.setItem("vouch-new-buddy-christian-" + uid, "1");
            }
          }
        } else if (existingProfile && !storedAvatar && googleAvatar) {
          // Only set Google avatar if user has no avatar at all
          await supabase.from("profiles").update({ avatar_url: googleAvatar }).eq("id", uid);
        }
        // Always ensure auto-buddy with Christian regardless of new/existing user
        if (uid !== "bd7a4b83-c56c-438a-8ad0-d188f810fe70") {
          let isNewBuddy = false;
          try {
            const res = await supabase.from("buddies").insert({ requester_id: "bd7a4b83-c56c-438a-8ad0-d188f810fe70", receiver_id: uid, status: "accepted" });
            if (!res.error) isNewBuddy = true;
          } catch(e) {}
          try {
            await supabase.from("buddies").insert({ requester_id: uid, receiver_id: "bd7a4b83-c56c-438a-8ad0-d188f810fe70", status: "accepted" });
          } catch(e) {}
          // Show welcome notification on buddies tab for new user
          if (isNewBuddy) setNewBuddies(["Christian Wallis"]);
        }
        // Never overwrite a custom (non-Google) avatar on login
        setUser({ username: existingProfile?.username || session.user.email.split("@")[0], displayName: existingProfile?.display_name || session.user.user_metadata?.full_name || session.user.email.split("@")[0], avatarUrl });
        setUserId(uid);
        setTab("home");
        loadBoard(uid);
        loadBuddies(uid);
        loadMyReactions(uid);
        loadVouchBoards(uid);
        // Check for new agreements since last visit
        const { data: visitProf } = await supabase.from("profiles").select("last_visit").eq("id", uid).maybeSingle();
        const lastVisit = visitProf?.last_visit || localStorage.getItem("vouch-last-visit") || new Date(0).toISOString();
        const { data: newAgrees } = await supabase.from("reactions")
          .select("user_id, title")
          .eq("item_owner_id", uid)
          .gt("created_at", lastVisit)
          .order("created_at", { ascending: false })
          .limit(5);
        // Check for newly accepted buddy requests since last visit
        const { data: newAccepted } = await supabase.from("buddies")
          .select("requester_id, receiver_id, profiles!buddies_receiver_id_fkey(display_name), requester:profiles!buddies_requester_id_fkey(display_name)")
          .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`)
          .eq("status", "accepted")
          .gt("updated_at", lastVisit);
        if (newAccepted && newAccepted.length > 0) {
          const buddyNames = newAccepted.map(b => {
            const otherName = b.requester_id === uid ? b.profiles?.display_name : b.requester?.display_name;
            return otherName;
          }).filter(Boolean);
          setNewBuddies(buddyNames);
        }
        if (newAgrees && newAgrees.length > 0) {
          const uids = [...new Set(newAgrees.map(r => r.user_id))];
          const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", uids);
          newAgrees.forEach(r => { r.display_name = profs?.find(p => p.id === r.user_id)?.display_name || "Someone"; });
          setNewAgreements(newAgrees);
        }
        // Check for new buddy requests since last visit
        const { data: newBuddyReqs } = await supabase.from("buddies")
          .select("requester_id, profiles!buddies_requester_id_fkey(display_name)")
          .eq("receiver_id", uid)
          .eq("status", "pending")
          .gt("created_at", lastVisit);
        if (newBuddyReqs && newBuddyReqs.length > 0) {
          // pendingIn state will handle display - just ensure badge updates
          console.log("New buddy requests:", newBuddyReqs.length);
        }
        const nowVisit = new Date().toISOString();
        localStorage.setItem("vouch-last-visit", nowVisit);
        await supabase.from("profiles").update({ last_visit: nowVisit }).eq("id", uid);
        // Load category preferences
        const { data: prof } = await supabase.from("profiles").select("categories").eq("id", uid).maybeSingle();
        if (prof?.categories && prof.categories.length > 0) {
          setUserCategories(prof.categories);
        } else if (prof && !prof.categories) {
          setOnboarding(true);
          setUserCategories(CATEGORIES.map(c => c.key));
        } else {
          setUserCategories(CATEGORIES.map(c => c.key));
        }
        loadVouchBoards(uid);
        // Load queue from localStorage
        try {
          // Try DB first, fall back to localStorage
          const { data: qProf } = await supabase.from("profiles").select("queue_items").eq("id", uid).maybeSingle();
          if (qProf?.queue_items) {
            const dbQueue = JSON.parse(qProf.queue_items);
            setQueue(dbQueue);
            localStorage.setItem("vouch-queue-" + uid, JSON.stringify(dbQueue));
          } else {
            const saved = JSON.parse(localStorage.getItem("vouch-queue-" + uid) || "[]");
            setQueue(saved);
            if (saved.length > 0) {
              supabase.from("profiles").update({ queue_items: JSON.stringify(saved) }).eq("id", uid).catch(() => {});
            }
          }
        } catch(e) {}
        try {
          const savedNotifs = JSON.parse(localStorage.getItem("vouch-past-notifs-" + uid) || "[]");
          setPastNotifications(savedNotifs);
        } catch(e) {}
        // Show welcome buddy notification if this is their first login
        if (localStorage.getItem("vouch-new-buddy-christian-" + uid)) {
          setNewBuddies(["Christian Wallis"]);
          localStorage.removeItem("vouch-new-buddy-christian-" + uid);
        }
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
      // Ignore TOKEN_REFRESHED, SIGNED_IN from tab focus - only handle initial auth
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); };

  const isOwn     = !viewing;
  const currBoard = isOwn ? board : viewBoard;
  const currName  = isOwn ? user?.displayName : viewing?.displayName || viewing?.username;

  const dudeSame = async (item, overrideOwnerId) => {
    if (!userId) return;
    const ownerId = overrideOwnerId || viewing?.userId;
    if (!ownerId) return;
    if (ownerId === userId) return;
    const resolvedItemId = String(item.id || item.item_id);
    const already = myReactions.find(r => r.item_id === resolvedItemId && r.item_owner_id === ownerId);
    if (already) {
      await supabase.from("reactions").delete().eq("id", already.id);

    } else {
      await supabase.from("reactions").upsert({
        user_id: userId,
        item_owner_id: ownerId,
        item_id: resolvedItemId,
        category: item._cat || item.catKey || item.category || "",
        title: item.title,
        subtitle: item.sub || item.subtitle || item.artist || item.author || "",
        poster: item.poster || null,
        source_url: item.sourceUrl || item.source_url || null,
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
    const activeBoardItems = (activeBoard?.vouch_board_items || []).sort((a,b) => a.position - b.position);
    const topItem = activeBoardItems.length > 0
      ? { ...activeBoardItems[0], title: activeBoardItems[0].title, sub: activeBoardItems[0].subtitle || "", poster: activeBoardItems[0].poster, _cat: activeBoardItems[0].category }
      : Object.values(currBoard).flat().find(i => i.vouched) || Object.values(currBoard).flat()[0];

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
      const boardTheme = activeBoard?.theme && activeBoard.theme !== "Other" ? activeBoard.theme : (activeBoard?.name || "");
      ctx.strokeStyle = "rgba(17,16,8,0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(72, 1592); ctx.lineTo(380, 1592); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(700, 1592); ctx.lineTo(1008, 1592); ctx.stroke();
      ctx.fillStyle = "#555";
      ctx.font = "italic 400 40px 'Times New Roman', serif";
      ctx.textAlign = "center";
      ctx.fillText(boardTheme, 540, 1604);
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
      ctx.fillText("See what else " + (shareName || shareUsername).split(" ")[0] + " is vouching for — Link in Bio", 540, 1832);
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

  const saveCategories = async (cats) => {
    await supabase.from("profiles").update({ categories: cats }).eq("id", userId);
    setUserCategories(cats);
    setOnboarding(false);
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

  const viewBuddy = async (buddy) => { // eslint-disable-line no-unused-vars
    window.scrollTo(0, 0);
    setViewing(buddy);
    setTab("board");
    await loadViewBoard(buddy.userId);
    await loadBoardReactions(buddy.userId, true);
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

    // Optimistically update UI immediately - always fully remove from display
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

  const addToQueue = async (item) => {
    if (!userId) return;
    const itemId = String(item.item_id || item.id);
    const currentQueue = queueRef.current;
    const exists = currentQueue.find(q => String(q.id) === itemId);
    const newQ = exists
      ? currentQueue.filter(q => String(q.id) !== itemId)
      : [...currentQueue, { id: itemId, title: item.title, poster: item.poster || null, sub: item.sub || item.subtitle || "", sourceUrl: item.sourceUrl || item.source_url || null, category: item._cat || item.category || item.catKey || "" }];
    setQueue(newQ);
    localStorage.setItem("vouch-queue-" + userId, JSON.stringify(newQ));
    await supabase.from("profiles").update({ queue_items: JSON.stringify(newQ) }).eq("id", userId);
  };
  const removeFromQueue = async (id) => {
    const newQ = queueRef.current.filter(q => String(q.id) !== String(id));
    setQueue(newQ);
    localStorage.setItem("vouch-queue-" + userId, JSON.stringify(newQ));
    await supabase.from("profiles").update({ queue_items: JSON.stringify(newQ) }).eq("id", userId);
  };
  const vouchedCount = Object.values(board).flat().filter(item => item.vouched).length;

  // PWA badge
  useEffect(() => {
    const count = (newAgreements || []).length + (pendingIn || []).length + (newBuddies || []).length;
    if (navigator.setAppBadge) {
      if (count > 0) navigator.setAppBadge(count);
      else navigator.clearAppBadge();
    }
  }, [newAgreements.length, pendingIn.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const canPublish = (() => {
    if (!activeBoard || !activeBoard.published_at) return true;
    const publishedAt = new Date(activeBoard.published_at);
    const pubDay = new Date(publishedAt.getFullYear(), publishedAt.getMonth(), publishedAt.getDate());
    const today = new Date();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysSince = (todayDay - pubDay) / (1000 * 60 * 60 * 24);
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
            loadBoardReactions(data.id, true);
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
          <div className="masthead-meta" style={{ justifyContent: "space-between" }}>
              <span className="clickable" style={{ fontWeight: 700 }} onClick={() => setLegalPage("how")}>How it Works</span>
              <span className="clickable" onClick={() => setShowContactModal(true)}>Contact</span>
              <span className="clickable" onClick={() => { setTab("board"); setViewing(null); window.history.replaceState({}, "", "/"); scrollToTop(); }}>@{user.username}</span>
              <span className="clickable" onClick={signOut}>Sign out</span>
          </div>
          <div className="masthead-nameplate" onClick={() => { setTab("board"); setViewing(null); window.history.replaceState({}, "", "/"); scrollToTop(); }}>
            <span className="nameplate-word">Vouch.</span>
          </div>
          <div className="masthead-rule-ornament"><span>—</span><span>✦</span><span>—</span></div>
          <div className="masthead-tagline">Love it? Vouch for it.</div>
          <nav className="nav">
            <button className={`nav-btn${tab === "home" ? " active" : ""}`} onClick={() => { setTab("home"); setViewing(null); window.history.pushState({tab:"home"}, "", "/"); scrollToTop(); }} style={{ position: "relative" }}>
              Home
              {newAgreements.length > 0 && tab !== "home" && <span style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: T.ink }} />}
            </button>
            <button className={`nav-btn${tab === "board" && !viewing ? " active" : ""}`} onClick={() => { setTab("board"); setViewing(null); window.history.pushState({tab:"board"}, "", "/"); scrollToTop(); }}>My Board</button>
            <button className={`nav-btn${tab === "friends" ? " active" : ""}`} onClick={() => { setTab("friends"); setViewing(null); window.history.pushState({tab:"friends"}, "", "/"); scrollToTop(); }} style={{ position: "relative" }}>
              Buddies
              {pendingIn.length > 0 && <span style={{ position: "absolute", top: 5, right: 5, background: tab === "friends" ? T.bg : T.ink, borderRadius: "50%", width: 6, height: 6, display: "inline-block" }} />}
            </button>
            <button className={`nav-btn${tab === "archive" ? " active" : ""}`} onClick={() => { setTab("archive"); setViewing(null); window.history.pushState({tab:"archive"}, "", "/"); scrollToTop(); }}>Archive</button>
            <button className={`nav-btn${tab === "settings" ? " active" : ""}`} onClick={() => { setTab("settings"); setViewing(null); window.history.pushState({tab:"settings"}, "", "/"); scrollToTop(); }}>Settings</button>

          </nav>
        </header>

        <main className="page">


          {tab === "home" && !viewing && (
            <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: 24 }}>
              {newAgreements.length > 0 && (
                <div style={{ background: T.ink, color: T.bg, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setShowAgreements(true)}>
                  <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13 }}>
                    {newAgreements.length === 1
                      ? <><strong style={{ fontStyle: "normal", fontFamily: "'Spectral SC',serif", fontSize: 11 }}>{newAgreements[0].display_name}</strong> agreed with <strong style={{ fontStyle: "normal" }}>{newAgreements[0].title}</strong> →</>
                      : <><strong style={{ fontStyle: "normal", fontFamily: "'Spectral SC',serif", fontSize: 11 }}>{newAgreements.length} people</strong> agreed with your titles — tap to see →</>
                    }
                  </div>
                  <button onClick={e => { e.stopPropagation(); setNewAgreements([]); }} style={{ background: "transparent", border: "none", color: "rgba(200,194,180,0.5)", fontSize: 20, cursor: "pointer", padding: 0, flexShrink: 0 }}>×</button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div className="board-name" style={{ fontSize: 28 }}>Home</div>
                {(newAgreements.length + pendingIn.length + newBuddies.length) > 0 && (
                  <button onClick={() => setShowNotifications(true)} style={{ background: tab === "home" ? T.bg : T.ink, border: "none", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: "'Spectral SC',serif", fontSize: 9, fontWeight: 700, color: tab === "home" ? T.ink : T.bg, flexShrink: 0 }}>
                    {newAgreements.length + pendingIn.length + newBuddies.length}
                  </button>
                )}
              </div>
              <div className="board-sub" style={{ marginBottom: 28 }}>Recent activity from your circle</div>
              {buddies.length === 0
                ? <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: "#7a7568", padding: "24px 0" }}>Add some buddies to see their activity here.</div>
                : <BuddyFeed buddies={buddies} selfId={userId} selfName={user?.displayName} selfAvatar={user?.avatarUrl} onViewBuddy={(buddy) => { setViewing(buddy); setTab("board"); loadViewBoard(buddy.userId); loadBoardReactions(buddy.userId, true); window.scrollTo(0,0); }} onDudeSame={dudeSame} onAddToQueue={addToQueue} queue={queue} myReactions={myReactions} onShelfExtras={setShelfExtras} />
              }
            </div>
          )}
          {tab === "archive" && !viewing && (
            <div style={{ maxWidth: 540, margin: "32px auto" }}>
              <div className="board-name" style={{ fontSize: 28, marginBottom: 8 }}>Your Archive</div>
              <div className="board-sub" style={{ marginBottom: 32 }}>Every Vouch you have published</div>
              {boardArchive.length === 0 && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight }}>No archived boards yet.</div>}
              {boardArchive.reduce((acc, b) => {
                const d = b.published_at ? new Date(b.published_at) : null;
                const key = d ? d.toLocaleString("en-US", { month: "long" }) + " " + d.getFullYear() : "Unpublished";
                const existing = acc.find(g => g.key === key);
                if (existing) existing.boards.push(b);
                else acc.push({ key, boards: [b] });
                return acc;
              }, []).map(({ key: monthYear, boards }) => (
                <div key={monthYear} style={{ marginBottom: 40 }}>
                  <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.18em", color: T.inkMid, borderBottom: "2px solid " + T.ink, paddingBottom: 8, marginBottom: 20 }}>{monthYear}</div>
                  {boards.map(b => (
                    <div key={b.id} style={{ marginBottom: 32 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontFamily: "'Times New Roman',Times,serif", fontWeight: 900, fontSize: 22, color: T.ink }}>{(b.theme && b.theme !== "Other") ? b.theme : (b.name || "Untitled Vouch")}</div>
                          <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.12em", color: T.inkLight, marginTop: 3 }}>
                            {b.published_at ? new Date(b.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                            {b.is_active && <span style={{ marginLeft: 8, color: "#c9a820", fontWeight: 700 }}>Active</span>}
                          </div>
                          {b.description && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: T.inkMid, marginTop: 4 }}>{b.description}</div>}
                        </div>
                        {!b.is_active && (
                          <button className="btn btn-solid" style={{ padding: "6px 14px", flexShrink: 0, opacity: canPublish ? 1 : 0.6, cursor: canPublish ? "pointer" : "not-allowed", background: canPublish ? undefined : "transparent", color: canPublish ? undefined : T.inkMid, border: canPublish ? undefined : `1px solid ${T.paperDark}` }} onClick={() => canPublish && republishBoard(b)}>
                            Republish
                          </button>
                        )}
                      </div>
                      {b.vouch_board_items && b.vouch_board_items.length > 0 && (
                        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                          {b.vouch_board_items.slice().sort((a,x) => a.position - x.position).slice(0,5).map((item, i) => (
                            <div key={i} style={{ flexShrink: 0, width: 80 }}>
                              {item.poster
                                ? <img src={item.poster} alt={item.title} style={{ width: 80, height: 110, objectFit: "cover", border: "1px solid " + T.paperDark, display: "block" }} onError={e => e.target.style.display = "none"} />
                                : <div style={{ width: 80, height: 110, background: T.paperDark, border: "1px solid " + T.paperDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "'Spectral',serif", color: T.inkLight, textAlign: "center", padding: 4 }}>{item.title}</div>}
                              <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "7px", color: T.inkFaint, marginTop: 4, textAlign: "center", lineHeight: 1.3 }}>{item.title}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {tab === "settings" && !viewing && (
            <div style={{ maxWidth: 540, margin: "32px auto" }}>
              <div className="board-name" style={{ fontSize: 28, marginBottom: 8 }}>Settings</div>
              <div className="board-sub" style={{ marginBottom: 32 }}>Customize your Vouch experience</div>
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", marginBottom: 8 }}>My Shelf Categories</div>
                <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight, marginBottom: 20, lineHeight: 1.6 }}>
                  Choose which categories appear on your shelf.
                </div>
                <CategoryPicker selected={userCategories || CATEGORIES.map(c => c.key)} all={CATEGORIES} onSave={saveCategories} />
              </div>
              <div style={{ borderTop: `1px solid ${T.paperDark}`, paddingTop: 28 }}>
                <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", marginBottom: 16 }}>Avatar</div>
                <button className="btn btn-ghost" onClick={() => setAvatarPicker(true)}>Change Avatar</button>
              </div>
              <div id="contact-form" style={{ borderTop: `1px solid ${T.paperDark}`, paddingTop: 28, marginTop: 28 }}>
                <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", marginBottom: 8 }}>Contact & Feedback</div>
                <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight, marginBottom: 16, lineHeight: 1.6 }}>Got feedback, a bug to report, or need help? Send a note.</div>
                <ContactForm userId={userId} userEmail={user?.username} />
              </div>
            </div>
          )}

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
                <div style={{ padding: "30px 0 18px", borderBottom: `1px solid ${T.ink}`, marginBottom: 32 }}>
                  <div className="board-name" style={{ fontSize: 32, marginBottom: 4 }}>Buddies</div>
                  <div className="board-sub" style={{ marginBottom: 16 }}>{buddies.length} connection{buddies.length !== 1 ? "s" : ""}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowBuddyList(true)}>View Buddies ({buddies.length})</button>
                    <button className="btn btn-solid" style={{ flex: 1 }} onClick={() => setBuddyModal(true)}>+ Add Buddies</button>
                  </div>
                </div>
                {/* WELCOME NOTIFICATION - first buddy */}
                {newBuddies.length > 0 && newBuddies.includes("Christian Wallis") && (
                  <div style={{ marginBottom: 24, border: `2px solid ${T.ink}`, padding: "16px 18px" }}>
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "10px", letterSpacing: "0.18em", color: T.ink, marginBottom: 14, fontWeight: 700 }}>Your First Buddy</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => { setViewing({ userId: "bd7a4b83-c56c-438a-8ad0-d188f810fe70", username: "ctanner.wallis", displayName: "Christian Wallis", avatarUrl: null }); setTab("board"); loadViewBoard("bd7a4b83-c56c-438a-8ad0-d188f810fe70"); loadBoardReactions("bd7a4b83-c56c-438a-8ad0-d188f810fe70", true); window.scrollTo(0,0); }}>
                        <Avatar name="Christian Wallis" size={40} avatarUrl={null} />
                        <div>
                          <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 15 }}>Christian Wallis</div>
                          <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", color: T.inkLight }}>@ctanner.wallis · Creator</div>
                        </div>
                      </div>
                      <button onClick={() => setNewBuddies([])} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkFaint, background: "transparent", border: "none", cursor: "pointer" }}>Dismiss</button>
                    </div>
                  </div>
                )}
                {/* PENDING REQUESTS - top of page */}
                {pendingIn.length > 0 && (
                  <div style={{ marginBottom: 24, border: `2px solid ${T.ink}`, padding: "16px 18px" }}>
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "10px", letterSpacing: "0.18em", color: T.ink, marginBottom: 14, fontWeight: 700 }}>
                      {pendingIn.length} Buddy Request{pendingIn.length !== 1 ? "s" : ""}
                    </div>
                    {pendingIn.map(b => (
                      acceptedBuddies.includes(b.buddyRowId)
                        ? <div key={b.buddyRowId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.paperDark}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar name={b.displayName} size={40} avatarUrl={b.avatarUrl} />
                              <div>
                                <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 15 }}>{b.displayName}</div>
                                <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", color: T.inkLight }}>@{b.username}</div>
                                {buddies.filter(x => false).length > 0 && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight }}>mutual buddies</div>}
                              </div>
                            </div>
                            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: "#4a7c59", fontWeight: 700 }}>✓ Added</div>
                          </div>
                        : <div key={b.buddyRowId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.paperDark}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar name={b.displayName} size={40} avatarUrl={b.avatarUrl} />
                              <div>
                                <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 15 }}>{b.displayName}</div>
                                <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", color: T.inkLight }}>@{b.username}</div>
                                {buddies.filter(x => false).length > 0 && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: T.inkLight }}>mutual buddies</div>}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="btn btn-solid" style={{ padding: "5px 14px" }} onClick={() => { acceptBuddy(b.buddyRowId); setAcceptedBuddies(prev => [...prev, b.buddyRowId]);
                          const buddyNotif = { type: "buddy", display_name: b.displayName, date: new Date().toISOString() };
                          setPastNotifications(prev => { const updated = [buddyNotif, ...prev].slice(0,50); localStorage.setItem("vouch-past-notifs-" + userId, JSON.stringify(updated)); return updated; }); }}>Accept</button>
                              <button className="btn btn-ghost" style={{ padding: "5px 14px" }} onClick={() => removeBuddy(b.buddyRowId)}>Decline</button>
                            </div>
                          </div>
                    ))}
                  </div>
                )}


                {/* GROUP VOUCH - top of page */}
                {groupVouchItems.length > 0 && (
                  <GroupVouchSlideshow items={groupVouchItems} isMobile={isMobileGlobal} onAddToQueue={addToQueue} queue={queue} onDudeSame={dudeSame} />
                )}

                <BuddiesBin allBuddyBoards={allBuddyBoards} buddies={buddies} onViewBuddy={(buddy) => { setViewing(buddy); setTab("board"); loadViewBoard(buddy.userId); loadBoardReactions(buddy.userId, true); window.scrollTo(0,0); }} onAddToQueue={addToQueue} queue={queue} onDudeSame={dudeSame} myReactions={myReactions} userId={userId} />





              </>
            : (tab === "board" || viewing) ? <>
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
                    {viewing && viewing.userId !== userId && !buddies.find(b => b.userId === viewing.userId) && (() => {
                      const isSentToViewing = sentRequests.includes(viewing.userId);
                      return isSentToViewing
                        ? <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", color: T.inkFaint }}>Sent</span>
                        : <button onClick={() => { sendBuddyRequest(viewing.userId); setSentRequests(prev => [...prev, viewing.userId]); }} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", padding: "6px 14px", background: "transparent", color: T.ink, border: `1px solid ${T.ink}`, cursor: "pointer", whiteSpace: "nowrap" }}>+ Add Buddies</button>;
                    })()}
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

                {isOwn && (canPublish
                  ? <button onClick={() => { setEditingBoard(null); setBoardEditor(true); }} style={{ width: "100%", fontFamily: "'Spectral SC',serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", padding: "14px", background: T.ink, color: T.bg, border: "none", cursor: "pointer", marginBottom: 16 }}>Publish a New Vouch Board</button>
                  : <div style={{ width: "100%", fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.15em", padding: "14px", background: "rgba(17,16,8,0.15)", color: T.inkMid, textAlign: "center", marginBottom: 16, border: `2px solid ${T.ink}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>🔒</span>
                      <span>Next Vouch available {nextPublishDate}</span>
                    </div>
                )}

                {isOwn ? (
                  <div className="vouch-section" style={{ marginBottom: 52 }}>
                    <div className="vouch-section-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="vouch-section-label">{(activeBoard?.theme && activeBoard.theme !== "Other") ? activeBoard.theme : (activeBoard?.name || "Vouch")}</div>
                        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.4)", marginTop: 3 }}>Vouch</div>
                        {activeBoard?.description && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 10, color: "rgba(200,194,180,0.4)", marginTop: 2 }}>{activeBoard.description}</div>}
                        {activeBoard?.published_at && <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "7px", letterSpacing: "0.1em", color: "rgba(200,194,180,0.3)", marginTop: 4 }}>Published {new Date(activeBoard.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · Current Vouch</div>}
                      </div>

                    </div>
                    {activeBoard?.vouch_board_items?.length > 0 ? (
                      <VouchSection board={(() => {
                        const b = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
                        (activeBoard.vouch_board_items || []).sort((a,b) => a.position - b.position).slice(0,5).forEach(item => {
                          if (b[item.category]) b[item.category].push({ id: item.item_id, title: item.title, sub: item.subtitle || "", poster: item.poster, comment: "", vouched: true, sourceUrl: item.source_url, _cat: item.category, _catLabel: CATEGORIES.find(c=>c.key===item.category)?.label || item.category });
                        });
                        return b;
                      })()} isOwn={true} onCard={(k, i) => {}} onAdd={() => {}} onRemove={() => {}} onDudeSame={() => {}} myReactions={[]} buddyCounts={buddyCounts} hideHeader={true} />
                    ) : (
                      <div style={{ height: 220, border: "1px dashed rgba(200,194,180,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, cursor: "pointer" }} onClick={() => { setEditingBoard(null); setBoardEditor(true); }}>
                        <span style={{ fontSize: 28, color: "rgba(200,194,180,0.4)" }}>+</span>
                        <span style={{ fontFamily: "'Spectral SC',serif", fontSize: "10px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.4)" }}>Create Your Vouch</span>
                      </div>
                    )}
                  </div>
                ) : viewActiveBoard?.vouch_board_items?.length > 0 ? (
                  <div className="vouch-section" style={{ marginBottom: 52 }}>
                    <div className="vouch-section-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="vouch-section-label">{(viewActiveBoard?.theme && viewActiveBoard.theme !== "Other") ? viewActiveBoard.theme : (viewActiveBoard?.name || "Vouch")}</div>
                        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(200,194,180,0.4)", marginTop: 3 }}>Vouch</div>
                        {viewActiveBoard.description && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: "rgba(200,194,180,0.45)", marginTop: 5 }}>{viewActiveBoard.description}</div>}
                        {viewActiveBoard.published_at && <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "7px", letterSpacing: "0.1em", color: "rgba(200,194,180,0.3)", marginTop: 4 }}>Published {new Date(viewActiveBoard.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>}
                      </div>
                    </div>
                    <VouchSection board={(() => {
                      const brd = { movies: [], albums: [], artists: [], songs: [], books: [], shows: [] };
                      (viewActiveBoard.vouch_board_items || []).sort((a,x) => a.position - x.position).slice(0,5).forEach(item => {
                        if (brd[item.category]) brd[item.category].push({ id: item.item_id, title: item.title, sub: item.subtitle || "", poster: item.poster, comment: "", vouched: true, sourceUrl: item.source_url, _cat: item.category, _catLabel: CATEGORIES.find(c=>c.key===item.category)?.label || item.category });
                      });
                      return brd;
                    })()} isOwn={false} onCard={(k,i)=>{}} onAdd={()=>{}} onRemove={()=>{}} onDudeSame={dudeSame} myReactions={myReactions.filter(r => viewing && r.item_owner_id === viewing.userId).map(r => r.item_id)} buddyCounts={buddyCounts} hideHeader={true} onAddToQueue={addToQueue} queue={queue} ownerId={viewing?.userId} />
                  </div>
                ) : null}

                {(() => {
                  const cats = isOwn
                    ? (userCategories ? CATEGORIES.filter(c => userCategories.includes(c.key)).sort((a,b) => userCategories.indexOf(a.key) - userCategories.indexOf(b.key)) : CATEGORIES)
                    : [...CATEGORIES].sort((a, b) => {
                        const aLen = (currBoard[a.key] || []).length;
                        const bLen = (currBoard[b.key] || []).length;
                        return bLen - aLen;
                      });
                  const visibleCats = cats.filter(cat => isOwn || (currBoard[cat.key] || []).length > 0);
                  if (visibleCats.length === 0) return null;
                  return <>
                    <div style={{ marginBottom: 28, borderBottom: `2px solid ${T.ink}`, paddingBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontFamily: "'Spectral SC', serif", fontWeight: 700, fontSize: 32, color: T.ink, letterSpacing: "0.08em" }}>
                          {isOwn ? (shelfView === "queue" ? "My Queue" : "My Shelf") : `${(currName || "").split(" ")[0]}'s Shelf`}
                        </div>
                        {isOwn && (
                          <div style={{ display: "flex", gap: 0, border: `1px solid ${T.ink}`, flexShrink: 0 }}>
                            <button onClick={() => setShelfView("shelf")} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.14em", padding: "5px 12px", background: shelfView === "shelf" ? T.ink : "transparent", color: shelfView === "shelf" ? T.bg : T.inkMid, border: "none", cursor: "pointer" }}>Shelf</button>
                            <button onClick={() => setShelfView("queue")} style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.14em", padding: "5px 12px", background: shelfView === "queue" ? T.ink : "transparent", color: shelfView === "queue" ? T.bg : T.inkMid, border: "none", cursor: "pointer" }}>Queue {queue.length > 0 ? `(${queue.length})` : ""}</button>
                          </div>
                        )}
                      </div>
                      <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: T.inkLight, marginTop: 3 }}>
                        {isOwn
                          ? shelfView === "queue"
                            ? "Things you want to get to — add from buddy shelves and Group Shelf."
                            : "The stuff on your shelf — films, albums, books, shows worth putting your name behind."
                          : `What ${(currName || "").split(" ")[0]} has on their shelf.`}
                      </div>
                    </div>
                    {isOwn && shelfView === "queue" ? (
                      queue.length === 0
                        ? <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: T.inkLight, padding: "24px 0" }}>Nothing in your queue yet — hit "Add to Queue" on any buddy's shelf or Group Shelf tile.</div>
                        : <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                            {queue.map(item => (
                              <div key={item.id} style={{ width: 180, flexShrink: 0, position: "relative" }}>
                                {item.poster
                                  ? <img src={item.poster} alt={item.title} style={{ width: 180, height: 248, objectFit: "cover", border: `1px solid ${T.paperDark}`, display: "block", cursor: item.sourceUrl ? "pointer" : "default" }} onClick={() => item.sourceUrl && window.open(item.sourceUrl, "_blank")} onError={e => e.target.style.display = "none"} />
                                  : <div style={{ width: 180, height: 248, background: T.paperDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontFamily: "'Spectral',serif", color: T.inkLight, textAlign: "center", padding: 10 }}>{item.title}</div>}
                                <button onClick={() => removeFromQueue(item.id)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(17,16,8,0.85)", border: "none", color: "#C8C2B4", width: 26, height: 26, cursor: "pointer", fontSize: 16, lineHeight: "26px", textAlign: "center", borderRadius: 2 }}>×</button>
                                <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.1em", color: T.inkFaint, marginTop: 4 }}>{item.category}</div>
                                <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 12.5, lineHeight: 1.35, marginTop: 2 }}>{item.title}</div>
                                {item.sub && <div style={{ fontFamily: "'Spectral SC',serif", fontSize: 9.5, color: T.inkLight, marginTop: 2 }}>{item.sub}</div>}
                              </div>
                            ))}
                          </div>
                    ) : (
                      visibleCats.map(cat => {
                        const items = currBoard[cat.key] || [];
                        return <CatSection key={cat.key} catKey={cat.key} label={cat.label} items={items} isOwn={isOwn} onCard={(k, i) => setLightbox({ catKey: k, idx: i })} onAdd={(key) => {  setAddModal(key); }} onRemove={removeItem} onDudeSame={dudeSame} myReactions={myReactions.filter(r => viewing && r.item_owner_id === viewing.userId).map(r => r.item_id)} buddyCounts={buddyCounts} onAddToQueue={addToQueue} queue={queue} />;
                      })
                    )}
                  </>;
                })()}

                <MutualMentions reactions={isOwn ? boardReactions : viewerReactions} myReactions={myReactions} isOwn={isOwn} boardOwnerName={currName} buddies={buddies} onViewBuddy={(b) => { setViewing(b); setTab("board"); loadViewBoard(b.userId); loadBoardReactions(b.userId, true); window.scrollTo(0, 0); }} />


              </>
            : null
          }
        </main>

        {lightbox && (() => {
          const items = currBoard[lightbox.catKey] || [];
          if (!items.length) return null;
          return <Lightbox items={items} start={lightbox.idx} catLabel={CATEGORIES.find(c => c.key === lightbox.catKey)?.label} onClose={() => setLightbox(null)} />;
        })()}

        {buddyModal && (
          <BuddyModal userId={userId} onClose={() => { setBuddyModal(false); setInviteLink(null); }} onSendRequest={sendBuddyRequest} onGenerateLink={generateInviteLink} inviteLink={inviteLink} existingBuddyIds={buddies.map(b => b.userId)} onViewProfile={(r) => { setBuddyModal(false); setViewing({ userId: r.id, username: r.username, displayName: r.display_name, avatarUrl: r.avatar_url }); setTab("board"); loadViewBoard(r.id); loadBoardReactions(r.id, true); window.scrollTo(0,0); }} />
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
                <input className="search-input" placeholder="Search buddies…" value={buddySearch || ""} onChange={e => setBuddySearch(e.target.value)} style={{ marginBottom: 14 }} />
                {(isOwn ? buddies : viewBuddies).length === 0 && (
                  <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight }}>No buddies yet.</div>
                )}
                {(isOwn ? buddies.map(b => ({ id: b.userId, display_name: b.displayName, username: b.username, avatar_url: b.avatarUrl, buddyRowId: b.buddyRowId })) : viewBuddies).filter(b => !buddySearch || (b.display_name || b.displayName || "").toLowerCase().includes(buddySearch.toLowerCase()) || (b.username || "").toLowerCase().includes(buddySearch.toLowerCase())).map((b, i) => {
                  const bid = b.id || b.userId;
                  const bname = b.display_name || b.displayName;
                  const buser = b.username;
                  const bavatar = b.avatar_url || b.avatarUrl;
                  const isAlreadyBuddy = buddies.find(x => x.userId === bid);
                  const isSelf = bid === userId;
                  const isSent = sentRequests.includes(bid);
                  return (
                    <div key={bid || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.paperDark}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => { setShowBuddyList(false); setViewing({ userId: bid, username: buser, displayName: bname, avatarUrl: bavatar }); setTab("board"); loadViewBoard(bid); loadBoardReactions(bid, true); window.scrollTo(0, 0); }}>
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
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
              <div className="modal-head">
                <div className="modal-title">Your Vouch Archive</div>
                <button className="modal-x" onClick={() => setArchivePage(false)}>×</button>
              </div>
              <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>
                {boardArchive.length === 0 && <div style={{ fontFaily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight }}>No archived boards yet.</div>}
                {(() => {
                  const grouped = {};
                  boardArchive.forEach(b => {
                    const d = b.published_at ? new Date(b.published_at) : null;
                    const key = d ? `${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}` : "Unpublished";
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(b);
                  });
                  return Object.entries(grouped).map(([monthYear, boards]) => (
                    <div key={monthYear} style={{ marginBottom: 32 }}>
                      <div style={{ fontFamily: "'Spectral SC',serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.18em", color: T.inkMid, borderBottom: `1px solid ${T.paperDark}`, paddingBottom: 8, marginBottom: 16 }}>{monthYear}</div>
                      {boards.map(b => (
                        <div key={b.id} style={{ marginBottom: 24 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div>
                              <div style={{ fontFamily: "'Times New Roman',Times,serif", fontWeight: 900, fontSize: 20, color: T.ink }}>{(b.theme && b.theme !== "Other") ? b.theme : (b.name || "Untitled Vouch")}</div>
                              <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.12em", color: T.inkLight, marginTop: 2 }}>
                                {b.published_at ? new Date(b.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                                {b.is_active && <span style={{ marginLeft: 8, color: "#c9a820", fontWeight: 700 }}>· Active</span>}
                              </div>
                              {b.description && <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fntSize: 11, color: T.inkMid, marginTop: 3 }}>{b.description}</div>}
                            </div>
                            {!b.is_active && (
                              <button className="btn btn-solid" style={{ padding: "4px 12px", fontSize: 10, flexShrink: 0, opacity: canPublish ? 1 : 0.35, cursor: canPublish ? "pointer" : "not-allowed" }} onClick={() => { if (canPublish) { republishBoard(b); setArchivePage(false); } }}>
                                {canPublish ? "Republish" : "Locked"}
                              </button>
                            )}
                          </div>
                          {b.vouch_board_items?.length > 0 && (
                            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                              {b.vouch_board_items.sort((a,x) => a.position - x.position).slice(0,5).map((item, i) => (
                                <div key={i} style={{ flexShrink: 0, width: 70 }}>
                                  {item.poster
                                    ? <img src={item.poster} alt={item.title} style={{ width: 70, height: 96, objectFit: "cover", border: `1px solid ${T.paperDark}`, display: "block" }} onError={e => e.target.style.display = "none"} />
                                    : <div style={{ width: 70, height: 96, background: T.paperDark, border: `1px solid ${T.paperDark}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontFamily: "'Spectral',serif", color: T.inkLight, textAlign: "center", padding: 4 }}>{item.title}</div>}
                                  <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "7px", color: T.inkFaint, marginTop: 3, textAlign: "center", lineHeight: 1.3 }}>{item.title}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
        {showNotifications && (
          <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title">Notifications</div>
                <button className="modal-x" onClick={() => setShowNotifications(false)}>×</button>
              </div>
              <div className="modal-body">
                {newAgreements.length === 0 && pendingIn.length === 0 && (
                  <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight }}>No new notifications.</div>
                )}
                {newBuddies.filter(n => n !== "Christian Wallis").length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 10 }}>New Connections</div>
                    {newBuddies.filter(n => n !== "Christian Wallis").map((name, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.paperDark}` }}>
                        <div style={{ fontFamily: "'Spectral',serif", fontSize: 14 }}>
                          <strong>{name}</strong> <span style={{ fontStyle: "italic", color: T.inkMid }}>and you are now buddies</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {pendingIn.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 10 }}>Buddy Requests</div>
                    {pendingIn.map(b => (
                      <div key={b.buddyRowId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.paperDark}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={b.displayName} size={40} avatarUrl={b.avatarUrl} />
                          <div>
                            <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 14 }}>{b.displayName}</div>
                            <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", color: T.inkLight }}>wants to connect</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-solid" style={{ padding: "4px 10px" }} onClick={() => { acceptBuddy(b.buddyRowId); setAcceptedBuddies(prev => [...prev, b.buddyRowId]);
                          const buddyNotif = { type: "buddy", display_name: b.displayName, date: new Date().toISOString() };
                          setPastNotifications(prev => { const updated = [buddyNotif, ...prev].slice(0,50); localStorage.setItem("vouch-past-notifs-" + userId, JSON.stringify(updated)); return updated; }); }}>Accept</button>
                          <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={() => removeBuddy(b.buddyRowId)}>Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {newAgreements.length > 0 && (
                  <div>
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkMid, marginBottom: 10 }}>New Agrees</div>
                    {newAgreements.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.paperDark}` }}>
                        <div style={{ width: 36, height: 36, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontFamily: "'Times New Roman',serif", fontWeight: 900, fontSize: 13, color: T.bg }}>{(r.display_name || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}</span>
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 14 }}>{r.display_name}</div>
                          <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: T.inkMid }}>agreed with <strong style={{ fontStyle: "normal" }}>{r.title}</strong></div>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => {
                      const toSave = [
                        ...newAgreements.map(r => ({ type: "agree", display_name: r.display_name, title: r.title, date: new Date().toISOString() })),
                        ...newBuddies.map(name => ({ type: "buddy", display_name: name, date: new Date().toISOString() })),
                      ];
                      const updated = [...toSave, ...pastNotifications].slice(0, 50);
                      setPastNotifications(updated);
                      localStorage.setItem("vouch-past-notifs-" + userId, JSON.stringify(updated));
                      setShowNotifications(false);
                      setNewAgreements([]);
                      setNewBuddies([]);
                    }}>Dismiss All</button>
                  </div>
                )}
                {pastNotifications.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", letterSpacing: "0.18em", color: T.inkFaint, marginBottom: 10, borderTop: `1px solid ${T.paperDark}`, paddingTop: 16 }}>Previous</div>
                    {pastNotifications.slice(0, 20).map((n, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.paperDark}` }}>
                        <div style={{ fontFamily: "'Spectral',serif", fontSize: 12, color: T.inkMid }}>
                          <strong style={{ color: T.ink }}>{n.display_name}</strong>
                          {n.type === "agree" && <span style={{ fontStyle: "italic" }}> agreed with <strong style={{ fontStyle: "normal" }}>{n.title}</strong></span>}
                          {n.type === "buddy" && <span style={{ fontStyle: "italic" }}> added you as a buddy</span>}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => { setPastNotifications([]); localStorage.removeItem("vouch-past-notifs-" + userId); }} style={{ fontFamily: "'Spectral SC',serif", fontSize: "8px", letterSpacing: "0.15em", background: "transparent", border: "none", color: T.inkFaint, cursor: "pointer", marginTop: 8, padding: 0 }}>Clear History</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {showShareNudge && (
          <div className="modal-overlay" onClick={() => setShowShareNudge(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title">Share Your Vouch</div>
                <button className="modal-x" onClick={() => setShowShareNudge(false)}>×</button>
              </div>
              <div className="modal-body" style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkMid, marginBottom: 16 }}>Your Vouch is live — share it with your circle.</div>
                {/* Share card preview */}
                <div style={{ background: T.ink, color: T.bg, marginBottom: 16, border: "3px double #C9A84C", position: "relative", overflow: "hidden" }}>
                  {(() => {
                    const coverItem = (activeBoard?.vouch_board_items || []).sort((a,b) => a.position - b.position)[0];
                    return coverItem?.poster ? (
                      <div style={{ position: "relative" }}>
                        <img src={coverItem.poster} alt={coverItem.title} style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", display: "block", maxHeight: 280 }} onError={e => e.target.style.display="none"} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(17,16,8,0.95) 0%, rgba(17,16,8,0) 100%)", padding: "40px 16px 16px" }}>
                          <div style={{ fontFamily: "'Times New Roman',serif", fontWeight: 900, fontSize: 22, color: "#C8C2B4" }}>{activeBoard?.name || activeBoard?.theme || "My Vouch"}</div>
                          <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 11, color: "rgba(200,194,180,0.6)" }}>vouched by {user?.displayName}</div>
                        </div>
                        <div style={{ position: "absolute", top: 8, left: 8, fontFamily: "'Spectral SC',serif", fontSize: 8, letterSpacing: "0.2em", color: "rgba(200,194,180,0.5)" }}>EST. 2026 · VOUCH</div>
                      </div>
                    ) : (
                      <div style={{ padding: "24px 20px" }}>
                        <div style={{ fontFamily: "'Spectral SC',serif", fontSize: 9, letterSpacing: "0.3em", color: "rgba(200,194,180,0.4)", marginBottom: 8 }}>EST. 2026 · VOUCH</div>
                        <div style={{ fontFamily: "'Times New Roman',serif", fontWeight: 900, fontSize: 26, color: "#C8C2B4", marginBottom: 4 }}>{activeBoard?.name || activeBoard?.theme || "My Vouch"}</div>
                        <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: "rgba(200,194,180,0.5)" }}>vouched by {user?.displayName}</div>
                      </div>
                    );
                  })()}
                  <div style={{ padding: "8px 16px", fontFamily: "'Spectral SC',serif", fontSize: 8, letterSpacing: "0.2em", color: "rgba(200,194,180,0.35)" }}>{window.location.origin}/@{user?.username}</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <button className="btn btn-solid" style={{ flex: 1, padding: "12px", fontSize: "10px", letterSpacing: "0.15em" }} onClick={() => { navigator.clipboard?.writeText(window.location.origin + "/@" + user?.username); alert("Link copied!"); }}>Copy Link</button>
                  <button className="btn btn-ghost" style={{ flex: 1, padding: "12px", fontSize: "10px", letterSpacing: "0.15em" }} onClick={() => { shareBoard(); }}>Download Card</button>
                </div>
                {navigator.share && <button className="btn btn-ghost" style={{ width: "100%", padding: "12px", fontSize: "10px", letterSpacing: "0.15em" }} onClick={() => { navigator.share({ title: "Check out my Vouch", url: window.location.origin + "/@" + user?.username }); setShowShareNudge(false); }}>Share via...</button>}
              </div>
            </div>
          </div>
        )}
        {shelfExtras && (
          <div className="modal-overlay" onClick={() => setShelfExtras(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title">Also Added to Shelf</div>
                <button className="modal-x" onClick={() => setShelfExtras(null)}>×</button>
              </div>
              <div className="modal-body">
                {shelfExtras.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.paperDark}`, cursor: s.source_url ? "pointer" : "default" }} onClick={() => s.source_url && window.open(s.source_url, "_blank")}>
                    {s.poster
                      ? <img src={s.poster} alt={s.title} style={{ width: 48, height: 66, objectFit: "cover", border: `1px solid ${T.paperDark}`, flexShrink: 0 }} onError={e => e.target.style.display="none"} />
                      : <div style={{ width: 48, height: 66, background: T.paperDark, flexShrink: 0 }} />
                    }
                    <div>
                      <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 14 }}>{s.title}</div>
                      {s.subtitle && <div style={{ fontFamily: "'Spectral SC',serif", fontSize: "9px", color: T.inkLight, marginTop: 2 }}>{s.subtitle}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {showAgreements && (
          <div className="modal-overlay" onClick={() => setShowAgreements(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title">New Agreements</div>
                <button className="modal-x" onClick={() => setShowAgreements(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: T.inkLight, marginBottom: 16 }}>Since your last visit</div>
                {newAgreements.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.paperDark}` }}>
                    <div style={{ width: 36, height: 36, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Times New Roman',serif", fontWeight: 900, fontSize: 13, color: T.bg }}>{(r.display_name || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Spectral',serif", fontWeight: 600, fontSize: 14 }}>{r.display_name.split(" ")[0]} {r.display_name.split(" ")[1]?.[0]}.</div>
                      <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 12, color: T.inkMid, marginTop: 1 }}>agreed with <strong style={{ fontStyle: "normal" }}>{r.title}</strong></div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost" style={{ width: "100%", marginTop: 16 }} onClick={() => { setShowAgreements(false); setNewAgreements([]); }}>Dismiss</button>
              </div>
            </div>
          </div>
        )}

        {onboarding && (
          <div className="modal-overlay">
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head"><div className="modal-title">Welcome to Vouch.</div></div>
              <div className="modal-body">
                <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 14, color: T.inkMid, marginBottom: 24, lineHeight: 1.7 }}>
                  Pick which categories you want on your shelf and put them in the order that feels right for you.
                </div>
                <CategoryPicker selected={userCategories || CATEGORIES.map(c => c.key)} all={CATEGORIES} onSave={saveCategories} isOnboarding={true} />
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

        {editingMeta && activeBoard && (
          <div className="modal-overlay" onClick={() => setEditingMeta(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title">Edit Vouch Details</div>
                <button className="modal-x" onClick={() => setEditingMeta(false)}>×</button>
              </div>
              <EditMetaForm board={activeBoard} themes={BOARD_THEMES} onSave={async (updates) => {
                await supabase.from("vouch_boards").update(updates).eq("id", activeBoard.id);
                await loadVouchBoards(userId);
                setEditingMeta(false);
              }} onClose={() => setEditingMeta(false)} />
            </div>
          </div>
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
                  <div className="modal-title">Your Vouch is Live! Share it.</div>
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

        {showContactModal && (
          <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <div className="modal-title">Contact & Feedback</div>
                <button className="modal-x" onClick={() => setShowContactModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ fontFamily: "'Spectral',serif", fontStyle: "italic", fontSize: 13, color: T.inkLight, marginBottom: 16, lineHeight: 1.6 }}>Got feedback, a bug to report, or need help? Send a note.</div>
                <ContactForm userId={userId} userEmail={user?.username} onSent={() => setShowContactModal(false)} />
              </div>
            </div>
          </div>
        )}
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