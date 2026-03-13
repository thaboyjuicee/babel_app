/**
 * Fetch token name + symbol + logo using Helius DAS getAssetBatch.
 *
 * Why this path:
 * - Public/managed RPC providers often restrict getProgramAccounts over the
 *   full Metaplex metadata program.
 * - Helius getAssetBatch is mint-address keyed, works reliably for fungible
 *   tokens, and resolves up to 1000 assets in a single RPC round-trip —
 *   far more efficient than calling getAsset one mint at a time.
 */

const DEFAULT_SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const SOLANA_RPC = process.env.SOLANA_RPC_URL ?? DEFAULT_SOLANA_RPC;

// Helius DAS supports up to 1000 IDs per getAssetBatch call.
const BATCH_SIZE = 1000;

type AssetContent = {
  metadata?: { name?: string; symbol?: string };
  links?: { image?: string };
  files?: Array<{ uri?: string; mime?: string }>;
};

function parseAssetContent(
  id: string,
  content: AssetContent | null | undefined,
): { name: string; symbol: string; logoUri: string } | null {
  const name = content?.metadata?.name?.trim() ?? "";
  const symbol = content?.metadata?.symbol?.trim() ?? "";
  if (!name) return null;

  // Prefer links.image; fall back to first file entry
  const logoUri =
    content?.links?.image?.trim() ||
    content?.files?.find((f) => f.uri)?.uri?.trim() ||
    "";

  return { name, symbol, logoUri };
}

/**
 * Fetch name/symbol/logoUri for a batch of mint addresses using getAssetBatch.
 * Falls back to an empty map if the RPC endpoint does not support the method.
 */
async function fetchAssetBatch(
  mints: string[],
): Promise<Map<string, { name: string; symbol: string; logoUri: string }>> {
  const out = new Map<string, { name: string; symbol: string; logoUri: string }>();
  if (mints.length === 0) return out;

  try {
    const res = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAssetBatch",
        params: { ids: mints },
      }),
    });
    if (!res.ok) return out;

    const json = (await res.json()) as {
      result?: Array<{
        id?: string;
        content?: AssetContent | null;
      } | null>;
      error?: unknown;
    };

    // If the endpoint returned an error or didn't understand the method, bail out.
    if (json.error || !Array.isArray(json.result)) return out;

    for (const asset of json.result) {
      if (!asset?.id) continue;
      const parsed = parseAssetContent(asset.id, asset.content);
      if (parsed) out.set(asset.id, parsed);
    }

    return out;
  } catch {
    return out;
  }
}

/**
 * Fetch name/symbol/logoUri for a batch of mint addresses.
 * Sends up to BATCH_SIZE mints per getAssetBatch RPC call, keeping
 * the number of round-trips to a minimum.
 */
export async function fetchSolanaMetadata(
  mints: string[],
): Promise<Map<string, { name: string; symbol: string; logoUri: string }>> {
  const out = new Map<string, { name: string; symbol: string; logoUri: string }>();
  if (mints.length === 0) return out;

  for (let i = 0; i < mints.length; i += BATCH_SIZE) {
    const slice = mints.slice(i, i + BATCH_SIZE);
    const batchResult = await fetchAssetBatch(slice);
    for (const [mint, meta] of batchResult) {
      out.set(mint, meta);
    }
  }

  return out;
}
