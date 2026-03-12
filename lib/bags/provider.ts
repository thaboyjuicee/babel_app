import { MockBagsProvider } from "@/lib/bags/mock-provider";
import { RealBagsProvider } from "@/lib/bags/real-provider";
import type { BagsDataProvider } from "@/lib/bags/types";

export function getBagsProvider(): BagsDataProvider {
  const baseUrl = process.env.BAGS_API_BASE_URL || "https://public-api-v2.bags.fm/api/v1/";
  const apiKey = process.env.BAGS_API_KEY;

  if (!apiKey) {
    return new MockBagsProvider();
  }

  return new RealBagsProvider(baseUrl, apiKey);
}
