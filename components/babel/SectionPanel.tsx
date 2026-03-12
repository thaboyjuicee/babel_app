"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Zap } from "lucide-react";
import type { RankedToken } from "@/types/babel";
import { MomentumBadge } from "@/components/babel/MomentumBadge";
import { EmptyState } from "@/components/babel/EmptyState";
import { cn } from "@/lib/utils/cn";

type PanelType = "climbers" | "breakout" | "losing";

const panelConfig: Record<PanelType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  climbers: { label: "Fastest Climbers", icon: TrendingUp, color: "text-emerald-400" },
  breakout: { label: "Near Breakout", icon: Zap, color: "text-amber-400" },
  losing: { label: "Losing Altitude", icon: TrendingDown, color: "text-rose-400" },
};

export function SectionPanel({
  type,
  tokens,
  onSelect,
}: {
  type: PanelType;
  tokens: RankedToken[];
  onSelect: (token: RankedToken) => void;
}) {
  const config = panelConfig[type];
  const Icon = config.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-[#12121A] p-4"
    >
      <header className="mb-3 flex items-center gap-2">
        <Icon className={cn("h-4 w-4", config.color)} />
        <h3 className="text-sm font-semibold tracking-tight text-white/90">{config.label}</h3>
      </header>

      {tokens.length === 0 ? <EmptyState message="No qualifying tokens yet." /> : null}

      <div className="space-y-1.5">
        {tokens.map((token) => (
          <button
            key={token.id}
            onClick={() => onSelect(token)}
            className="flex w-full items-center justify-between rounded-lg border border-transparent px-2 py-2 text-left transition hover:bg-white/[0.03]"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white/85">{token.name}</div>
              <div className="mt-1">
                <MomentumBadge label={token.momentumLabel} />
              </div>
            </div>

            <div className="ml-2 min-w-[84px] text-right">
              <div className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                token.rankDelta > 0 ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400",
              )}>
                {token.rankDelta > 0 ? `+${token.rankDelta}` : token.rankDelta}
              </div>
              <div className="mt-1 text-xs font-semibold text-white">{token.babelScore.toFixed(1)}</div>
            </div>
          </button>
        ))}
      </div>
    </motion.section>
  );
}
