"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Hall of Fame Game — CAR vs ARI
 * Position-specific props for QB / RB / WR / TE / K / DEF
 */

type PropKey = string;

const YARD_THRESHOLDS = [15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100];
const PASS_YARD_THRESHOLDS = [150, 175, 200, 225, 250, 275, 300, 325, 350];
const RECEPTION_THRESHOLDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function yardProps(prefix: "rush" | "rec" | "pass", thresholds: number[]) {
  return thresholds.map((n) => ({
    key: `${prefix}_yds_${n}` as PropKey,
    label: `${prefix === "rush" ? "Rush" : prefix === "rec" ? "Rec" : "Pass"} Yds ${n}+`,
  }));
}

function receptionProps() {
  return RECEPTION_THRESHOLDS.map((n) => ({
    key: `receptions_${n}` as PropKey,
    label: `Receptions ${n}+`,
  }));
}

const QB_PROPS: { key: PropKey; label: string }[] = [
  ...yardProps("pass", PASS_YARD_THRESHOLDS),
  { key: "pass_td_0.5", label: "Pass TD 0.5+" },
  { key: "pass_td_1.5", label: "Pass TD 1.5+" },
  { key: "pass_td_2.5", label: "Pass TD 2.5+" },
  ...yardProps("rush", YARD_THRESHOLDS),
  { key: "rush_td_0.5", label: "Rush TD 0.5+" },
  { key: "anytime_td", label: "Anytime TD" },
];

const RB_PROPS: { key: PropKey; label: string }[] = [
  ...yardProps("rush", YARD_THRESHOLDS),
  { key: "rush_td_0.5", label: "Rush TD 0.5+" },
  ...yardProps("rec", YARD_THRESHOLDS),
  ...receptionProps(),
  { key: "anytime_td", label: "Anytime TD" },
];

const WR_TE_PROPS: { key: PropKey; label: string }[] = [
  ...yardProps("rec", YARD_THRESHOLDS),
  ...receptionProps(),
  { key: "anytime_td", label: "Anytime TD" },
];

const K_PROPS: { key: PropKey; label: string }[] = [
  { key: "fg_1.5", label: "FG Made 1.5+" },
  { key: "fg_2.5", label: "FG Made 2.5+" },
  { key: "k_points_6.5", label: "K Points 6.5+" },
  { key: "k_points_7.5", label: "K Points 7.5+" },
  { key: "k_points_9.5", label: "K Points 9.5+" },
  { key: "anytime_td", label: "Anytime TD" },
];

const DEF_PROPS: { key: PropKey; label: string }[] = [
  { key: "tackles_3.5", label: "Tackles 3.5+" },
  { key: "tackles_5.5", label: "Tackles 5.5+" },
  { key: "tackles_6.5", label: "Tackles 6.5+" },
  { key: "tackles_7.5", label: "Tackles 7.5+" },
  { key: "sacks_0.5", label: "Sacks 0.5+" },
  { key: "sacks_1.5", label: "Sacks 1.5+" },
  { key: "int_0.5", label: "INT 0.5+" },
  { key: "def_td_0.5", label: "Def / ST TD 0.5+" },
];

type Group = "offense" | "kicker" | "defense";

type Player = {
  id: string;
  name: string;
  pos: string;
  team: "CAR" | "ARI";
  group: Group;
};

const PLAYERS: Player[] = [
  { id: "car-qb1", name: "Bryce Young", pos: "QB", team: "CAR", group: "offense" },
  { id: "car-rb1", name: "Chuba Hubbard", pos: "RB", team: "CAR", group: "offense" },
  { id: "car-rb2", name: "Rico Dowdle", pos: "RB", team: "CAR", group: "offense" },
  { id: "car-wr1", name: "Tetairoa McMillan", pos: "WR", team: "CAR", group: "offense" },
  { id: "car-wr2", name: "Xavier Legette", pos: "WR", team: "CAR", group: "offense" },
  { id: "car-wr3", name: "Adam Thielen", pos: "WR", team: "CAR", group: "offense" },
  { id: "car-te1", name: "Tommy Tremble", pos: "TE", team: "CAR", group: "offense" },
  { id: "car-k1", name: "Eddy Pineiro", pos: "K", team: "CAR", group: "kicker" },
  { id: "car-lb1", name: "Shaq Thompson", pos: "LB", team: "CAR", group: "defense" },
  { id: "car-edge1", name: "Derrick Brown", pos: "DL", team: "CAR", group: "defense" },
  { id: "car-cb1", name: "Jaycee Horn", pos: "CB", team: "CAR", group: "defense" },
  { id: "ari-qb1", name: "Kyler Murray", pos: "QB", team: "ARI", group: "offense" },
  { id: "ari-rb1", name: "James Conner", pos: "RB", team: "ARI", group: "offense" },
  { id: "ari-rb2", name: "Trey Benson", pos: "RB", team: "ARI", group: "offense" },
  { id: "ari-wr1", name: "Marvin Harrison Jr.", pos: "WR", team: "ARI", group: "offense" },
  { id: "ari-wr2", name: "Trey McBride", pos: "TE", team: "ARI", group: "offense" },
  { id: "ari-wr3", name: "Michael Wilson", pos: "WR", team: "ARI", group: "offense" },
  { id: "ari-wr4", name: "Zay Jones", pos: "WR", team: "ARI", group: "offense" },
  { id: "ari-k1", name: "Chad Ryland", pos: "K", team: "ARI", group: "kicker" },
  { id: "ari-lb1", name: "Zaven Collins", pos: "LB", team: "ARI", group: "defense" },
  { id: "ari-edge1", name: "Josh Sweat", pos: "EDGE", team: "ARI", group: "defense" },
  { id: "ari-cb1", name: "Max Melton", pos: "CB", team: "ARI", group: "defense" },
];

type LineKind = "ml" | "spread" | "over" | "under" | "def_td";

type GameLine = {
  id: string;
  label: string;
  kind: LineKind;
  team?: "CAR" | "ARI";
  line: number;
};

const GAME_LINES: GameLine[] = [
  { id: "car-ml", label: "Carolina ML", kind: "ml", team: "CAR", line: 0 },
  { id: "ari-ml", label: "Arizona ML", kind: "ml", team: "ARI", line: 0 },
  { id: "over-35.5", label: "Over 35.5", kind: "over", line: 35.5 },
  { id: "under-35.5", label: "Under 35.5", kind: "under", line: 35.5 },
  { id: "car-spread", label: "Carolina -1.5", kind: "spread", team: "CAR", line: -1.5 },
  { id: "ari-spread", label: "Arizona +1.5", kind: "spread", team: "ARI", line: 1.5 },
  { id: "car-def-td", label: "CAR Def / ST TD", kind: "def_td", team: "CAR", line: 0.5 },
  { id: "ari-def-td", label: "ARI Def / ST TD", kind: "def_td", team: "ARI", line: 0.5 },
];

function propsFor(pos: string, group: Group) {
  if (group === "kicker") return K_PROPS;
  if (group === "defense") return DEF_PROPS;
  if (pos === "QB") return QB_PROPS;
  if (pos === "RB") return RB_PROPS;
  if (pos === "WR" || pos === "TE") return WR_TE_PROPS;
  return WR_TE_PROPS;
}

function defaultProp(pos: string, group: Group): PropKey {
  if (group === "kicker") return "fg_1.5";
  if (group === "defense") {
    if (pos === "CB") return "int_0.5";
    if (pos === "EDGE" || pos === "DL") return "sacks_0.5";
    return "tackles_5.5";
  }
  if (pos === "QB") return "pass_yds_225";
  if (pos === "RB") return "rush_yds_20";
  if (pos === "WR" || pos === "TE") return "rec_yds_20";
  return "anytime_td";
}

// Build label map for Prop Watch
const ALL_PROP_LABELS: Record<string, string> = {};
for (const list of [QB_PROPS, RB_PROPS, WR_TE_PROPS, K_PROPS, DEF_PROPS]) {
  for (const p of list) ALL_PROP_LABELS[p.key] = p.label;
}
if (typeof window !== "undefined") {
  try {
    localStorage.setItem("pp-nfl-prop-labels", JSON.stringify(ALL_PROP_LABELS));
  } catch {
    /* ignore */
  }
}

function lineProgress(
  line: GameLine,
  car: number,
  ari: number,
  final: boolean
): { pct: number; label: string; hit: boolean | null; color: string } {
  const total = car + ari;
  const margin = car - ari;

  if (line.kind === "over") {
    const need = Math.ceil(line.line);
    const pct = Math.min(100, Math.round((total / need) * 100));
    const hit = total > line.line;
    if (final) {
      return {
        pct: hit ? 100 : pct,
        label: hit ? `HIT · ${total} total` : `MISS · ${total} total (need > ${line.line})`,
        hit,
        color: hit ? "bg-emerald-500" : "bg-red-500",
      };
    }
    return {
      pct,
      label: `${total} pts · need > ${line.line}`,
      hit: hit ? true : null,
      color: hit ? "bg-emerald-500" : pct >= 70 ? "bg-amber-400" : "bg-cyan-500",
    };
  }

  if (line.kind === "under") {
    const pctUsed = Math.min(100, Math.round((total / line.line) * 100));
    const hit = total < line.line;
    if (final) {
      return {
        pct: hit ? 100 : pctUsed,
        label: hit ? `HIT · ${total} total` : `MISS · ${total} total`,
        hit,
        color: hit ? "bg-emerald-500" : "bg-red-500",
      };
    }
    const busted = total > line.line;
    const room = line.line - total;
    return {
      pct: busted ? 100 : pctUsed,
      label: busted
        ? `BUSTED · ${total} already over ${line.line}`
        : `${total} pts · ${room.toFixed(1)} under left`,
      hit: busted ? false : null,
      color: busted ? "bg-red-500" : pctUsed >= 85 ? "bg-amber-400" : "bg-cyan-500",
    };
  }

  if (line.kind === "ml" && line.team) {
    const winning = line.team === "CAR" ? margin > 0 : margin < 0;
    const tied = margin === 0;
    if (car === 0 && ari === 0 && !final) {
      return { pct: 0, label: "Pregame · waiting for kickoff", hit: null, color: "bg-zinc-600" };
    }
    if (final) {
      return {
        pct: winning ? 100 : 0,
        label: winning ? `HIT · ${line.team} wins` : `MISS · final ${car}–${ari}`,
        hit: winning,
        color: winning ? "bg-emerald-500" : "bg-red-500",
      };
    }
    return {
      pct: winning ? 70 : tied ? 35 : 15,
      label: tied
        ? `Tied ${car}–${ari}`
        : winning
        ? `${line.team} leading · ${car}–${ari}`
        : `${line.team} trailing · ${car}–${ari}`,
      hit: null,
      color: winning ? "bg-emerald-400" : tied ? "bg-amber-400" : "bg-red-400",
    };
  }

  if (line.kind === "spread" && line.team) {
    const carCovers = margin > 1.5;
    const ariCovers = -margin < 1.5;
    const covers = line.team === "CAR" ? carCovers : ariCovers;
    if (car === 0 && ari === 0 && !final) {
      return { pct: 0, label: "Pregame · waiting for kickoff", hit: null, color: "bg-zinc-600" };
    }
    if (final) {
      return {
        pct: covers ? 100 : 0,
        label: covers ? `HIT · covers · ${car}–${ari}` : `MISS · ${car}–${ari}`,
        hit: covers,
        color: covers ? "bg-emerald-500" : "bg-red-500",
      };
    }
    return {
      pct: covers ? 70 : 25,
      label: covers ? `Covering · ${car}–${ari}` : `Not covering · ${car}–${ari}`,
      hit: null,
      color: covers ? "bg-emerald-400" : "bg-amber-400",
    };
  }

  if (line.kind === "def_td") {
    return {
      pct: 0,
      label: "Track manually · Def / ST TD (no auto feed yet)",
      hit: null,
      color: "bg-zinc-600",
    };
  }

  return { pct: 0, label: "—", hit: null, color: "bg-zinc-600" };
}

export default function NflTrackerPage() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favProps, setFavProps] = useState<Record<string, PropKey>>({});
  const [lineFavs, setLineFavs] = useState<Set<string>>(new Set());
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [carScore, setCarScore] = useState(0);
  const [ariScore, setAriScore] = useState(0);
  const [isFinal, setIsFinal] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      localStorage.setItem("pp-nfl-prop-labels", JSON.stringify(ALL_PROP_LABELS));
      const f = localStorage.getItem("pp-nfl-favs");
      const p = localStorage.getItem("pp-nfl-fav-props");
      const l = localStorage.getItem("pp-nfl-line-favs");
      if (f) setFavorites(new Set(JSON.parse(f)));
      if (p) setFavProps(JSON.parse(p));
      if (l) setLineFavs(new Set(JSON.parse(l)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("pp-nfl-favs", JSON.stringify([...favorites]));
  }, [favorites, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("pp-nfl-fav-props", JSON.stringify(favProps));
  }, [favProps, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("pp-nfl-line-favs", JSON.stringify([...lineFavs]));
  }, [lineFavs, mounted]);

  // Persist score for Prop Watch bars
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      "pp-nfl-score",
      JSON.stringify({ car: carScore, ari: ariScore, final: isFinal })
    );
  }, [carScore, ariScore, isFinal, mounted]);

  function toggleFav(id: string, pos: string, group: Group) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        const d = defaultProp(pos, group);
        setFavProps((fp) => ({ ...fp, [id]: fp[id] || d }));
      }
      return next;
    });
  }

  function toggleLine(id: string) {
    setLineFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const favPlayers = PLAYERS.filter((p) => favorites.has(p.id));
  const other = showFavOnly ? [] : PLAYERS.filter((p) => !favorites.has(p.id));
  const trackedLines = GAME_LINES.filter((g) => lineFavs.has(g.id));

  function PlayerRow({ p, isFav }: { p: Player; isFav: boolean }) {
    const opts = propsFor(p.pos, p.group);
    const prop = favProps[p.id] || defaultProp(p.pos, p.group);
    // If stored prop isn't in current list (old pass_yds on RB), fall back
    const safeProp = opts.some((o) => o.key === prop) ? prop : defaultProp(p.pos, p.group);
    return (
      <div
        className={`flex flex-col gap-2 px-4 py-3 border-b border-zinc-800/80 last:border-0 ${
          isFav ? "bg-emerald-950/15" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleFav(p.id, p.pos, p.group)}
            className={`text-lg leading-none ${
              isFav ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {isFav ? "★" : "☆"}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">
              {p.name}{" "}
              <span className="text-xs text-zinc-500 font-normal">{p.pos}</span>
            </div>
            <div className="text-[11px] text-zinc-500">{p.team} · HOF Game</div>
          </div>
        </div>
        {isFav && (
          <div className="pl-8">
            <select
              value={safeProp}
              onChange={(e) =>
                setFavProps((fp) => ({ ...fp, [p.id]: e.target.value }))
              }
              className="bg-zinc-800 border border-zinc-700 rounded-md text-xs px-2 py-1 max-w-full"
            >
              {opts.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="mt-2 h-2 w-full rounded-full bg-zinc-800">
              <div className="h-full w-0 rounded-full bg-zinc-600" />
            </div>
            <div className="text-[10px] text-zinc-600 mt-1">
              Player prop bar fills when live stats are available
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-zinc-950 text-lg">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">ParlayPulse</h1>
                <p className="text-xs text-zinc-500">NFL Tracker</p>
              </div>
            </Link>
            <nav className="hidden md:flex gap-3 text-sm flex-wrap">
              <Link href="/" className="text-zinc-400 hover:text-white">Ticket Health</Link>
              <Link href="/save-the-unit" className="text-zinc-400 hover:text-white">Save the Unit</Link>
              <Link href="/pga-groupings" className="text-zinc-400 hover:text-white">PGA</Link>
              <Link href="/mlb-tracker" className="text-zinc-400 hover:text-white">MLB</Link>
              <Link href="/nfl-tracker" className="text-emerald-400 font-medium">NFL</Link>
              <Link href="/prop-watch" className="text-zinc-400 hover:text-white">Prop Watch</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Hall of Fame Game</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Carolina Panthers vs Arizona Cardinals · 8:00 PM ET · Canton, OH
              </p>
              <p className="text-xs text-zinc-600 mt-1">Line: CAR −1.5 · O/U 35.5</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showFavOnly}
                onChange={(e) => setShowFavOnly(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Favorites only
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-4 border-t border-zinc-800 pt-4">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">CAR score</label>
              <input
                type="number"
                min={0}
                value={carScore}
                onChange={(e) => setCarScore(Number(e.target.value) || 0)}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">ARI score</label>
              <input
                type="number"
                min={0}
                value={ariScore}
                onChange={(e) => setAriScore(Number(e.target.value) || 0)}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div className="text-sm font-mono text-zinc-300 pb-1.5">
              Total: {carScore + ariScore}
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-400 pb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFinal}
                onChange={(e) => setIsFinal(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Final
            </label>
            <p className="text-[10px] text-zinc-600 w-full">
              Score is manual for MVP — O/U bars use total points. Def / ST TD is a star-able team
              prop below.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-zinc-400 mb-2 px-1">Game lines</h3>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3 flex flex-wrap gap-2">
            {GAME_LINES.map((g) => {
              const on = lineFavs.has(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => toggleLine(g.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    on
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {on ? "★ " : "☆ "}
                  {g.label}
                </button>
              );
            })}
          </div>
        </section>

        {trackedLines.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-2 px-1">
              ★ Your game lines ({trackedLines.length})
            </h3>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/80">
              {trackedLines.map((line) => {
                const prog = lineProgress(line, carScore, ariScore, isFinal);
                return (
                  <div key={line.id} className="px-4 py-3 bg-emerald-950/10">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleLine(line.id)}
                          className="text-amber-400 text-lg leading-none"
                        >
                          ★
                        </button>
                        <span className="text-sm font-medium">{line.label}</span>
                      </div>
                      {prog.hit === true && (
                        <span className="text-xs font-semibold text-emerald-400">HIT</span>
                      )}
                      {prog.hit === false && (
                        <span className="text-xs font-semibold text-red-400">MISS</span>
                      )}
                    </div>
                    <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${prog.color}`}
                        style={{ width: `${Math.max(prog.pct, prog.pct > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1.5">{prog.label}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {favPlayers.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-2 px-1">
              ★ Your players ({favPlayers.length})
            </h3>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
              {favPlayers.map((p) => (
                <PlayerRow key={p.id} p={p} isFav />
              ))}
            </div>
          </section>
        )}

        {!showFavOnly && (
          <>
            <section>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2 px-1">
                Carolina · Offense / ST / Defense
              </h3>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
                {other
                  .filter((p) => p.team === "CAR")
                  .map((p) => (
                    <PlayerRow key={p.id} p={p} isFav={false} />
                  ))}
              </div>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2 px-1">
                Arizona · Offense / ST / Defense
              </h3>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
                {other
                  .filter((p) => p.team === "ARI")
                  .map((p) => (
                    <PlayerRow key={p.id} p={p} isFav={false} />
                  ))}
              </div>
            </section>
          </>
        )}

        <footer className="text-center text-xs text-zinc-600 pt-4 pb-6">
          Props are position-specific (RB = rush/rec, WR/TE = rec, QB = pass + rush + anytime TD).
          Star Def / ST TD under game lines. Favorites sync to Prop Watch.
        </footer>
      </main>
    </div>
  );
}
