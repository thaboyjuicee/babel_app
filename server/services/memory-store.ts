import type { RankedToken } from "@/types/babel";

type SnapshotStore = {
  historyByBucket: Record<string, RankedToken[]>;
  latest: RankedToken[];
  updatedAt: string;
  source: "mock" | "real";
  lastRefreshError?: string | null;
};

const globalStore = globalThis as typeof globalThis & { __babelStore?: SnapshotStore };

export function getMemoryStore(): SnapshotStore {
    if (!globalStore.__babelStore) {
      globalStore.__babelStore = {
        historyByBucket: {},
        latest: [],
        updatedAt: new Date(0).toISOString(),
        source: "mock",
        lastRefreshError: null,
      };
    }
  return globalStore.__babelStore;
}
