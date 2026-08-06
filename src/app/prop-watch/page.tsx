"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Master Prop Watch — favorites across sports + progress bars where possible.
 */

type WatchItem = {
  id: string;
  sport: "MLB" | "NFL" | "PGA" | "LINE";
  title: string;
  subtitle: string;
  propLabel?: string;
  href: string;
  pct?: number;
  barLabel?: string;
  hit?: boolean | null;
  color?: string;
};

const NFL_NAMES: Record<string, string> = {
  "car-qb1": "Bryce Young",
  "car-rb1": "Chuba Hubbard",
  "car-rb2": "Rico Dowdle",
  "car-wr1": "Tetairoa McMillan",
  "car-wr2": "Xavier Legette",
  "car-wr3": "Adam Thielen",
  "car-te1": "Tommy Tremble",
  "car-k1": "Eddy Pineiro",
  "car-lb1": "Shaq Thompson",
  "car-edge1": "Derrick Brown",
  "car-cb1": "Jaycee Horn",
  "ari-qb1": "Kyler Murray",
  "ari-rb1": "James Conner",
  "ari-rb2": "Trey Benson",
  "ari-wr1": "Marvin Harrison Jr.",
  "ari-wr2": "Trey McBride",
  "ari-wr3": "Michael Wilson",
  "ari-wr4": "Zay Jones",
  "ari-k1": "Chad Ryland",
  "ari-lb1": "Zaven Collins",
  "ari-edge1": "Josh Sweat",
  "ari-cb1": "Max Melton",
};

const LINE_LABELS: Record<string, string> = {
  "car-ml": "Carolina ML",
  "ari-ml": "Arizona ML",
  "over-35.5": "Over 35.5",
  "under-35.5": "Under 35.5",
  "car-spread": "Carolina -1.5",
  "ari-spread": "Arizona +1.5",
  "car-def-td": "CAR Def / ST TD",
  "ari-def-td": "ARI Def / ST TD",
};

const MLB_PROP_LABELS: Record<string, string> = {
  "hits_0.5": "Hits 0.5+",
  "hits_1.5": "Hits 1.5+",
  "hits_2.5": "Hits 2.5+",
  "hr_0.5": "HR 0.5+",
  "hr_1.5": "HR 1.5+",
  "tb_1.5": "TB 1.5+",
  "tb_2.5": "TB 2.5+",
  "tb_3.5": "TB 3.5+",
  "rbi_0.5": "RBI 0.5+",
  "rbi_1.5": "RBI 1.5+",
  "runs_0.5": "Runs 0.5+",
  "runs_1.5": "Runs 1.5+",
  "sb_0.5": "SB 0.5+",
  "k_3.5": "Ks 3.5+",
  "k_4.5": "Ks 4.5+",
  "k_5.5": "Ks 5.5+",
  "k_6.5": "Ks 6.5+",
};

const PGA_NAMES: Record<string, string> = {
  hossler: "Beau Hossler",
  schmid: "Matti Schmid",
  jsmith: "Jordan Smith",
  jthomas: "Justin Thomas",
  theegala: "Sahith Theegala",
  matsuyama: "Hideki Matsuyama",
  spieth: "Jordan Spieth",
  // ids from groupings page — extend as needed
};

function mlbProgress(
  prop: string,
  meta: {
    hits: number;
    homeRuns: number;
    totalBases: number;
    rbi: number;
    runs: number;
    stolenBases: number;
    strikeOuts: number;
  }
): { pct: number; label: string; hit: boolean; color: string } {
  const map: Record<string, { cur: number; need: number }> = {
    "hits_0.5": { cur: meta.hits, need: 1 },
    "hits_1.5": { cur: meta.hits, need: 2 },
    "hits_2.5": { cur: meta.hits, need: 3 },
    "hr_0.5": { cur: meta.homeRuns, need: 1 },
    "hr_1.5": { cur: meta.homeRuns, need: 2 },
    "tb_1.5": { cur: meta.totalBases, need: 2 },
    "tb_2.5": { cur: meta.totalBases, need: 3 },
    "tb_3.5": { cur: meta.totalBases, need: 4 },
    "rbi_0.5": { cur: meta.rbi, need: 1 },
    "rbi_1.5": { cur: meta.rbi, need: 2 },
    "runs_0.5": { cur: meta.runs, need: 1 },
    "runs_1.5": { cur: meta.runs, need: 2 },
    "sb_0.5": { cur: meta.stolenBases, need: 1 },
    "k_3.5": { cur: meta.strikeOuts, need: 4 },
    "k_4.5": { cur: meta.strikeOuts, need: 5 },
    "k_5.5": { cur: meta.strikeOuts, need: 6 },
    "k_6.5": { cur: meta.strikeOuts, need: 7 },
  };
  const m = map[prop] || { cur: 0, need: 1 };
  const hit = m.cur >= m.need;
  const pct = Math.min(100, Math.round((m.cur / m.need) * 100));
  const color = hit ? "bg-emerald-500" : pct >= 67 ? "bg-emerald-400" : pct >= 34 ? "bg-amber-400" : "bg-red-500";
  return {
    pct: hit ? 100 : pct,
    label: `${m.cur} / need ${m.need}${hit ? " · HIT" : ""}`,
    hit,
    color,
  };
}

function lineBar(
  id: string,
  car: number,
  ari: number,
  final: boolean
): { pct: number; label: string; hit: boolean | null; color: string } {
  const total = car + ari;
  const margin = car - ari;
  if (id === "over-35.5") {
    const need = 36;
    const pct = Math.min(100, Math.round((total / need) * 100));
    const hit = total > 35.5;
    return {
      pct: hit ? 100 : pct,
      label: `${total} pts · need > 35.5`,
      hit: final ? hit : hit ? true : null,
      color: hit ? "bg-emerald-500" : pct >= 70 ? "bg-amber-400" : "bg-cyan-500",
    };
  }
  if (id === "under-35.5") {
    const pctUsed = Math.min(100, Math.round((total / 35.5) * 100));
    const busted = total > 35.5;
    const hit = total < 35.5;
    return {
      pct: busted ? 100 : pctUsed,
      label: busted ? `BUSTED · ${total}` : `${total} pts · under 35.5`,
      hit: final ? hit : busted ? false : null,
      color: busted ? "bg-red-500" : pctUsed >= 85 ? "bg-amber-400" : "bg-cyan-500",
    };
  }
  if (id === "car-ml" || id === "ari-ml") {
    const team = id.startsWith("car") ? "CAR" : "ARI";
    const winning = team === "CAR" ? margin > 0 : margin < 0;
    if (car === 0 && ari === 0)
      return { pct: 0, label: "Pregame", hit: null, color: "bg-zinc-600" };
    return {
      pct: winning ? 70 : 20,
      label: `${car}–${ari}`,
      hit: final ? winning : null,
      color: winning ? "bg-emerald-400" : "bg-red-400",
    };
  }
  if (id.includes("spread")) {
    const carCovers = margin > 1.5;
    const ariCovers = -margin < 1.5;
    const covers = id.startsWith("car") ? carCovers : ariCovers;
    if (car === 0 && ari === 0)
      return { pct: 0, label: "Pregame", hit: null, color: "bg-zinc-600" };
    return {
      pct: covers ? 70 : 25,
      label: `${car}–${ari}`,
      hit: final ? covers : null,
      color: covers ? "bg-emerald-400" : "bg-amber-400",
    };
  }
  return { pct: 0, label: "Manual track", hit: null, color: "bg-zinc-600" };
}

export default function PropWatchPage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const list: WatchItem[] = [];

    try {
      const nflPropLabels: Record<string, string> = JSON.parse(
        localStorage.getItem("pp-nfl-prop-labels") || "{}"
      );
      const nflFavs: string[] = JSON.parse(localStorage.getItem("pp-nfl-favs") || "[]");
      const nflProps: Record<string, string> = JSON.parse(
        localStorage.getItem("pp-nfl-fav-props") || "{}"
      );
      for (const id of nflFavs) {
        const prop = nflProps[id];
        list.push({
          id: `nfl-${id}`,
          sport: "NFL",
          title: NFL_NAMES[id] || id,
          subtitle: "Hall of Fame Game · CAR vs ARI",
          propLabel:
            nflPropLabels[prop] ||
            prop?.replace(/_/g, " ") ||
            "Prop on NFL page",
          href: "/nfl-tracker",
          pct: 0,
          barLabel: "Live player stats after kickoff feed",
          color: "bg-zinc-600",
        });
      }

      const lineFavs: string[] = JSON.parse(localStorage.getItem("pp-nfl-line-favs") || "[]");
      const score = JSON.parse(localStorage.getItem("pp-nfl-score") || '{"car":0,"ari":0,"final":false}');
      for (const id of lineFavs) {
        const bar = lineBar(id, score.car || 0, score.ari || 0, !!score.final);
        list.push({
          id: `line-${id}`,
          sport: "LINE",
          title: LINE_LABELS[id] || id,
          subtitle: "NFL · CAR vs ARI game line",
          href: "/nfl-tracker",
          pct: bar.pct,
          barLabel: bar.label,
          hit: bar.hit,
          color: bar.color,
        });
      }

      const mlbFavs: string[] = JSON.parse(localStorage.getItem("pp-mlb-favs") || "[]");
      const mlbProps: Record<string, string> = JSON.parse(
        localStorage.getItem("pp-mlb-fav-props") || "{}"
      );
      const mlbMeta: Record<
        string,
        {
          name: string;
          team: string;
          opponent: string;
          hits: number;
          homeRuns: number;
          totalBases: number;
          rbi: number;
          runs: number;
          stolenBases: number;
          strikeOuts: number;
        }
      > = JSON.parse(localStorage.getItem("pp-mlb-fav-meta") || "{}");

      for (const id of mlbFavs) {
        const meta = mlbMeta[id];
        const prop = mlbProps[id] || "hits_0.5";
        const prog = meta
          ? mlbProgress(prop, meta)
          : { pct: 0, label: "Open MLB Tracker to refresh", hit: null as boolean | null, color: "bg-zinc-600" };
        list.push({
          id: `mlb-${id}`,
          sport: "MLB",
          title: meta?.name || `Player ${id.split("-").pop()}`,
          subtitle: meta
            ? `${meta.team} vs ${meta.opponent.split(" ").slice(-1)[0]}`
            : "Open MLB Tracker for live name + progress bar",
          propLabel: MLB_PROP_LABELS[prop] || prop,
          href: "/mlb-tracker",
          pct: prog.pct,
          barLabel: prog.label,
          hit: prog.hit,
          color: prog.color,
        });
      }

      const golfFavs: string[] = JSON.parse(localStorage.getItem("pp-golf-favs") || "[]");
      for (const id of golfFavs) {
        list.push({
          id: `pga-${id}`,
          sport: "PGA",
          title: PGA_NAMES[id] || `Golfer ${id}`,
          subtitle: "Open PGA Groupings for score / thru",
          href: "/pga-groupings",
        });
      }

      setItems(list);

      // Live-enrich MLB favorites from Stats API (names + bars)
      if (mlbFavs.length) {
        (async () => {
          try {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            const schedRes = await fetch(
              `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}`
            );
            if (!schedRes.ok) return;
            const sched = await schedRes.json();
            const games: any[] = [];
            for (const day of sched.dates || []) {
              for (const g of day.games || []) games.push(g);
            }
            const byId: Record<string, any> = {};
            for (const g of games) {
              try {
                const boxRes = await fetch(
                  `https://statsapi.mlb.com/api/v1/game/${g.gamePk}/boxscore`
                );
                if (!boxRes.ok) continue;
                const box = await boxRes.json();
                const away = g.teams?.away?.team;
                const home = g.teams?.home?.team;
                for (const side of ["away", "home"] as const) {
                  const teamData = box.teams?.[side];
                  if (!teamData) continue;
                  const teamAbbr =
                    side === "away"
                      ? away?.abbreviation || "AWY"
                      : home?.abbreviation || "HME";
                  const opponent =
                    side === "away" ? home?.name || "Home" : away?.name || "Away";
                  const playersMap = teamData.players || {};
                  for (const key of Object.keys(playersMap)) {
                    const pl = playersMap[key];
                    const pid = pl?.person?.id;
                    if (!pid) continue;
                    const fullId = `${g.gamePk}-${pid}`;
                    const batting = pl.stats?.batting || {};
                    const pitching = pl.stats?.pitching || {};
                    byId[fullId] = {
                      name: pl.person?.fullName || `Player ${pid}`,
                      team: teamAbbr,
                      opponent,
                      hits: Number(batting.hits) || 0,
                      homeRuns: Number(batting.homeRuns) || 0,
                      totalBases: Number(batting.totalBases) || 0,
                      rbi: Number(batting.rbi) || 0,
                      runs: Number(batting.runs) || 0,
                      stolenBases: Number(batting.stolenBases) || 0,
                      strikeOuts:
                        Number(pitching.strikeOuts) ||
                        Number(batting.strikeOuts) ||
                        0,
                    };
                  }
                }
              } catch {
                /* skip game */
              }
            }
            // persist meta for next visit
            try {
              const existing = JSON.parse(
                localStorage.getItem("pp-mlb-fav-meta") || "{}"
              );
              for (const id of mlbFavs) {
                if (byId[id]) existing[id] = byId[id];
              }
              localStorage.setItem("pp-mlb-fav-meta", JSON.stringify(existing));
            } catch {
              /* ignore */
            }
            setItems((prev) =>
              prev.map((item) => {
                if (item.sport !== "MLB") return item;
                const rawId = item.id.replace(/^mlb-/, "");
                const meta = byId[rawId];
                if (!meta) return item;
                const prop =
                  JSON.parse(localStorage.getItem("pp-mlb-fav-props") || "{}")[
                    rawId
                  ] || "hits_0.5";
                const prog = mlbProgress(prop, meta);
                return {
                  ...item,
                  title: meta.name,
                  subtitle: `${meta.team} vs ${meta.opponent.split(" ").slice(-1)[0]}`,
                  pct: prog.pct,
                  barLabel: prog.label,
                  hit: prog.hit,
                  color: prog.color,
                };
              })
            );
          } catch {
            /* ignore live enrich errors */
          }
        })();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const bySport = {
    NFL: items.filter((i) => i.sport === "NFL"),
    LINE: items.filter((i) => i.sport === "LINE"),
    MLB: items.filter((i) => i.sport === "MLB"),
    PGA: items.filter((i) => i.sport === "PGA"),
  };

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
                <p className="text-xs text-zinc-500">Prop Watch</p>
              </div>
            </Link>
            <nav className="hidden md:flex gap-3 text-sm flex-wrap">
              <Link href="/" className="text-zinc-400 hover:text-white">Ticket Health</Link>
              <Link href="/save-the-unit" className="text-zinc-400 hover:text-white">Save the Unit</Link>
              <Link href="/pga-groupings" className="text-zinc-400 hover:text-white">PGA</Link>
              <Link href="/mlb-tracker" className="text-zinc-400 hover:text-white">MLB</Link>
              <Link href="/nfl-tracker" className="text-zinc-400 hover:text-white">NFL</Link>
              <Link href="/prop-watch" className="text-emerald-400 font-medium">Prop Watch</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold">Multi-Sport Prop Watch</h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Everything you&apos;ve starred — with progress bars for MLB stats and NFL game lines.
            Refresh sport pages to keep bars current.
          </p>
        </section>

        {mounted && items.length === 0 && (
          <div className="text-center text-zinc-500 py-16 space-y-3">
            <p>No favorites yet.</p>
            <p className="text-sm">
              Star players on{" "}
              <Link href="/mlb-tracker" className="text-emerald-400">MLB</Link>,{" "}
              <Link href="/nfl-tracker" className="text-emerald-400">NFL</Link>, or{" "}
              <Link href="/pga-groupings" className="text-emerald-400">PGA</Link>.
            </p>
          </div>
        )}

        {(["NFL", "LINE", "MLB", "PGA"] as const).map((sport) => {
          const rows = bySport[sport];
          if (rows.length === 0) return null;
          return (
            <section key={sport}>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2 px-1">
                {sport === "LINE" ? "Game lines" : sport} ({rows.length})
              </h3>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/80">
                {rows.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block px-4 py-3 hover:bg-zinc-800/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                        {item.sport}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-2">
                          {item.title}
                          {item.hit === true && (
                            <span className="text-[10px] text-emerald-400 font-semibold">HIT</span>
                          )}
                          {item.hit === false && (
                            <span className="text-[10px] text-red-400 font-semibold">MISS</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">{item.subtitle}</div>
                        {item.propLabel && (
                          <div className="text-xs text-emerald-400/90 mt-0.5">{item.propLabel}</div>
                        )}
                      </div>
                      <span className="text-zinc-600 text-sm">→</span>
                    </div>
                    {typeof item.pct === "number" && (
                      <div className="mt-2 ml-13 pl-[52px]">
                        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${item.color || "bg-cyan-500"}`}
                            style={{
                              width: `${Math.max(item.pct, item.pct > 0 ? 4 : 0)}%`,
                            }}
                          />
                        </div>
                        {item.barLabel && (
                          <div className="text-[10px] text-zinc-500 mt-1">{item.barLabel}</div>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <footer className="text-center text-xs text-zinc-600 pt-4 pb-6">
          MLB bars use last stats from MLB Tracker. Visit MLB Tracker to refresh names/stats, then
          reopen Prop Watch.
        </footer>
      </main>
    </div>
  );
}
