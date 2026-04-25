import { useState, useCallback } from "react";
import "./App.css";
import "./comp/chatInput.css";

import uclujLogo from "./U_Cluj.svg.png";

import HomePage from "./pages/HomePage";
import ShortlistPage from "./pages/ShortlistPage";
import SearchPage from "./pages/SearchPage";
import PlayerProfile from "./PlayerProfile";

/* ─── CONFIG ────────────────────────────────────────────────────────────── */
export const API_BASE = "/api";

export const INITIAL_SHORTLISTS = [
  { id: "main", label: "Main Shortlist", playerIds: [] },
  { id: "u21", label: "U21", playerIds: [] },
  { id: "expiry", label: "Contract Expiry", playerIds: [] },
];

/* ─── ICONS ─────────────────────────────────────────────────────────────── */
function HomeIcon()      { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>; }
function ShortlistIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function SearchIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>; }
function PersonIcon()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function ChevronIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }

const NAV = [
  { id: "home",      label: "Home",      Icon: HomeIcon      },
  { id: "shortlist", label: "Shortlist", Icon: ShortlistIcon },
  { id: "search",    label: "Search",    Icon: SearchIcon    },
];

/* ─── LOGIN PAGE COMPONENT ─────────────────────────────────────────────── */
function LoginPage({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(u, p);
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
           <img src={uclujLogo} alt="Logo" style={{ width: 100, height: 100, objectFit: 'contain' }} />
        </div>
        <h2 style={{fontFamily: 'serif'}}>Login</h2>
        <input 
          type="text" 
          placeholder="Nume Utilizator" 
          value={u} 
          onChange={e => setU(e.target.value)} 
          required 
          className="login-input"
        />
        <input 
          type="password" 
          placeholder="Parolă" 
          value={p} 
          onChange={e => setP(e.target.value)} 
          required 
          className="login-input"
        />
        <button type="submit" className="login-submit-btn">Intră în cont</button>
      </form>
    </div>
  );
}

/* ─── ROOT ──────────────────────────────────────────────────────────────── */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayUser, setDisplayUser] = useState("");
  const [activeTab, setActiveTab] = useState("home");

  const [shortlists, setShortlists] = useState(INITIAL_SHORTLISTS);
  const [playersDB,  setPlayersDB]  = useState({});

  const [profileId,       setProfileId]       = useState(null);
  const [shortlistTarget, setShortlistTarget] = useState(null);

  const handleLoginSubmit = (username, password) => {
    // MODIFICARE AICI: Folosim 'username' pentru afișare
    setDisplayUser(username); 
    setIsLoggedIn(true);
  };

  const upsertPlayer = useCallback((player) => {
    if (!player?.id) return;
    setPlayersDB(db => ({ ...db, [player.id]: { ...db[player.id], ...player } }));
  }, []);

  const isPlayerInAnyShortlist = useCallback(
    (pid) => shortlists.some(sl => sl.playerIds.includes(pid)),
    [shortlists]
  );

  const addToShortlist = useCallback((slId, player) => {
    upsertPlayer(player);
    setShortlists(prev => prev.map(sl =>
      sl.id !== slId || sl.playerIds.includes(player.id)
        ? sl
        : { ...sl, playerIds: [...sl.playerIds, player.id] }
    ));
  }, [upsertPlayer]);

  const removeFromShortlist = useCallback((slId, pid) => {
    setShortlists(prev => prev.map(sl =>
      sl.id === slId
        ? { ...sl, playerIds: sl.playerIds.filter(id => id !== pid) }
        : sl
    ));
  }, []);

  const createShortlist = useCallback((label) => {
    const trimmed = label.trim();
    if (!trimmed) return null;
    const id = trimmed.toLowerCase().replace(/\s+/g, "-");
    setShortlists(prev =>
      prev.some(sl => sl.id === id) ? prev : [...prev, { id, label: trimmed, playerIds: [] }]
    );
    return id;
  }, []);

  const sharedProps = {
    shortlists, playersDB, upsertPlayer,
    isPlayerInAnyShortlist,
    addToShortlist, removeFromShortlist, createShortlist,
    onOpenProfile:   (id)     => setProfileId(id),
    onOpenStarModal: (player) => setShortlistTarget(player),
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLoginSubmit} />;
  }

  return (
    <div className="App">
      <div className="top-right-username">
        {displayUser}
      </div>

      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo-wrap">
            <img src={uclujLogo} alt="U Cluj"
              style={{ width: 150, height: 150, objectFit: "contain", flexShrink: 0 }} />
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`nav-btn${activeTab === id ? " nav-btn-active" : ""}`}
            >
              <span className="nav-icon"><Icon /></span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="league-row">
            <div className="league-name">Superliga România</div>
            <div className="league-sub">Baza de date actualizată</div>
            <div className="league-sub">20 Mai 2024</div>
          </div>
          <div className="user-row">
            <div className="user-avatar"><PersonIcon /></div>
            <div>
              <div className="user-name">{displayUser}</div>
              <div className="user-role">Antrenor</div>
            </div>
            <div style={{ marginLeft: "auto" }}><ChevronIcon /></div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {activeTab === "home"      && <HomePage      {...sharedProps} />}
        {activeTab === "shortlist" && <ShortlistPage {...sharedProps} />}
        {activeTab === "search"    && <SearchPage    {...sharedProps} />}
      </main>

      {profileId && (
        <div className="profile-overlay">
          <PlayerProfile playerId={profileId} onBack={() => setProfileId(null)} />
        </div>
      )}

      {shortlistTarget && (
        <ShortlistModal
          player={shortlistTarget}
          shortlists={shortlists}
          onAdd={(slId)     => addToShortlist(slId, shortlistTarget)}
          onRemove={(slId) => removeFromShortlist(slId, shortlistTarget.id)}
          onCreateShortlist={createShortlist}
          onClose={() => setShortlistTarget(null)}
        />
      )}
    </div>
  );
}

/* ─── SHORTLIST MODAL (Rămâne neschimbat) ────────────────────────────────── */
export function ShortlistModal({ player, shortlists, onAdd, onRemove, onCreateShortlist, onClose }) {
  const isIn = (slId) => shortlists.find(x => x.id === slId)?.playerIds.includes(player.id);

  const handleCreate = () => {
    const name = prompt("Numele noului shortlist:");
    if (!name) return;
    const id = onCreateShortlist(name);
    if (id) onAdd(id);
  };

  return (
    <div className="modal-overlay" id="modalOverlay"
      onClick={e => e.target.id === "modalOverlay" && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Adaugă în shortlist</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-player-name">{player.name}</div>
          <div className="modal-player-sub">{player.club} · {player.position}</div>
        </div>
        <div className="modal-list">
          {shortlists.map(sl => {
            const inList = isIn(sl.id);
            return (
              <button key={sl.id}
                className={`shortlist-item${inList ? " shortlist-item-active" : ""}`}
                onClick={() => inList ? onRemove(sl.id) : onAdd(sl.id)}>
                <span>{sl.label}</span>
                <span className="shortlist-item-check">{inList ? "✓" : "+"}</span>
              </button>
            );
          })}
          <button className="shortlist-item shortlist-item-new" onClick={handleCreate}>
            <span>+ Creează shortlist nou</span>
          </button>
        </div>
      </div>
    </div>
  );
}