# Babel

Babel is a momentum discovery app for Bags tokens.

It ranks newly launched tokens into age buckets (15m, 1h, 4h, 24h), computes a composite "Babel Score", and presents the top movers in a visual tower UI.

Tagline: Catch the climb before the crowd.

## What Babel Does

- Pulls the live Bags pool universe from the Bags API.
- Enriches migrated tokens with real market activity (DexScreener).
- Resolves name and symbol metadata for a subset of non-migrated tokens using Solana RPC (`getAsset`), when available.
- Synthesizes age distribution for recent non-migrated pools so all age buckets remain useful.
- Computes weighted Babel Scores and directional movement (`up`, `down`, `flat`).
- Serves ranked results via internal API routes and a Next.js App Router UI.

## Current Data Model (Important)

The Bags endpoint `solana/bags/pools` returns pool references such as:

- `tokenMint`
- `dbcConfigKey`
- `dbcPoolKey`
- optional `dammV2PoolKey` for migrated pools

It does not provide a full market payload for every token.

To build a useful momentum surface, Babel applies a hybrid strategy:

1. Real enriched tokens
- Migrated pools are identified via `onlyMigrated=true`.
- These mints are enriched through DexScreener to obtain timestamps, volume, price, and trade activity.

2. Synthetic recent tokens
- Recent non-migrated pools are still included.
- Ages are distributed over the last 24h by index to populate all age buckets.
- Name and symbol are resolved via Solana RPC when possible.

Result: Babel shows a real-time, ranked signal even when upstream metadata is sparse.

## Tech Stack

- Next.js 16 (App Router, webpack)
- React 19 + TypeScript
- Tailwind CSS 4
- Framer Motion
- Prisma 6 + PostgreSQL
- Radix Dialog + Lucide icons

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env.local
```

3. Update `.env.local` (minimum)

```bash
BAGS_API_KEY=your_bags_key
BAGS_API_BASE_URL=https://public-api-v2.bags.fm/api/v1/
BAGS_API_TOKENS_PATH=solana/bags/pools
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/babel
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Start dev server

```bash
npm run dev
```

5. Open

- http://localhost:3000

## Environment Variables

Below is the complete runtime configuration currently used by the app.

### Required for real data

- `BAGS_API_KEY`
  - Bags API key from developer dashboard.
- `BAGS_API_BASE_URL`
  - Default: `https://public-api-v2.bags.fm/api/v1/`
- `BAGS_API_TOKENS_PATH`
  - Default recommended: `solana/bags/pools`

### Optional but strongly recommended

- `SOLANA_RPC_URL`
  - Used for name/symbol metadata lookup via `getAsset`.
  - Example: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
  - If omitted, Babel falls back to public Solana RPC, which may be rate-limited.

### Database

- `DATABASE_URL`
  - PostgreSQL connection string for Prisma persistence.

### App URL

- `NEXT_PUBLIC_APP_URL`
  - Public app base URL.

### Retention controls

- `BABEL_RANKING_RETENTION_HOURS` (default `24`)
- `BABEL_SNAPSHOT_RETENTION_DAYS` (default `7`)

Rows older than these windows are pruned during ingestion.

### Scale controls

- `BABEL_MAX_UNIVERSE_SIZE` (default `12000`)
  - Max tokens sent into scoring stage.
- `BABEL_BUCKET_LIMIT` (default `120`)
  - Max ranked tokens retained per age bucket in cache.
- `BABEL_DB_SAVE_LIMIT` (default `1000`)
  - Max rankings persisted to DB each refresh.
- `BABEL_ENRICH_WINDOW` (default `500`)
  - Number of recent non-enriched pools included as synthetic candidates.

## npm Scripts

- `npm run dev`
  - Start local dev server.
- `npm run build`
  - Production build.
- `npm run start`
  - Start production server after build.
- `npm run lint`
  - ESLint checks.
- `npm run db:generate`
  - Generate Prisma client.
- `npm run db:migrate`
  - Run Prisma migration in dev.
- `npm run seed`
  - Seed deterministic mock data.
- `npm run ingest`
  - Run one forced ingestion cycle.

## API Routes

### Product routes

- `GET /api/tower?bucket=15m|1h|4h|24h`
- `GET /api/climbers?bucket=...`
- `GET /api/breakout?bucket=...`
- `GET /api/falling?bucket=...`
- `GET /api/token/[id]`

### Debug route (non-production only)

- `GET /api/debug/probe`

Purpose:
- Tests candidate Bags endpoint paths.
- Returns per-path status and count.
- Suggests a `BAGS_API_TOKENS_PATH` value.

## Scoring Model

Babel Score is a weighted composite:

- Buyer growth: 30%
- Trade and volume momentum: 25%
- Acceleration: 20%
- Age-relative strength: 15%
- Stability and quality: 10%

Implementation details:

- Inputs are sanitized for non-finite values.
- Sorting is deterministic (score, then age, then mint).
- Momentum labels are derived from score plus rank delta.

## Runtime Flow

1. Provider selection
- If `BAGS_API_KEY` exists, real provider is always used.
- In production, missing `BAGS_API_KEY` throws an error.
- In development only, no key falls back to mock provider.

2. Ingestion and refresh
- Service cache revalidates every 45s.
- A module-level in-flight lock prevents concurrent refresh races.

3. Universe shaping
- Universe is priority-ranked and capped for scoring safety.
- Per-bucket output is capped to stabilize SSR cache and payload size.

4. Persistence
- Snapshots and rankings are written to PostgreSQL (when configured).
- Retention cleanup runs in-transaction before writes.

## Project Structure

- `app/`
  - App Router pages and API routes.
- `components/babel/`
  - Product UI components.
- `lib/bags/`
  - Provider implementations and enrichment logic.
- `lib/scoring/`
  - Babel score engine.
- `server/services/`
  - Orchestration, caching, persistence.
- `prisma/`
  - Prisma schema and migration state.
- `scripts/`
  - Seeding and manual ingestion scripts.

## Troubleshooting

### Probe returns 404 for most paths

Expected. The canonical Bags discovery path is currently:

- `solana/bags/pools`

Set:

```bash
BAGS_API_TOKENS_PATH=solana/bags/pools
```

### Empty older buckets (1h/4h/24h)

If upstream data is sparse, Babel relies on synthetic age distribution for recent non-migrated pools. This is expected behavior and is part of the current ranking strategy.

### Many `Unknown` or shortened symbols

Use a Solana RPC that supports `getAsset` well (for example Helius) and set:

```bash
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Prisma migration cannot see `DATABASE_URL`

Prisma CLI reads `.env` by default. If values are only in `.env.local`, copy or export the variable before running migrate.

### Build cache size warnings / heavy payloads

Tune these env vars downward:

- `BABEL_MAX_UNIVERSE_SIZE`
- `BABEL_BUCKET_LIMIT`
- `BABEL_DB_SAVE_LIMIT`

## Disclaimer

For informational use only. Not financial advice. Rankings are algorithmic and may not reflect full market conditions.
