"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type PropType =
  | "hits_0.5"
  | "hits_1.5"
  | "hits_2.5"
  | "hr_0.5"
  | "hr_1.5"
  | "tb_1.5"
  | "tb_2.5"
  | "tb_3.5"
  | "rbi_0.5"
  | "rbi_1.5"
  | "runs_0.5"
  | "runs_1.5"
  | "sb_0.5"
  | "k_3.5"
  | "k_4.5"
  | "k_5.5"
  | "k_6.5";

const PROP_OPTIONS: { key: PropType; label: string; target: number; stat: string }[] = [
  { key: "hits_0.5", label: "Hits 0.5+", target: 0.5, stat: "hits" },
  { key: "hits_1.5", label: "Hits 1.5+", target: 1.5, stat: "hits" },
  { key: "hits_2.5", label: "Hits 2.5+", target: 2.5, stat: "hits" },
  { key: "hr_0.5", label: "HR 0.5+", target: 0.5, stat: "homeRuns" },
  { key: "hr_1.5", label: "HR 1.5+", target: 1.5, stat: "homeRuns" },
  { key: "tb_1.5", label: "Total Bases 1.5+", target: 1.5, stat: "totalBases" },
  { key: "tb_2.5", label: "Total Bases 2.5+", target: 2.5, stat: "totalBases" },
  { key: "tb_3.5", label: "Total Bases 3.5+", target: 3.5, stat: "totalBases" },
  { key: "rbi_0.5", label: "RBI 0.5+", target: 0.5, stat: "rbi" },
  { key: "rbi_1.5", label: "RBI 1.5+", target: 1.5, stat: "rbi" },
  { key: "runs_0.5", label: "Runs 0.5+", target: 0.5, stat: "runs" },
  { key: "runs_1.5", label: "Runs 1.5+", target: 1.5, stat: "runs" },
  { key: "sb_0.5", label: "SB 0.5+", target: 0.5, stat: "stolenBases" },
  { key: "k_3.5", label: "Ks 3.5+", target: 3.5, stat: "strikeOuts" },
  { key: "k_4.5", label: "Ks 4.5+", target: 4.5, stat: "strikeOuts" },
  { key: "k_5.5", label: "Ks 5.5+", target: 5.5, stat: "strikeOuts" },
  { key: "k_6.5", label: "Ks 6.5+", target: 6.5, stat: "strikeOuts" },
];

type PlayerRow = {
  id: string; // gamePk-playerId
  gamePk: number;
  playerId: number;
  name: string;
  team: string;
  teamAbbr: string;
  position: string;
  isPitcher: boolean;
  opponent: string;
  gameStatus: string;
  inning?: string;
  // live stats
  hits: number;
  homeRuns: number;
  totalBases: number;
  rbi: number;
  runs: number;
  stolenBases: number;
  strikeOuts: number; // pitcher Ks or batter Ks
  atBats: number;
};

type FavConfig = {
  playerKey: string;
  prop: PropType;
};

function progressFor(player: PlayerRow, prop: PropType): { current: number; target: number; pct: number; hit: boolean; label: string } {
  const opt = PROP_OPTIONS.find((p) => p.key === prop)!;
  const current =
    opt.stat === "hits"
      ? player.hits
      : opt.stat === "homeRuns"
      ? player.homeRuns
      : opt.stat === "totalBases"
      ? player.totalBases
      : opt.stat === "rbi"
      ? player.rbi
      : opt.stat === "runs"
      ? player.runs
      : opt.stat === "stolenBases"
      ? player.stolenBases
      : player.strikeOuts;

  const target = opt.target;
  // For X.5 lines, need floor(target)+1 to clear
  const needed = Math.floor(target) + 1;
  const pct = Math.min(100, Math.round((current / needed) * 100));
  const hit = current >= needed;
  return { current, target, pct, hit, label: opt.label };
}

function barColor(pct: number, hit: boolean): string {
  if (hit) return "bg-emerald-500";
  if (pct >= 67) return "bg-emerald-400";
  if (pct >= 34) return "bg-amber-400";
  return "bg-red-500";
}

export default function MlbTrackerPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favProps, setFavProps] = useState<Record<string, PropType>>({});
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const f = localStorage.getItem("pp-mlb-favs");
      const p = localStorage.getItem("pp-mlb-fav-props");
      if (f) setFavorites(new Set(JSON.parse(f)));
      if (p) setFavProps(JSON.parse(p));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("pp-mlb-favs", JSON.stringify([...favorites]));
  }, [favorites, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("pp-mlb-fav-props", JSON.stringify(favProps));
  }, [favProps, mounted]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Today's schedule (US Eastern-ish — use local date)
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;

      const schedRes = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}&hydrate=team,linescore,probablePitcher`
      );
      if (!schedRes.ok) throw new Error("Failed to load schedule");
      const sched = await schedRes.json();
      const dates = sched.dates || [];
      const games: any[] = [];
      for (const day of dates) {
        for (const g of day.games || []) games.push(g);
      }

      const rows: PlayerRow[] = [];

      // Limit concurrent fetches
      for (const g of games) {
        const gamePk = g.gamePk;
        const status = g.status?.detailedState || g.status?.abstractGameState || "";
        const away = g.teams?.away?.team;
        const home = g.teams?.home?.team;
        const awayName = away?.name || "Away";
        const homeName = home?.name || "Home";
        const awayAbbr = away?.abbreviation || "AWY";
        const homeAbbr = home?.abbreviation || "HME";
        const inning =
          g.linescore?.currentInningOrdinal && g.linescore?.inningState
            ? `${g.linescore.inningState} ${g.linescore.currentInningOrdinal}`
            : undefined;

        try {
          const boxRes = await fetch(
            `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`
          );
          if (!boxRes.ok) continue;
          const box = await boxRes.json();

          for (const side of ["away", "home"] as const) {
            const teamData = box.teams?.[side];
            if (!teamData) continue;
            const teamName = side === "away" ? awayName : homeName;
            const teamAbbr = side === "away" ? awayAbbr : homeAbbr;
            const opponent = side === "away" ? homeName : awayName;
            const batters = teamData.batters || [];
            const pitchers = teamData.pitchers || [];
            const playersMap = teamData.players || {};

            // Batting order players
            for (const pid of batters) {
              const key = `ID${pid}`;
              const p = playersMap[key];
              if (!p) continue;
              const person = p.person;
              const stats = p.stats?.batting || {};
              const pos = p.position?.abbreviation || "";
              // Skip pitchers listed only as PH sometimes — still include if they have batting order
              rows.push({
                id: `${gamePk}-${pid}`,
                gamePk,
                playerId: pid,
                name: person?.fullName || "Unknown",
                team: teamName,
                teamAbbr,
                position: pos,
                isPitcher: false,
                opponent,
                gameStatus: status,
                inning,
                hits: Number(stats.hits) || 0,
                homeRuns: Number(stats.homeRuns) || 0,
                totalBases: Number(stats.totalBases) || 0,
                rbi: Number(stats.rbi) || 0,
                runs: Number(stats.runs) || 0,
                stolenBases: Number(stats.stolenBases) || 0,
                strikeOuts: Number(stats.strikeOuts) || 0,
                atBats: Number(stats.atBats) || 0,
              });
            }

            // Starting / active pitchers
            for (const pid of pitchers) {
              const key = `ID${pid}`;
              const p = playersMap[key];
              if (!p) continue;
              const person = p.person;
              const stats = p.stats?.pitching || {};
              // Avoid dup if already in batters (two-way)
              if (rows.some((r) => r.id === `${gamePk}-${pid}`)) {
                // enrich Ks on existing
                const existing = rows.find((r) => r.id === `${gamePk}-${pid}`);
                if (existing) {
                  existing.strikeOuts = Number(stats.strikeOuts) || existing.strikeOuts;
                  existing.isPitcher = true;
                }
                continue;
              }
              rows.push({
                id: `${gamePk}-${pid}`,
                gamePk,
                playerId: pid,
                name: person?.fullName || "Unknown",
                team: teamName,
                teamAbbr,
                position: "P",
                isPitcher: true,
                opponent,
                gameStatus: status,
                inning,
                hits: 0,
                homeRuns: 0,
                totalBases: 0,
                rbi: 0,
                runs: 0,
                stolenBases: 0,
                strikeOuts: Number(stats.strikeOuts) || 0,
                atBats: 0,
              });
            }
          }
        } catch {
          // game may not have boxscore yet — skip
        }
      }

      setPlayers(rows);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to load MLB data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 90_000); // refresh ~90s
    return () => clearInterval(t);
  }, [load]);

  function toggleFav(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        if (!favProps[id]) {
          setFavProps((fp) => ({ ...fp, [id]: "hits_0.5" }));
        }
      }
      return next;
    });
  }

  function setProp(id: string, prop: PropType) {
    setFavProps((prev) => ({ ...prev, [id]: prop }));
  }

  const favPlayers = players.filter((p) => favorites.has(p.id));
  const otherPlayers = showFavOnly
    ? []
    : players.filter((p) => !favorites.has(p.id));

  // Group others by game for readability
  const byGame = new Map<number, PlayerRow[]>();
  for (const p of otherPlayers) {
    if (!byGame.has(p.gamePk)) byGame.set(p.gamePk, []);
    byGame.get(p.gamePk)!.push(p);
  }

  function PlayerCard({ p, isFav }: { p: PlayerRow; isFav: boolean }) {
    const prop = favProps[p.id] || "hits_0.5";
    const prog = isFav ? progressFor(p, prop) : null;
    const pitcherProps = PROP_OPTIONS.filter((o) => o.stat === "strikeOuts");
    const batterProps = PROP_OPTIONS.filter((o) => o.stat !== "strikeOuts");
    const options = p.isPitcher ? pitcherProps : batterProps;

    return (
      <div
        className={`flex flex-col gap-2 px-4 py-3 border-b border-zinc-800/80 last:border-0 ${
          isFav ? "bg-emerald-950/15" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleFav(p.id)}
            className={`text-lg leading-none shrink-0 ${
              isFav ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"
            }`}
            title={isFav ? "Unfavorite" : "Favorite"}
          >
            {isFav ? "★" : "☆"}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {p.name}{" "}
              <span className="text-zinc-500 font-normal text-xs">{p.position}</span>
            </div>
            <div className="text-[11px] text-zinc-500 truncate">
              {p.teamAbbr} vs {p.opponent.split(" ").slice(-1)[0]} · {p.gameStatus}
              {p.inning ? ` · ${p.inning}` : ""}
            </div>
          </div>
          {!isFav && (
            <div className="text-[11px] text-zinc-500 font-mono shrink-0">
              {p.isPitcher ? `${p.strikeOuts} K` : `${p.hits} H · ${p.homeRuns} HR`}
            </div>
          )}
        </div>

        {isFav && prog && (
          <div className="pl-8 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={prop}
                onChange={(e) => setProp(p.id, e.target.value as PropType)}
                className="bg-zinc-800 border border-zinc-700 rounded-md text-xs px-2 py-1"
              >
                {options.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-zinc-400">
                {prog.current} / need {Math.floor(prog.target) + 1}
                {prog.hit && (
                  <span className="ml-1 text-emerald-400 font-semibold">HIT</span>
                )}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor(
                  prog.pct,
                  prog.hit
                )}`}
                style={{ width: `${prog.hit ? 100 : prog.pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-zinc-950 text-lg">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">ParlayPulse</h1>
                <p className="text-xs text-zinc-500">MLB Player Tracker</p>
              </div>
            </Link>
            <nav className="hidden sm:flex gap-4 text-sm">
              <Link href="/" className="text-zinc-400 hover:text-white transition">
                Ticket Health
              </Link>
              <Link href="/save-the-unit" className="text-zinc-400 hover:text-white transition">
                Save the Unit
              </Link>
              <Link href="/pga-groupings" className="text-zinc-400 hover:text-white transition">
                PGA Groupings
              </Link>
              <Link href="/mlb-tracker" className="text-emerald-400 font-medium">
                MLB Tracker
              </Link>
            </nav>
          </div>
          <div className="text-right text-xs text-zinc-500">
            {lastUpdated && <div>Updated: {lastUpdated.toLocaleTimeString()}</div>}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">MLB Player Tracker</h2>
              <p className="text-sm text-zinc-400 mt-1 max-w-xl">
                Star players from today&apos;s lineups. Pick the prop you&apos;re on and watch the
                live progress bar fill as the game goes.
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <button
                onClick={load}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                {loading ? "Refreshing…" : "Refresh now"}
              </button>
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
          </div>
          {error && (
            <div className="mt-4 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </section>

        {/* Favorites */}
        {favPlayers.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-amber-400 mb-2 px-1">
              ★ Your players ({favPlayers.length})
            </h3>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
              {favPlayers.map((p) => (
                <PlayerCard key={p.id} p={p} isFav />
              ))}
            </div>
          </section>
        )}

        {/* Rest of field by game */}
        {!showFavOnly &&
          Array.from(byGame.entries()).map(([gamePk, list]) => {
            const sample = list[0];
            const title = sample
              ? `${sample.teamAbbr} game · ${sample.gameStatus}${
                  sample.inning ? ` · ${sample.inning}` : ""
                }`
              : `Game ${gamePk}`;
            // Better title from first away/home
            const teams = [...new Set(list.map((p) => p.teamAbbr))];
            const header =
              teams.length >= 2
                ? `${teams[0]} @ ${teams[1]} · ${sample?.gameStatus || ""}${
                    sample?.inning ? ` · ${sample.inning}` : ""
                  }`
                : title;

            return (
              <section key={gamePk}>
                <h3 className="text-sm font-semibold text-zinc-400 mb-2 px-1">{header}</h3>
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
                  {list.map((p) => (
                    <PlayerCard key={p.id} p={p} isFav={false} />
                  ))}
                </div>
              </section>
            );
          })}

        {!loading && players.length === 0 && !error && (
          <div className="text-center text-zinc-500 py-12">
            No MLB games / boxscores available for today yet.
          </div>
        )}

        <footer className="text-center text-xs text-zinc-600 pt-4 pb-6">
          Live stats from MLB Stats API. Props are for tracking only — not betting advice.
          Auto-refreshes about every 90 seconds.
        </footer>
      </main>
    </div>
  );
}
