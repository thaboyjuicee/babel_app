/**
 * Fetch token name + symbol using Helius DAS getAsset.
 *
 * Why this path:
 * - Public/managed RPC providers often restrict getProgramAccounts over the
 *   full Metaplex metadata program.
 * - Helius getAsset is mint-address keyed and works reliably for fungible tokens.
 */

const DEFAULT_SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const SOLANA_RPC = process.env.SOLANA_RPC_URL ?? DEFAULT_SOLANA_RPC;

async function fetchAssetMeta(
  mint: string,
): Promise<{ name: string; symbol: string } | null> {
  try {
    const res = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAsset",
        params: { id: mint },
      }),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      result?: {
        content?: {
          metadata?: {
            name?: string;
            symbol?: string;
          };
        };
      };
      error?: unknown;
    };

    const name = json?.result?.content?.metadata?.name?.trim() ?? "";
    const symbol = json?.result?.content?.metadata?.symbol?.trim() ?? "";
    if (!name) return null;

    return { name, symbol };
  } catch {
    return null;
  }
}

/**
 * Fetch name/symbol for a batch of mint addresses.
 * Uses low concurrency so the endpoint remains stable during SSR/build.
 */
export async function fetchSolanaMetadata(
  mints: string[],
): Promise<Map<string, { name: string; symbol: string }>> {
  const out = new Map<string, { name: string; symbol: string }>();
  if (mints.length === 0) return out;

  const CONCURRENCY = 6;
  for (let i = 0; i < mints.length; i += CONCURRENCY) {
    const slice = mints.slice(i, i + CONCURRENCY);
    const metas = await Promise.all(slice.map((mint) => fetchAssetMeta(mint)));

    for (let j = 0; j < slice.length; j += 1) {
      const meta = metas[j];
      if (meta) out.set(slice[j], meta);
    }
  }

  return out;
}
