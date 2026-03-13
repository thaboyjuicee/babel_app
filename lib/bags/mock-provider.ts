import type { BagsTokenRaw } from "@/types/babel";
import type { BagsDataProvider } from "@/lib/bags/types";

const TOKEN_NAMES = [
  "Flux","Nova","Kite","Arc","Pulse","Helio","Nyx","Byte","Rune","Echo","Prism","Atlas","Cinder","Bloom","Quill","Volt","Orbit","Shore","Drift","Vanta",
];

function seeded(index: number, factor = 1): number {
  const x = Math.sin(index * 12.9898 + factor * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function makeAddress(seed: number): string {
  return `0x${Math.floor(seeded(seed) * 10 ** 16)
    .toString(16)
    .padStart(16, "0")}${Math.floor(seeded(seed + 2) * 10 ** 16)
    .toString(16)
    .padStart(16, "0")}`;
}

export class MockBagsProvider implements BagsDataProvider {
  source = "mock" as const;

  async getTokenUniverse(): Promise<BagsTokenRaw[]> {
    const now = Date.now();
    const total = 48;

    return Array.from({ length: total }).map((_, i) => {
      const ageMinutes = Math.floor(2 + seeded(i, 3) * 1400);
      const createdAt = new Date(now - ageMinutes * 60_000).toISOString();
      const base = 20 + seeded(i, 5) * 220;
      const momentum = 0.65 + seeded(i, 9);

      const name = TOKEN_NAMES[i % TOKEN_NAMES.length];
      const symbol = `${name.slice(0, 3).toUpperCase()}${(i % 9) + 1}`;

      return {
        mint: makeAddress(i + 10),
        name: `${name} Bag`,
        symbol,
        creator: makeAddress(i + 100),
        createdAt,
        price: Number((0.00005 + seeded(i, 11) * 0.002).toFixed(8)),
        volume: Number((base * momentum * (1 + seeded(i, 7))).toFixed(2)),
        tradeCount: Math.round(15 + base * 0.7 + seeded(i, 13) * 80),
        buyerCount: Math.round(8 + base * 0.4 + seeded(i, 17) * 40),
        feeValue: Number((base * 0.018 + seeded(i, 23) * 8).toFixed(2)),
        hasLiveActivity: true,
        dataSource: "mock" as const,
      };
    });
  }
}
