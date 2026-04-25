import { useState, useEffect, useCallback, useMemo } from "react";
import uclujLogo from "./U_Cluj.svg.png";

/* ─────────────────────────────────────────────────────────────────────────────
   PLAYER PROFILE PAGE — U Cluj Scout AI
   Folosire: <PlayerProfile playerId={id} onBack={() => ...} />
   Backend endpoint: GET /api/players/:id

   Structura response așteptată (flat, direct pe player.stats):
   {
     id, name, age, nationality, club, position, preferredFoot, height,
     contractUntil, marketValue, rating,
     stats: {
       matches, minutes, goals, assists, xG, xA,
       pasesTotal, pasesAccuracy, pasesKey, crosses, crossAccuracy,
       pasesShort, pasesShortAcc, pasesMedium, pasesMediumAcc,
       pasesLong, pasesLongAcc, pasesProgressive, pasesThirdAtt,
       driblings, driblingAttempts,
       duelsTotal, duelsWon, tackles, tackleAttempts,
       interceptions, foulsCommitted, foulsReceived,
       aerialDuels, aerialWon, pressing, recoveries, clearances, errorsToShot,
       successfulPasses, successfulDribbles, aerialDuelsWon,
       offensiveDuelsWon, defensiveDuelsWon,
     },
     seasonRatings: [
       { matchday: "Et.1", rating: 7.2, opponent: "FCSB", home: true }
     ]
   }
───────────────────────────────────────────────────────────────────────────── */

const API_BASE = "/api";

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function avg(arr) {
  if (!arr || !arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Afișează număr cu 1 zecimală sau "—"
const fmt1 = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  const n = Number(val);
  if (isNaN(n)) return "—";
  return n.toFixed(1);
};

// Afișează procent sau "—%"
const pct = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  const n = Number(val);
  if (isNaN(n)) return "—";
  return `${n.toFixed(0)}%`;
};

/* ─── ROOT COMPONENT ───────────────────────────────────────────────────────── */

export default function PlayerProfile({ playerId, onBack }) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("general");

  const fetchPlayer = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/players/${playerId}`);
      if (!res.ok) throw new Error(`Eroare server: ${res.status}`);
      const data = await res.json();
      setPlayer(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  return (
    <div style={S.root}>
      {/* ── Main ── */}
      <main style={S.main}>
        {/* Header */}
        <div style={S.pageHeader}>
          <div style={S.pageHeaderInner}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button onClick={onBack} style={S.backBtn}>
                ←
              </button>
              <div>
                <h1 style={S.pageTitle}>Profil Jucător</h1>
                <p style={S.pageSub}>
                  {loading
                    ? "Se încarcă…"
                    : player
                      ? "Statistici sezon · Superliga României"
                      : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div style={S.centerState}>
            <div style={S.stateTitle}>Se încarcă profilul…</div>
          </div>
        )}

        {!loading && error && (
          <div style={S.centerState}>
            <div style={S.stateTitle}>Eroare la încărcare</div>
            <div style={S.stateSub}>{error}</div>
            <button style={S.retryBtn} onClick={fetchPlayer}>
              Încearcă din nou
            </button>
          </div>
        )}

        {!loading && !error && player && (
          <div style={S.content}>
            <ProfileHeader player={player} />
            <TabBar active={tab} onChange={setTab} />
            {tab === "general" && <TabGeneral player={player} />}
            {tab === "pase" && <TabPase player={player} />}
            {tab === "dueluri" && <TabDueluri player={player} />}
            {tab === "forma" && <TabForma player={player} />}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── PROFILE HEADER ──────────────────────────────────────────────────────── */

function ProfileHeader({ player }) {
  return (
    <div style={S.profileTop}>
      <div style={S.avatarHero}>{initials(player.name)}</div>

      <div style={S.playerMainInfo}>
        <div style={S.playerFullName}>{player.name ?? "—"}</div>
        <div style={S.posBadgeRow}>
          <span style={S.posBadge}>{player.position ?? "—"}</span>
          <span style={S.playerClub}>
            {player.club ?? "—"} · {player.nationality ?? "—"}
          </span>
        </div>
        <div style={S.metaChips}>
          <MetaChip
            label="Vârstă"
            value={player.age ? `${player.age} ani` : "—"}
          />
          <MetaChip label="Înălțime" value={player.height ?? "—"} />
          <MetaChip label="Picior" value={player.preferredFoot ?? "—"} />
          <MetaChip label="Contract" value={player.contractUntil ?? "—"} />
          <MetaChip label="Naționalitate" value={player.nationality ?? "—"} />
        </div>
      </div>

      <div style={S.playerRightStats}>
        <div style={S.marketVal}>
          <div style={S.mvLabel}>VALOARE DE PIAȚĂ</div>
          <div style={S.mvVal}>{player.marketValue ?? "—"}</div>
        </div>
        <div style={S.ratingOverall}>
          <div style={S.roLabel}>RATING</div>
          <div style={S.roVal}>{player.rating ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

function MetaChip({ label, value }) {
  return (
    <div style={S.metaChip}>
      <span style={S.metaChipLabel}>{label}</span>
      <span style={S.metaChipVal}>{value}</span>
    </div>
  );
}

/* ─── TAB BAR ─────────────────────────────────────────────────────────────── */

const TABS = [
  { id: "general", label: "Statistici generale" },
  { id: "pase", label: "Pase & Creativitate" },
  { id: "dueluri", label: "Dueluri & Apărare" },
  { id: "forma", label: "Formă sezon" },
];

function TabBar({ active, onChange }) {
  return (
    <div style={S.tabs}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{ ...S.tab, ...(active === t.id ? S.tabActive : {}) }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── TAB: GENERAL ────────────────────────────────────────────────────────── */

function TabGeneral({ player }) {
  const s = player.stats ?? {};

  // per-90 calculat dacă AI-ul nu îl trimite direct
  const per90 = (val) => {
    if (val == null || !s.minutes) return null;
    return (val / s.minutes) * 90;
  };

  return (
    <div>
      <div style={S.statsGrid}>
        <StatCard
          label="Meciuri jucate"
          value={s.matches ?? "—"}
          sub={s.minutes ? `${s.minutes} min. totale` : "—"}
        />
        <StatCard
          label="Goluri (per 90)"
          value={fmt1(per90(s.goals))}
          sub={`Total: ${s.goals ?? "—"}`}
        />
        <StatCard
          label="Asisturi (per 90)"
          value={fmt1(per90(s.assists))}
          sub={`Total: ${s.assists ?? "—"}`}
        />
        <StatCard
          label="xG (per 90)"
          value={fmt1(per90(s.xG))}
          sub="Expected Goals"
        />
        <StatCard
          label="xA (per 90)"
          value={fmt1(per90(s.xA))}
          sub="Expected Assists"
        />
        <StatCard
          label="Rating Conversie"
          value={
            s.goals != null && s.driblingAttempts != null
              ? pct((s.goals / (s.driblingAttempts || 1)) * 100)
              : "—"
          }
          sub="Eficiență finalizare"
        />
      </div>

      <div style={S.sectionTitle}>Eficiență (Procentaje Reușită)</div>
      <div style={S.ratingBarGroup}>
        <RatingBar label="Acuratețe Pase" value={s.pasesAccuracy} />
        <RatingBar
          label="Succes Driblinguri"
          value={
            s.driblings != null && s.driblingAttempts
              ? (s.driblings / s.driblingAttempts) * 100
              : null
          }
        />
        <RatingBar
          label="Dueluri Aeriene Câștigate"
          value={
            s.aerialWon != null && s.aerialDuels
              ? (s.aerialWon / s.aerialDuels) * 100
              : null
          }
        />
        <RatingBar
          label="Dueluri Câștigate"
          value={
            s.duelsWon != null && s.duelsTotal
              ? (s.duelsWon / s.duelsTotal) * 100
              : null
          }
        />
        <RatingBar label="Acuratețe Centrări" value={s.crossAccuracy} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={S.statCard}>
      <div style={S.statCardLabel}>{label}</div>
      <div style={S.statCardVal}>{value ?? "—"}</div>
      {sub && <div style={S.statCardSub}>{sub}</div>}
    </div>
  );
}

function RatingBar({ label, value }) {
  const procentaj =
    value != null && !isNaN(value) ? Math.min(100, Number(value)) : 0;
  const hasValue = value != null && !isNaN(value);
  return (
    <div style={S.ratingRow}>
      <span style={S.ratingLbl}>{label}</span>
      <div style={S.ratingBarWrap}>
        <div style={{ ...S.ratingBarFill, width: `${procentaj}%` }} />
      </div>
      <span style={S.ratingNum}>{hasValue ? pct(value) : "—"}</span>
    </div>
  );
}

/* ─── TAB: PASE & CREATIVITATE ────────────────────────────────────────────── */

function TabPase({ player }) {
  const s = player.stats ?? {};
  const per90 = (val) =>
    val != null && s.minutes ? (val / s.minutes) * 90 : null;

  return (
    <div style={S.twoCol}>
      <div>
        <div
          style={{
            ...S.statsGrid,
            gridTemplateColumns: "1fr 1fr",
            marginBottom: 20,
          }}
        >
          <StatCard
            label="Pase (per 90)"
            value={fmt1(per90(s.pasesTotal))}
            sub={
              s.pasesAccuracy != null
                ? `${pct(s.pasesAccuracy)} acuratețe`
                : "—"
            }
          />
          <StatCard
            label="Pase Cheie"
            value={fmt1(per90(s.pasesKey))}
            sub="Duc la șut"
          />
          <StatCard
            label="Centrări"
            value={fmt1(per90(s.crosses))}
            sub={
              s.crossAccuracy != null
                ? `${pct(s.crossAccuracy)} acuratețe`
                : "—"
            }
          />
          <StatCard
            label="Pase Progressive"
            value={fmt1(per90(s.pasesProgressive))}
            sub="Înainte spre poartă"
          />
        </div>
      </div>

      <div style={S.detailBlock}>
        <div style={S.sectionTitle}>Defalcare Distribuție (per 90)</div>
        <DetailRows
          rows={[
            [
              "Pase Scurte",
              `${fmt1(per90(s.pasesShort))} (${pct(s.pasesShortAcc)})`,
            ],
            [
              "Pase Medii",
              `${fmt1(per90(s.pasesMedium))} (${pct(s.pasesMediumAcc)})`,
            ],
            [
              "Pase Lungi",
              `${fmt1(per90(s.pasesLong))} (${pct(s.pasesLongAcc)})`,
            ],
            ["Pase în Treimea Ofensivă", fmt1(per90(s.pasesThirdAtt))],
            [
              "Driblinguri Încercate",
              `${fmt1(per90(s.driblingAttempts))} (${
                s.driblings != null && s.driblingAttempts
                  ? pct((s.driblings / s.driblingAttempts) * 100)
                  : "—"
              } reușite)`,
            ],
            ["Presing (acțiuni)", fmt1(per90(s.pressing))],
          ]}
        />
      </div>
    </div>
  );
}

/* ─── TAB: DUELURI & APĂRARE ──────────────────────────────────────────────── */

function TabDueluri({ player }) {
  const s = player.stats ?? {};
  const per90 = (val) =>
    val != null && s.minutes ? (val / s.minutes) * 90 : null;

  const duelsWonPct =
    s.duelsWon != null && s.duelsTotal
      ? (s.duelsWon / s.duelsTotal) * 100
      : null;
  const aerialWonPct =
    s.aerialWon != null && s.aerialDuels
      ? (s.aerialWon / s.aerialDuels) * 100
      : null;
  const tacklePct =
    s.tackles != null && s.tackleAttempts
      ? (s.tackles / s.tackleAttempts) * 100
      : null;

  return (
    <div style={S.twoCol}>
      <div style={S.detailBlock}>
        <div style={S.sectionTitle}>Dueluri la Sol (per 90)</div>
        <DetailRows
          rows={[
            [
              "Total Dueluri",
              `${fmt1(per90(s.duelsTotal))} (${pct(duelsWonPct)} câștigate)`,
            ],
            [
              "Tackle-uri",
              `${fmt1(per90(s.tackles))} (${pct(tacklePct)} reușite)`,
            ],
            ["Faulturi Comise", fmt1(per90(s.foulsCommitted))],
            ["Faulturi Suferite", fmt1(per90(s.foulsReceived))],
            ["Recuperări", fmt1(per90(s.recoveries))],
            ["Erori spre șut", fmt1(per90(s.errorsToShot))],
          ]}
        />
      </div>

      <div style={S.detailBlock}>
        <div style={S.sectionTitle}>Aerian & Defensiv (per 90)</div>
        <DetailRows
          rows={[
            [
              "Dueluri Aeriene",
              `${fmt1(per90(s.aerialDuels))} (${pct(aerialWonPct)} câștigate)`,
            ],
            ["Intercepții", fmt1(per90(s.interceptions))],
            ["Degajări (Clearances)", fmt1(per90(s.clearances))],
            ["Recuperări Totale", fmt1(per90(s.recoveries))],
            ["Presing (acțiuni)", fmt1(per90(s.pressing))],
          ]}
        />
      </div>
    </div>
  );
}

/* ─── TAB: FORMA SEZON ────────────────────────────────────────────────────── */

function TabForma({ player }) {
  const ratings = useMemo(
    () => player.seasonRatings ?? [],
    [player.seasonRatings],
  );

  useEffect(() => {
    if (!ratings.length) return;

    if (!window.Chart) {
      console.warn(
        "Chart.js nu este încărcat. Adaugă <script src='https://cdn.jsdelivr.net/npm/chart.js'></script> în index.html",
      );
      return;
    }

    const ctx = document.getElementById("formaChart");
    if (!ctx) return;

    // Distruge chart-ul anterior dacă există
    if (ctx.__chartjs) ctx.__chartjs.destroy();

    const labels = ratings.map((r) => r.matchday);
    const data = ratings.map((r) => r.rating);
    const pointColors = data.map((v) =>
      v >= 8.0 ? "#1d9e75" : v >= 7.0 ? "#ef9f27" : "#e63946",
    );

    const chart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Rating",
            data,
            backgroundColor: "rgba(29, 158, 117, 0.05)",
            borderWidth: 2,
            pointRadius: 6,
            pointBackgroundColor: pointColors,
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            tension: 0.3,
            fill: true,
            segment: {
              borderColor: (ctx) =>
                ctx.p0.parsed.y > ctx.p1.parsed.y ? "#e63946" : "#1d9e75",
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Rating: ${ctx.parsed.y.toFixed(1)}`,
              title: (ctx) => {
                const r = ratings[ctx[0].dataIndex];
                return `${r.matchday} · ${r.opponent} (${r.home ? "Acasă" : "Deplasare"})`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: false },
            grid: { display: false },
          },
          y: {
            min: 1,
            max: 10,
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: "#f0f0f0" },
          },
        },
      },
    });
    ctx.__chartjs = chart;

    return () => chart.destroy();
  }, [ratings]);

  if (!ratings.length) {
    return (
      <div style={S.centerState}>
        <div style={S.stateTitle}>Nu există date de formă disponibile</div>
        <div style={S.stateSub}>
          AI-ul va completa istoricul per etapă când datele vor fi disponibile.
        </div>
      </div>
    );
  }

  const half = Math.floor(ratings.length / 2);
  const top3 = [...ratings].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const avgTur = avg(ratings.slice(0, half).map((r) => r.rating));
  const avgRetur = avg(ratings.slice(half).map((r) => r.rating));
  const avgGeneral = avg(ratings.map((r) => r.rating));

  return (
    <div>
      <div style={S.sectionTitle}>Rating per etapă — Sezon curent</div>
      <div style={S.chartWrap}>
        <canvas
          id="formaChart"
          role="img"
          aria-label="Grafic rating jucator per etapa"
        />
      </div>

      <div style={S.twoCol}>
        <div style={S.detailBlock}>
          <div style={S.sectionTitle}>Cele mai bune meciuri</div>
          <DetailRows
            rows={top3.map((r) => [
              `${r.matchday} · ${r.opponent} (${r.home ? "Acasă" : "Deplasare"})`,
              fmt1(r.rating),
            ])}
          />
        </div>
        <div style={S.detailBlock}>
          <div style={S.sectionTitle}>Medie rating pe faze</div>
          <DetailRows
            rows={[
              [`Tur (Et. 1–${half})`, fmt1(avgTur)],
              [`Retur (Et. ${half + 1}–${ratings.length})`, fmt1(avgRetur)],
              ["Medie generală", fmt1(avgGeneral)],
            ]}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── DETAIL ROWS ─────────────────────────────────────────────────────────── */

function DetailRows({ rows }) {
  return (
    <div style={S.detailRows}>
      {rows.map(([key, val], i) => (
        <div
          key={i}
          style={{
            ...S.detailRow,
            ...(i === rows.length - 1 ? { borderBottom: "none" } : {}),
          }}
        >
          <span style={S.detailKey}>{key}</span>
          <span style={S.detailVal}>{val ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── STYLES ──────────────────────────────────────────────────────────────── */

const S = {
  root: {
    display: "flex",
    height: "100%",
    width: "100%",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    background: "#fff",
    color: "#000",
    overflow: "hidden",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  pageHeader: {
    borderBottom: "1px solid #e5e5e5",
    padding: "16px 32px",
    flexShrink: 0,
    background: "#fff",
  },
  pageHeaderInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    background: "none",
    border: "1px solid #e5e5e5",
    borderRadius: 7,
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 16,
    color: "#000",
    flexShrink: 0,
    marginRight: 12,
  },
  pageTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#000",
    letterSpacing: "-0.4px",
  },
  pageSub: {
    margin: "3px 0 0",
    fontSize: 13,
    color: "#888",
    fontFamily: "inherit",
  },
  centerState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 8,
  },
  stateTitle: { fontSize: 16, fontWeight: 600, color: "#000" },
  stateSub: { fontSize: 13, color: "#888", textAlign: "center" },
  retryBtn: {
    marginTop: 8,
    padding: "8px 18px",
    border: "1px solid #e5e5e5",
    borderRadius: 7,
    background: "#fff",
    fontSize: 13,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  content: { flex: 1, overflowY: "auto", padding: 32 },

  /* Profile header */
  profileTop: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: 28,
    alignItems: "start",
    marginBottom: 32,
    paddingBottom: 28,
    borderBottom: "1px solid #e5e5e5",
  },
  avatarHero: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "#000",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    fontWeight: 700,
    flexShrink: 0,
  },
  playerMainInfo: { flex: 1 },
  playerFullName: {
    fontSize: 28,
    fontWeight: 700,
    color: "#000",
    letterSpacing: "-0.6px",
    marginBottom: 4,
  },
  posBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  posBadge: {
    background: "#000",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    letterSpacing: "0.4px",
  },
  playerClub: { fontSize: 14, color: "#888" },
  metaChips: { display: "flex", gap: 8, flexWrap: "wrap" },
  metaChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    border: "1px solid #e5e5e5",
    borderRadius: 7,
    fontSize: 12,
  },
  metaChipLabel: { color: "#888" },
  metaChipVal: { fontWeight: 600, color: "#000" },
  playerRightStats: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  marketVal: { textAlign: "right" },
  mvLabel: {
    fontSize: 11,
    color: "#888",
    letterSpacing: "0.3px",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  mvVal: {
    fontSize: 26,
    fontWeight: 700,
    color: "#000",
    letterSpacing: "-0.5px",
  },
  ratingOverall: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#000",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 8,
  },
  roLabel: { fontSize: 11, opacity: 0.6, letterSpacing: "0.4px" },
  roVal: { fontSize: 22, fontWeight: 700 },

  /* Tabs */
  tabs: {
    display: "flex",
    borderBottom: "1px solid #e5e5e5",
    marginBottom: 28,
  },
  tab: {
    padding: "10px 20px",
    border: "none",
    background: "none",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 500,
    color: "#888",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    marginBottom: -1,
  },
  tabActive: { color: "#000", borderBottomColor: "#000" },

  /* Stats grid */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    border: "1px solid #e5e5e5",
    borderRadius: 10,
    padding: "18px 20px",
  },
  statCardLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: 600,
    letterSpacing: "0.4px",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  statCardVal: {
    fontSize: 30,
    fontWeight: 700,
    color: "#000",
    letterSpacing: "-0.5px",
    lineHeight: 1,
  },
  statCardSub: { fontSize: 12, color: "#aaa", marginTop: 4 },

  /* Rating bars */
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#000",
    marginBottom: 12,
  },
  ratingBarGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 24,
  },
  ratingRow: { display: "flex", alignItems: "center", gap: 12 },
  ratingLbl: { fontSize: 12, color: "#888", width: 220, flexShrink: 0 },
  ratingBarWrap: {
    flex: 1,
    height: 6,
    background: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  ratingBarFill: { height: "100%", background: "#000", borderRadius: 3 },
  ratingNum: {
    fontSize: 12,
    fontWeight: 700,
    color: "#000",
    width: 36,
    textAlign: "right",
    flexShrink: 0,
  },

  /* Chart */
  chartWrap: {
    position: "relative",
    width: "100%",
    height: 320,
    marginBottom: 24,
  },

  /* Two col & detail blocks */
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  detailBlock: {
    border: "1px solid #e5e5e5",
    borderRadius: 10,
    padding: "18px 20px",
  },
  detailRows: { display: "flex", flexDirection: "column" },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "9px 0",
    borderBottom: "1px solid #f5f5f5",
    fontSize: 13,
  },
  detailKey: { color: "#888" },
  detailVal: { fontWeight: 600, color: "#000" },
};
