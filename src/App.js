import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import "./comp/chatInput.css";

import uclujLogo from "./U_Cluj.svg.png";
import portarImg from "./portar.jpeg";
import fundasImg from "./fundasok.jpg";
import mijImg from "./mijlocas.jpeg";
import atacantImg from "./atacant.jpeg";

import PlayerProfile from "./PlayerProfile";

/* ─── CONFIG ─────────────────────────────────────────────────────────────── */

const API_BASE = "/api";

const CATEGORY_CARDS = [
  {
    id: "portari",
    label: "Portari",
    image: portarImg,
    positions: ["GK", "GKP"],
  },
  {
    id: "fundasi",
    label: "Fundași",
    image: fundasImg,
    positions: ["CB", "LB", "RB", "LWB", "RWB", "DEF"],
  },
  {
    id: "mijlocasi",
    label: "Mijlocași",
    image: mijImg,
    positions: ["CM", "CDM", "CAM", "LM", "RM", "MID"],
  },
  {
    id: "atacanti",
    label: "Atacanți",
    image: atacantImg,
    positions: ["ST", "CF", "LW", "RW", "FWD"],
  },
];

const STATUS_CFG = {
  prioritar: { label: "Prioritar", color: "#000" },
  monitorizat: { label: "Monitorizat", color: "#888" },
  "în negociere": { label: "În negociere", color: "#555" },
};

const NAV = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "shortlist", label: "Shortlist", Icon: ShortlistIcon },
  { id: "search", label: "Search", Icon: SearchIcon },
];

const INITIAL_SHORTLISTS = [
  { id: "main", label: "Main Shortlist", playerIds: [] },
  { id: "u21", label: "U21", playerIds: [] },
  { id: "expiry", label: "Contract Expiry", playerIds: [] },
];

/* ─── API CALLS ─────────────────────────────────────────────────────────── */

async function apiSearch(query) {
  try {
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 30 }),
    });
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("apiSearch error:", err);
    return {
      results: [],
      ai_summary: "Eroare la căutare. Verifică dacă backend-ul rulează.",
      count: 0,
    };
  }
}

async function apiChat(message) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("apiChat error:", err);
    return {
      reply:
        "Eroare la conexiune cu backend-ul. Verifică că rulează pe portul 8000.",
      players: [],
    };
  }
}

/* ─── ROOT ───────────────────────────────────────────────────────────────── */

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [activePage, setActivePage] = useState(null);

  // ── Player Profile (global — deschis de oriunde) ──
  const [profileTarget, setProfileTarget] = useState(null);

  // ── Chat (Home) ──
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState(false);

  // ── Search state ──
  const [searchPrompt, setSearchPrompt] = useState("");
  const [searchTags, setSearchTags] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchHistory, setSearchHistory] = useState([
    "atacant tânăr",
    "fundaș central",
  ]);
  const [searchAiSummary, setSearchAiSummary] = useState("");
  const [gkActive, setGkActive] = useState(false);
  const [sliders, setSliders] = useState({
    minutes: 0,
    matches: 0,
    conceded: 100,
  });

  // ── Baza de date locală ──
  const [playersDB, setPlayersDB] = useState({});

  // ── Shortlist-uri ──
  const [shortlists, setShortlists] = useState(INITIAL_SHORTLISTS);

  // ── Modal "Adaugă în shortlist" ──
  const [shortlistTarget, setShortlistTarget] = useState(null);

  /* ─ Helpers players & shortlists ─ */

  const upsertPlayer = useCallback((player) => {
    if (!player?.id) return;
    setPlayersDB((db) => ({
      ...db,
      [player.id]: { ...db[player.id], ...player },
    }));
  }, []);

  const isPlayerInAnyShortlist = useCallback(
    (playerId) => shortlists.some((sl) => sl.playerIds.includes(playerId)),
    [shortlists],
  );

  const addToShortlist = useCallback(
    (shortlistId, player) => {
      upsertPlayer(player);
      setShortlists((prev) =>
        prev.map((sl) => {
          if (sl.id !== shortlistId) return sl;
          if (sl.playerIds.includes(player.id)) return sl;
          return { ...sl, playerIds: [...sl.playerIds, player.id] };
        }),
      );
    },
    [upsertPlayer],
  );

  const removeFromShortlist = useCallback((shortlistId, playerId) => {
    setShortlists((prev) =>
      prev.map((sl) =>
        sl.id === shortlistId
          ? { ...sl, playerIds: sl.playerIds.filter((id) => id !== playerId) }
          : sl,
      ),
    );
  }, []);

  const createShortlist = useCallback((label) => {
    const trimmed = label.trim();
    if (!trimmed) return null;
    const id = trimmed.toLowerCase().replace(/\s+/g, "-");
    setShortlists((prev) =>
      prev.some((sl) => sl.id === id)
        ? prev
        : [...prev, { id, label: trimmed, playerIds: [] }],
    );
    return id;
  }, []);

  /* ─ Navigare ─ */

  const openPlayerProfile = useCallback((playerId) => {
    setProfileTarget({ playerId });
  }, []);

  const closePlayerProfile = useCallback(() => {
    setProfileTarget(null);
  }, []);

  const goToCategory = (cat, shortlistId) =>
    setActivePage({ type: "category", category: cat, shortlistId });
  const goBack = () => setActivePage(null);
  const switchTab = (id) => {
    setActiveTab(id);
    setActivePage(null);
  };

  /* ─ Chat — apelează /api/chat ─ */

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text) return;
    if (!chatMode) setChatMode(true);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    setIsTyping(true);

    const response = await apiChat(text);

    // Salvăm jucătorii returnați în DB locală
    if (response.players && response.players.length > 0) {
      response.players.forEach((p) => upsertPlayer(p));
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: response.reply,
        players: response.players || [],
      },
    ]);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ─ Search — apelează /api/search ─ */

  const handleSearch = async () => {
    const text = searchPrompt.trim();
    if (!text) return;

    if (!searchHistory.includes(text)) {
      setSearchHistory([text, ...searchHistory]);
    }
    setSearchLoading(true);
    setHasSearched(true);

    const response = await apiSearch(text);

    setSearchResults(response.results || []);
    setSearchAiSummary(response.ai_summary || "");

    // Salvăm în playersDB pentru shortlist
    if (response.results) {
      response.results.forEach((p) => upsertPlayer(p));
    }

    setSearchLoading(false);
  };

  /* ─ Render ─ */

  return (
    <div className="App">
      {/* ── Sidebar ── */}
      <Sidebar activeTab={activeTab} onSwitchTab={switchTab} />

      {/* ── Main ── */}
      <main className="main-content">
        {/* HOME */}
        {activeTab === "home" && (
          <HomeTab
            chatMode={chatMode}
            messages={messages}
            input={chatInput}
            isTyping={isTyping}
            setInput={setChatInput}
            handleSend={handleSend}
            handleKeyDown={handleKeyDown}
            uclujLogo={uclujLogo}
            onOpenProfile={openPlayerProfile}
            onOpenStarModal={setShortlistTarget}
            isPlayerInAnyShortlist={isPlayerInAnyShortlist}
          />
        )}

        {/* SHORTLIST — grid categorii */}
        {activeTab === "shortlist" && activePage === null && (
          <ShortlistHome
            shortlists={shortlists}
            playersDB={playersDB}
            onCreateShortlist={createShortlist}
            onSelectCategory={goToCategory}
          />
        )}

        {/* SHORTLIST — lista jucători dintr-o categorie */}
        {activeTab === "shortlist" && activePage?.type === "category" && (
          <CategoryPage
            category={activePage.category}
            shortlistId={activePage.shortlistId}
            shortlists={shortlists}
            playersDB={playersDB}
            isPlayerInAnyShortlist={isPlayerInAnyShortlist}
            onOpenStarModal={setShortlistTarget}
            onRemoveFromShortlist={removeFromShortlist}
            onBack={goBack}
            onOpenProfile={openPlayerProfile}
          />
        )}

        {/* SEARCH */}
        {activeTab === "search" && (
          <SearchPage
            prompt={searchPrompt}
            setPrompt={setSearchPrompt}
            tags={searchTags}
            setTags={setSearchTags}
            results={searchResults}
            setResults={setSearchResults}
            loading={searchLoading}
            setLoading={setSearchLoading}
            hasSearched={hasSearched}
            setHasSearched={setHasSearched}
            history={searchHistory}
            setHistory={setSearchHistory}
            aiSummary={searchAiSummary}
            gkActive={gkActive}
            setGkActive={setGkActive}
            sliders={sliders}
            setSliders={setSliders}
            isPlayerInAnyShortlist={isPlayerInAnyShortlist}
            onOpenStarModal={setShortlistTarget}
            onOpenProfile={openPlayerProfile}
            onSearch={handleSearch}
          />
        )}
      </main>

      {/* ── Player Profile — overlay global ── */}
      {profileTarget && (
        <div className="profile-overlay">
          <PlayerProfile
            playerId={profileTarget.playerId}
            onBack={closePlayerProfile}
          />
        </div>
      )}

      {/* Modal global "+ Shortlist" */}
      {shortlistTarget && (
        <ShortlistModal
          player={shortlistTarget}
          shortlists={shortlists}
          onAdd={(slId) => addToShortlist(slId, shortlistTarget)}
          onRemove={(slId) => removeFromShortlist(slId, shortlistTarget.id)}
          onCreateShortlist={createShortlist}
          onClose={() => setShortlistTarget(null)}
        />
      )}
    </div>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────────────────────── */

function Sidebar({ activeTab, onSwitchTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo-wrap">
          <img
            src={uclujLogo}
            alt="U Cluj"
            style={{
              width: 150,
              height: 150,
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onSwitchTab(id)}
              className={`nav-btn${active ? " nav-btn-active" : ""}`}
            >
              <span className="nav-icon">
                <Icon />
              </span>
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/* ─── HOME TAB ───────────────────────────────────────────────────────────── */

function HomeTab({
  chatMode,
  messages,
  input,
  isTyping,
  setInput,
  handleSend,
  handleKeyDown,
  uclujLogo,
  onOpenProfile,
  onOpenStarModal,
  isPlayerInAnyShortlist,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const cards = [
    { src: portarImg, alt: "Portar", rotate: -18, translateX: -90 },
    { src: fundasImg, alt: "Fundaș", rotate: -6, translateX: -30 },
    { src: mijImg, alt: "Mijlocaș", rotate: 6, translateX: 30 },
    { src: atacantImg, alt: "Atacant", rotate: 18, translateX: 90 },
  ];

  const InputBox = (
    <div className="chat-container-wrapper">
      <div className="input-box-container">
        <textarea
          placeholder="Scrie mesajul tău aici..."
          className="chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="2"
        />
        <div className="button-row">
          <button className="send-btn" onClick={handleSend}>
            <span className="send-icon">
              <SendIcon />
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!chatMode) {
    return (
      <>
        <div className="welcome-container">
          <div
            style={{
              position: "relative",
              height: 180,
              width: 320,
              marginBottom: 16,
            }}
          >
            {cards.map((card, i) => (
              <img
                key={i}
                src={card.src}
                alt={card.alt}
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 0,
                  width: 130,
                  height: 240,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "2px solid #e0e0e0",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
                  transform: `translateX(calc(-50% + ${card.translateX}px)) rotate(${card.rotate}deg)`,
                  transformOrigin: "bottom center",
                  zIndex: i,
                }}
              />
            ))}
          </div>
          <h1 className="welcome-title">Slavă ție, studenție!</h1>
          <p className="welcome-subtitle">
            Spune-mi ce tip de jucători cauți sau ce informații ai nevoie.
          </p>
        </div>
        <div className="bottom-input-area">{InputBox}</div>
      </>
    );
  }

  return (
    <div className="chat-page">
      <div className="messages-area">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            {msg.role === "ai" && (
              <div className="ai-avatar">
                <img
                  src={uclujLogo}
                  alt="AI"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    objectFit: "cover",
                    mixBlendMode: "multiply",
                  }}
                />
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                maxWidth: "70%",
              }}
            >
              <div className={`message-bubble ${msg.role}`}>{msg.text}</div>
              {msg.players && msg.players.length > 0 && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {msg.players.map((p) => (
                    <ChatPlayerCard
                      key={p.id}
                      player={p}
                      onOpenProfile={() => onOpenProfile(p.id)}
                      onStar={() => onOpenStarModal(p)}
                      isStarred={isPlayerInAnyShortlist(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message-row ai">
            <div className="ai-avatar">
              <img
                src={uclujLogo}
                alt="AI"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  objectFit: "cover",
                  mixBlendMode: "multiply",
                }}
              />
            </div>
            <div className="message-bubble ai">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-bar">{InputBox}</div>
    </div>
  );
}

/* ─── CHAT PLAYER CARD ───────────────────────────────────────────────────── */

function ChatPlayerCard({ player, onOpenProfile, onStar, isStarred }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 10,
        border: "1px solid #e5e5e5",
        borderRadius: 10,
        background: "#fff",
        fontSize: 13,
      }}
    >
      <div
        className="player-avatar"
        style={{ width: 36, height: 36, fontSize: 12 }}
      >
        {initials(player.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "#000" }}>{player.name}</div>
        <div style={{ fontSize: 11, color: "#888" }}>
          {player.club} · {player.age} ani · {player.position}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 11 }}>
          {player.rating != null && (
            <span style={{ color: "#000", fontWeight: 600 }}>
              RTG {player.rating}
            </span>
          )}
          {player.compatibilityScore != null && (
            <span style={{ color: "#1d9e75", fontWeight: 600 }}>
              COMP {player.compatibilityScore}%
            </span>
          )}
          {player.marketValue && (
            <span style={{ color: "#888" }}>{player.marketValue}</span>
          )}
        </div>
      </div>
      <button
        onClick={onOpenProfile}
        style={{
          padding: "5px 10px",
          fontSize: 11,
          border: "1px solid #000",
          borderRadius: 6,
          background: "#000",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Profil →
      </button>
      <button
        onClick={onStar}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          display: "flex",
        }}
      >
        <StarIcon filled={isStarred} />
      </button>
    </div>
  );
}

/* ─── SHORTLIST HOME ─────────────────────────────────────────────────────── */

function ShortlistHome({
  shortlists,
  playersDB,
  onCreateShortlist,
  onSelectCategory,
}) {
  const [activeShortlistId, setActiveShortlistId] = useState(
    shortlists[0]?.id ?? null,
  );

  useEffect(() => {
    if (!shortlists.find((sl) => sl.id === activeShortlistId)) {
      setActiveShortlistId(shortlists[0]?.id ?? null);
    }
  }, [shortlists, activeShortlistId]);

  const activeShortlist = shortlists.find((sl) => sl.id === activeShortlistId);

  const handleAdd = () => {
    const name = prompt("Numele noului shortlist:");
    if (!name) return;
    const id = onCreateShortlist(name);
    if (id) setActiveShortlistId(id);
  };

  const countsByCategory = CATEGORY_CARDS.reduce((acc, cat) => {
    if (!activeShortlist) {
      acc[cat.id] = 0;
      return acc;
    }
    acc[cat.id] = activeShortlist.playerIds.filter((pid) => {
      const p = playersDB[pid];
      return p && cat.positions.includes(p.position);
    }).length;
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shortlist</h1>
          <p className="page-sub">
            Selectează o categorie pentru a vizualiza jucătorii adăugați
          </p>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-tabs">
          {shortlists.map((sl) => (
            <button
              key={sl.id}
              onClick={() => setActiveShortlistId(sl.id)}
              className={`filter-tab${activeShortlistId === sl.id ? " filter-tab-active" : ""}`}
            >
              {sl.label}
              {sl.playerIds.length > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    color: "#aaa",
                    fontWeight: 500,
                  }}
                >
                  ({sl.playerIds.length})
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={handleAdd}
          className="add-tab-btn"
          title="Adaugă shortlist nou"
        >
          <PlusIcon />
        </button>
      </div>

      <div className="card-grid">
        {CATEGORY_CARDS.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            index={i}
            count={countsByCategory[cat.id] ?? 0}
            onClick={() => onSelectCategory(cat, activeShortlistId)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── CATEGORY CARD ──────────────────────────────────────────────────────── */

function CategoryCard({ cat, index, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="cat-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="cat-card-content">
        <img src={cat.image} alt={cat.label} className="cat-card-img" />
        <div className="cat-card-label">{cat.label}</div>
      </div>
      <div className="cat-card-arrow">
        {count > 0 && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#000",
              background: "#f5f5f5",
              padding: "2px 8px",
              borderRadius: 5,
              marginRight: 8,
            }}
          >
            {count}
          </span>
        )}
        →
      </div>
    </button>
  );
}

/* ─── CATEGORY PAGE ──────────────────────────────────────────────────────── */

function CategoryPage({
  category,
  shortlistId,
  shortlists,
  playersDB,
  isPlayerInAnyShortlist,
  onOpenStarModal,
  onRemoveFromShortlist,
  onBack,
  onOpenProfile,
}) {
  const [selected, setSelected] = useState(null);

  const shortlist = shortlists.find((sl) => sl.id === shortlistId);
  const players = (shortlist?.playerIds ?? [])
    .map((pid) => playersDB[pid])
    .filter((p) => p && category.positions.includes(p.position));

  useEffect(() => {
    if (selected && !players.find((p) => p.id === selected.id)) {
      setSelected(null);
    }
  }, [players, selected]);

  const removePlayer = (id) => {
    onRemoveFromShortlist(shortlistId, id);
  };

  const changeStatus = (id, status) => {
    if (selected?.id === id) setSelected((s) => ({ ...s, status }));
  };

  return (
    <div className="category-layout">
      <div className="page">
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onBack} className="back-btn">
              ←
            </button>
            <div>
              <h1 className="page-title">{category.label}</h1>
              <p className="page-sub">
                {shortlist?.label} · {players.length} jucători
              </p>
            </div>
          </div>
        </div>

        {players.length === 0 ? (
          <div className="center-state">
            <div className="empty-icon">
              <ShortlistIcon size={40} />
            </div>
            <div className="state-title">Niciun jucător adăugat</div>
            <div className="state-sub">
              Adaugă jucători din secțiunea Search.
            </div>
          </div>
        ) : (
          <div className="player-list">
            {players.map((player, i) => (
              <PlayerRow
                key={player.id}
                player={player}
                index={i}
                isSelected={selected?.id === player.id}
                isStarred={isPlayerInAnyShortlist(player.id)}
                onClick={() =>
                  setSelected(selected?.id === player.id ? null : player)
                }
                onStar={() => onOpenStarModal(player)}
                onRemove={() => removePlayer(player.id)}
                onOpenProfile={() => onOpenProfile(player.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PlayerDetailPanel
          player={selected}
          onClose={() => setSelected(null)}
          onRemove={() => removePlayer(selected.id)}
          onStatusChange={(status) => changeStatus(selected.id, status)}
          onOpenProfile={() => onOpenProfile(selected.id)}
        />
      )}
    </div>
  );
}

/* ─── PLAYER ROW (Shortlist) ─────────────────────────────────────────────── */

function PlayerRow({
  player,
  index,
  isSelected,
  isStarred,
  onClick,
  onStar,
  onRemove,
  onOpenProfile,
}) {
  const statusCfg = STATUS_CFG[player.status] ?? STATUS_CFG.monitorizat;
  return (
    <div
      onClick={onClick}
      className={`player-row${isSelected ? " player-row-selected" : ""}`}
    >
      <div className="player-idx">{index + 1}</div>
      <div className="player-avatar">{initials(player.name)}</div>
      <div className="player-info">
        <div className="player-name">{player.name}</div>
        <div className="player-meta">
          {player.club} · {player.age} ani · {player.nationality ?? ""}
        </div>
      </div>
      <div className="player-stats">
        <StatPill label="RTG" value={player.rating} />
        <StatPill label="MEC" value={player.matches} />
        <StatPill label="GOL" value={player.goals ?? 0} />
        <StatPill label="AST" value={player.assists ?? 0} />
      </div>
      <div className="player-value">{player.marketValue ?? "—"}</div>
      <div
        className="status-dot"
        style={{ background: statusCfg.color }}
        title={statusCfg.label}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenProfile();
        }}
        className="action-btn"
        title="Deschide profil"
      >
        Profil →
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStar();
        }}
        className="star-btn"
        title="Adaugă/elimină din shortlist"
      >
        <StarIcon filled={isStarred} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="remove-btn"
        title="Elimină din shortlistul curent"
      >
        ×
      </button>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="stat-pill">
      <span className="stat-pill-val">{value ?? "—"}</span>
      <span className="stat-pill-label">{label}</span>
    </div>
  );
}

/* ─── DETAIL PANEL ───────────────────────────────────────────────────────── */

function PlayerDetailPanel({
  player,
  onClose,
  onRemove,
  onStatusChange,
  onOpenProfile,
}) {
  const statusCfg = STATUS_CFG[player.status] ?? STATUS_CFG.monitorizat;
  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <span className="detail-title">Profil jucător</span>
        <button onClick={onClose} className="close-btn">
          ×
        </button>
      </div>

      <div className="detail-body">
        <div className="detail-hero">
          <div className="detail-avatar">{initials(player.name)}</div>
          <div className="detail-name">{player.name}</div>
          <div className="detail-club">{player.club}</div>
          <div className="detail-status-row">
            <span
              className="detail-status-dot"
              style={{ background: statusCfg.color }}
            />
            <span className="detail-status-label">{statusCfg.label}</span>
          </div>
        </div>

        <div className="info-block">
          {[
            ["Naționalitate", player.nationality ?? "—"],
            ["Vârstă", player.age ? `${player.age} ani` : "—"],
            ["Valoare", player.marketValue ?? "—"],
            ["Meciuri", player.matches ?? "—"],
          ].map(([k, v]) => (
            <div key={k} className="info-row">
              <span className="info-key">{k}</span>
              <span className="info-val">{v}</span>
            </div>
          ))}
        </div>

        <div className="big-stats">
          {[
            ["Rating", player.rating],
            ["Goluri", player.goals],
            ["Pase", player.assists],
          ].map(([l, v]) => (
            <div key={l} className="big-stat">
              <div className="big-stat-val">{v ?? "—"}</div>
              <div className="big-stat-label">{l}</div>
            </div>
          ))}
        </div>

        {/* ─── METRICI CUSTOM ─── */}
        {(player.compatibilityScore != null ||
          player.behaviorCoefficient != null) && (
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {player.compatibilityScore != null && (
              <div
                style={{
                  flex: 1,
                  padding: 10,
                  border: "1px solid #1d9e75",
                  borderRadius: 8,
                  background: "#f0fdf4",
                  textAlign: "center",
                }}
              >
                <div
                  style={{ fontSize: 10, color: "#1d9e75", fontWeight: 700 }}
                >
                  COMPATIBILITATE
                </div>
                <div
                  style={{ fontSize: 22, fontWeight: 700, color: "#1d9e75" }}
                >
                  {player.compatibilityScore}%
                </div>
              </div>
            )}
            {player.behaviorCoefficient != null && (
              <div
                style={{
                  flex: 1,
                  padding: 10,
                  border: "1px solid #555",
                  borderRadius: 8,
                  background: "#fafafa",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 10, color: "#555", fontWeight: 700 }}>
                  COMPORTAMENT
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#000" }}>
                  {player.behaviorCoefficient}
                </div>
              </div>
            )}
          </div>
        )}

        {player.note && <div className="note-block">{player.note}</div>}

        <div className="status-section">
          <div className="status-section-title">Schimbă status</div>
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => onStatusChange(key)}
              className={`status-btn${player.status === key ? " status-btn-active" : ""}`}
            >
              <span
                className="detail-status-dot"
                style={{
                  background: player.status === key ? "#fff" : cfg.color,
                }}
              />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="detail-footer"
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        <button
          onClick={onOpenProfile}
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid #000",
            borderRadius: 7,
            background: "#000",
            color: "#fff",
            fontSize: 12,
            fontFamily: "inherit",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Profil complet →
        </button>
        <button onClick={onRemove} className="remove-full-btn">
          Elimină din shortlist
        </button>
      </div>
    </aside>
  );
}

/* ─── SEARCH PAGE ────────────────────────────────────────────────────────── */

function SearchPage({
  prompt,
  setPrompt,
  tags,
  setTags,
  results,
  loading,
  hasSearched,
  history,
  setHistory,
  aiSummary,
  gkActive,
  setGkActive,
  sliders,
  setSliders,
  isPlayerInAnyShortlist,
  onOpenStarModal,
  onOpenProfile,
  onSearch,
}) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const searchRef = useRef(null);

  const defaultSliders = { minutes: 0, matches: 0, conceded: 100 };

  const pageSubText =
    hasSearched && !loading
      ? `${results.length} jucători găsiți`
      : "Superliga România · 2024/25";

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsHistoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    setIsHistoryOpen(false);
    onSearch();
  };

  const resetSliders = () => setSliders(defaultSliders);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h1 className="page-title">Caută Jucători</h1>
            <p className="page-sub">{pageSubText}</p>
          </div>
        </div>
      </div>

      <div className="content-area">
        <div className="center-column">
          <div className="search-section">
            <div className="search-container" ref={searchRef}>
              <div className="search-bar">
                <SearchIcon size={15} />
                <input
                  className="search-input"
                  type="text"
                  value={prompt}
                  onFocus={() => setIsHistoryOpen(true)}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder="Descrie ce tip de jucător cauți... (ex: atacant tânăr sub 23 ani)"
                />
                <button
                  className="search-btn"
                  disabled={loading}
                  onClick={handleSearch}
                >
                  {loading ? "Se caută..." : "Caută →"}
                </button>
              </div>

              {isHistoryOpen && history.length > 0 && (
                <div className="search-history-dropdown">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="history-item"
                      onClick={() => {
                        setPrompt(item);
                        setIsHistoryOpen(false);
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 11, opacity: 0.5 }}>🕒</span>
                        {item}
                      </span>
                      <button
                        className="history-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistory(history.filter((i) => i !== item));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {tags.length > 0 && (
              <div className="tags-row">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                    <button
                      className="tag-remove"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button className="clear-btn" onClick={() => setTags([])}>
                  Șterge tot ×
                </button>
              </div>
            )}

            {/* ── AI SUMMARY ── */}
            {aiSummary && !loading && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  background: "#f9f9f9",
                  border: "1px solid #e5e5e5",
                  borderRadius: 10,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#333",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#888",
                    marginBottom: 6,
                    letterSpacing: 0.5,
                  }}
                >
                  🤖 ANALIZĂ AI
                </div>
                {aiSummary}
              </div>
            )}
          </div>

          <div className="results-area">
            {loading && (
              <div className="results-fade-in">
                {[1, 2, 3, 4].map((i) => (
                  <SearchSkeletonRow key={i} />
                ))}
              </div>
            )}

            {!loading && hasSearched && results.length === 0 && (
              <div className="empty-state">
                <EmptySearchIcon />
                <div className="empty-title">Niciun rezultat</div>
                <div className="empty-sub">
                  Încearcă să modifici filtrele sau termenii de căutare.
                </div>
              </div>
            )}

            {!loading && !hasSearched && (
              <div className="empty-state">
                <EmptySearchIcon />
                <div className="empty-title">Începe o căutare</div>
                <div className="empty-sub">
                  Descrie tipul de jucător sau folosește filtrele din panoul
                  lateral.
                </div>
                <div className="suggestions-row">
                  {[
                    "atacant tânăr sub 23 ani",
                    "fundaș central român",
                    "mijlocaș creativ cu 5 asisturi",
                    "portar experimentat",
                  ].map((s) => (
                    <button
                      key={s}
                      className="suggestion-btn"
                      onClick={() => setPrompt(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && results.length > 0 && (
              <SearchResultsList
                results={results}
                isPlayerInAnyShortlist={isPlayerInAnyShortlist}
                onOpenStarModal={onOpenStarModal}
                onOpenProfile={onOpenProfile}
              />
            )}
          </div>
        </div>

        <aside className="right-panel">
          <h2 className="filter-header">Filtre Jucători</h2>

          <form onReset={resetSliders}>
            <div
              className={`gk-toggle${gkActive ? " gk-active" : ""}`}
              onClick={() => setGkActive(!gkActive)}
            >
              <span>Caută Portari (GK)</span>
              <div className="toggle-switch"></div>
            </div>

            <div className="filter-group">
              <div className="filter-group-title">Generale & Fizic</div>
              <div className="f-row">
                <label className="filter-label">Poziție</label>
                <select className="f-select">
                  <option>Toate</option>
                  <option>Atacant</option>
                  <option>Mijlocaș</option>
                  <option>Fundaș</option>
                </select>
              </div>
              <div className="f-row">
                <label className="filter-label">Picior preferat</label>
                <select className="f-select">
                  <option>Oricare</option>
                  <option>Stângul</option>
                  <option>Dreptul</option>
                  <option>Ambele</option>
                </select>
              </div>
              <div className="f-row">
                <label className="filter-label">Vârstă (Ani)</label>
                <div className="filter-inputs">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    className="f-input"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    className="f-input"
                  />
                </div>
              </div>
              <div className="f-row">
                <label className="filter-label">Cotă piață (€)</label>
                <div className="filter-inputs">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    className="f-input"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    className="f-input"
                  />
                </div>
              </div>
              <div className="f-row">
                <label className="filter-label">Înălțime (cm)</label>
                <div className="filter-inputs">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    className="f-input"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    className="f-input"
                  />
                </div>
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-group-title">
                A. Filtre de Bază (Volum)
              </div>
              <div className="f-row">
                <div className="filter-row-header">
                  <label className="filter-label">Minute jucate (Minim)</label>
                  <span className="range-value">{sliders.minutes}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  value={sliders.minutes}
                  onChange={(e) =>
                    setSliders({ ...sliders, minutes: e.target.value })
                  }
                  className="f-input"
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
              <div className="f-row">
                <div className="filter-row-header">
                  <label className="filter-label">Meciuri jucate (Minim)</label>
                  <span className="range-value">{sliders.matches}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={sliders.matches}
                  onChange={(e) =>
                    setSliders({ ...sliders, matches: e.target.value })
                  }
                  className="f-input"
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
            </div>

            <SearchFilterGroup
              title="B. Filtre Ofensive"
              labels={[
                "xG (Expected Goals)",
                "Goluri per 90",
                "Conversie Goluri (%)",
                "Driblinguri încercate",
                "Driblinguri reușite (%)",
                "Atingeri în careu",
              ]}
            />
            <SearchFilterGroup
              title="C. Playmaking & Pase"
              labels={[
                "xA (Expected Assists)",
                "Pase progresive",
                "Pase inteligente",
                "Acuratețe pase (%)",
                "Acuratețe centrări (%)",
              ]}
            />
            <SearchFilterGroup
              title="D. Defensive & Fizice"
              labels={[
                "Dueluri defensive",
                "Dueluri defensive câștigate (%)",
                "Dueluri aeriene",
                "Dueluri aeriene câștigate (%)",
                "Intercepții",
              ]}
            />

            <div className="filter-group">
              <div className="filter-group-title">E. Goalkeeper (GK)</div>
              <div className="f-row">
                <div className="filter-row-header">
                  <label className="filter-label">Goluri primite (Maxim)</label>
                  <span className="range-value">{sliders.conceded}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliders.conceded}
                  onChange={(e) =>
                    setSliders({ ...sliders, conceded: e.target.value })
                  }
                  className="f-input"
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
              {["Volum intervenții", "Rată de parade (%)"].map((label) => (
                <SearchRangeInputs key={label} label={label} />
              ))}
            </div>

            <button type="reset" className="reset-btn">
              Resetează Toate Filtrele
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

/* ─── SEARCH — sub-componente ────────────────────────────────────────────── */

function SearchFilterGroup({ title, labels }) {
  return (
    <div className="filter-group">
      <div className="filter-group-title">{title}</div>
      {labels.map((label) => (
        <SearchRangeInputs key={label} label={label} />
      ))}
    </div>
  );
}

function SearchRangeInputs({ label }) {
  const isPercent = label.includes("(%)");
  return (
    <div className="f-row">
      <label className="filter-label">{label}</label>
      <div className="filter-inputs">
        <input
          type="number"
          min="0"
          max={isPercent ? "100" : undefined}
          placeholder="Min"
          className="f-input"
        />
        <input
          type="number"
          min="0"
          max={isPercent ? "100" : undefined}
          placeholder="Max"
          className="f-input"
        />
      </div>
    </div>
  );
}

function SearchResultsList({
  results,
  isPlayerInAnyShortlist,
  onOpenStarModal,
  onOpenProfile,
}) {
  return (
    <div className="results-fade-in">
      <div className="list-header">
        <div className="list-header-spacer" />
        <div className="list-header-player">Jucător</div>
        <div className="list-header-pos">Poziție</div>
        <div className="list-header-value">Valoare</div>
        <div className="list-header-actions" />
      </div>
      {results.map((player, i) => (
        <div key={player.id} style={{ animationDelay: `${i * 0.03}s` }}>
          <SearchPlayerRow
            player={player}
            isStarred={isPlayerInAnyShortlist(player.id)}
            onStar={() => onOpenStarModal(player)}
            onOpenProfile={() => onOpenProfile(player.id)}
          />
        </div>
      ))}
    </div>
  );
}

function SearchPlayerRow({ player, isStarred, onStar, onOpenProfile }) {
  return (
    <div className="player-row" style={{ cursor: "default" }}>
      <div className="player-avatar">{initials(player.name)}</div>
      <div className="player-info">
        <div className="player-name">{player.name}</div>
        <div className="player-meta">
          {player.club} · {player.age} ani · {player.nationality}
        </div>
        {/* ── 3 METRICI INLINE ── */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {player.rating != null && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#000",
                background: "#000",
                color: "#fff",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              RTG {player.rating}
            </span>
          )}
          {player.compatibilityScore != null && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "#1d9e75",
                color: "#fff",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              COMP {player.compatibilityScore}%
            </span>
          )}
          {player.behaviorCoefficient != null && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "#888",
                color: "#fff",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              COMP. {player.behaviorCoefficient}
            </span>
          )}
        </div>
      </div>
      <div className="position-badge">{player.position}</div>
      <div className="player-value">{player.marketValue}</div>
      <div className="player-actions">
        <button className="action-btn" onClick={onOpenProfile}>
          Profil →
        </button>
        <button
          className="star-btn star-btn-action"
          onClick={onStar}
          title="Adaugă în shortlist"
        >
          <StarIcon filled={isStarred} />
        </button>
      </div>
    </div>
  );
}

function SearchSkeletonRow() {
  return (
    <div className="skeleton-row">
      <div className="skeleton-avatar" />
      <div className="skeleton-info">
        <div className="skeleton-line" />
        <div className="skeleton-line-sub" />
      </div>
      <div className="skeleton-badge" />
      <div className="skeleton-value" />
      <div className="skeleton-actions">
        <div className="skeleton-btn" style={{ width: 70 }} />
        <div className="skeleton-btn" style={{ width: 90 }} />
      </div>
    </div>
  );
}

/* ─── SHORTLIST MODAL ────────────────────────────────────────────────────── */

function ShortlistModal({
  player,
  shortlists,
  onAdd,
  onRemove,
  onCreateShortlist,
  onClose,
}) {
  const isInShortlist = (slId) => {
    const sl = shortlists.find((x) => x.id === slId);
    return sl?.playerIds.includes(player.id);
  };

  const handleCreate = () => {
    const name = prompt("Numele noului shortlist:");
    if (!name) return;
    const id = onCreateShortlist(name);
    if (id) onAdd(id);
  };

  return (
    <div
      className="modal-overlay"
      id="modalOverlay"
      onClick={(e) => e.target.id === "modalOverlay" && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Adaugă în shortlist</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-player-name">{player.name}</div>
          <div className="modal-player-sub">
            {player.club} · {player.position}
          </div>
        </div>
        <div className="modal-list">
          {shortlists.map((sl) => {
            const inList = isInShortlist(sl.id);
            return (
              <button
                key={sl.id}
                className={`shortlist-item${inList ? " shortlist-item-active" : ""}`}
                onClick={() => (inList ? onRemove(sl.id) : onAdd(sl.id))}
              >
                <span>{sl.label}</span>
                <span className="shortlist-item-check">
                  {inList ? "✓" : "+"}
                </span>
              </button>
            );
          })}
          <button
            className="shortlist-item shortlist-item-new"
            onClick={handleCreate}
          >
            <span>+ Creează shortlist nou</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── TYPING DOTS ────────────────────────────────────────────────────────── */

function TypingDots() {
  return (
    <div className="typing-dots">
      <span />
      <span />
      <span />
    </div>
  );
}

/* ─── ICONS ──────────────────────────────────────────────────────────────── */

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}
function ShortlistIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function SearchIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function EmptySearchIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ccc"
      strokeWidth="1.5"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 16, height: 16 }}
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function StarIcon({ filled }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "#000" : "none"}
      stroke={filled ? "#000" : "#bbb"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* ─── HELPER ─────────────────────────────────────────────────────────────── */

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}
