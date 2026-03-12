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
    if (Number.isNaN(date.getTime())) {
      return "now";
    }

    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZone: "UTC",
    }).format(date);
  }, [current.updatedAt]);

  const climbers = useMemo(() => current.tokens.filter((item) => item.rankDelta > 0).sort((a, b) => b.rankDelta - a.rankDelta).slice(0, 6), [current.tokens]);
  const breakout = useMemo(() => current.tokens.filter((item) => item.momentumLabel === "Near Breakout" || item.rank <= 6).slice(0, 6), [current.tokens]);
  const falling = useMemo(() => current.tokens.filter((item) => item.rankDelta < 0).sort((a, b) => a.rankDelta - b.rankDelta).slice(0, 6), [current.tokens]);

  const onTokenSelect = (token: RankedToken) => {
    setSelectedToken(token);
    setDrawerOpen(true);
  };

  return (
    <AppShell>
      <HeroSection />

      <section id="tower" className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Momentum Tower</h2>
            <p className="mt-1 text-sm text-white/45">Which new Bags tokens are rising fastest right now?</p>
          </div>
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-white/45">
            Updated {updatedText} · {current.source.toUpperCase()} mode
          </div>
        </div>

        <AgeBucketTabs selected={selectedBucket} onChange={setSelectedBucket} />

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr,1fr]">
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
