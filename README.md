# Babel

Babel is a visual momentum tracker for Bags that helps users spot fast-rising new tokens before they become obvious.

Tagline: **Catch the climb before the crowd.**

## What this MVP includes

- Next.js App Router + TypeScript + Tailwind CSS
- Dark premium UI with animated age-based momentum towers
- Bags provider abstraction with automatic fallback:
  - `RealBagsProvider` when `BAGS_API_KEY` is present
  - `MockBagsProvider` with seeded realistic data when credentials are missing
- Snapshot + ranking service layer on the server
- Babel Score engine with modular weighted scoring:
  - `30%` buyer growth
  - `25%` trade/volume momentum
  - `20%` acceleration
  - `15%` age-relative strength
  - `10%` stability/quality
- Internal API routes:
  - `GET /api/tower?bucket=1h`
  - `GET /api/climbers?bucket=1h`
  - `GET /api/breakout?bucket=1h`
  - `GET /api/falling?bucket=1h`
  - `GET /api/token/[id]`
- Homepage with:
  - Hero
  - Age bucket tabs (default `1h`)
  - Tapering momentum tower
  - Fastest Climbers / Near Breakout / Losing Altitude panels
  - Token detail drawer
  - How it Works section
- About page (`/about`)
- Loading and empty states

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Prisma + Postgres schema
- Lucide icons
- shadcn-style UI primitives (`Button`, `Badge`, `Sheet`)

## Environment variables

Copy `.env.example` to `.env.local` and fill what you need:

```bash
BAGS_API_KEY=
BAGS_API_BASE_URL=https://public-api-v2.bags.fm/api/v1/
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/babel
NEXT_PUBLIC_APP_URL=http://localhost:3000
BABEL_RANKING_RETENTION_HOURS=24
BABEL_SNAPSHOT_RETENTION_DAYS=7
```

Retention controls (optional):

- `BABEL_RANKING_RETENTION_HOURS`: keep ranking snapshots this many hours (default `24`).
- `BABEL_SNAPSHOT_RETENTION_DAYS`: keep token snapshots this many days (default `7`).

The app prunes rows older than these windows automatically each time ingestion runs (`npm run ingest` or on-demand refresh in production). It also removes orphaned `Token` rows left behind after snapshot/ranking deletions.

### Mock mode behavior

If `BAGS_API_KEY` is missing, Babel automatically runs in mock mode using deterministic seeded token data.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database and Prisma

Generate client:

```bash
npm run db:generate
```

Run migration in your local Postgres:

```bash
npm run db:migrate
```

Seed mock snapshots/rankings:

```bash
npm run seed
```

Run one ingestion cycle manually:

```bash
npm run ingest
```

## Architecture overview

- `lib/bags/`: Bags providers (real + mock) and source abstraction
- `lib/scoring/`: Babel score engine and momentum label derivation
- `server/services/`: server-side snapshot/ranking orchestration and caching
- `app/api/*`: internal API endpoints consumed by clients/integrations
- `components/babel/`: product UI components (tower, panels, drawer, sections)
- `prisma/`: database schema and SQL migration

## Notes for v1 scope

Included:

- Discovery-focused experience
- Age-bucket momentum ranking
- Visual tower differentiator
- Backend service computation and caching

Excluded intentionally:

- Wallet/auth flows
- AI chat
- Trading execution
- Social/notification systems
- Prediction claims

## Disclaimer

Informational only. Not financial advice. Rankings are algorithmic and may not reflect full market conditions.
