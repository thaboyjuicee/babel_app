import { unstable_cache } from "next/cache";
import { AGE_BUCKETS, type AgeBucket, type TowerResponse } from "@/types/babel";
import { getTowerData } from "@/server/services/babel-service";

const getCachedTower = unstable_cache(
  async (bucket: AgeBucket): Promise<TowerResponse> => getTowerData(bucket),
  ["babel-tower-cache"],
  { revalidate: 45, tags: ["babel-tower"] },
);

export async function getHomeData(defaultBucket: AgeBucket = "1h") {
  const entries = await Promise.all(
    AGE_BUCKETS.map(async (bucket) => {
      try {
        const data = await getCachedTower(bucket.key);
        return [bucket.key, data] as const;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const empty: TowerResponse = {
          bucket: bucket.key,
          updatedAt: new Date().toISOString(),
          tokens: [],
          source: "real",
          error: errorMessage,
        };
        return [bucket.key, empty] as const;
      }
    }),
  );

  return {
    initialBucket: defaultBucket,
    towerByBucket: Object.fromEntries(entries) as Record<AgeBucket, TowerResponse>,
  };
}
