"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Hall of Fame Game — Aug 6, 2026
 * Carolina Panthers vs Arizona Cardinals · 8:00 PM ET · Canton, OH
 * Player lists are skill-position focused for prop tracking (preseason depth varies).
 * Live stat bars can be wired later; structure + favorites work now.
 */

type PropKey =
  | "pass_yds_225.5"
  | "pass_td_1.5"
  | "rush_yds_45.5"
  | "rush_yds_55.5"
  | "rush_td_0.5"
  | "rec_yds_35.5"
  | "rec_yds_45.5"
  | "rec_yds_55.5"
  | "receptions_3.5"
  | "receptions_4.5"
  | "anytime_td"
  | "fg_1.5"
  | "k_points_7.5"
  | "tackles_5.5"
  | "tackles_6.5"
  | "sacks_0.5"
  | "int_0.5"
  | "def_td_0.5";

const OFFENSE_PROPS: { key: PropKey; label: string }[] = [
  { key: "pass_yds_225.5", label: "Pass Yds 225.5+" },
  { key: "pass_td_1.5", label: "Pass TD 1.5+" },
  { key: "rush_yds_45.5", label: "Rush Yds 45.5+" },
  { key: "rush_yds_55.5", label: "Rush Yds 55.5+" },
  { key: "rush_td_0.5", label: "Rush TD 0.5+" },
  { key: "rec_yds_35.5", label: "Rec Yds 35.5+" },
  { key: "rec_yds_45.5", label: "Rec Yds 45.5+" },
  { key: "rec_yds_55.5", label: "Rec Yds 55.5+" },
  { key: "receptions_3.5", label: "Receptions 3.5+" },
  { key: "receptions_4.5", label: "Receptions 4.5+" },
  { key: "anytime_td", label: "Anytime TD" },
];

const K_PROPS: { key: PropKey; label: string }[] = [
  { key: "fg_1.5", label: "FG Made 1.5+" },
  { key: "k_points_7.5", label: "K Points 7.5+" },
  { key: "anytime_td", label: "Anytime TD" },
];

const DEF_PROPS: { key: PropKey; label: string }[] = [
  { key: "tackles_5.5", label: "Tackles 5.5+" },
  { key: "tackles_6.5", label: "Tackles 6.5+" },
  { key: "sacks_0.5", label: "Sacks 0.5+" },
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
  // Carolina — offense
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
  // Arizona — offense
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

const GAME_LINES = [
  { id: "car-ml", label: "Carolina ML", team: "CAR" },
  { id: "ari-ml", label: "Arizona ML", team: "ARI" },
  { id: "over-35.5", label: "Over 35.5", team: "TOT" },
  { id: "under-35.5", label: "Under 35.5", team: "TOT" },
  { id: "car-spread", label: "Carolina -1.5", team: "CAR" },
  { id: "ari-spread", label: "Arizona +1.5", team: "ARI" },
];

function propsFor(group: Group) {
  if (group === "kicker") return K_PROPS;
  if (group === "defense") return DEF_PROPS;
  return OFFENSE_PROPS;
}

export default function NflTrackerPage() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favProps, setFavProps] = useState<Record<string, PropKey>>({});
  const [lineFavs, setLineFavs] = useState<Set<string>>(new Set());
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
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

  function toggleFav(id: string, group: Group) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        if (!favProps[id]) {
          const defaults = propsFor(group);
          setFavProps((fp) => ({ ...fp, [id]: defaults[0].key }));
        }
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

  function PlayerRow({ p, isFav }: { p: Player; isFav: boolean }) {
    const opts = propsFor(p.group);
    const prop = favProps[p.id] || opts[0].key;
    return (
      <div
        className={`flex flex-col gap-2 px-4 py-3 border-b border-zinc-800/80 last:border-0 ${
          isFav ? "bg-emerald-950/15" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleFav(p.id, p.group)}
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
              value={prop}
              onChange={(e) =>
                setFavProps((fp) => ({ ...fp, [p.id]: e.target.value as PropKey }))
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
              <div className="h-full w-0 rounded-full bg-zinc-600" title="Live stats after kickoff" />
            </div>
            <div className="text-[10px] text-zinc-600 mt-1">
              Progress bar fills when live stats are available
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
              <p className="text-xs text-zinc-600 mt-1">
                Line: CAR −1.5 · O/U 35.5 (pregame reference)
              </p>
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
        </section>

        {/* Game lines */}
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
              <h3 className="text-sm font-semibold text-zinc-400 mb-2 px-1">Carolina · Offense / ST / Defense</h3>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
                {other.filter((p) => p.team === "CAR").map((p) => (
                  <PlayerRow key={p.id} p={p} isFav={false} />
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2 px-1">Arizona · Offense / ST / Defense</h3>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
                {other.filter((p) => p.team === "ARI").map((p) => (
                  <PlayerRow key={p.id} p={p} isFav={false} />
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="text-center text-xs text-zinc-600 pt-4 pb-6">
          Preseason depth charts change — star who you&apos;re on. Live stat bars come after kickoff wiring.
          Favorites sync to Prop Watch.
        </footer>
      </main>
    </div>
  );
}
