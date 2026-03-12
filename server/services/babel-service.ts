import { AGE_BUCKETS, type AgeBucket, type RankedToken, type TowerResponse } from "@/types/babel";
import { getBagsProvider } from "@/lib/bags/provider";
import { computeBabelRankings } from "@/lib/scoring/babel-score";
import { prisma } from "@/lib/db/prisma";
import { getMemoryStore } from "@/server/services/memory-store";

const REVALIDATE_MS = 45_000;

function shouldRefresh(lastUpdated: string) {
  return Date.now() - new Date(lastUpdated).getTime() > REVALIDATE_MS;
}

async function saveToDatabase(rankings: RankedToken[]): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  for (const ranked of rankings) {
    const token = await prisma.token.upsert({
      where: { mint: ranked.mint },
      update: {
        name: ranked.name,
        symbol: ranked.symbol,
        creator: ranked.creator,
        createdAt: new Date(Date.now() - ranked.ageMinutes * 60_000),
      },
      create: {
        mint: ranked.mint,
        name: ranked.name,
        symbol: ranked.symbol,
        creator: ranked.creator,
        createdAt: new Date(Date.now() - ranked.ageMinutes * 60_000),
      },
    });

    await prisma.tokenSnapshot.create({
      data: {
        tokenId: token.id,
        capturedAt: new Date(ranked.computedAt),
        price: ranked.metrics.price,
        volume: ranked.metrics.volume,
        tradeCount: ranked.metrics.tradeCount,
        buyerCount: ranked.metrics.buyerCount,
        feeValue: ranked.metrics.feeValue,
      },
    });

    await prisma.tokenRanking.create({
      data: {
        tokenId: token.id,
        bucket: ranked.bucket,
        babelScore: ranked.babelScore,
        rank: ranked.rank,
        previousRank: ranked.previousRank,
        rankDelta: ranked.rankDelta,
        momentumLabel: ranked.momentumLabel,
        computedAt: new Date(ranked.computedAt),
      },
    });
  }
}

async function refreshRankings(force = false): Promise<void> {
  const store = getMemoryStore();
  if (!force && !shouldRefresh(store.updatedAt) && store.latest.length > 0) {
    return;
  }

  const provider = getBagsProvider();
  const universe = await provider.getTokenUniverse();

  const historic = Object.fromEntries(
    AGE_BUCKETS.map((bucket) => [bucket.key, store.latest.filter((token) => token.bucket === bucket.key)]),
  ) as Record<AgeBucket, RankedToken[]>;

  const rankings = computeBabelRankings(universe, historic);

  store.latest = rankings;
  store.updatedAt = new Date().toISOString();
  store.source = provider.source;

  for (const bucket of AGE_BUCKETS) {
    store.historyByBucket[bucket.key] = rankings.filter((token) => token.bucket === bucket.key);
  }

  if (process.env.DATABASE_URL) {
    await saveToDatabase(rankings);
  }
}

export async function getTowerData(bucket: AgeBucket): Promise<TowerResponse> {
  await refreshRankings();
  const store = getMemoryStore();
  return {
    bucket,
    updatedAt: store.updatedAt,
    source: store.source,
    tokens: store.latest.filter((token) => token.bucket === bucket),
  };
}

export async function getTopMovers(bucket: AgeBucket, direction: "up" | "down", limit = 8): Promise<RankedToken[]> {
  const data = await getTowerData(bucket);
  return data.tokens
    .filter((token) => (direction === "up" ? token.rankDelta > 0 : token.rankDelta < 0))
    .sort((a, b) => (direction === "up" ? b.rankDelta - a.rankDelta : a.rankDelta - b.rankDelta))
    .slice(0, limit);
}

export async function getBreakoutTokens(bucket: AgeBucket, limit = 8): Promise<RankedToken[]> {
  const data = await getTowerData(bucket);
  return data.tokens
    .filter((token) => token.momentumLabel === "Near Breakout" || token.rank <= 6)
    .sort((a, b) => b.babelScore - a.babelScore)
    .slice(0, limit);
}

export async function getTokenById(id: string): Promise<RankedToken | null> {
  await refreshRankings();
  const store = getMemoryStore();
  return store.latest.find((token) => token.id === id || token.mint === id) ?? null;
}

export async function runIngestionNow(): Promise<{ captured: number; updatedAt: string; source: "mock" | "real" }> {
  await refreshRankings(true);
  const store = getMemoryStore();
  return {
    captured: store.latest.length,
    updatedAt: store.updatedAt,
    source: store.source,
  };
}
