import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.ODDS_API_KEY;

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "ODDS_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") || "baseball_mlb";
  const markets = searchParams.get("markets") || "h2h";
  const regions = searchParams.get("regions") || "us";

  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=american`;

  try {
    const res = await fetch(url, { next: { revalidate: 30 } });
    const remaining = res.headers.get("x-requests-remaining");
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || data.error || "Odds API error", data },
        { status: res.status }
      );
    }

    return NextResponse.json({
      data,
      meta: {
        remainingCredits: remaining,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch odds" },
      { status: 500 }
    );
  }
}
