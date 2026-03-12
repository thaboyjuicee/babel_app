import { NextResponse } from "next/server";
import { RealBagsProvider } from "@/lib/bags/real-provider";

// Only available in non-production to avoid leaking API structure.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Probe not available in production" }, { status: 403 });
  }
  const apiKey = process.env.BAGS_API_KEY;
  const baseUrl = process.env.BAGS_API_BASE_URL ?? "https://public-api-v2.bags.fm/api/v1/";
  if (!apiKey) {
    return NextResponse.json({ error: "BAGS_API_KEY is not set" }, { status: 400 });
  }
  const provider = new RealBagsProvider(baseUrl, apiKey);
  const results = await provider.probeAll();
  const working = Object.entries(results).filter(([, v]) => v.count > 0);
  return NextResponse.json({
    baseUrl,
    results,
    recommendation:
      working.length > 0
        ? `Set BAGS_API_TOKENS_PATH=${working[0][0]} in .env.local`
        : "No endpoint returned usable token data. Check your API key and base URL.",
  });
}
