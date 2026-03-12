"use client";

import { useMemo, useState } from "react";
import type { AgeBucket, RankedToken, TowerResponse } from "@/types/babel";
import { HeroSection } from "@/components/babel/HeroSection";
import { AgeBucketTabs } from "@/components/babel/AgeBucketTabs";
import { TowerView } from "@/components/babel/TowerView";
import { SectionPanel } from "@/components/babel/SectionPanel";
import { TokenDetailDrawer } from "@/components/babel/TokenDetailDrawer";
import { HowItWorksSection } from "@/components/babel/HowItWorksSection";
import { AppShell } from "@/components/babel/AppShell";

type BabelHomeProps = {
  initialBucket: AgeBucket;
  towerByBucket: Record<AgeBucket, TowerResponse>;
};

export function BabelHome({ initialBucket, towerByBucket }: BabelHomeProps) {
  const [selectedBucket, setSelectedBucket] = useState<AgeBucket>(initialBucket);
  const [selectedToken, setSelectedToken] = useState<RankedToken | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const current = towerByBucket[selectedBucket];

  const updatedText = useMemo(() => {
    const date = new Date(current.updatedAt);
    if (Number.isNaN(date.getTime())) return "now";
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZone: "UTC",
    }).format(date);
  }, [current.updatedAt]);

  const apiError = current.error ?? null;
  const isStale = useMemo(() => {
    const parsed = Date.parse(current.updatedAt);
    if (!Number.isFinite(parsed)) return false;
    return Date.now() - parsed > 90_000;
  }, [current.updatedAt]);

  const climbers = useMemo(
    () => current.tokens.filter((t) => t.rankDelta > 0).sort((a, b) => b.rankDelta - a.rankDelta).slice(0, 6),
    [current.tokens],
  );
  const breakout = useMemo(
    () => current.tokens.filter((t) => t.momentumLabel === "Near Breakout" || t.rank <= 6).slice(0, 6),
    [current.tokens],
  );
  const falling = useMemo(
    () => current.tokens.filter((t) => t.rankDelta < 0).sort((a, b) => a.rankDelta - b.rankDelta).slice(0, 6),
    [current.tokens],
  );

  const onTokenSelect = (token: RankedToken) => {
    setSelectedToken(token);
    setDrawerOpen(true);
  };

  return (
    <AppShell>
      <HeroSection />

      <section id="tower" className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Momentum Tower</h2>
            <p className="mt-1 text-sm text-white/45">Which new Bags tokens are rising fastest right now?</p>
          </div>
          <div className="self-start rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-white/45 sm:self-center">
            Updated {updatedText} UTC
          </div>
        </div>

        <AgeBucketTabs selected={selectedBucket} onChange={setSelectedBucket} />

        {apiError ? (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-5">
            <p className="text-sm font-semibold text-rose-400">Bags API unavailable</p>
            <p className="mt-1 text-xs text-white/50">{apiError}</p>
            <p className="mt-2 text-xs text-white/35">
              Check your <code className="rounded bg-white/[0.06] px-1">BAGS_API_KEY</code> and{" "}
              <code className="rounded bg-white/[0.06] px-1">BAGS_API_TOKENS_PATH</code> in{" "}
              <code className="rounded bg-white/[0.06] px-1">.env.local</code>, then restart the server.
              Use <code className="rounded bg-white/[0.06] px-1">/api/debug/probe</code> to test your API key.
            </p>
          </div>
        ) : null}

        {isStale ? (
          <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-4 text-sm text-amber-100/90">
            <p>Data may be stale. Last refresh was at {updatedText} UTC. Results are best-effort from the latest cached snapshot.</p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <TowerView tokens={current.tokens} selectedId={selectedToken?.id} onSelect={onTokenSelect} />

          <div className="space-y-4">
            <SectionPanel type="climbers" tokens={climbers} onSelect={onTokenSelect} />
            <SectionPanel type="breakout" tokens={breakout} onSelect={onTokenSelect} />
            <SectionPanel type="losing" tokens={falling} onSelect={onTokenSelect} />
          </div>
        </div>
      </section>

      <HowItWorksSection />

      <TokenDetailDrawer token={selectedToken} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </AppShell>
  );
}
