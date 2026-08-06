/**
 * Convert American odds to implied probability (0-1)
 */
export function americanToImpliedProb(americanOdds: number): number {
  if (americanOdds === 0) return 0.5;
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  }
  return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
}

/**
 * Calculate parlay payout for a given stake and array of American odds
 * Returns total return (stake + profit)
 */
export function calculateParlayPayout(stake: number, americanOddsList: number[]): number {
  if (americanOddsList.length === 0) return stake;

  let decimalOdds = 1;
  for (const odds of americanOddsList) {
    if (odds > 0) {
      decimalOdds *= odds / 100 + 1;
    } else {
      decimalOdds *= 100 / Math.abs(odds) + 1;
    }
  }
  return Math.round(stake * decimalOdds * 100) / 100;
}

/**
 * Combined probability of independent legs (product)
 */
export function combinedProbability(probs: number[]): number {
  if (probs.length === 0) return 0;
  return probs.reduce((acc, p) => acc * p, 1);
}

/**
 * Determine ticket health based on current combined probability
 */
export function getTicketHealth(
  currentProb: number | null
): { health: "strong" | "moderate" | "weak" | "dead" | "unknown"; label: string; color: string } {
  if (currentProb === null) {
    return { health: "unknown", label: "Unknown", color: "text-zinc-400" };
  }
  if (currentProb >= 0.65) {
    return { health: "strong", label: "Strong", color: "text-emerald-400" };
  }
  if (currentProb >= 0.35) {
    return { health: "moderate", label: "Moderate", color: "text-yellow-400" };
  }
  if (currentProb >= 0.12) {
    return { health: "weak", label: "Weak", color: "text-orange-400" };
  }
  return { health: "dead", label: "Dead / Longshot", color: "text-red-400" };
}

export function formatAmericanOdds(odds: number): string {
  if (odds > 0) return `+${odds}`;
  return `${odds}`;
}

export function formatPercent(prob: number | null): string {
  if (prob === null) return "—";
  return `${(prob * 100).toFixed(1)}%`;
}
