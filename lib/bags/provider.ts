import { MockBagsProvider } from "@/lib/bags/mock-provider";
import { RealBagsProvider } from "@/lib/bags/real-provider";
import type { BagsDataProvider } from "@/lib/bags/types";

export function getBagsProvider(): BagsDataProvider {
  const baseUrl = process.env.BAGS_API_BASE_URL || "https://public-api-v2.bags.fm/api/v1/";
  const apiKey = process.env.BAGS_API_KEY;

  // When an API key is present always use the real provider — never silently fall back to mock.
  if (apiKey) {
    return new RealBagsProvider(baseUrl, apiKey);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("BAGS_API_KEY is required in production. Set it in your environment.");
  }

  return new MockBagsProvider();
}
