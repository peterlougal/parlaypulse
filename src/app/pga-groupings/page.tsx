"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * MANUAL UPDATE ZONE
 * Edit this list every ~30 min with current scores / thru / status.
 * Keep player names consistent so favorites still match.
 */
const TOURNAMENT = {
  name: "PGA Tour — Current Event",
  course: "Update course name",
  round: "Round 1",
  lastUpdated: "Aug 6, 2026 — manual",
};

type Player = {
  id: string;
  name: string;
  score: string; // e.g. "-3", "E", "+2"
  thru: string; // e.g. "14", "F", "11:54 AM"
  status?: "playing" | "finished" | "teeing" | "wd" | "cut";
};

type Group = {
  id: string;
  label: string; // e.g. "Group 1"
  teeTime?: string;
  players: Player[];
};

const GROUPS: Group[] = [
  {
    id: "g1",
    label: "Group 1",
    teeTime: "7:00 AM",
    players: [
      { id: "p1", name: "Justin Thomas", score: "-3", thru: "14", status: "playing" },
      { id: "p2", name: "Cameron Young", score: "E", thru: "14", status: "playing" },
      { id: "p3", name: "Aaron Rai", score: "E", thru: "13", status: "playing" },
    ],
  },
  {
    id: "g2",
    label: "Group 2",
    teeTime: "7:11 AM",
    players: [
      { id: "p4", name: "Hideki Matsuyama", score: "-", thru: "11:54 AM", status: "teeing" },
      { id: "p5", name: "Ryan Gerard", score: "-", thru: "12:05 PM", status: "teeing" },
      { id: "p6", name: "Ben Griffin", score: "-", thru: "12:16 PM", status: "teeing" },
    ],
  },
  {
    id: "g3",
    label: "Group 3",
    teeTime: "7:22 AM",
    players: [
      { id: "p7", name: "Scottie Scheffler", score: "-5", thru: "F", status: "finished" },
      { id: "p8", name: "Xander Schauffele", score: "-2", thru: "F", status: "finished" },
      { id: "p9", name: "Collin Morikawa", score: "-1", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g4",
    label: "Group 4",
    teeTime: "7:33 AM",
    players: [
      { id: "p10", name: "Rory McIlroy", score: "-4", thru: "16", status: "playing" },
      { id: "p11", name: "Jon Rahm", score: "-2", thru: "16", status: "playing" },
      { id: "p12", name: "Viktor Hovland", score: "+1", thru: "15", status: "playing" },
    ],
  },
];

function scoreColor(score: string): string {
  if (score === "-" || score === "") return "text-zinc-500";
  if (score === "E") return "text-zinc-200";
  if (score.startsWith("-")) return "text-emerald-400";
  if (score.startsWith("+")) return "text-red-400";
  return "text-zinc-200";
}

function statusLabel(s?: string): string {
  if (s === "finished") return "F";
  if (s === "teeing") return "Teeing";
  if (s === "wd") return "WD";
  if (s === "cut") return "CUT";
  return "";
}

export default function PgaGroupingsPage() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("pp-golf-favs");
      if (raw) setFavorites(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("pp-golf-favs", JSON.stringify([...favorites]));
  }, [favorites, mounted]);

  function toggleFav(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    players: showFavOnly ? g.players.filter((p) => favorites.has(p.id)) : g.players,
  })).filter((g) => g.players.length > 0);

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
                <p className="text-xs text-zinc-500">PGA Groupings</p>
              </div>
            </Link>
            <nav className="hidden sm:flex gap-4 text-sm">
              <Link href="/" className="text-zinc-400 hover:text-white transition">
                Ticket Health
              </Link>
              <Link href="/save-the-unit" className="text-zinc-400 hover:text-white transition">
                Save the Unit
              </Link>
              <Link href="/pga-groupings" className="text-emerald-400 font-medium">
                PGA Groupings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{TOURNAMENT.name}</h2>
              <p className="text-sm text-zinc-400 mt-1">
                {TOURNAMENT.course} · {TOURNAMENT.round}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Updated: {TOURNAMENT.lastUpdated}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showFavOnly}
                onChange={(e) => setShowFavOnly(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Favorites only
            </label>
          </div>
          <p className="text-xs text-zinc-500 mt-4 max-w-2xl">
            Star the players on your ticket so you can filter to just those groups. Scores are
            updated manually for now — refresh this page after each update.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleGroups.map((group) => (
            <div
              key={group.id}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
                <span className="font-semibold text-sm">{group.label}</span>
                {group.teeTime && (
                  <span className="text-xs text-zinc-500">{group.teeTime}</span>
                )}
              </div>
              <div className="divide-y divide-zinc-800/80">
                {group.players.map((p) => {
                  const isFav = favorites.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        isFav ? "bg-emerald-950/20" : ""
                      }`}
                    >
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
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        {p.status && p.status !== "playing" && (
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                            {statusLabel(p.status)}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-mono font-semibold ${scoreColor(p.score)}`}>
                          {p.score}
                        </div>
                        <div className="text-[11px] text-zinc-500">{p.thru}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {visibleGroups.length === 0 && (
          <div className="text-center text-zinc-500 py-12">
            No favorited players in current groupings. Turn off “Favorites only” or star some players.
          </div>
        )}

        <footer className="text-center text-xs text-zinc-600 pt-4 pb-6">
          Scores are manually maintained for MVP. Not a live feed. For tracking only.
        </footer>
      </main>
    </div>
  );
}
