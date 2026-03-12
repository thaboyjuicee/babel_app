import { MockBagsProvider } from "@/lib/bags/mock-provider";
import { computeBabelRankings } from "@/lib/scoring/babel-score";
import { getMemoryStore } from "@/server/services/memory-store";
import { AGE_BUCKETS } from "@/types/babel";

async function main() {
  const provider = new MockBagsProvider();
  const universe = await provider.getTokenUniverse();
  const rankings = computeBabelRankings(universe, {});

  const store = getMemoryStore();
  store.latest = rankings;
  store.updatedAt = new Date().toISOString();
  store.source = "mock";
  for (const bucket of AGE_BUCKETS) {
    store.historyByBucket[bucket.key] = rankings.filter((t) => t.bucket === bucket.key);
  }

  console.log(`Seeded ${rankings.length} tokens from mock provider at ${store.updatedAt}`);
}

main().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
