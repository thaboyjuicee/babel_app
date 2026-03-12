import type { BagsTokenRaw } from "@/types/babel";
import type { BagsDataProvider } from "@/lib/bags/types";
import { dexScreenerEnrich } from "@/lib/bags/dexscreener";
import { fetchSolanaMetadata } from "@/lib/bags/solana-meta";

// How many most-recent tokens (by list position) to enrich with DexScreener.
// Overridable via BABEL_ENRICH_WINDOW env var.
const DEFAULT_ENRICH_WINDOW = 1000;

function getEnrichWindow(): number {
  const v = parseInt(process.env.BABEL_ENRICH_WINDOW ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_ENRICH_WINDOW;
}

// Ordered list of paths to try until one succeeds.
// Keep legacy guesses at the end for backward compatibility.
const CANDIDATE_PATHS = [
  "solana/bags/pools",
  "token-launch/creators",
  "pools",
  "tokens",
  "coins",
  "markets",
  "token/list",
];

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

// Extracts the token-level sub-object from a pool record if the API wraps tokens inside pools.
function unwrap(raw: Record<string, unknown>): Record<string, unknown> {
  const inner = raw?.token || raw?.tokenInfo || raw?.baseToken || raw?.coin;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    // Merge parent-level stats (volume, trades, etc.) into token fields
    return { ...raw, ...(inner as Record<string, unknown>) };
  }
  return raw;
}

export function normalizeToken(raw: Record<string, unknown>): BagsTokenRaw | null {
  const unwrapped = unwrap(raw);

  const mint = toStringValue(
    unwrapped?.mint ||
    unwrapped?.tokenMint ||
    unwrapped?.address ||
    unwrapped?.contractAddress ||
    unwrapped?.poolAddress ||
    unwrapped?.id,
  );
  if (!mint) return null;

  return {
    mint,
    name: toStringValue(unwrapped?.name || unwrapped?.tokenName, "Unknown Token"),
    symbol: toStringValue(unwrapped?.symbol || unwrapped?.tokenSymbol, "UNK"),
    creator: toStringValue(
      unwrapped?.creator || unwrapped?.owner || unwrapped?.deployer || unwrapped?.authority,
      "unknown",
    ),
    createdAt: toStringValue(
      unwrapped?.createdAt ||
      unwrapped?.created_at ||
      unwrapped?.timestamp ||
      unwrapped?.launchTime ||
      unwrapped?.deployedAt,
      new Date().toISOString(),
    ),
    price: toNumber(
      unwrapped?.price ||
      unwrapped?.lastPrice ||
      unwrapped?.priceUsd ||
      unwrapped?.currentPrice,
    ),
    volume: toNumber(
      unwrapped?.volume ||
      unwrapped?.volume24h ||
      unwrapped?.volume_24h ||
      unwrapped?.volumeUsd,
    ),
    tradeCount: toNumber(
      unwrapped?.tradeCount ||
      unwrapped?.trades ||
      unwrapped?.trade_count ||
      unwrapped?.txCount ||
      unwrapped?.transactions,
    ),
    buyerCount: toNumber(
      unwrapped?.buyerCount ||
      unwrapped?.buyers ||
      unwrapped?.buyer_count ||
      unwrapped?.uniqueBuyers ||
      unwrapped?.holders,
    ),
    feeValue: toNumber(
      unwrapped?.feeValue ||
      unwrapped?.fees ||
      unwrapped?.fee_value ||
      unwrapped?.feesUsd ||
      unwrapped?.revenue,
    ),
    hasLiveActivity: false,
  };
}

export class RealBagsProvider implements BagsDataProvider {
  source = "real" as const;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private get headers() {
    return {
      "x-api-key": this.apiKey,
      "content-type": "application/json",
    };
  }

  private async tryPath(path: string): Promise<{ ok: boolean; status: number; tokens: BagsTokenRaw[] }> {
    const url = `${this.baseUrl.replace(/\/+$/, "")}/${path}`;
    try {
      const res = await fetch(url, {
        headers: this.headers,
        next: { revalidate: 60 },
      });
      if (!res.ok) return { ok: false, status: res.status, tokens: [] };

      const payload = await res.json();
      const candidate: unknown =
        Array.isArray(payload)
          ? payload
          : payload?.response ?? payload?.data ?? payload?.tokens ?? payload?.pools ?? payload?.results ?? payload?.items ?? [];

      if (!Array.isArray(candidate)) return { ok: true, status: res.status, tokens: [] };

      const tokens = (candidate as Record<string, unknown>[])
        .map(normalizeToken)
        .filter((item): item is BagsTokenRaw => Boolean(item));

      return { ok: true, status: res.status, tokens };
    } catch {
      return { ok: false, status: 0, tokens: [] };
    }
  }

  /**
   * Fetch the set of token mints that have migrated to Meteora DAMM v2.
   * These are indexed by DexScreener and have real trading data available.
   */
  private async fetchMigratedMints(basePath: string): Promise<Set<string>> {
    try {
      const url = `${this.baseUrl.replace(/\/+$/, "")}/${basePath}?onlyMigrated=true`;
      const res = await fetch(url, { headers: this.headers, next: { revalidate: 300 } });
      if (!res.ok) return new Set();
      const payload = await res.json();
      const candidate = Array.isArray(payload)
        ? payload
        : (payload?.response ?? payload?.data ?? []);
      if (!Array.isArray(candidate)) return new Set();
      return new Set(
        (candidate as Record<string, unknown>[])
          .map((r) => String(r.tokenMint ?? r.mint ?? ""))
          .filter(Boolean),
      );
    } catch {
      return new Set();
    }
  }

  /**
   * Enrich migrated tokens with DexScreener (real timestamps + trading metrics),
   * and fill the rest with the most recent non-migrated tokens using index-based
   * synthetic ages to populate all four age buckets.
   */
  private async enrichAndDistribute(
    basicTokens: BagsTokenRaw[],
    migratedMints: Set<string>,
  ): Promise<BagsTokenRaw[]> {
    const total = basicTokens.length;
    if (total === 0) return [];

    // Enrich migrated tokens (on Meteora DAMM v2 = DexScreener indexed)
    const mintsToEnrich =
      migratedMints.size > 0
        ? basicTokens.filter((t) => migratedMints.has(t.mint)).map((t) => t.mint)
        : basicTokens.slice(Math.max(0, total - getEnrichWindow())).map((t) => t.mint);

    const enrichMap = await dexScreenerEnrich(mintsToEnrich);

    // Apply DexScreener data to migrated tokens
    const enrichedTokens = basicTokens
      .filter((t) => enrichMap.has(t.mint))
      .map((t): BagsTokenRaw => {
        const dex = enrichMap.get(t.mint)!;
        return {
          ...t,
          name: dex.name || t.name,
          symbol: dex.symbol || t.symbol,
          createdAt: dex.pairCreatedAt > 0 ? new Date(dex.pairCreatedAt).toISOString() : t.createdAt,
          price: dex.priceUsd,
          volume: dex.volume24h,
          tradeCount: dex.txBuys24h + dex.txSells24h,
          buyerCount: dex.txBuys24h,
          feeValue: dex.volume24h * 0.01,
          hasLiveActivity: true,
        };
      });

    // Recent non-migrated tokens with index-based synthetic age (newest = now, oldest = 24h ago)
    const windowSize = Math.min(total, getEnrichWindow());
    const recentNonEnriched = basicTokens
      .slice(Math.max(0, total - windowSize))
      .filter((t) => !enrichMap.has(t.mint));

    // Fetch on-chain Metaplex name/symbol for the most recent synthetic tokens only
    // (capped to avoid public RPC rate limits — older tokens stay as shortened mint IDs)
    const META_CAP = 60;
    const toNameLookup = recentNonEnriched.slice(-META_CAP).map((t) => t.mint);
    const metaMap = await fetchSolanaMetadata(toNameLookup);
    console.log(`[Babel] Solana metadata resolved ${metaMap.size}/${toNameLookup.length} synthetic tokens`);

    const now = Date.now();
    const HOURS_24 = 24 * 60 * 60 * 1000;
    const syntheticTokens = recentNonEnriched.map((token, idx, arr): BagsTokenRaw => {
      const meta = metaMap.get(token.mint);
      const short = token.mint.slice(0, 6);
      const fraction = idx / Math.max(1, arr.length - 1);
      return {
        ...token,
        name: meta?.name || `Bags ${short}…`,
        symbol: meta?.symbol || short,
        createdAt: new Date(now - (1 - fraction) * HOURS_24).toISOString(),
        hasLiveActivity: false,
      };
    });

    console.log(
      `[Babel] Universe: ${enrichedTokens.length} real (DexScreener) + ${syntheticTokens.length} synthetic`,
    );
    return [...enrichedTokens, ...syntheticTokens];
  }

  async getTokenUniverse(): Promise<BagsTokenRaw[]> {
    const pinnedPath = process.env.BAGS_API_TOKENS_PATH;
    const candidatePaths = [
      ...(pinnedPath ? [pinnedPath] : []),
      ...CANDIDATE_PATHS,
    ];
    const seen = new Set<string>();
    const attempts = candidatePaths.filter((path) => {
      if (seen.has(path)) return false;
      seen.add(path);
      return true;
    });

    const errors: string[] = [];
    for (const path of attempts) {
      const result = await this.tryPath(path);
      if (!result.ok) {
        errors.push(`/${path}: status ${result.status}`);
        continue;
      }
      if (result.tokens.length === 0) {
        errors.push(`/${path}: empty`);
        continue;
      }

      const migratedMints = await this.fetchMigratedMints(path);
      console.log(`[Babel] Bags API: using /${path} (${result.tokens.length} total, ${migratedMints.size} migrated)`);
      return this.enrichAndDistribute(result.tokens, migratedMints);
    }

    throw new Error(
      `Bags API returned no usable data. Tried: ${errors.join(", ")}. ` +
      `Set BAGS_API_TOKENS_PATH in .env.local to pin the correct endpoint. ` +
      `Current base URL: ${this.baseUrl}`,
    );
  }

  /** Probe all candidate paths — for the /api/debug/probe endpoint. */
  async probeAll(): Promise<Record<string, { status: number; count: number }>> {
    const results = await Promise.all(
      CANDIDATE_PATHS.map(async (path) => {
        const r = await this.tryPath(path);
        return [path, { status: r.status, count: r.tokens.length }] as const;
      }),
    );
    return Object.fromEntries(results);
  }
}
