import { AGE_BUCKETS, type AgeBucket, type BagsTokenRaw, type RankedToken, type TowerResponse } from "@/types/babel";
import { getBagsProvider } from "@/lib/bags/provider";
import { computeBabelRankings } from "@/lib/scoring/babel-score";
import { prisma } from "@/lib/db/prisma";
import { getMemoryStore } from "@/server/services/memory-store";

const REVALIDATE_MS = 45_000;
const DEFAULT_RANKING_RETENTION_HOURS = 24;
const DEFAULT_SNAPSHOT_RETENTION_DAYS = 7;
const DEFAULT_MAX_UNIVERSE_SIZE = 12_000;
const DEFAULT_BUCKET_LIMIT = 120;
const DEFAULT_DB_SAVE_LIMIT = 1_000;

let refreshInFlight: Promise<void> | null = null;

function parseEnvInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.trunc(parsed);
}

function getRankingRetentionCutoff(now = new Date()) {
  const hours = parseEnvInteger(process.env.BABEL_RANKING_RETENTION_HOURS, DEFAULT_RANKING_RETENTION_HOURS);
  return new Date(now.getTime() - hours * 60 * 60_000);
}

function getSnapshotRetentionCutoff(now = new Date()) {
  const days = parseEnvInteger(process.env.BABEL_SNAPSHOT_RETENTION_DAYS, DEFAULT_SNAPSHOT_RETENTION_DAYS);
  return new Date(now.getTime() - days * 24 * 60 * 60_000);
}

function shouldRefresh(lastUpdated: string) {
  return Date.now() - new Date(lastUpdated).getTime() > REVALIDATE_MS;
}

function getMaxUniverseSize(): number {
  return parseEnvInteger(process.env.BABEL_MAX_UNIVERSE_SIZE, DEFAULT_MAX_UNIVERSE_SIZE);
}

function getBucketLimit(): number {
  return parseEnvInteger(process.env.BABEL_BUCKET_LIMIT, DEFAULT_BUCKET_LIMIT);
}

function getDbSaveLimit(): number {
  return parseEnvInteger(process.env.BABEL_DB_SAVE_LIMIT, DEFAULT_DB_SAVE_LIMIT);
}

function scoreUniversePriority(token: BagsTokenRaw): number {
  const ageMinutes = Math.max(0, (Date.now() - new Date(token.createdAt).getTime()) / 60_000);
  const recencyBoost = Number.isFinite(ageMinutes) ? Math.max(0, 1_440 - ageMinutes) : 0;
  return token.volume * 0.55 + token.tradeCount * 0.25 + token.buyerCount * 0.15 + token.feeValue * 0.05 + recencyBoost;
}

function limitUniverse(universe: BagsTokenRaw[]): BagsTokenRaw[] {
  const maxUniverse = getMaxUniverseSize();
  if (universe.length <= maxUniverse) return universe;

  return [...universe]
    .sort((a, b) => scoreUniversePriority(b) - scoreUniversePriority(a))
    .slice(0, maxUniverse);
}

async function cleanupRetentionWindows() {
  const now = new Date();
  const rankingCutoff = getRankingRetentionCutoff(now);
  const snapshotCutoff = getSnapshotRetentionCutoff(now);

  await prisma.$transaction([
    prisma.tokenSnapshot.deleteMany({ where: { capturedAt: { lt: snapshotCutoff } } }),
    prisma.tokenRanking.deleteMany({ where: { computedAt: { lt: rankingCutoff } } }),
    prisma.token.deleteMany({
      where: {
        snapshots: { none: {} },
        rankings: { none: {} },
      },
    }),
  ]);
}

async function saveToDatabase(rankings: RankedToken[]): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  const writeLimit = getDbSaveLimit();
  const rankingsToPersist = rankings.slice(0, writeLimit);

  await cleanupRetentionWindows();

  for (const ranked of rankingsToPersist) {
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
  if (refreshInFlight) {
    await refreshInFlight;
    return;
  }

  refreshInFlight = (async () => {
    const store = getMemoryStore();
    if (!force && !shouldRefresh(store.updatedAt) && store.latest.length > 0) {
      return;
    }

    const provider = getBagsProvider();
    let universe: BagsTokenRaw[] = [];
    let refreshError: string | null = null;
    try {
      universe = await provider.getTokenUniverse();
    } catch (error) {
      if (store.latest.length > 0) {
        refreshError = error instanceof Error ? error.message : String(error);
        console.error(
          `[Babel] Failed to refresh token universe (${provider.source}); reusing ${store.latest.length} cached tokens`,
          error,
        );
        store.lastRefreshError = refreshError;
        return;
      }
      store.lastRefreshError = error instanceof Error ? error.message : String(error);
      throw error;
    }

    store.lastRefreshError = null;
    const scoringUniverse = limitUniverse(universe);

    const historic = Object.fromEntries(
      AGE_BUCKETS.map((bucket) => [bucket.key, store.latest.filter((token) => token.bucket === bucket.key)]),
    ) as Record<AgeBucket, RankedToken[]>;

    const rankings = computeBabelRankings(scoringUniverse, historic);
    const bucketLimit = getBucketLimit();
    const compactLatest: RankedToken[] = [];

    for (const bucket of AGE_BUCKETS) {
      const bucketTokens = rankings
        .filter((token) => token.bucket === bucket.key)
        .slice(0, bucketLimit);
      store.historyByBucket[bucket.key] = bucketTokens;
      for (const token of bucketTokens) {
        compactLatest.push(token);
      }
    }

    store.latest = compactLatest;
    store.updatedAt = new Date().toISOString();
    store.source = provider.source;

    if (process.env.DATABASE_URL) {
      try {
        await saveToDatabase(compactLatest);
      } catch (error) {
        const dbError = error instanceof Error ? error.message : String(error);
        store.lastRefreshError = `Database persistence unavailable: ${dbError}`;
        console.error("[Babel] Database persistence failed:", error);
      }
    }
  })();

  try {
    await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function getTowerData(bucket: AgeBucket): Promise<TowerResponse> {
  await refreshRankings();
  const store = getMemoryStore();
  return {
    bucket,
    updatedAt: store.updatedAt,
    source: store.source,
    error: store.lastRefreshError ?? undefined,
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
