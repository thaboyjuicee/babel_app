/**
 * DexScreener enrichment for Bags token universe.
 * Used to obtain real creation timestamps and trading metrics, since the Bags
 * pools API only returns pool keys (no stats).
 */

export type DexEnrichment = {
  name: string;
  symbol: string;
  pairCreatedAt: number; // unix ms
  priceUsd: number;
  volume24h: number;
  volume1h: number;
  volume5m: number;
  txBuys24h: number;
  txBuys1h: number;
  txSells24h: number;
  liquidity: number;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Fetch enrichment data from DexScreener for a list of token mint addresses.
 * Returns a Map of mint → best (most liquid) pair data.
 * Batches 30 mints per request, all batches run in parallel.
 */
export async function dexScreenerEnrich(
  mints: string[],
): Promise<Map<string, DexEnrichment>> {
  const result = new Map<string, DexEnrichment>();
  if (mints.length === 0) return result;

  const batches = chunk(mints, 30);

  // Process 4 batches at a time — fully parallel saturates DexScreener rate limits.
  const CONCURRENCY = 4;
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    await Promise.all(
      batches.slice(i, i + CONCURRENCY).map(async (batch) => {
        try {
          const url = `https://api.dexscreener.com/latest/dex/tokens/${batch.join(",")}`;
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`[Babel] DexScreener batch returned ${res.status}`);
            return;
          }

          const json = (await res.json()) as { pairs?: unknown[] };
          const pairs = (json?.pairs ?? []) as Record<string, unknown>[];

          for (const pair of pairs) {
            const baseToken = pair?.baseToken as Record<string, string> | undefined;
            const mint = baseToken?.address;
            if (!mint) continue;

            const liquidity = Number(
              (pair?.liquidity as Record<string, number> | undefined)?.usd ?? 0,
            );
            const existing = result.get(mint);
            if (existing && existing.liquidity >= liquidity) continue;

            const vol = pair?.volume as Record<string, number> | undefined;
            const txns = pair?.txns as
              | Record<string, Record<string, number>>
              | undefined;

            result.set(mint, {
              name: baseToken?.name ?? "",
              symbol: baseToken?.symbol ?? "",
              pairCreatedAt: Number(pair?.pairCreatedAt ?? 0),
              priceUsd: parseFloat(String(pair?.priceUsd ?? "0")) || 0,
              volume24h: vol?.h24 ?? 0,
              volume1h: vol?.h1 ?? 0,
              volume5m: vol?.m5 ?? 0,
              txBuys24h: txns?.h24?.buys ?? 0,
              txBuys1h: txns?.h1?.buys ?? 0,
              txSells24h: txns?.h24?.sells ?? 0,
              liquidity,
            });
          }
        } catch (err) {
          console.warn(`[Babel] DexScreener batch error:`, err instanceof Error ? err.message : String(err));
        }
      }),
    );
  }

  return result;
}
