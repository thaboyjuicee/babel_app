# Babel

## Overview

Babel is a Bags-native momentum tracker for newly launched Solana tokens. It continuously ingests token candidates, enriches them with trading/metadata signals, computes a normalized **Babel Score**, and renders ranked towers across four age windows:

- `15m`
- `1h`
- `4h`
- `24h`

The system is designed for both production use (with real external data) and local development (with deterministic mock data).

## Vision

Catch active momentum early:
- **who** is climbing,
- **which** tokens are close to breakout,
- **who** is still `Quiet Climber`,
- and **which** ones are starting to lose steam.

All data is surfaced as ranked lists and a token detail flow that supports trend/score inspection.

---

## Tech stack

- **Framework:** Next.js 16 (App Router) with React Server Components for initial page data
- **Styling:** Tailwind CSS 4
- **Motion:** Framer Motion
- **ORM:** Prisma 6 with PostgreSQL
- **API/data enrichment:** Bags API, DexScreener, Solana RPC (getAssetBatch)
- **Runtime:** Node.js 22 on Railway, local `npm` workflow

---

## Repository layout

- `app/`
  - `page.tsx`: server page that preloads all four buckets.
  - `api/`: internal endpoints consumed by UI and ops tooling.
- `components/babel/`
  - `BabelHome`: client shell for auto-refresh, bucket switching, and panel rendering.
  - `TowerView`: ranked column view.
  - `SectionPanel`: climber/breakout/loss panels.
  - `TokenDetailDrawer`: modal details for one token.
  - `HowItWorksSection`, `HeroSection`, `AgeBucketTabs`, etc.
- `server/services/`
  - `babel-service.ts`: ranking orchestration, caching, fallback, persistence.
  - `home-data.ts`: preloads all buckets for first paint with Next cache.
  - `memory-store.ts`: in-memory store used as fast cache + continuity layer.
- `lib/bags/`
  - `provider.ts`: picks mock vs real provider.
  - `real-provider.ts`: calls Bags API, enriches + buckets tokens.
  - `mock-provider.ts`: deterministic fallback dataset for local/offline dev.
  - `dexscreener.ts`: enriches migrated tokens with real metrics.
  - `solana-meta.ts`: batch RPC metadata for logos/names/symbols.
- `lib/scoring/babel-score.ts`: scoring and ranking implementation.
- `prisma/`
  - `schema.prisma`, migrations.
- `scripts/`
  - `ingest.ts`: force one refresh and write to in-memory data.
  - `seed-mock.ts`: populate memory store with mock tokens.
- `Procfile`: Railway process and release command definitions.

---

## Environment variables

Copy:

```bash
cp .env.example .env.local
```

### Required for real mode

- `BAGS_API_KEY`  
  Bags API key. In production, missing key throws.
- `BAGS_API_BASE_URL`  
  Defaults to `https://public-api-v2.bags.fm/api/v1/`.
- `BAGS_API_TOKENS_PATH`  
  Path appended to base URL for token universe. Current canonical path is usually:
  `solana/bags/pools`
- `DATABASE_URL`  
  PostgreSQL DSN for persistence. Optional for local/dev operation if persistence is intentionally disabled.

### Optional

- `NEXT_PUBLIC_APP_URL`  
  Base app URL for metadata/docs if needed.
- `SOLANA_RPC_URL`  
  For metadata/logo lookup. Helius-style RPC is recommended.
- `BABEL_RANKING_RETENTION_HOURS` (default: `24`)  
  Keeps historical rank rows for move tracking.
- `BABEL_SNAPSHOT_RETENTION_DAYS` (default: `7`)  
  Snapshot retention window for persistence cleanup.
- `BABEL_MAX_UNIVERSE_SIZE` (default: `12000`)  
  Limit universe before scoring.
- `BABEL_BUCKET_LIMIT` (default: `120`)  
  Bucket output cap (max rows returned per age bucket).
- `BABEL_DB_SAVE_LIMIT` (default: `1000`)  
  Cap rows written to DB per refresh.
- `BABEL_ENRICH_WINDOW` (default: `1000`)  
  Number of recent tokens that are enriched/synthetically aged.
- `BABEL_LOGO_METADATA_CAP`  
  Currently reserved for future use; metadata lookup caps are currently hardcoded.

---

## What the system fetches from Bags and how it transforms it

Bags endpoint responses are typically pool-shaped and may not have full market activity fields for every item. Babel normalizes each result with:

- `mint` (from `tokenMint`/`mint`/`address`/fallback keys)
- name/symbol fallback
- creator/owner fallback
- createdAt
- base liquidity-like metrics if present (`volume`, `tradeCount`, `buyerCount`, `feeValue`)
- optional `logoUri`, `image`, etc.

### Real provider flow (`lib/bags/real-provider.ts`)

1. Resolve a token list from one of candidate paths (pinned path first).
   - Primary: `BAGS_API_TOKENS_PATH`
   - Fallbacks include legacy path guesses.
2. Fetch migrated mints using `onlyMigrated=true`.
3. Enrich migrated mints from DexScreener:
   - pair-created time
   - `priceUsd`
   - 24h volume / buy/sell tx counts
   - symbol/logo metadata
4. For non-migrated/recent tokens:
   - assign synthetic ages across a 24h spread (`recent non-enriched` index distribution),
   - optionally replace name/symbol/logo from Solana metadata for sampled mints.

This guarantees all four age buckets have meaningful population even when upstream data is sparse.

### Mock provider flow (`lib/bags/mock-provider.ts`)

- Deterministic generated token universe for local iteration.
- Useful when no `BAGS_API_KEY` in development.
- Marked with source `mock` and still flows through identical scoring/ranking UI paths.

---

## Ranking model (`lib/scoring/babel-score.ts`)

Each token becomes a `BagsTokenRaw`, gets sanitized, bucketed, scored, then merged by age group.

### Buckets

`15m`, `1h`, `4h`, `24h` are assigned by:

- `ageMinutes <= 15`
- `ageMinutes <= 60`
- `ageMinutes <= 240`
- otherwise `24h`

### Score decomposition

All components are normalized to `0..100` before weighting.

- `buyerGrowth`: `normalize(buyerCount) * 100`
- `tradeVolumeMomentum`: `(0.45*normalize(tradeCount) + 0.55*normalize(volume)) * 100`
- `acceleration`: `clamp((normalize(buyerCount)+normalize(tradeCount))/2 + normalize(feeValue)*0.2) * 100`
- `ageRelativeStrength`: `clamp(1 - ageMinutes/1440) * 100`
- `stabilityQuality`: `clamp(1 - abs(normalize(feeValue) - normalize(volume))) * 100`

Combined:

```text
score = 0.30*buyerGrowth
      + 0.25*tradeVolumeMomentum
      + 0.20*acceleration
      + 0.15*ageRelativeStrength
      + 0.10*stabilityQuality
```

Ranks are sorted within each bucket by:
1. `babelScore` desc,
2. `ageMinutes` asc (younger first),
3. `mint` lexical for determinism.

Momentum labels are mapped from score + rank delta:
- `Rising Fast`
- `Near Breakout`
- `Stable High`
- `Quiet Climber`
- `Losing Steam`

Trend arrays are generated per ranked token to support lightweight sparkline rendering.

---

## Data contracts

### `TowerResponse`

Returned by `/api/tower` and by the home data cache:

- `bucket`: selected age bucket
- `updatedAt`: ISO timestamp string
- `source`: `"mock"` or `"real"`
- `tokens`: ranked list for that bucket
- `error?`: optional warning/failure detail

### `RankedToken`

- `id`, `mint`, `name`, `symbol`, `creator`
- `ageMinutes`
- `bucket`
- `babelScore`, `rank`, `previousRank`, `rankDelta`, `direction`
- `momentumLabel`
- `metrics`:
  - `volume`, `tradeCount`, `buyerCount`, `feeValue`, `price`
- `hasLiveActivity`
- `logoUri?`
- `trend`: lightweight trend series
- `scoreBreakdown`
- `whyRanked`: textual signal summary
- `dataSource`: `dexscreener | on-chain | bags | mock`
- `computedAt`

### Type references

Canonical enum values are defined in:
- `AgeBucket = "15m" | "1h" | "4h" | "24h"`
- `Direction = "up" | "down" | "flat"`

---

## Caching, refresh, and persistence

### In-memory orchestration

`server/services/memory-store.ts` stores:
- latest tokens
- per-bucket token history
- last update timestamp
- last refresh warning/error

`babel-service.ts` uses:
- `REVALIDATE_MS = 45_000`
- global `refreshInFlight` lock to avoid duplicate refresh bursts
- history reuse when provider fails but cache is warm

### Home cache layer

`server/services/home-data.ts` preloads all 4 buckets with `unstable_cache(revalidate: 45s)` and serves them to the page before client hydration.

### DB persistence

When `DATABASE_URL` is present, each refresh:
- writes upserted `Token` rows,
- adds `TokenSnapshot` rows,
- adds `TokenRanking` rows,
- then prunes old rows based on:
  - `BABEL_RANKING_RETENTION_HOURS`
  - `BABEL_SNAPSHOT_RETENTION_DAYS`.

If DB writes fail, data still serves from in-memory snapshot and warning text is surfaced in UI.

---

## API routes

All routes are under `app/api`.

### `GET /api/tower?bucket=15m|1h|4h|24h`

Returns full `TowerResponse` for the selected bucket.

### `GET /api/climbers?bucket=...`

Returns `{ bucket, tokens }` filtered for `rankDelta > 0`.

### `GET /api/falling?bucket=...`

Returns `{ bucket, tokens }` filtered for `rankDelta < 0`.

### `GET /api/breakout?bucket=...`

Returns `{ bucket, tokens }` where momentum indicates `Near Breakout` or `rank <= 6`.

### `GET /api/token/[id]`

Returns a single ranked token by `mint` or `id`, or 404 if absent.

### `GET /api/debug/probe` (dev only)

- Available only when `NODE_ENV !== "production"`.
- Fetches candidate Bags paths and returns per-path status + item counts.
- Uses recommendation to set `BAGS_API_TOKENS_PATH`.

---

## Local setup

### 1. Install

```bash
npm install
```

### 2. Configure

```bash
cp .env.example .env.local
```

Edit `.env.local` with real keys or keep a partial config for mock mode.

### 3. Run

```bash
npm run dev
```

Open:

- `http://localhost:3000`

### 4. Optional DB setup

If you want persistence, provide `DATABASE_URL` and run migrations:

```bash
npx prisma migrate dev
```

For existing DB schema bootstrap:

```bash
npx prisma migrate deploy
```

---

## Railway deployment guide

### Process model

`Procfile` defines:

```text
release: npx prisma migrate deploy
web: npm run start
```

Railway typically maps this to:
- install dependencies
- build step (`next build`)
- run `release` before web service start
- expose `0.0.0.0:8080` by script

### Recommended environment variables on Railway

At minimum:
- `NODE_ENV=production`
- `BAGS_API_KEY`
- `BAGS_API_TOKENS_PATH=solana/bags/pools`
- `DATABASE_URL` (if using Postgres plugin)
- `NEXT_PUBLIC_APP_URL=https://<your-railway-app>`
- `SOLANA_RPC_URL`

### Post-deploy checks

- Hit site endpoint and API endpoints.
- Verify startup logs:
  - migration run success
  - `next start -H 0.0.0.0`
- Confirm no repeated DB table-not-found failure after first migration deployment.

---

## Troubleshooting

### 1) Bags API returns no usable data

If startup or first refresh logs:

```text
Error: Bags API returned no usable data...
```

Fix:
- run `GET /api/debug/probe` in non-prod to discover valid path.
- pin best candidate in `BAGS_API_TOKENS_PATH`.
- ensure API key and base URL are valid.

### 2) Database persistence warning

Common message:

```text
Database persistence unavailable...
```

Meaning:
- Data is still served from latest snapshot.
- only DB writes/queries fail.

If new table appears `public.TokenSnapshot` / migration missing:
- run `npx prisma migrate deploy`
- ensure Railway Postgres is attached and reachable.

### 3) Logos missing on older age buckets

Not all tokens have logos from Bags or DexScreener.
- Synthetic pre-migration tokens rely on Solana metadata where available.
- For best coverage:
  - set a reliable `SOLANA_RPC_URL`.
- raise `BABEL_ENRICH_WINDOW`.

### 4) Cross-origin warning in dev

Warning about dev origin (`allowedDevOrigins`) is informational.
- It appears when accessing from a non-default host IP in Next dev mode.
- Usually harmless.

### 5) Hydration mismatch / stale HTML

If a mismatch persists:
- check client-only calculations (time/now/random) and move them to effect-driven render.
- ensure server and client branches align in first paint.

---

## API response debugging

You can inspect response payload quickly:

```bash
curl "http://localhost:3000/api/tower?bucket=1h"
curl "http://localhost:3000/api/climbers?bucket=1h"
curl "http://localhost:3000/api/breakout?bucket=1h"
curl "http://localhost:3000/api/falling?bucket=1h"
curl "http://localhost:3000/api/token/<mint-or-id>"
```

In development, also run:

```bash
curl "http://localhost:3000/api/debug/probe"
```

---

## Build, lint, and maintenance commands

- `npm run dev`  
  Start dev server with webpack.
- `npm run build`  
  Production build.
- `npm run start`  
  Production server (binds `0.0.0.0`).
- `npm run lint`  
  Run ESLint.
- `npm run seed`  
  Populate mock in-memory dataset.
- `npm run ingest`  
  Force one ingestion pass via service pipeline.
- `npm run db:generate`  
  Generate Prisma client.
- `npm run db:migrate`  
  Local dev migrations.

---

## Notes and caveats

- Data quality is bounded by Bags/DexScreener/API limits and path drift.
- Most “no live activity” states are intentional for synthetic/non-migrated rows.
- 24h buckets intentionally include synthetic distributed ages to keep historical context available.
- The current logo field in code uses `logoUri` (not `logoUrl`).
- `BABEL_DISABLE_DB_PERSISTENCE` appears in `.env.example` but is not currently checked in runtime code.

---

## Project status & contribution direction

This README reflects current code behavior:
- real-time refresh every ~45 seconds,
- cached rendering on both SSR and API,
- synthetic backfill for non-enriched tokens,
- explicit warning surfacing instead of hard fail when optional persistence is unavailable.

Contributions should preserve:
1. Deterministic ranking tie-breaking.
2. Safe numeric sanitization.
3. Graceful degrade behavior.
4. Consistency of token IDs / mint keys across cache, API, and drawer.

---

## Disclaimer

This application is for informational purposes only and is not financial advice.
