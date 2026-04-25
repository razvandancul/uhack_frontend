import { useState, useEffect } from "react";
import portarImg  from "../portar.jpeg";
import fundasImg  from "../fundasok.jpg";
import mijImg     from "../mijlocas.jpeg";
import atacantImg from "../atacant.jpeg";

const CATEGORY_CARDS = [
  { id: "portari",   label: "Portari",   image: portarImg,  positions: ["GK","GKP"] },
  { id: "fundasi",   label: "Fundași",   image: fundasImg,  positions: ["CB","LB","RB","LWB","RWB","DEF"] },
  { id: "mijlocasi", label: "Mijlocași", image: mijImg,     positions: ["CM","CDM","CAM","LM","RM","MID"] },
  { id: "atacanti",  label: "Atacanți",  image: atacantImg, positions: ["ST","CF","LW","RW","FWD"] },
];

const STATUS_CFG = {
  prioritar:      { label: "Prioritar",    color: "#000" },
  monitorizat:    { label: "Monitorizat",  color: "#888" },
  "în negociere": { label: "În negociere", color: "#555" },
};

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function StarIcon({ filled }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#000" : "none"} stroke={filled ? "#000" : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function EmptyIcon() { return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }

function initials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
}

export default function ShortlistPage({ shortlists, playersDB, isPlayerInAnyShortlist, createShortlist, addToShortlist, removeFromShortlist, onOpenProfile, onOpenStarModal }) {
  const [activePage, setActivePage] = useState(null); // null = home, { category, shortlistId } = detalii

  if (activePage) {
    return (
      <CategoryPage
        category={activePage.category}
        shortlistId={activePage.shortlistId}
        shortlists={shortlists}
        playersDB={playersDB}
        isPlayerInAnyShortlist={isPlayerInAnyShortlist}
        onOpenStarModal={onOpenStarModal}
        onRemoveFromShortlist={removeFromShortlist}
        onBack={() => setActivePage(null)}
        onOpenProfile={onOpenProfile}
      />
    );
  }

  return (
    <ShortlistHome
      shortlists={shortlists}
      playersDB={playersDB}
      onCreateShortlist={createShortlist}
      onSelectCategory={(cat, slId) => setActivePage({ category: cat, shortlistId: slId })}
    />
  );
}

/* ─── SHORTLIST HOME ────────────────────────────────────────────────────── */
function ShortlistHome({ shortlists, playersDB, onCreateShortlist, onSelectCategory }) {
  const [activeSlId, setActiveSlId] = useState(shortlists[0]?.id ?? null);

  useEffect(() => {
    if (!shortlists.find(sl => sl.id === activeSlId)) {
      setActiveSlId(shortlists[0]?.id ?? null);
    }
  }, [shortlists, activeSlId]);

  const activeSl = shortlists.find(sl => sl.id === activeSlId);

  const handleAdd = () => {
    const name = prompt("Numele noului shortlist:");
    if (!name) return;
    const id = onCreateShortlist(name);
    if (id) setActiveSlId(id);
  };

  const countsByCategory = CATEGORY_CARDS.reduce((acc, cat) => {
    acc[cat.id] = (activeSl?.playerIds ?? []).filter(pid => {
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
          <p className="page-sub">Selectează o categorie pentru a vizualiza jucătorii adăugați</p>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-tabs">
          {shortlists.map(sl => (
            <button key={sl.id} onClick={() => setActiveSlId(sl.id)}
              className={`filter-tab${activeSlId === sl.id ? " filter-tab-active" : ""}`}>
              {sl.label}
              {sl.playerIds.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, color: "#aaa", fontWeight: 500 }}>({sl.playerIds.length})</span>
              )}
            </button>
          ))}
        </div>
        <button onClick={handleAdd} className="add-tab-btn" title="Adaugă shortlist nou"><PlusIcon /></button>
      </div>

      <div className="card-grid">
        {CATEGORY_CARDS.map((cat, i) => (
          <button key={cat.id} onClick={() => onSelectCategory(cat, activeSlId)}
            className="cat-card" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="cat-card-content">
              <img src={cat.image} alt={cat.label} className="cat-card-img" />
              <div className="cat-card-label">{cat.label}</div>
            </div>
            <div className="cat-card-arrow">
              {countsByCategory[cat.id] > 0 && (
                <span style={{ fontSize: 13, fontWeight: 700, background: "#f5f5f5", padding: "2px 8px", borderRadius: 5, marginRight: 8 }}>
                  {countsByCategory[cat.id]}
                </span>
              )}
              →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── CATEGORY PAGE ─────────────────────────────────────────────────────── */
function CategoryPage({ category, shortlistId, shortlists, playersDB, isPlayerInAnyShortlist, onOpenStarModal, onRemoveFromShortlist, onBack, onOpenProfile }) {
  const [selected, setSelected] = useState(null);

  const shortlist = shortlists.find(sl => sl.id === shortlistId);
  const players = (shortlist?.playerIds ?? [])
    .map(pid => playersDB[pid])
    .filter(p => p && category.positions.includes(p.position));

  useEffect(() => {
    if (selected && !players.find(p => p.id === selected.id)) setSelected(null);
  }, [players, selected]);

  return (
    <div className="category-layout">
      <div className="page">
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onBack} className="back-btn">←</button>
            <div>
              <h1 className="page-title">{category.label}</h1>
              <p className="page-sub">{shortlist?.label} · {players.length} jucători</p>
            </div>
          </div>
        </div>

        {players.length === 0 ? (
          <div className="center-state">
            <div className="empty-icon"><EmptyIcon /></div>
            <div className="state-title">Niciun jucător adăugat</div>
            <div className="state-sub">Adaugă jucători din secțiunea Search.</div>
          </div>
        ) : (
          <div className="player-list">
            {players.map((player, i) => (
              <PlayerRow
                key={player.id} player={player} index={i}
                isSelected={selected?.id === player.id}
                isStarred={isPlayerInAnyShortlist(player.id)}
                onClick={() => setSelected(selected?.id === player.id ? null : player)}
                onStar={() => onOpenStarModal(player)}
                onRemove={() => onRemoveFromShortlist(shortlistId, player.id)}
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
          onRemove={() => onRemoveFromShortlist(shortlistId, selected.id)}
          onStatusChange={status => setSelected(s => ({ ...s, status }))}
          onOpenProfile={() => onOpenProfile(selected.id)}
        />
      )}
    </div>
  );
}

/* ─── PLAYER ROW ────────────────────────────────────────────────────────── */
function PlayerRow({ player, index, isSelected, isStarred, onClick, onStar, onRemove, onOpenProfile }) {
  const statusCfg = STATUS_CFG[player.status] ?? STATUS_CFG.monitorizat;
  return (
    <div onClick={onClick} className={`player-row${isSelected ? " player-row-selected" : ""}`}>
      <div className="player-idx">{index + 1}</div>
      <div className="player-avatar">{initials(player.name)}</div>
      <div className="player-info">
        <div className="player-name">{player.name}</div>
        <div className="player-meta">{player.club} · {player.age} ani · {player.nationality ?? ""}</div>
      </div>
      <div className="player-stats">
        <StatPill label="RTG" value={player.rating}       />
        <StatPill label="MEC" value={player.matches}      />
        <StatPill label="GOL" value={player.goals  ?? 0}  />
        <StatPill label="AST" value={player.assists ?? 0} />
      </div>
      <div className="player-value">{player.marketValue ?? "—"}</div>
      <div className="status-dot" style={{ background: statusCfg.color }} title={statusCfg.label} />
      <button onClick={e => { e.stopPropagation(); onOpenProfile(); }} className="action-btn">Profil →</button>
      <button onClick={e => { e.stopPropagation(); onStar(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
        <StarIcon filled={isStarred} />
      </button>
      <button onClick={e => { e.stopPropagation(); onRemove(); }} className="remove-btn">×</button>
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

/* ─── DETAIL PANEL ──────────────────────────────────────────────────────── */
function PlayerDetailPanel({ player, onClose, onRemove, onStatusChange, onOpenProfile }) {
  const statusCfg = STATUS_CFG[player.status] ?? STATUS_CFG.monitorizat;
  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <span className="detail-title">Profil jucător</span>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      <div className="detail-body">
        <div className="detail-hero">
          <div className="detail-avatar">{initials(player.name)}</div>
          <div className="detail-name">{player.name}</div>
          <div className="detail-club">{player.club}</div>
          <div className="detail-status-row">
            <span className="detail-status-dot" style={{ background: statusCfg.color }} />
            <span className="detail-status-label">{statusCfg.label}</span>
          </div>
        </div>
        <div className="info-block">
          {[["Naționalitate", player.nationality ?? "—"], ["Vârstă", player.age ? `${player.age} ani` : "—"], ["Valoare", player.marketValue ?? "—"], ["Meciuri", player.matches ?? "—"]].map(([k, v]) => (
            <div key={k} className="info-row">
              <span className="info-key">{k}</span>
              <span className="info-val">{v}</span>
            </div>
          ))}
        </div>
        <div className="big-stats">
          {[["Rating", player.rating], ["Goluri", player.goals], ["Pase", player.assists]].map(([l, v]) => (
            <div key={l} className="big-stat">
              <div className="big-stat-val">{v ?? "—"}</div>
              <div className="big-stat-label">{l}</div>
            </div>
          ))}
        </div>
        {player.note && <div className="note-block">{player.note}</div>}
        <div className="status-section">
          <div className="status-section-title">Schimbă status</div>
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <button key={key} onClick={() => onStatusChange(key)}
              className={`status-btn${player.status === key ? " status-btn-active" : ""}`}>
              <span className="detail-status-dot" style={{ background: player.status === key ? "#fff" : cfg.color }} />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>
      <div className="detail-footer" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={onOpenProfile} style={{ width: "100%", padding: 10, border: "1px solid #000", borderRadius: 7, background: "#000", color: "#fff", fontSize: 12, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}>
          Profil complet →
        </button>
        <button onClick={onRemove} className="remove-full-btn">Elimină din shortlist</button>
      </div>
    </aside>
  );
}