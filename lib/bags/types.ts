import type { BagsTokenRaw } from "@/types/babel";

export interface BagsDataProvider {
  source: "mock" | "real";
  getTokenUniverse(): Promise<BagsTokenRaw[]>;
}
