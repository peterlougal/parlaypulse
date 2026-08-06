export type SportKey = "baseball_mlb" | "basketball_wnba" | "soccer_usa_mls";

export type MarketType = "h2h" | "spreads" | "totals";

export interface BetLeg {
  id: string;
  sport: SportKey;
  eventId?: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  market: MarketType;
  originalOdds: number;
  point?: number;
}
