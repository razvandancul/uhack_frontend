import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../App";

/* ─── API ────────────────────────────────────────────────────────────────── */
async function apiSearch(query, filters = {}) {
    try {
        const res = await fetch(`${API_BASE}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, filters, limit: 30 }),
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        return await res.json();
    } catch (err) {
        return { results: [], ai_summary: "Eroare la căutare. Verifică dacă backend-ul rulează.", count: 0 };
    }
}

/* ─── ICONS ─────────────────────────────────────────────────────────────── */
function SearchIconSm({ size = 15 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
}
function EmptySearchIcon() {
    return <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
}
function StarIcon({ filled }) {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#000" : "none"} stroke={filled ? "#000" : "#bbb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}

function initials(name = "") {
    return name.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
}

/* ─── SEARCH PAGE ───────────────────────────────────────────────────────── */
export default function SearchPage({ isPlayerInAnyShortlist, onOpenStarModal, onOpenProfile, upsertPlayer }) {
    const [prompt, setPrompt] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [history, setHistory] = useState(["atacant tânăr", "fundaș central"]);
    const [aiSummary, setAiSummary] = useState("");
    const [historyOpen, setHistoryOpen] = useState(false);
    const searchRef = useRef(null);

    // STARE PENTRU TOATE FILTRELE DIN PANOU
    const [filters, setFilters] = useState({
        gkActive: false,
        position: "Toate",
        foot: "Oricare",
        minutes: 0,
        matches: 0,
        conceded: 100,
        // Atributele dinamice (min/max) sunt gestionate ca obiecte goale sau stringuri
        stats: {} 
    });

    useEffect(() => {
        const handleClick = e => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setHistoryOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleSearch = async () => {
        const text = prompt.trim();
        setHistoryOpen(false);
        setLoading(true);
        setHasSearched(true);

        if (text && !history.includes(text)) setHistory(prev => [text, ...prev]);

        const response = await apiSearch(text, filters);
        setResults(response.results || []);
        setAiSummary(response.ai_summary || "");
        if (response.results) response.results.forEach(p => upsertPlayer(p));
        setLoading(false);
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
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
                                    placeholder="Descrie ce tip de jucător cauți..."
                                />
                                <button className="search-btn" disabled={loading} onClick={handleSearch}>
                                    {loading ? "..." : "Caută →"}
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {aiSummary && !loading && (
                            <div style={{ marginTop: 16, padding: 14, background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 10, fontSize: 13, lineHeight: 1.5, color: "#333" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 6, letterSpacing: 0.5 }}>🤖 ANALIZĂ AI</div>
                                {aiSummary}
                            </div>
                        )}
                    </div>

                    <div className="results-area">
                        {loading && [1, 2, 3, 4].map(i => <SearchSkeletonRow key={i} />)}
                        {!loading && hasSearched && results.length === 0 && (
                            <div className="empty-state">
                                <EmptySearchIcon />
                                <div className="empty-title">Niciun rezultat</div>
                                <div className="empty-sub">Încearcă să modifici filtrele.</div>
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
                                {results.map((player) => (
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

                <aside className="right-panel">
                    <h2 className="filter-header">Filtre Jucători</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className={`gk-toggle${filters.gkActive ? " gk-active" : ""}`} 
                             onClick={() => updateFilter('gkActive', !filters.gkActive)}>
                            <span>Caută Portari (GK)</span>
                            <div className="toggle-switch"></div>
                        </div>

                        <FilterGroup title="Generale & Fizic">
                            <FilterSelect label="Poziție" options={["Toate", "Atacant", "Mijlocaș", "Fundaș"]} 
                                value={filters.position} onChange={v => updateFilter('position', v)} />
                            <FilterSelect label="Picior preferat" options={["Oricare", "Stângul", "Dreptul", "Ambele"]} 
                                value={filters.foot} onChange={v => updateFilter('foot', v)} />
                            <FilterRange label="Vârstă (Ani)" />
                            <FilterRange label="Cotă piață (€)" />
                            <FilterRange label="Înălțime (cm)" />
                        </FilterGroup>

                        <FilterGroup title="A. Filtre de Bază (Volum)">
                            <SliderRow label="Minute jucate (Minim)" min={0} max={5000} value={filters.minutes} onChange={v => updateFilter('minutes', v)} />
                            <SliderRow label="Meciuri jucate (Minim)" min={0} max={60} value={filters.matches} onChange={v => updateFilter('matches', v)} />
                        </FilterGroup>

                        <FilterGroup title="B. Filtre Ofensive">
                            {["xG (Expected Goals)", "Goluri per 90", "Conversie Goluri (%)", "Driblinguri încercate", "Driblinguri reușite (%)", "Atingeri în careu"].map(l => <FilterRange key={l} label={l} />)}
                        </FilterGroup>

                        <FilterGroup title="C. Playmaking & Pase">
                            {["xA (Expected Assists)", "Pase progresive", "Pase inteligente", "Acuratețe pase (%)", "Acuratețe centrări (%)"].map(l => <FilterRange key={l} label={l} />)}
                        </FilterGroup>

                        <FilterGroup title="D. Defensive & Fizice">
                            {["Dueluri defensive", "Dueluri defensive câștigate (%)", "Dueluri aeriene", "Dueluri aeriene câștigate (%)", "Intercepții"].map(l => <FilterRange key={l} label={l} />)}
                        </FilterGroup>

                        <FilterGroup title="E. Goalkeeper (GK)">
                            <SliderRow label="Goluri primite (Maxim)" min={0} max={100} value={filters.conceded} onChange={v => updateFilter('conceded', v)} />
                            {["Volum intervenții", "Rată de parade (%)"].map(l => <FilterRange key={l} label={l} />)}
                        </FilterGroup>

                        {/* BUTONUL DE SUBMIT */}
                        <button 
                            type="button"
                            className="apply-filters-btn" 
                            style={{
                                width: "100%", padding: "14px", background: "#000", color: "#fff",
                                border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer",
                                marginTop: "15px", marginBottom: "10px", fontSize: "13px"
                            }}
                            onClick={handleSearch}
                        >
                            APLICĂ FILTRELE
                        </button>

                        <button type="reset" className="reset-btn" onClick={() => updateFilter('stats', {})}>Resetează Toate Filtrele</button>
                    </form>
                </aside>
            </div>
        </div>
    );
}

/* ─── Sub-componente ────────────────────────────────────────────────────── */
function FilterGroup({ title, children }) {
    return (
        <div className="filter-group">
            <div className="filter-group-title">{title}</div>
            {children}
        </div>
    );
}
function FilterSelect({ label, options, value, onChange }) {
    return (
        <div className="f-row">
            <label className="filter-label">{label}</label>
            <select className="f-select" value={value} onChange={e => onChange(e.target.value)}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}
function FilterRange({ label }) {
    return (
        <div className="f-row">
            <label className="filter-label">{label}</label>
            <div className="filter-inputs">
                <input type="number" placeholder="Min" className="f-input" />
                <input type="number" placeholder="Max" className="f-input" />
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
                onChange={e => onChange(parseInt(e.target.value))} className="f-input" style={{ width: "100%", padding: 0 }} />
        </div>
    );
}
function SearchPlayerRow({ player, isStarred, onStar, onOpenProfile }) {
    return (
        <div className="player-row" style={{ cursor: "default" }}>
            <div className="player-avatar">{initials(player.name)}</div>
            <div className="player-info">
                <div className="player-name">{player.name}</div>
                <div className="player-meta">{player.club} · {player.age} ani</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {player.rating != null && <span style={{ fontSize: 10, fontWeight: 700, background: "#000", color: "#fff", padding: "2px 7px", borderRadius: 4 }}>RTG {player.rating}</span>}
                </div>
            </div>
            <div className="position-badge">{player.position}</div>
            <div className="player-value">{player.marketValue}</div>
            <div className="player-actions">
                <button className="action-btn" onClick={onOpenProfile}>Profil →</button>
                <button onClick={onStar} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <StarIcon filled={isStarred} />
                </button>
            </div>
        </div>
    );
}
function SearchSkeletonRow() {
    return <div className="skeleton-row" style={{height: 60, background: '#f9f9f9', marginBottom: 8, borderRadius: 8}} />;
}