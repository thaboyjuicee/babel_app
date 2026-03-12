export type AgeBucket = "15m" | "1h" | "4h" | "24h";

export const AGE_BUCKETS: { key: AgeBucket; label: string; description: string; maxMinutes: number }[] = [
  { key: "15m", label: "15m", description: "Under 15 minutes old", maxMinutes: 15 },
  { key: "1h", label: "1h", description: "Under 1 hour old", maxMinutes: 60 },
  { key: "4h", label: "4h", description: "Under 4 hours old", maxMinutes: 240 },
  { key: "24h", label: "24h", description: "Under 24 hours old", maxMinutes: 1440 },
];

export type MomentumLabel =
  | "Rising Fast"
  | "Quiet Climber"
  | "Near Breakout"
  | "Stable High"
  | "Losing Steam";

export const MOMENTUM_COLORS = {
  "Rising Fast": { text: "text-emerald-400", bg: "bg-emerald-400/10", glow: "rgba(52,211,153,0.25)" },
  "Quiet Climber": { text: "text-cyan-400", bg: "bg-cyan-400/10", glow: "rgba(34,211,238,0.15)" },
  "Near Breakout": { text: "text-amber-400", bg: "bg-amber-400/10", glow: "rgba(251,191,36,0.20)" },
  "Stable High": { text: "text-blue-400", bg: "bg-blue-400/10", glow: "rgba(96,165,250,0.15)" },
  "Losing Steam": { text: "text-rose-400", bg: "bg-rose-400/10", glow: "rgba(251,113,133,0.15)" },
} as const;

export type Direction = "up" | "down" | "flat";

export type TokenEntity = {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  creator: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type TokenSnapshotEntity = {
  id: string;
  tokenId: string;
  capturedAt: string;
  price: number;
  volume: number;
  tradeCount: number;
  buyerCount: number;
  feeValue: number;
  rawData?: Record<string, unknown>;
};

export type ScoreBreakdown = {
  buyerGrowth: number;
  tradeVolumeMomentum: number;
  acceleration: number;
  ageRelativeStrength: number;
  stabilityQuality: number;
};

export type RankedToken = {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  creator: string;
  ageMinutes: number;
  bucket: AgeBucket;
  babelScore: number;
  rank: number;
  previousRank: number | null;
  rankDelta: number;
  direction: Direction;
  momentumLabel: MomentumLabel;
  whyRanked: string;
  metrics: {
    volume: number;
    tradeCount: number;
    buyerCount: number;
    feeValue: number;
    price: number;
  };
  hasLiveActivity: boolean;
  logoUri?: string;
  trend: number[];
  scoreBreakdown: ScoreBreakdown;
  computedAt: string;
};

export type BagsTokenRaw = {
  mint: string;
  name: string;
  symbol: string;
  creator: string;
  createdAt: string;
  price: number;
  volume: number;
  tradeCount: number;
  buyerCount: number;
  feeValue: number;
  hasLiveActivity: boolean;
  logoUri?: string;
};

export type TowerResponse = {
  bucket: AgeBucket;
  updatedAt: string;
  tokens: RankedToken[];
  source: "mock" | "real";
  error?: string;
};
