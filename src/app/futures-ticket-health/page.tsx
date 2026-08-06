"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

/**
 * Futures Ticket Health
 * Manual tracker for long-dated parlays / futures.
 * Compare original odds vs current odds → leg heat + overall health +
 * "Generate Current Value" (stake needed now for the same payout).
 */

type Leg = {
  id: string;
  bet: string;
  originalOdds: string; // American, e.g. +150 or -110
  currentOdds: string;
  won: boolean;
};

function parseAmerican(raw: string): number | null {
  const s = raw.trim().replace(/[−–]/g, "-").replace(/\s/g, "");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n === 0) return null;
  return n;
}

function americanToDecimal(am: number): number {
  if (am > 0) return 1 + am / 100;
  return 1 + 100 / Math.abs(am);
}

function decimalToAmerican(dec: number): string {
  if (dec <= 1) return "—";
  if (dec >= 2) {
    const a = Math.round((dec - 1) * 100);
    return `+${a}`;
  }
  const a = Math.round(100 / (dec - 1));
  return `-${a}`;
}

/** Implied win probability from American odds (no vig strip for MVP). */
function impliedProb(am: number): number {
  if (am > 0) return 100 / (am + 100);
  return Math.abs(am) / (Math.abs(am) + 100);
}

/**
 * Leg "advantage" score 0–100 for color.
 * Shorter current price than original = better for holder of the ticket.
 * e.g. got +600, now +135 → big green.
 */
function legHeat(original: number, current: number): {
  pct: number;
  label: string;
  color: string;
  text: string;
} {
  const p0 = impliedProb(original);
  const p1 = impliedProb(current);
  // How much more likely market says it is vs when you bought
  const delta = p1 - p0; // positive = market more confident / shorter price

  // Map delta into 0–100 display. ±40% implied swing ≈ full scale
  const pct = Math.max(0, Math.min(100, Math.round(50 + delta * 125)));

  let label = "Steady";
  let color = "bg-zinc-500";
  let text = "text-zinc-400";
  if (delta >= 0.15) {
    label = "Strong";
    color = "bg-emerald-500";
    text = "text-emerald-400";
  } else if (delta >= 0.05) {
    label = "Up";
    color = "bg-emerald-400";
    text = "text-emerald-400";
  } else if (delta <= -0.15) {
    label = "Cold";
    color = "bg-red-500";
    text = "text-red-400";
  } else if (delta <= -0.05) {
    label = "Down";
    color = "bg-amber-500";
    text = "text-amber-400";
  }

  return { pct, label, color, text };
}

function newId() {
  return `leg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function FuturesTicketHealthPage() {
  const [stake, setStake] = useState("15");
  const [legs, setLegs] = useState<Leg[]>([
    { id: newId(), bet: "", originalOdds: "", currentOdds: "", won: false },
  ]);
  const [showValue, setShowValue] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("pp-futures-ticket");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.stake) setStake(String(data.stake));
        if (Array.isArray(data.legs) && data.legs.length) {
          setLegs(
            data.legs.map((l: Leg) => ({
              ...l,
              won: Boolean(l.won),
            }))
          );
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      "pp-futures-ticket",
      JSON.stringify({ stake, legs })
    );
  }, [stake, legs, mounted]);

  function updateLeg(id: string, patch: Partial<Leg>) {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    setShowValue(false);
  }

  function addLeg() {
    setLegs((prev) => [
      ...prev,
      { id: newId(), bet: "", originalOdds: "", currentOdds: "", won: false },
    ]);
    setShowValue(false);
  }

  function removeLeg(id: string) {
    setLegs((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
    setShowValue(false);
  }

  const analysis = useMemo(() => {
    const parsed = legs.map((l) => ({
      ...l,
      o: parseAmerican(l.originalOdds),
      c: parseAmerican(l.currentOdds),
    }));
    // Original ticket needs original odds on every leg (won or not)
    const withOrig = parsed.filter((l) => l.o !== null);
    if (withOrig.length === 0) return null;

    let origDec = 1;
    for (const l of withOrig) {
      origDec *= americanToDecimal(l.o!);
    }

    // Rows for display: won legs = 100% heat; open need current odds
    const legRows = parsed.map((l) => {
      if (l.won && l.o !== null) {
        return {
          ...l,
          heat: {
            pct: 100,
            label: "Won",
            color: "bg-emerald-500",
            text: "text-emerald-400",
          },
          origDec: americanToDecimal(l.o),
          currDec: 1, // settled
        };
      }
      if (l.o !== null && l.c !== null) {
        const heat = legHeat(l.o, l.c);
        return {
          ...l,
          heat,
          origDec: americanToDecimal(l.o),
          currDec: americanToDecimal(l.c),
        };
      }
      return null;
    }).filter(Boolean) as Array<
      Leg & {
        o: number | null;
        c: number | null;
        heat: { pct: number; label: string; color: string; text: string };
        origDec: number;
        currDec: number;
      }
    >;

    if (legRows.length === 0) return null;

    // Remaining open legs only (not won) for rebuild cost
    const openRows = legRows.filter((l) => !l.won && l.c !== null);
    let openCurrDec = 1;
    for (const l of openRows) {
      openCurrDec *= l.currDec;
    }

    const stakeN = Number(stake) || 0;
    const originalPayout = stakeN * origDec;
    const originalProfit = originalPayout - stakeN;

    // Cost today to hit SAME payout using only remaining legs at current odds
    let currentValue = 0;
    if (openRows.length === 0) {
      // All won — ticket already pays; no rebuild needed
      currentValue = 0;
    } else if (openCurrDec > 1) {
      currentValue = originalPayout / openCurrDec;
    }

    const payoutIfSameStake =
      openRows.length === 0 ? originalPayout : stakeN * openCurrDec;

    const health = Math.round(
      legRows.reduce((s, r) => s + r.heat.pct, 0) / legRows.length
    );

    return {
      legRows,
      openCount: openRows.length,
      wonCount: legRows.filter((l) => l.won).length,
      incomplete: parsed.filter((l) => !l.won && (l.o === null || l.c === null)).length,
      origDec,
      openCurrDec,
      stakeN,
      originalPayout,
      originalProfit,
      currentValue,
      payoutIfSameStake,
      health,
      combinedOrigAmerican: decimalToAmerican(origDec),
      combinedOpenAmerican: decimalToAmerican(openCurrDec),
      allWon: openRows.length === 0 && legRows.every((l) => l.won),
    };
  }, [legs, stake]);

  function healthColor(h: number) {
    if (h >= 70) return "text-emerald-400";
    if (h >= 50) return "text-amber-400";
    if (h >= 35) return "text-orange-400";
    return "text-red-400";
  }

  function healthBar(h: number) {
    if (h >= 70) return "bg-emerald-500";
    if (h >= 50) return "bg-amber-400";
    if (h >= 35) return "bg-orange-400";
    return "bg-red-500";
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
                <p className="text-xs text-zinc-500">Futures Ticket Health</p>
              </div>
            </Link>
            <nav className="hidden md:flex gap-3 text-sm flex-wrap">
              <Link href="/" className="text-zinc-400 hover:text-white">Ticket Health</Link>
              <Link href="/futures-ticket-health" className="text-emerald-400 font-medium">Futures</Link>
              <Link href="/save-the-unit" className="text-zinc-400 hover:text-white">Save the Unit</Link>
              <Link href="/pga-groupings" className="text-zinc-400 hover:text-white">PGA</Link>
              <Link href="/mlb-tracker" className="text-zinc-400 hover:text-white">MLB</Link>
              <Link href="/nfl-tracker" className="text-zinc-400 hover:text-white">NFL</Link>
              <Link href="/prop-watch" className="text-zinc-400 hover:text-white">Prop Watch</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Top: stake + health */}
        <section className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Futures Ticket Health</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Track long parlays &amp; futures. Enter what you got each leg at vs what it is
                now — see heat per leg and what it would cost to rebuild the same payout.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-[10px] text-zinc-500 mb-1">
                  Original stake ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={stake}
                  onChange={(e) => {
                    setStake(e.target.value);
                    setShowValue(false);
                  }}
                  className="w-28 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {analysis && analysis.stakeN > 0 && (
                <div className="text-sm text-zinc-400 pb-2">
                  Original payout{" "}
                  <span className="text-white font-semibold tabular-nums">
                    ${analysis.originalPayout.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-zinc-600">
                    {" "}
                    ({analysis.combinedOrigAmerican} combined)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 min-w-[160px] flex flex-col items-center justify-center text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ticket Health
            </div>
            {analysis ? (
              <>
                <div className={`text-4xl font-bold mt-1 tabular-nums ${healthColor(analysis.health)}`}>
                  {analysis.health}%
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${healthBar(analysis.health)}`}
                    style={{ width: `${analysis.health}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="text-3xl font-bold text-zinc-600 mt-1">—</div>
            )}
          </div>
        </section>

        {/* Legs */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-400 mb-2 px-1">
            Legs ({legs.length})
          </h3>
          <div className="space-y-3">
            {legs.map((leg, idx) => {
              const o = parseAmerican(leg.originalOdds);
              const c = parseAmerican(leg.currentOdds);
              const heat = o !== null && c !== null ? legHeat(o, c) : null;
              return (
                <div
                  key={leg.id}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-500 font-medium">Leg {idx + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={leg.won}
                          onChange={(e) => {
                            updateLeg(leg.id, { won: e.target.checked });
                          }}
                          className="rounded border-zinc-600"
                        />
                        <span className={leg.won ? "text-emerald-400 font-semibold" : ""}>
                          Won
                        </span>
                      </label>
                      {legs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLeg(leg.id)}
                          className="text-xs text-zinc-500 hover:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px] gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Bet</label>
                      <input
                        type="text"
                        placeholder="e.g. Ohtani MVP"
                        value={leg.bet}
                        onChange={(e) => updateLeg(leg.id, { bet: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">
                        Odds you got
                      </label>
                      <input
                        type="text"
                        placeholder="+150"
                        value={leg.originalOdds}
                        onChange={(e) =>
                          updateLeg(leg.id, { originalOdds: e.target.value })
                        }
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">
                        Current odds
                      </label>
                      <input
                        type="text"
                        placeholder="+135"
                        value={leg.currentOdds}
                        onChange={(e) =>
                          updateLeg(leg.id, { currentOdds: e.target.value })
                        }
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  </div>
                  {(leg.won || heat) && (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            leg.won ? "bg-emerald-500" : heat!.color
                          }`}
                          style={{ width: `${leg.won ? 100 : heat!.pct}%` }}
                        />
                      </div>
                      <div
                        className={`text-xs font-semibold tabular-nums min-w-[3rem] text-right ${
                          leg.won ? "text-emerald-400" : heat!.text
                        }`}
                      >
                        {leg.won ? 100 : heat!.pct}%
                      </div>
                      <div
                        className={`text-[10px] uppercase tracking-wide ${
                          leg.won ? "text-emerald-400" : heat!.text
                        }`}
                      >
                        {leg.won ? "Won" : heat!.label}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addLeg}
            className="mt-3 text-sm text-emerald-400 hover:text-emerald-300"
          >
            + Add leg
          </button>
        </section>

        {/* Current value */}
        {analysis && analysis.stakeN > 0 && analysis.legRows.length > 0 && (
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Same-payout rebuild cost</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {analysis.allWon
                    ? "All legs won — ticket is a winner. No rebuild needed."
                    : `Cost to rebuild the same $${analysis.originalPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })} payout using only the ${analysis.openCount} remaining open leg${analysis.openCount === 1 ? "" : "s"} at current odds (won legs excluded).`}
                </p>
              </div>
              {!analysis.allWon && (
                <button
                  type="button"
                  onClick={() => setShowValue(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  Generate Current Value
                </button>
              )}
            </div>
            {showValue && !analysis.allWon && (
              <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Current value</div>
                  <div className="text-2xl font-bold text-emerald-400 tabular-nums">
                    $
                    {analysis.currentValue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-1">
                    Stake on remaining legs for same payout
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">You paid</div>
                  <div className="text-2xl font-bold text-white tabular-nums">
                    ${analysis.stakeN.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-1">Original stake</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Multiple</div>
                  <div className="text-2xl font-bold text-white tabular-nums">
                    {analysis.stakeN > 0
                      ? (analysis.currentValue / analysis.stakeN).toFixed(1)
                      : "—"}
                    x
                  </div>
                  <div className="text-[11px] text-zinc-600 mt-1">
                    vs what you risked
                  </div>
                </div>
                <div className="sm:col-span-3 text-xs text-zinc-500">
                  Full ticket was {analysis.combinedOrigAmerican}
                  {analysis.wonCount > 0
                    ? ` · ${analysis.wonCount} leg${analysis.wonCount === 1 ? "" : "s"} already won`
                    : ""}
                  {" · "}
                  remaining combined {analysis.combinedOpenAmerican}. Won legs are not in this
                  rebuild price.
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="text-center text-xs text-zinc-600 pt-2 pb-6">
          Manual entry for MVP. Odds movement colors: shorter price than your number = greener
          leg. Saved on this device only.
        </footer>
      </main>
    </div>
  );
}
