"use client";

import { useState, useCallback, useEffect } from "react";
import {
  americanToImpliedProb,
  calculateParlayPayout,
  combinedProbability,
  formatAmericanOdds,
  formatPercent,
  getTicketHealth,
} from "@/lib/oddsMath";
import type { BetLeg, SportKey, MarketType } from "@/lib/types";

const SPORTS: { key: SportKey; label: string }[] = [
  { key: "baseball_mlb", label: "MLB" },
  { key: "basketball_wnba", label: "WNBA" },
  { key: "soccer_usa_mls", label: "MLS" },
];

const MARKETS: { key: MarketType; label: string }[] = [
  { key: "h2h", label: "Moneyline" },
  { key: "spreads", label: "Spread" },
  { key: "totals", label: "Total (O/U)" },
];

interface ApiEvent {
  id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers?: any[];
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function HomePage() {
  const [legs, setLegs] = useState<BetLeg[]>([]);
  const [stake, setStake] = useState(100);

  const [sport, setSport] = useState<SportKey>("baseball_mlb");
  const [market, setMarket] = useState<MarketType>("h2h");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selection, setSelection] = useState("");
  const [originalOdds, setOriginalOdds] = useState("");
  const [point, setPoint] = useState("");

  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<any[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoadingEvents(true);
      setSelectedEventId("");
      setSelection("");
      setEvents([]);

      try {
        const res = await fetch(`/api/odds?sport=${sport}&markets=h2h&regions=us`);
        const json = await res.json();

        if (!res.ok) {
          console.error(json.error);
          return;
        }

        if (json.meta?.remainingCredits) {
          setCreditsRemaining(json.meta.remainingCredits);
        }

        if (!cancelled && Array.isArray(json.data)) {
          const sorted = [...json.data].sort(
            (a: ApiEvent, b: ApiEvent) =>
              new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
          );
          setEvents(sorted);
        }
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [sport]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const selectionOptions: string[] = (() => {
    if (!selectedEvent) return [];
    if (market === "h2h" || market === "spreads") {
      return [selectedEvent.away_team, selectedEvent.home_team];
    }
    if (market === "totals") {
      return ["Over", "Under"];
    }
    return [];
  })();

  const addLeg = () => {
    const oddsNum = parseInt(originalOdds, 10);
    if (!selectedEvent || !selection || isNaN(oddsNum)) {
      alert("Please select a game, a side, and enter valid American odds.");
      return;
    }

    const newLeg: BetLeg = {
      id: generateId(),
      sport,
      eventId: selectedEvent.id,
      homeTeam: selectedEvent.home_team,
      awayTeam: selectedEvent.away_team,
      selection,
      market,
      originalOdds: oddsNum,
      point: point ? parseFloat(point) : undefined,
    };

    setLegs((prev) => [...prev, newLeg]);
    setSelection("");
    setOriginalOdds("");
    setPoint("");
  };

  const removeLeg = (id: string) => {
    setLegs((prev) => prev.filter((l) => l.id !== id));
  };

  const clearAll = () => {
    setLegs([]);
    setLiveData(null);
    setError(null);
  };

  const fetchLiveOdds = useCallback(async () => {
    if (legs.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const sportsNeeded = Array.from(new Set(legs.map((l) => l.sport)));
      const allEvents: any[] = [];

      for (const s of sportsNeeded) {
        const res = await fetch(
          `/api/odds?sport=${s}&markets=h2h,spreads,totals&regions=us`
        );
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to fetch odds");
        }

        if (json.meta?.remainingCredits) {
          setCreditsRemaining(json.meta.remainingCredits);
        }

        if (Array.isArray(json.data)) {
          allEvents.push(...json.data);
        }
      }

      setLiveData(allEvents);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Something went wrong fetching live odds");
    } finally {
      setLoading(false);
    }
  }, [legs]);

  function findLiveOddsForLeg(leg: BetLeg) {
    if (!liveData) return null;

    let event = liveData.find((e) => e.id === leg.eventId);

    if (!event) {
      event = liveData.find((e) => {
        const home = (e.home_team || "").toLowerCase();
        const away = (e.away_team || "").toLowerCase();
        return home === leg.homeTeam.toLowerCase() && away === leg.awayTeam.toLowerCase();
      });
    }

    if (!event) return null;

    for (const book of event.bookmakers || []) {
      const mkt = book.markets?.find((m: any) => m.key === leg.market);
      if (!mkt) continue;

      const outcome = mkt.outcomes?.find((o: any) => {
        const name = (o.name || "").toLowerCase();
        const sel = leg.selection.toLowerCase();

        if (leg.market === "h2h") {
          return name === sel || name.includes(sel) || sel.includes(name);
        }
        if (leg.market === "spreads" || leg.market === "totals") {
          const pointMatch =
            leg.point === undefined ||
            o.point === leg.point ||
            Math.abs((o.point || 0) - (leg.point || 0)) < 0.1;
          return (name === sel || name.includes(sel) || sel.includes(name)) && pointMatch;
        }
        return false;
      });

      if (outcome) {
        return {
          price: outcome.price as number,
          point: outcome.point,
          book: book.title,
          eventId: event.id,
        };
      }
    }
    return null;
  }

  const originalOddsList = legs.map((l) => l.originalOdds);
  const originalProbs = legs.map((l) => americanToImpliedProb(l.originalOdds));
  const combinedOrigProb = combinedProbability(originalProbs);
  const originalPayout = calculateParlayPayout(stake, originalOddsList);

  const liveStatuses = legs.map((leg) => {
    const live = findLiveOddsForLeg(leg);
    const currentOdds = live?.price ?? null;
    const implied = currentOdds !== null ? americanToImpliedProb(currentOdds) : null;
    return {
      leg,
      currentOdds,
      impliedProb: implied,
      originalImpliedProb: americanToImpliedProb(leg.originalOdds),
      livePriceFound: !!live,
      book: live?.book,
    };
  });

  const currentProbs = liveStatuses
    .map((s) => s.impliedProb)
    .filter((p): p is number => p !== null);
  const combinedCurrentProb =
    currentProbs.length === legs.length && legs.length > 0
      ? combinedProbability(currentProbs)
      : null;

  const health = getTicketHealth(combinedCurrentProb);

  function formatGameLabel(e: ApiEvent) {
    const time = new Date(e.commence_time);
    const timeStr = time.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `${e.away_team} @ ${e.home_team}  (${timeStr})`;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-zinc-950 text-lg">
              P
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ParlayPulse</h1>
              <p className="text-xs text-zinc-500">Live ticket health & hedge tool</p>
            </div>
          </div>
          <div className="text-right text-xs text-zinc-500">
            {creditsRemaining && <div>Credits left: {creditsRemaining}</div>}
            {lastUpdated && <div>Updated: {lastUpdated.toLocaleTimeString()}</div>}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Add a Leg</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value as SportKey)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {SPORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Market</label>
              <select
                value={market}
                onChange={(e) => {
                  setMarket(e.target.value as MarketType);
                  setSelection("");
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {MARKETS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs text-zinc-400 mb-1">
                Game {loadingEvents && <span className="text-zinc-500">(loading…)</span>}
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setSelection("");
                }}
                disabled={loadingEvents || events.length === 0}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              >
                <option value="">
                  {loadingEvents
                    ? "Loading games…"
                    : events.length === 0
                    ? "No games available right now"
                    : "Select a game…"}
                </option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {formatGameLabel(e)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Your Selection</label>
              <select
                value={selection}
                onChange={(e) => setSelection(e.target.value)}
                disabled={!selectedEventId}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              >
                <option value="">
                  {!selectedEventId ? "Select a game first" : "Select side…"}
                </option>
                {selectionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Original Odds (American)</label>
              <input
                type="text"
                placeholder="-150 or +130"
                value={originalOdds}
                onChange={(e) => setOriginalOdds(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {(market === "spreads" || market === "totals") && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Point (spread / total line)</label>
                <input
                  type="text"
                  placeholder={market === "spreads" ? "e.g. -1.5" : "e.g. 8.5"}
                  value={point}
                  onChange={(e) => setPoint(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={addLeg}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition"
            >
              + Add Leg
            </button>
            {legs.length > 0 && (
              <button
                onClick={clearAll}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg text-sm transition"
              >
                Clear All
              </button>
            )}
          </div>
        </section>

        {legs.length > 0 && (
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">
                Your Ticket ({legs.length} leg{legs.length !== 1 ? "s" : ""})
              </h2>
              <div className="flex items-center gap-3">
                <label className="text-sm text-zinc-400 flex items-center gap-2">
                  Stake $
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value) || 0)}
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                  />
                </label>
                <button
                  onClick={fetchLiveOdds}
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition"
                >
                  {loading ? "Updating…" : "Get Live Odds"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {legs.map((leg, idx) => {
                const status = liveStatuses[idx];
                return (
                  <div
                    key={leg.id}
                    className="flex flex-wrap items-center justify-between gap-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {leg.awayTeam} @ {leg.homeTeam}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {leg.selection}
                        {leg.point !== undefined ? ` (${leg.point})` : ""} ·{" "}
                        {leg.market === "h2h" ? "ML" : leg.market === "spreads" ? "Spread" : "Total"} · Original{" "}
                        {formatAmericanOdds(leg.originalOdds)} ({formatPercent(status.originalImpliedProb)})
                      </div>
                    </div>

                    <div className="text-right">
                      {status.livePriceFound ? (
                        <div>
                          <div className="text-sm font-mono">
                            Live {formatAmericanOdds(status.currentOdds!)}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {formatPercent(status.impliedProb)} implied
                            {status.book ? ` · ${status.book}` : ""}
                          </div>
                        </div>
                      ) : liveData ? (
                        <div className="text-xs text-amber-400">No match found</div>
                      ) : (
                        <div className="text-xs text-zinc-500">—</div>
                      )}
                    </div>

                    <button
                      onClick={() => removeLeg(leg.id)}
                      className="text-zinc-500 hover:text-red-400 text-sm px-2"
                      title="Remove leg"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
          </section>
        )}

        {legs.length > 0 && (
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Ticket Analysis</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-800/60 rounded-xl p-4">
                <div className="text-xs text-zinc-400 mb-1">Original Win Prob</div>
                <div className="text-2xl font-bold tabular-nums">{formatPercent(combinedOrigProb)}</div>
              </div>

              <div className="bg-zinc-800/60 rounded-xl p-4">
                <div className="text-xs text-zinc-400 mb-1">Current Win Prob</div>
                <div className={`text-2xl font-bold tabular-nums ${health.color}`}>
                  {formatPercent(combinedCurrentProb)}
                </div>
              </div>

              <div className="bg-zinc-800/60 rounded-xl p-4">
                <div className="text-xs text-zinc-400 mb-1">Original Payout (${stake})</div>
                <div className="text-2xl font-bold tabular-nums text-emerald-400">
                  ${originalPayout.toFixed(2)}
                </div>
              </div>

              <div className="bg-zinc-800/60 rounded-xl p-4">
                <div className="text-xs text-zinc-400 mb-1">Ticket Health</div>
                <div className={`text-2xl font-bold ${health.color}`}>{health.label}</div>
              </div>
            </div>

            <div className="text-sm text-zinc-400 leading-relaxed">
              {combinedCurrentProb === null && liveData && (
                <p>
                  Could not match all legs to live markets. This should be rare now that you pick
                  from the live game list.
                </p>
              )}
              {combinedCurrentProb !== null && combinedCurrentProb >= 0.6 && (
                <p>
                  Strong position. You can let it ride or place a small hedge if you want to lock
                  in profit.
                </p>
              )}
              {combinedCurrentProb !== null &&
                combinedCurrentProb < 0.6 &&
                combinedCurrentProb >= 0.25 && (
                  <p>
                    Moderate health. Watch remaining games. Hedging one stronger leg can reduce
                    risk.
                  </p>
                )}
              {combinedCurrentProb !== null && combinedCurrentProb < 0.25 && (
                <p>
                  Ticket is under heavy pressure. Many bettors use this window to hedge remaining
                  legs or free up bankroll for new action.
                </p>
              )}
            </div>
          </section>
        )}

        {legs.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg mb-2">No legs yet</p>
            <p className="text-sm max-w-md mx-auto">
              Select a sport → pick a live/upcoming game → choose your side → enter the odds you
              locked in. Then track the ticket in real time.
            </p>
          </div>
        )}

        <footer className="text-center text-xs text-zinc-600 pt-8 pb-6">
          ParlayPulse is an analytics tool only — not a sportsbook. Probabilities are derived from
          live market odds. For entertainment and informational use. Gamble responsibly.
        </footer>
      </main>
    </div>
  );
}
