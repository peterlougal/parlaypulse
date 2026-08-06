"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  americanToImpliedProb,
  calculateParlayPayout,
  combinedProbability,
  formatAmericanOdds,
  formatPercent,
} from "@/lib/oddsMath";

const SPORTS_PRIORITY: { key: string; label: string; tier: number }[] = [
  { key: "baseball_mlb", label: "MLB", tier: 1 },
  { key: "basketball_wnba", label: "WNBA", tier: 1 },
  { key: "soccer_usa_mls", label: "MLS", tier: 2 },
  { key: "soccer_epl", label: "EPL", tier: 2 },
  { key: "soccer_uefa_champs_league", label: "UCL", tier: 2 },
  { key: "soccer_uefa_europa_league", label: "UEL", tier: 2 },
  { key: "tennis_atp_french_open", label: "ATP", tier: 2 },
  { key: "tennis_wta_french_open", label: "WTA", tier: 2 },
];

interface Candidate {
  eventId: string;
  sport: string;
  sportLabel: string;
  home: string;
  away: string;
  selection: string;
  price: number;
  implied: number;
  book: string;
  commence: string;
  tier: number;
}

interface BuiltTicket {
  id: string;
  title: string;
  goal: string;
  legs: Candidate[];
  combinedOdds: number;
  successProb: number;
  stakeToPlace: number;
  projectedReturn: number;
  netIfWins: number;
  explanation: string;
}

function americanToDecimal(american: number): number {
  if (american > 0) return american / 100 + 1;
  return 100 / Math.abs(american) + 1;
}

function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

/** Greedy pack heavy favorites toward a target decimal multiplier */
function buildTicketToward(
  candidates: Candidate[],
  targetDecimal: number,
  maxLegs: number,
  minPrice: number // e.g. -200 means only take prices <= -200 (more negative or equal)
): Candidate[] {
  const usable = candidates.filter((c) => c.price <= minPrice);
  const picked: Candidate[] = [];
  let current = 1;

  for (const c of usable) {
    if (picked.length >= maxLegs) break;
    // avoid same event twice
    if (picked.some((p) => p.eventId === c.eventId)) continue;
    const d = americanToDecimal(c.price);
    // if already at/over target, stop unless we have zero legs
    if (picked.length > 0 && current >= targetDecimal * 0.95) break;
    picked.push(c);
    current *= d;
    if (current >= targetDecimal) break;
  }
  return picked;
}

function ticketFromLegs(
  id: string,
  title: string,
  goal: string,
  legs: Candidate[],
  originalStake: number,
  explanation: string
): BuiltTicket | null {
  if (legs.length === 0) return null;
  const decimals = legs.map((l) => americanToDecimal(l.price));
  const combinedDecimal = decimals.reduce((a, b) => a * b, 1);
  const combinedOdds = decimalToAmerican(combinedDecimal);
  const successProb = combinedProbability(legs.map((l) => l.implied));

  // Stake to place so that profit ≈ originalStake for "save unit"
  // return = stake * combinedDecimal; we want return ≈ originalStake + stake  (get stake back + recover unit)
  // Actually "save the unit" = get original stake amount back as profit, so:
  // profit = stakeToPlace * (combinedDecimal - 1) ≈ originalStake
  // stakeToPlace ≈ originalStake / (combinedDecimal - 1)
  const stakeToPlace =
    combinedDecimal > 1.01
      ? Math.round((originalStake / (combinedDecimal - 1)) * 100) / 100
      : originalStake;
  const projectedReturn = calculateParlayPayout(stakeToPlace, legs.map((l) => l.price));
  const netIfWins = Math.round((projectedReturn - stakeToPlace) * 100) / 100;

  return {
    id,
    title,
    goal,
    legs,
    combinedOdds,
    successProb,
    stakeToPlace,
    projectedReturn,
    netIfWins,
    explanation,
  };
}

export default function SaveTheUnitPage() {
  const [originalStake, setOriginalStake] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tickets, setTickets] = useState<BuiltTicket[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [credits, setCredits] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTickets([]);

    try {
      const all: Candidate[] = [];

      for (const sport of SPORTS_PRIORITY) {
        try {
          const res = await fetch(
            `/api/odds?sport=${sport.key}&markets=h2h&regions=us`
          );
          const json = await res.json();
          if (json.meta?.remainingCredits) setCredits(json.meta.remainingCredits);
          if (!res.ok || !Array.isArray(json.data)) continue;

          for (const event of json.data) {
            for (const book of event.bookmakers || []) {
              const mkt = book.markets?.find((m: any) => m.key === "h2h");
              if (!mkt) continue;
              for (const o of mkt.outcomes || []) {
                const price = o.price as number;
                // Heavy favorites only
                if (price > -150) continue;
                // Skip draws for soccer 3-way for this MVP
                if ((o.name || "").toLowerCase() === "draw") continue;

                all.push({
                  eventId: event.id,
                  sport: sport.key,
                  sportLabel: sport.label,
                  home: event.home_team,
                  away: event.away_team,
                  selection: o.name,
                  price,
                  implied: americanToImpliedProb(price),
                  book: book.title,
                  commence: event.commence_time,
                  tier: sport.tier,
                });
              }
            }
          }
        } catch {
          // sport may be off-season — skip
        }
      }

      // Dedupe by event+selection, keep shortest price (most negative)
      const map = new Map<string, Candidate>();
      for (const c of all) {
        const key = `${c.eventId}|${c.selection}`;
        const existing = map.get(key);
        if (!existing || c.price < existing.price) map.set(key, c);
      }

      const unique = Array.from(map.values()).sort((a, b) => {
        // Prefer American sports (tier 1), then heavier favorites
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.price - b.price; // more negative first
      });

      setCandidates(unique);
      setLastUpdated(new Date());

      // Build 3 options
      // 1. Save the Unit — target ~even money (decimal ~2.0), only very heavy legs
      const saveLegs = buildTicketToward(unique, 2.0, 5, -400);
      const save = ticketFromLegs(
        "save",
        "Save the Unit",
        "Recover your original stake",
        saveLegs,
        originalStake,
        "Built from the heaviest live favorites available. Goal is to get as close as possible to recovering your unit if this ticket hits."
      );

      // 2. Small win — target ~2.5–3.0 decimal, allow -200+
      const smallLegs = buildTicketToward(unique, 2.75, 4, -200);
      const small = ticketFromLegs(
        "small",
        "Small Win",
        "Recover stake + a little profit",
        smallLegs,
        originalStake,
        "Slightly longer combined price so you can finish ahead of break-even while still using strong live favorites."
      );

      // 3. Go for ~5x — target decimal ~5–6
      const fiveLegs = buildTicketToward(unique, 5.5, 5, -150);
      const five = ticketFromLegs(
        "five",
        "Go for ~5x",
        "Higher upside from heavy favorites",
        fiveLegs,
        originalStake,
        "Aims near a 5× return on the amount you put down. Still grounded in live favorites, but more variance."
      );

      setTickets([save, small, five].filter(Boolean) as BuiltTicket[]);
    } catch (err: any) {
      setError(err.message || "Failed to scan live favorites");
    } finally {
      setLoading(false);
    }
  }, [originalStake]);

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
                <p className="text-xs text-zinc-500">Save the Unit</p>
              </div>
            </Link>
            <nav className="hidden md:flex gap-3 text-sm flex-wrap">
              <Link href="/" className="text-zinc-400 hover:text-white">Ticket Health</Link>
              <Link href="/save-the-unit" className="text-emerald-400 font-medium">Save the Unit</Link>
              <Link href="/pga-groupings" className="text-zinc-400 hover:text-white">PGA</Link>
              <Link href="/mlb-tracker" className="text-zinc-400 hover:text-white">MLB</Link>
              <Link href="/nfl-tracker" className="text-zinc-400 hover:text-white">NFL</Link>
              <Link href="/prop-watch" className="text-zinc-400 hover:text-white">Prop Watch</Link>
            </nav>
          </div>
          <div className="text-right text-xs text-zinc-500">
            {credits && <div>Credits left: {credits}</div>}
            {lastUpdated && <div>Updated: {lastUpdated.toLocaleTimeString()}</div>}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-2">Save the Unit</h2>
          <p className="text-sm text-zinc-400 mb-6 max-w-2xl">
            When a ticket is in trouble, this tool scans live heavy favorites across available
            sports and builds three ready-to-use options: get your unit back, finish a little
            ahead, or swing for a larger return. Prefer American sports when possible; only
            extreme live prices for the safest option.
          </p>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Unit size to recover ($)
              </label>
              <input
                type="number"
                value={originalStake}
                onChange={(e) => setOriginalStake(Number(e.target.value) || 0)}
                className="w-32 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={scan}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition"
            >
              {loading ? "Scanning live favorites…" : "Find Options"}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
        </section>

        {tickets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col"
              >
                <div className="mb-3">
                  <div className="text-lg font-semibold">{t.title}</div>
                  <div className="text-xs text-zinc-400">{t.goal}</div>
                </div>

                <div className="bg-zinc-800/60 rounded-xl p-3 mb-4">
                  <div className="text-xs text-zinc-400">Projected success rate</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {formatPercent(t.successProb)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    If you get this bet in at these prices
                  </div>
                </div>

                <div className="space-y-2 mb-4 flex-1">
                  {t.legs.map((leg, i) => (
                    <div
                      key={i}
                      className="text-sm bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-3 py-2"
                    >
                      <div className="font-medium">
                        {leg.selection}{" "}
                        <span className="text-zinc-400 font-mono">
                          {formatAmericanOdds(leg.price)}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        {leg.away} @ {leg.home} · {leg.sportLabel} · {leg.book}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-800 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Combined odds</span>
                    <span className="font-mono">{formatAmericanOdds(t.combinedOdds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Suggested stake</span>
                    <span>${t.stakeToPlace.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">If it hits, you get</span>
                    <span className="text-emerald-400 font-medium">
                      ${t.projectedReturn.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Net profit</span>
                    <span>${t.netIfWins.toFixed(2)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">{t.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && tickets.length === 0 && lastUpdated && (
          <div className="text-center text-zinc-500 py-8">
            No strong live favorites found right now. Try again when more games are in progress.
          </div>
        )}

        {candidates.length > 0 && (
          <section className="text-xs text-zinc-600">
            Scanned {candidates.length} heavy favorite prices across available sports.
          </section>
        )}

        <footer className="text-center text-xs text-zinc-600 pt-4 pb-6">
          ParlayPulse is an analytics tool only — not a sportsbook. Recommendations use live
          market odds and independent-probability estimates. Gamble responsibly.
        </footer>
      </main>
    </div>
  );
}
