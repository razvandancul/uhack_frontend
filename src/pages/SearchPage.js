import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../App";

/* ─── API ────────────────────────────────────────────────────────────────── */
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
    return { results: [], ai_summary: "Eroare la căutare. Verifică dacă backend-ul rulează.", count: 0 };
  }
}

/* ─── ICONS ─────────────────────────────────────────────────────────────── */
function SearchIconSm({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
function EmptySearchIcon() {
  return <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
function StarIcon({ filled }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#000" : "none"} stroke={filled ? "#000" : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}

function initials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
}

/* ─── SEARCH PAGE ───────────────────────────────────────────────────────── */
export default function SearchPage({ isPlayerInAnyShortlist, onOpenStarModal, onOpenProfile, upsertPlayer }) {
  const [prompt,      setPrompt]      = useState("");
  const [tags,        setTags]        = useState([]);
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [history,     setHistory]     = useState(["atacant tânăr", "fundaș central"]);
  const [aiSummary,   setAiSummary]   = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [gkActive,    setGkActive]    = useState(false);
  const [sliders,     setSliders]     = useState({ minutes: 0, matches: 0, conceded: 100 });
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClick = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setHistoryOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = async () => {
    const text = prompt.trim();
    if (!text) return;
    if (!history.includes(text)) setHistory(prev => [text, ...prev]);
    setHistoryOpen(false);
    setLoading(true);
    setHasSearched(true);
    const response = await apiSearch(text);
    setResults(response.results || []);
    setAiSummary(response.ai_summary || "");
    if (response.results) response.results.forEach(p => upsertPlayer(p));
    setLoading(false);
  };

  const pageSubText = hasSearched && !loading ? `${results.length} jucători găsiți` : "Superliga România · 2024/25";

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
        {/* ── Center column ── */}
        <div className="center-column">
          <div className="search-section">
            <div className="search-container" ref={searchRef}>
              <div className="search-bar">
                <SearchIconSm />
                <input
                  className="search-input"
                  type="text"
                  value={prompt}
                  onFocus={() => setHistoryOpen(true)}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                  placeholder="Descrie ce tip de jucător cauți... (ex: atacant tânăr sub 23 ani)"
                />
                <button className="search-btn" disabled={loading} onClick={handleSearch}>
                  {loading ? "Se caută..." : "Caută →"}
                </button>
              </div>

              {historyOpen && history.length > 0 && (
                <div className="search-history-dropdown">
                  {history.map((item, idx) => (
                    <div key={idx} className="history-item"
                      onClick={() => { setPrompt(item); setHistoryOpen(false); }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, opacity: 0.5 }}>🕒</span>{item}
                      </span>
                      <button className="history-delete-btn"
                        onClick={e => { e.stopPropagation(); setHistory(history.filter(i => i !== item)); }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {tags.length > 0 && (
              <div className="tags-row">
                {tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button className="tag-remove" onClick={() => setTags(tags.filter(t => t !== tag))}>×</button>
                  </span>
                ))}
                <button className="clear-btn" onClick={() => setTags([])}>Șterge tot ×</button>
              </div>
            )}

            {aiSummary && !loading && (
              <div style={{ marginTop: 16, padding: 14, background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 13, lineHeight: 1.5, color: "#333" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, letterSpacing: 0.5 }}>🤖 ANALIZĂ AI</div>
                {aiSummary}
              </div>
            )}
          </div>

          <div className="results-area">
            {loading && [1,2,3,4].map(i => <SearchSkeletonRow key={i} />)}

            {!loading && hasSearched && results.length === 0 && (
              <div className="empty-state">
                <EmptySearchIcon />
                <div className="empty-title">Niciun rezultat</div>
                <div className="empty-sub">Încearcă să modifici filtrele sau termenii de căutare.</div>
              </div>
            )}

            {!loading && !hasSearched && (
              <div className="empty-state">
                <EmptySearchIcon />
                <div className="empty-title">Începe o căutare</div>
                <div className="empty-sub">Descrie tipul de jucător sau folosește filtrele din panoul lateral.</div>
                <div className="suggestions-row">
                  {["atacant tânăr sub 23 ani", "fundaș central român", "mijlocaș creativ cu 5 asisturi", "portar experimentat"].map(s => (
                    <button key={s} className="suggestion-btn" onClick={() => setPrompt(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="results-fade-in">
                <div className="list-header">
                  <div className="list-header-spacer" />
                  <div className="list-header-player">Jucător</div>
                  <div className="list-header-pos">Poziție</div>
                  <div className="list-header-value">Valoare</div>
                  <div className="list-header-actions" />
                </div>
                {results.map((player, i) => (
                  <SearchPlayerRow
                    key={player.id}
                    player={player}
                    isStarred={isPlayerInAnyShortlist(player.id)}
                    onStar={() => onOpenStarModal(player)}
                    onOpenProfile={() => onOpenProfile(player.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel filtre ── */}
        <aside className="right-panel">
          <h2 className="filter-header">Filtre Jucători</h2>
          <form onReset={() => setSliders({ minutes: 0, matches: 0, conceded: 100 })}>
            <div className={`gk-toggle${gkActive ? " gk-active" : ""}`} onClick={() => setGkActive(!gkActive)}>
              <span>Caută Portari (GK)</span>
              <div className="toggle-switch"></div>
            </div>

            <FilterGroup title="Generale & Fizic">
              <FilterSelect label="Poziție" options={["Toate","Atacant","Mijlocaș","Fundaș"]} />
              <FilterSelect label="Picior preferat" options={["Oricare","Stângul","Dreptul","Ambele"]} />
              <FilterRange label="Vârstă (Ani)" />
              <FilterRange label="Cotă piață (€)" />
              <FilterRange label="Înălțime (cm)" />
            </FilterGroup>

            <FilterGroup title="A. Filtre de Bază (Volum)">
              <SliderRow label="Minute jucate (Minim)" min={0} max={5000} value={sliders.minutes} onChange={v => setSliders(s => ({ ...s, minutes: v }))} />
              <SliderRow label="Meciuri jucate (Minim)" min={0} max={60}   value={sliders.matches} onChange={v => setSliders(s => ({ ...s, matches: v }))} />
            </FilterGroup>

            <FilterGroup title="B. Filtre Ofensive">
              {["xG (Expected Goals)","Goluri per 90","Conversie Goluri (%)","Driblinguri încercate","Driblinguri reușite (%)","Atingeri în careu"].map(l => <FilterRange key={l} label={l} />)}
            </FilterGroup>
            <FilterGroup title="C. Playmaking & Pase">
              {["xA (Expected Assists)","Pase progresive","Pase inteligente","Acuratețe pase (%)","Acuratețe centrări (%)"].map(l => <FilterRange key={l} label={l} />)}
            </FilterGroup>
            <FilterGroup title="D. Defensive & Fizice">
              {["Dueluri defensive","Dueluri defensive câștigate (%)","Dueluri aeriene","Dueluri aeriene câștigate (%)","Intercepții"].map(l => <FilterRange key={l} label={l} />)}
            </FilterGroup>
            <FilterGroup title="E. Goalkeeper (GK)">
              <SliderRow label="Goluri primite (Maxim)" min={0} max={100} value={sliders.conceded} onChange={v => setSliders(s => ({ ...s, conceded: v }))} />
              {["Volum intervenții","Rată de parade (%)"].map(l => <FilterRange key={l} label={l} />)}
            </FilterGroup>

            <button type="reset" className="reset-btn">Resetează Toate Filtrele</button>
          </form>
        </aside>
      </div>
    </div>
  );
}

/* ─── Filter sub-components ─────────────────────────────────────────────── */
function FilterGroup({ title, children }) {
  return (
    <div className="filter-group">
      <div className="filter-group-title">{title}</div>
      {children}
    </div>
  );
}
function FilterSelect({ label, options }) {
  return (
    <div className="f-row">
      <label className="filter-label">{label}</label>
      <select className="f-select">{options.map(o => <option key={o}>{o}</option>)}</select>
    </div>
  );
}
function FilterRange({ label }) {
  const isPercent = label.includes("(%)");
  return (
    <div className="f-row">
      <label className="filter-label">{label}</label>
      <div className="filter-inputs">
        <input type="number" min="0" max={isPercent ? "100" : undefined} placeholder="Min" className="f-input" />
        <input type="number" min="0" max={isPercent ? "100" : undefined} placeholder="Max" className="f-input" />
      </div>
    </div>
  );
}
function SliderRow({ label, min, max, value, onChange }) {
  return (
    <div className="f-row">
      <div className="filter-row-header">
        <label className="filter-label">{label}</label>
        <span className="range-value">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(e.target.value)} className="f-input" style={{ width: "100%", padding: 0 }} />
    </div>
  );
}

/* ─── Search player row ──────────────────────────────────────────────────── */
function SearchPlayerRow({ player, isStarred, onStar, onOpenProfile }) {
  return (
    <div className="player-row" style={{ cursor: "default" }}>
      <div className="player-avatar">{initials(player.name)}</div>
      <div className="player-info">
        <div className="player-name">{player.name}</div>
        <div className="player-meta">{player.club} · {player.age} ani · {player.nationality}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {player.rating != null && <span style={{ fontSize: 10, fontWeight: 700, background: "#000", color: "#fff", padding: "2px 7px", borderRadius: 4 }}>RTG {player.rating}</span>}
          {player.compatibilityScore != null && <span style={{ fontSize: 10, fontWeight: 700, background: "#1d9e75", color: "#fff", padding: "2px 7px", borderRadius: 4 }}>COMP {player.compatibilityScore}%</span>}
        </div>
      </div>
      <div className="position-badge">{player.position}</div>
      <div className="player-value">{player.marketValue}</div>
      <div className="player-actions">
        <button className="action-btn" onClick={onOpenProfile}>Profil →</button>
        <button className="star-btn star-btn-action" onClick={onStar} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} title="Adaugă în shortlist">
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