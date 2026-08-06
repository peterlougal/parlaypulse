"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Master Prop Watch — reads favorites from localStorage across sports pages.
 * Keys used elsewhere:
 *  - pp-mlb-favs, pp-mlb-fav-props
 *  - pp-nfl-favs, pp-nfl-fav-props, pp-nfl-line-favs
 *  - pp-golf-favs
 */

type WatchItem = {
  id: string;
  sport: "MLB" | "NFL" | "PGA" | "LINE";
  title: string;
  subtitle: string;
  propLabel?: string;
  href: string;
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

const NFL_PROP_LABELS: Record<string, string> = {
  "pass_yds_225.5": "Pass Yds 225.5+",
  "pass_td_1.5": "Pass TD 1.5+",
  "rush_yds_45.5": "Rush Yds 45.5+",
  "rush_yds_55.5": "Rush Yds 55.5+",
  "rush_td_0.5": "Rush TD 0.5+",
  "rec_yds_35.5": "Rec Yds 35.5+",
  "rec_yds_45.5": "Rec Yds 45.5+",
  "rec_yds_55.5": "Rec Yds 55.5+",
  "receptions_3.5": "Receptions 3.5+",
  "receptions_4.5": "Receptions 4.5+",
  anytime_td: "Anytime TD",
  "fg_1.5": "FG Made 1.5+",
  "k_points_7.5": "K Points 7.5+",
  "tackles_5.5": "Tackles 5.5+",
  "tackles_6.5": "Tackles 6.5+",
  "sacks_0.5": "Sacks 0.5+",
  "int_0.5": "INT 0.5+",
  "def_td_0.5": "Def / ST TD 0.5+",
};

const LINE_LABELS: Record<string, string> = {
  "car-ml": "Carolina ML",
  "ari-ml": "Arizona ML",
  "over-35.5": "Over 35.5",
  "under-35.5": "Under 35.5",
  "car-spread": "Carolina -1.5",
  "ari-spread": "Arizona +1.5",
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

export default function PropWatchPage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const list: WatchItem[] = [];

    try {
      // NFL players
      const nflFavs: string[] = JSON.parse(localStorage.getItem("pp-nfl-favs") || "[]");
      const nflProps: Record<string, string> = JSON.parse(
        localStorage.getItem("pp-nfl-fav-props") || "{}"
      );
      for (const id of nflFavs) {
        list.push({
          id: `nfl-${id}`,
          sport: "NFL",
          title: NFL_NAMES[id] || id,
          subtitle: "Hall of Fame Game · CAR vs ARI",
          propLabel: NFL_PROP_LABELS[nflProps[id]] || nflProps[id] || "Prop selected on NFL page",
          href: "/nfl-tracker",
        });
      }

      // NFL lines
      const lineFavs: string[] = JSON.parse(localStorage.getItem("pp-nfl-line-favs") || "[]");
      for (const id of lineFavs) {
        list.push({
          id: `line-${id}`,
          sport: "LINE",
          title: LINE_LABELS[id] || id,
          subtitle: "NFL · CAR vs ARI game line",
          href: "/nfl-tracker",
        });
      }

      // MLB — we only store ids; names require live reload. Show keys + link back.
      const mlbFavs: string[] = JSON.parse(localStorage.getItem("pp-mlb-favs") || "[]");
      const mlbProps: Record<string, string> = JSON.parse(
        localStorage.getItem("pp-mlb-fav-props") || "{}"
      );
      for (const id of mlbFavs) {
        list.push({
          id: `mlb-${id}`,
          sport: "MLB",
          title: `Player ${id.split("-").slice(-1)[0]}`,
          subtitle: "Open MLB Tracker for live name + progress bar",
          propLabel: MLB_PROP_LABELS[mlbProps[id]] || mlbProps[id],
          href: "/mlb-tracker",
        });
      }

      // PGA
      const golfFavs: string[] = JSON.parse(localStorage.getItem("pp-golf-favs") || "[]");
      for (const id of golfFavs) {
        list.push({
          id: `pga-${id}`,
          sport: "PGA",
          title: `Golfer ${id}`,
          subtitle: "Open PGA Groupings for score / thru",
          href: "/pga-groupings",
        });
      }
    } catch {
      /* ignore */
    }

    setItems(list);
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
            Everything you&apos;ve starred across MLB, NFL, PGA, and game lines — one place.
            Star players on each sport page; they show up here automatically on this device.
          </p>
          {!mounted && (
            <p className="text-xs text-zinc-600 mt-2">Loading favorites…</p>
          )}
        </section>

        {mounted && items.length === 0 && (
          <div className="text-center text-zinc-500 py-16 space-y-3">
            <p>No favorites yet.</p>
            <p className="text-sm">
              Go to{" "}
              <Link href="/mlb-tracker" className="text-emerald-400">MLB</Link>,{" "}
              <Link href="/nfl-tracker" className="text-emerald-400">NFL</Link>, or{" "}
              <Link href="/pga-groupings" className="text-emerald-400">PGA</Link>{" "}
              and star players or game lines.
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
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                      {item.sport}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      <div className="text-[11px] text-zinc-500 truncate">{item.subtitle}</div>
                      {item.propLabel && (
                        <div className="text-xs text-emerald-400/90 mt-0.5">{item.propLabel}</div>
                      )}
                    </div>
                    <span className="text-zinc-600 text-sm">→</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <footer className="text-center text-xs text-zinc-600 pt-4 pb-6">
          Favorites are stored in this browser only for now. Cross-device accounts come later with
          the subscription tier.
        </footer>
      </main>
    </div>
  );
}
