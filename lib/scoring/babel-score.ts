import { AGE_BUCKETS, type AgeBucket, type BagsTokenRaw, type MomentumLabel, type RankedToken, type ScoreBreakdown } from "@/types/babel";
import { clamp } from "@/lib/utils/format";

type HistoricMap = Record<string, RankedToken[]>;

function safeNumber(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function ageInMinutes(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 1440;
  return Math.max(0, (Date.now() - created) / 60_000);
}

function pickBucket(ageMinutes: number): AgeBucket {
  for (const bucket of AGE_BUCKETS) {
    if (ageMinutes <= bucket.maxMinutes) {
      return bucket.key;
    }
  }
  return "24h";
}

function normalize(v: number, max: number): number {
  if (max <= 0) return 0;
  return clamp(v / max);
}

function maxBy<T>(items: T[], pick: (item: T) => number): number {
  let max = 0;
  for (const item of items) {
    const value = pick(item);
    if (value > max) max = value;
  }
  return max;
}

function scoreLabel(score: number, delta: number): MomentumLabel {
  if (delta < -1 || score < 35) return "Losing Steam";
  if (score >= 82 && delta >= 1) return "Rising Fast";
  if (score >= 68 && delta >= 2) return "Near Breakout";
  if (score >= 62) return "Stable High";
  return "Quiet Climber";
}

function buildWhyRanked(breakdown: ScoreBreakdown): string {
  const parts = [
    { label: "buyer growth", score: breakdown.buyerGrowth },
    { label: "trade/volume momentum", score: breakdown.tradeVolumeMomentum },
    { label: "acceleration", score: breakdown.acceleration },
    { label: "age-relative strength", score: breakdown.ageRelativeStrength },
    { label: "stability", score: breakdown.stabilityQuality },
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.label);

  return `Strongest factors: ${parts.join(" and ")}.`;
}

export function computeBabelRankings(tokens: BagsTokenRaw[], historic: HistoricMap = {}): RankedToken[] {
  const sanitizedTokens = tokens
    .filter((token): token is BagsTokenRaw => Boolean(token.mint))
    .map((token) => ({
      ...token,
      price: safeNumber(token.price),
      volume: safeNumber(token.volume),
      tradeCount: safeNumber(token.tradeCount),
      buyerCount: safeNumber(token.buyerCount),
      feeValue: safeNumber(token.feeValue),
    }));

  if (sanitizedTokens.length === 0) {
    return [];
  }

  const ages = sanitizedTokens.map((t) => ageInMinutes(t.createdAt));
  const maxVolume = Math.max(maxBy(sanitizedTokens, (t) => t.volume), 1);
  const maxTrades = Math.max(maxBy(sanitizedTokens, (t) => t.tradeCount), 1);
  const maxBuyers = Math.max(maxBy(sanitizedTokens, (t) => t.buyerCount), 1);
  const maxFees = Math.max(maxBy(sanitizedTokens, (t) => t.feeValue), 1);

  const historyByBucket: Record<AgeBucket, Map<string, number>> = {
    "15m": new Map(historic["15m"]?.map((item) => [item.mint, item.rank]) ?? []),
    "1h": new Map(historic["1h"]?.map((item) => [item.mint, item.rank]) ?? []),
    "4h": new Map(historic["4h"]?.map((item) => [item.mint, item.rank]) ?? []),
    "24h": new Map(historic["24h"]?.map((item) => [item.mint, item.rank]) ?? []),
  };

  const scored = sanitizedTokens.map((token, idx): RankedToken => {
    const ageMinutes = ages[idx] ?? 0;
    const bucket = pickBucket(ageMinutes);

    const buyerGrowth = normalize(token.buyerCount, maxBuyers) * 100;
    const tradeVolumeMomentum = (normalize(token.tradeCount, maxTrades) * 0.45 + normalize(token.volume, maxVolume) * 0.55) * 100;
    const acceleration = clamp((normalize(token.buyerCount, maxBuyers) + normalize(token.tradeCount, maxTrades)) / 2 + normalize(token.feeValue, maxFees) * 0.2) * 100;
    const ageRelativeStrength = clamp(1 - ageMinutes / 1440) * 100;
    const stabilityQuality = clamp(1 - Math.abs(normalize(token.feeValue, maxFees) - normalize(token.volume, maxVolume))) * 100;

    const breakdown: ScoreBreakdown = {
      buyerGrowth,
      tradeVolumeMomentum,
      acceleration,
      ageRelativeStrength,
      stabilityQuality,
    };

    const babelScore = Number((
      buyerGrowth * 0.30 +
      tradeVolumeMomentum * 0.25 +
      acceleration * 0.20 +
      ageRelativeStrength * 0.15 +
      stabilityQuality * 0.10
    ).toFixed(2));

    const previousRank = historyByBucket[bucket].get(token.mint) ?? null;
    const rankDelta = previousRank ? previousRank - 999 : 0;

    const trend = Array.from({ length: 16 }, (_, n) => {
      const wave = Math.sin((n + 1) * 0.55 + idx * 0.3) * 0.08;
      const baseline = babelScore / 100;
      return Number(clamp(baseline + wave + n * 0.005).toFixed(3));
    });

    return {
      id: token.mint,
      mint: token.mint,
      name: token.name,
      symbol: token.symbol,
      creator: token.creator,
      ageMinutes,
      bucket,
      babelScore,
      rank: 0,
      previousRank,
      rankDelta,
      direction: "flat",
      momentumLabel: "Quiet Climber",
      whyRanked: buildWhyRanked(breakdown),
      metrics: {
        volume: token.volume,
        tradeCount: token.tradeCount,
        buyerCount: token.buyerCount,
        feeValue: token.feeValue,
        price: token.price,
      },
      trend,
      scoreBreakdown: breakdown,
      computedAt: new Date().toISOString(),
    };
  });

  const byBucket: Record<AgeBucket, RankedToken[]> = { "15m": [], "1h": [], "4h": [], "24h": [] };
  for (const item of scored) {
    byBucket[item.bucket].push(item);
  }

  const merged: RankedToken[] = [];

  (Object.keys(byBucket) as AgeBucket[]).forEach((bucket) => {
    const previousByMint = new Map(historic[bucket]?.map((item) => [item.mint, item.rank]) ?? []);

    const sorted = byBucket[bucket]
      .sort((a, b) => {
        const scoreDelta = b.babelScore - a.babelScore;
        if (scoreDelta !== 0) return scoreDelta;

        const ageDelta = a.ageMinutes - b.ageMinutes;
        if (ageDelta !== 0) return ageDelta;

        return a.mint.localeCompare(b.mint);
      })
      .map((item, i) => {
        const rank = i + 1;
        const hasHistory = previousByMint.has(item.mint);
        const previousRank = hasHistory ? (previousByMint.get(item.mint) as number | undefined) ?? null : null;
        const delta = previousRank ? previousRank - rank : 0;
        const direction: RankedToken["direction"] = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

        return {
          ...item,
          rank,
          previousRank,
          rankDelta: delta,
          direction,
          momentumLabel: scoreLabel(item.babelScore, delta),
        };
      });

    for (const token of sorted) {
      merged.push(token);
    }
  });

  return merged;
}
