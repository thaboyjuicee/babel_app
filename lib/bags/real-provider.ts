import type { BagsTokenRaw } from "@/types/babel";
import type { BagsDataProvider } from "@/lib/bags/types";

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

function normalizeToken(raw: Record<string, unknown>): BagsTokenRaw | null {
  const mint = toStringValue(raw?.mint || raw?.tokenMint || raw?.address);
  if (!mint) return null;

  return {
    mint,
    name: toStringValue(raw?.name, "Unknown Token"),
    symbol: toStringValue(raw?.symbol, "UNK"),
    creator: toStringValue(raw?.creator || raw?.owner, "unknown"),
    createdAt: toStringValue(raw?.createdAt || raw?.created_at || raw?.timestamp, new Date().toISOString()),
    price: toNumber(raw?.price || raw?.lastPrice),
    volume: toNumber(raw?.volume || raw?.volume24h || raw?.volume_24h),
    tradeCount: toNumber(raw?.tradeCount || raw?.trades || raw?.trade_count),
    buyerCount: toNumber(raw?.buyerCount || raw?.buyers || raw?.buyer_count),
    feeValue: toNumber(raw?.feeValue || raw?.fees || raw?.fee_value),
  };
}

export class RealBagsProvider implements BagsDataProvider {
  source = "real" as const;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async getTokenUniverse(): Promise<BagsTokenRaw[]> {
    const url = `${this.baseUrl.replace(/\/+$/, "")}/tokens`;
    const res = await fetch(url, {
      headers: {
        "x-api-key": this.apiKey,
        "content-type": "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Bags API failed (${res.status})`);
    }

    const payload = await res.json();
    const candidate = Array.isArray(payload) ? payload : payload?.data || payload?.tokens || [];

    if (!Array.isArray(candidate)) {
      return [];
    }

    return (candidate as Record<string, unknown>[])
      .map(normalizeToken)
      .filter((item): item is BagsTokenRaw => Boolean(item));
  }
}
