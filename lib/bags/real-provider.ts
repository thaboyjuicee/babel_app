import type { BagsTokenRaw } from "@/types/babel";
import type { BagsDataProvider } from "@/lib/bags/types";

// Ordered list of paths to try until one succeeds.
const CANDIDATE_PATHS = ["pools", "tokens", "coins", "markets", "token/list"];

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
          : payload?.data ?? payload?.tokens ?? payload?.pools ?? payload?.results ?? payload?.items ?? [];

      if (!Array.isArray(candidate)) return { ok: true, status: res.status, tokens: [] };

      const tokens = (candidate as Record<string, unknown>[])
        .map(normalizeToken)
        .filter((item): item is BagsTokenRaw => Boolean(item));

      return { ok: true, status: res.status, tokens };
    } catch {
      return { ok: false, status: 0, tokens: [] };
    }
  }

  async getTokenUniverse(): Promise<BagsTokenRaw[]> {
    // If the user has pinned a specific path, use it directly.
    const pinnedPath = process.env.BAGS_API_TOKENS_PATH;
    if (pinnedPath) {
      const result = await this.tryPath(pinnedPath);
      if (!result.ok) throw new Error(`Bags API ${pinnedPath} returned ${result.status}`);
      return result.tokens;
    }

    // Auto-discover: walk candidate paths and use first that responds with data.
    const errors: string[] = [];
    for (const path of CANDIDATE_PATHS) {
      const result = await this.tryPath(path);
      if (result.ok && result.tokens.length > 0) {
        console.log(`[Babel] Bags API: using /${path} (${result.tokens.length} tokens)`);
        return result.tokens;
      }
      errors.push(`/${path}: ${result.ok ? "empty" : result.status}`);
    }

    throw new Error(
      `Bags API returned no usable data. Tried: ${errors.join(", ")}. ` +
      `Set BAGS_API_TOKENS_PATH in .env.local to pin the correct endpoint.`,
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
