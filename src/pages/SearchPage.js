import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../App";

/* ─── API ────────────────────────────────────────────────────────────────── */
async function apiSearchSmart(query) {
  try {
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 30 }),
    });
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return await res.json();
  } catch {
    return {
      results: [],
      ai_summary: "Eroare la căutare. Verifică backend-ul.",
      count: 0,
    };
  }
}

async function apiSearchAdvanced(payload) {
  try {
    const res = await fetch(`${API_BASE}/search/advanced`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Advanced search failed: ${res.status}`);
    return await res.json();
  } catch {
    return { results: [], count: 0 };
  }
}

/* ─── ICONS ─────────────────────────────────────────────────────────────── */
function SearchIconSm({ size = 15 }) {
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

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/* ─── GROWTH POTENTIAL TAG ───────────────────────────────────────────────── */
function GrowthTag({ value }) {
  if (value == null) return null;

  let label, bg, color;
  if (value >= 75) {
    label = "⚡ Top Prospect";
    bg = "#eef9f5";
    color = "#1d9e75";
  } else if (value >= 55) {
    label = "🌱 Talent";
    bg = "#fff8e6";
    color = "#b8770a";
  } else if (value >= 35) {
    label = "📊 Consolidat";
    bg = "#f0f4ff";
    color = "#3b5bdb";
  } else {
    label = "🔻 În declin";
    bg = "#fff5f5";
    color = "#c92a2a";
  }

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        background: bg,
        color,
        padding: "2px 7px",
        borderRadius: 4,
        border: `1px solid ${color}33`,
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      {label}
    </span>
  );
}

/* ─── MAPS ───────────────────────────────────────────────────────────────── */
const POSITION_TO_ROLE = {
  Toate: null,
  Atacant: "FWD",
  Mijlocaș: "MID",
  Fundaș: "DEF",
};
const FOOT_MAP = {
  Oricare: null,
  Stângul: "left",
  Dreptul: "right",
  Ambele: "both",
};

/* ─── DEFAULT FILTERS ────────────────────────────────────────────────────── */
const defaultFilters = {
  // Generale
  gkActive: false,
  position: "Toate",
  foot: "Oricare",
  ageMin: "",
  ageMax: "",
  heightMin: "",
  valueMin: "",
  valueMax: "",
  // Volum
  minutes: 0,
  matches: 0,
  // Ofensive — suportate de backend
  minGoals: "",
  minAssists: "",
  // Playmaking — suportate de backend
  minPassPct: "",
  // GK
  conceded: 100,
};

/* ─── BUILD PAYLOAD ──────────────────────────────────────────────────────── */
function buildAdvancedPayload(query, filters) {
  const payload = { query: query || "" };

  // Poziție / GK
  if (filters.gkActive) {
    payload.role_code = "GKP";
  } else {
    const role = POSITION_TO_ROLE[filters.position];
    if (role) payload.role_code = role;
  }

  // Picior
  const foot = FOOT_MAP[filters.foot];
  if (foot) payload.preferred_foot = foot;

  // Vârstă
  if (filters.ageMin) payload.age_min = parseInt(filters.ageMin);
  if (filters.ageMax) payload.age_max = parseInt(filters.ageMax);

  // Înălțime
  if (filters.heightMin) payload.min_height_cm = parseInt(filters.heightMin);

  // Valoare piață
  if (filters.valueMin)
    payload.min_market_value_eur = parseInt(filters.valueMin);
  if (filters.valueMax)
    payload.max_market_value_eur = parseInt(filters.valueMax);

  // Volum
  if (filters.matches > 0) payload.min_matches = parseInt(filters.matches);
  if (filters.minutes > 0) payload.min_minutes = parseInt(filters.minutes);

  // Ofensive
  if (filters.minGoals) payload.min_goals = parseInt(filters.minGoals);
  if (filters.minAssists) payload.min_assists = parseInt(filters.minAssists);

  // Playmaking
  if (filters.minPassPct)
    payload.min_pass_percent = parseFloat(filters.minPassPct);

  return payload;
}

function hasActiveFilters(filters) {
  return (
    filters.gkActive ||
    (filters.position && filters.position !== "Toate") ||
    (filters.foot && filters.foot !== "Oricare") ||
    filters.ageMin ||
    filters.ageMax ||
    filters.heightMin ||
    filters.valueMin ||
    filters.valueMax ||
    filters.minutes > 0 ||
    filters.matches > 0 ||
    filters.minGoals ||
    filters.minAssists ||
    filters.minPassPct
  );
}

/* ─── SEARCH PAGE ────────────────────────────────────────────────────────── */
export default function SearchPage({
  isPlayerInAnyShortlist,
  onOpenStarModal,
  onOpenProfile,
  upsertPlayer,
}) {
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [history, setHistory] = useState(["atacant tânăr", "fundaș central"]);
  const [aiSummary, setAiSummary] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setHistoryOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = async () => {
    const text = prompt.trim();
    setHistoryOpen(false);
    setLoading(true);
    setHasSearched(true);

    if (text && !history.includes(text)) setHistory((prev) => [text, ...prev]);

    let response;
    if (hasActiveFilters(filters)) {
      const payload = buildAdvancedPayload(text, filters);
      response = await apiSearchAdvanced(payload);
      setAiSummary("");
    } else {
      response = await apiSearchSmart(text);
      setAiSummary(response.ai_summary || "");
    }

    setResults(response.results || []);
    if (response.results) response.results.forEach((p) => upsertPlayer(p));
    setLoading(false);
  };

  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => setFilters(defaultFilters);

  const pageSubText =
    hasSearched && !loading
      ? `${results.length} jucători găsiți`
      : "Superliga România · 2024/25";

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
          {/* ── SEARCH BAR ── */}
          <div className="search-section">
            <div className="search-container" ref={searchRef}>
              <div className="search-bar">
                <SearchIconSm />
                <input
                  className="search-input"
                  type="text"
                  value={prompt}
                  onFocus={() => setHistoryOpen(true)}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder="Numele unui jucător sau descriere... (ex: Tănase, atacant tânăr sub 23 ani)"
                />
                <button
                  className="search-btn"
                  disabled={loading}
                  onClick={handleSearch}
                >
                  {loading ? "Se caută..." : "Caută →"}
                </button>
              </div>

              {historyOpen && history.length > 0 && (
                <div className="search-history-dropdown">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="history-item"
                      onClick={() => {
                        setPrompt(item);
                        setHistoryOpen(false);
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

            {/* AI SUMMARY */}
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

          {/* ── RESULTS ── */}
          <div className="results-area">
            {loading && (
              <div className="results-fade-in">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonRow key={i} />
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
                  Caută după nume sau folosește filtrele din panoul lateral.
                </div>
                <div className="suggestions-row">
                  {[
                    "Tănase",
                    "atacant tânăr sub 23 ani",
                    "fundaș central român",
                    "mijlocaș cu 5 asisturi",
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
              <ResultsList
                results={results}
                isPlayerInAnyShortlist={isPlayerInAnyShortlist}
                onOpenStarModal={onOpenStarModal}
                onOpenProfile={onOpenProfile}
              />
            )}
          </div>
        </div>

        {/* ── FILTER PANEL ── */}
        <FilterPanel
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
          onApply={handleSearch}
        />
      </div>
    </div>
  );
}

/* ─── FILTER PANEL ───────────────────────────────────────────────────────── */
function FilterPanel({ filters, updateFilter, resetFilters, onApply }) {
  return (
    <aside className="right-panel">
      <h2 className="filter-header">Filtre Jucători</h2>

      {/* GK Toggle */}
      <div
        className={`gk-toggle${filters.gkActive ? " gk-active" : ""}`}
        onClick={() => updateFilter("gkActive", !filters.gkActive)}
      >
        <span>Caută Portari (GK)</span>
        <div className="toggle-switch"></div>
      </div>

      {/* ── A. Generale & Fizic ── */}
      <FilterGroup title="Generale & Fizic">
        <div className="f-row">
          <label className="filter-label">Poziție</label>
          <select
            className="f-select"
            value={filters.position}
            onChange={(e) => updateFilter("position", e.target.value)}
          >
            <option>Toate</option>
            <option>Atacant</option>
            <option>Mijlocaș</option>
            <option>Fundaș</option>
          </select>
        </div>

        <div className="f-row">
          <label className="filter-label">Picior preferat</label>
          <select
            className="f-select"
            value={filters.foot}
            onChange={(e) => updateFilter("foot", e.target.value)}
          >
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
              value={filters.ageMin}
              onChange={(e) => updateFilter("ageMin", e.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="Max"
              className="f-input"
              value={filters.ageMax}
              onChange={(e) => updateFilter("ageMax", e.target.value)}
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
              value={filters.valueMin}
              onChange={(e) => updateFilter("valueMin", e.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="Max"
              className="f-input"
              value={filters.valueMax}
              onChange={(e) => updateFilter("valueMax", e.target.value)}
            />
          </div>
        </div>

        <div className="f-row">
          <label className="filter-label">Înălțime min. (cm)</label>
          <input
            type="number"
            min="0"
            placeholder="ex: 180"
            className="f-input"
            value={filters.heightMin}
            onChange={(e) => updateFilter("heightMin", e.target.value)}
          />
        </div>
      </FilterGroup>

      {/* ── B. Volum de Joc ── */}
      <FilterGroup title="B. Volum de Joc">
        <div className="f-row">
          <div className="filter-row-header">
            <label className="filter-label">Minute jucate (Min)</label>
            <span className="range-value">{filters.minutes}</span>
          </div>
          <input
            type="range"
            min="0"
            max="3000"
            value={filters.minutes}
            onChange={(e) => updateFilter("minutes", parseInt(e.target.value))}
            className="f-input"
            style={{ width: "100%", padding: 0 }}
          />
        </div>

        <div className="f-row">
          <div className="filter-row-header">
            <label className="filter-label">Meciuri jucate (Min)</label>
            <span className="range-value">{filters.matches}</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={filters.matches}
            onChange={(e) => updateFilter("matches", parseInt(e.target.value))}
            className="f-input"
            style={{ width: "100%", padding: 0 }}
          />
        </div>
      </FilterGroup>

      {/* ── C. Ofensive ── */}
      <FilterGroup title="C. Filtre Ofensive">
        <div className="f-row">
          <label className="filter-label">Goluri (Min)</label>
          <input
            type="number"
            min="0"
            placeholder="ex: 5"
            className="f-input"
            value={filters.minGoals}
            onChange={(e) => updateFilter("minGoals", e.target.value)}
          />
        </div>

        <div className="f-row">
          <label className="filter-label">Asisturi (Min)</label>
          <input
            type="number"
            min="0"
            placeholder="ex: 3"
            className="f-input"
            value={filters.minAssists}
            onChange={(e) => updateFilter("minAssists", e.target.value)}
          />
        </div>

        {/* Filtre viitoare — vizuale, fără backend încă */}
        <ComingSoonRange label="xG (Expected Goals)" />
        <ComingSoonRange label="Goluri per 90" />
        <ComingSoonRange label="Conversie Goluri (%)" />
        <ComingSoonRange label="Driblinguri reușite (%)" />
        <ComingSoonRange label="Atingeri în careu" />
      </FilterGroup>

      {/* ── D. Playmaking & Pase ── */}
      <FilterGroup title="D. Playmaking & Pase">
        <div className="f-row">
          <label className="filter-label">Acuratețe pase (%) Min</label>
          <input
            type="number"
            min="0"
            max="100"
            placeholder="ex: 75"
            className="f-input"
            value={filters.minPassPct}
            onChange={(e) => updateFilter("minPassPct", e.target.value)}
          />
        </div>

        {/* Filtre viitoare */}
        <ComingSoonRange label="xA (Expected Assists)" />
        <ComingSoonRange label="Pase progresive" />
        <ComingSoonRange label="Pase inteligente" />
        <ComingSoonRange label="Acuratețe centrări (%)" />
      </FilterGroup>

      {/* ── E. Defensive & Fizice ── */}
      <FilterGroup title="E. Defensive & Fizice">
        <ComingSoonRange label="Dueluri defensive câștigate (%)" />
        <ComingSoonRange label="Dueluri aeriene câștigate (%)" />
        <ComingSoonRange label="Intercepții" />
        <ComingSoonRange label="Pressing reușit" />
      </FilterGroup>

      {/* ── F. Goalkeeper ── */}
      {filters.gkActive && (
        <FilterGroup title="F. Goalkeeper (GK)">
          <div className="f-row">
            <div className="filter-row-header">
              <label className="filter-label">Goluri primite (Max)</label>
              <span className="range-value">{filters.conceded}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.conceded}
              onChange={(e) =>
                updateFilter("conceded", parseInt(e.target.value))
              }
              className="f-input"
              style={{ width: "100%", padding: 0 }}
            />
          </div>
          <ComingSoonRange label="Volum intervenții" />
          <ComingSoonRange label="Rată de parade (%)" />
        </FilterGroup>
      )}

      {/* ── Butoane ── */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          onClick={onApply}
          style={{
            flex: 1,
            padding: "10px 16px",
            border: "1px solid #000",
            background: "#000",
            color: "#fff",
            borderRadius: 7,
            fontSize: 13,
            fontFamily: "inherit",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Aplică Filtre
        </button>
        <button
          onClick={resetFilters}
          className="reset-btn"
          style={{ flex: 1 }}
        >
          Resetează
        </button>
      </div>
    </aside>
  );
}

/* ─── FILTER SUB-COMPONENTS ──────────────────────────────────────────────── */
function FilterGroup({ title, children }) {
  return (
    <div className="filter-group">
      <div className="filter-group-title">{title}</div>
      {children}
    </div>
  );
}

function ComingSoonRange({ label }) {
  return (
    <div className="f-row">
      <label className="filter-label" style={{ opacity: 0.6 }}>
        {label}{" "}
        <span
          style={{
            fontSize: 9,
            background: "#f0f0f0",
            color: "#999",
            borderRadius: 3,
            padding: "1px 4px",
            fontWeight: 600,
          }}
        >
          CURÂND
        </span>
      </label>
      <div className="filter-inputs">
        <input type="number" placeholder="Min" className="f-input" />
        <input type="number" placeholder="Max" className="f-input" />
      </div>
    </div>
  );
}

/* ─── RESULTS ────────────────────────────────────────────────────────────── */
function ResultsList({
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
          <PlayerRow
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

function PlayerRow({ player, isStarred, onStar, onOpenProfile }) {
  return (
    <div className="player-row" style={{ cursor: "default" }}>
      <div className="player-avatar">{initials(player.name)}</div>
      <div className="player-info">
        <div className="player-name">{player.name}</div>
        <div className="player-meta">
          {player.club} · {player.age} ani · {player.nationality}
        </div>
        <div
          style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}
        >
          {player.rating != null && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
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
              CMP. {player.behaviorCoefficient}
            </span>
          )}
          {/* ── GROWTH POTENTIAL TAG ── */}
          {player.growthPotential != null && (
            <GrowthTag value={player.growthPotential} />
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

function SkeletonRow() {
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
