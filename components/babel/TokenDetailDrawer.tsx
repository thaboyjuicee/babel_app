"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { MomentumBadge } from "@/components/babel/MomentumBadge";
import { ScoreBadge } from "@/components/babel/ScoreBadge";
import { SparklineChart } from "@/components/babel/SparklineChart";
import { formatCompactNumber, shortAddress } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { RankedToken } from "@/types/babel";

type TokenDetailDrawerProps = {
  token: RankedToken | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const breakdownLabels: Array<{ key: keyof RankedToken["scoreBreakdown"]; label: string }> = [
  { key: "buyerGrowth", label: "Buyer Growth" },
  { key: "tradeVolumeMomentum", label: "Trade/Volume Momentum" },
  { key: "acceleration", label: "Acceleration" },
  { key: "ageRelativeStrength", label: "Age Relative Strength" },
  { key: "stabilityQuality", label: "Stability / Quality" },
];

export function TokenDetailDrawer({ token, open, onOpenChange }: TokenDetailDrawerProps) {
  const [copied, setCopied] = useState<"mint" | "creator" | null>(null);
  const [sparklineWidth, setSparklineWidth] = useState(260);
  const bagsTokenUrl = token ? `https://bags.fm/${encodeURIComponent(token.mint)}` : "";

  useEffect(() => {
    const update = () => {
      const available = Math.max(220, window.innerWidth - 48);
      setSparklineWidth(Math.min(340, available));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const hasLiveActivity = token
    ? token.hasLiveActivity && (
      token.metrics.volume > 0 ||
      token.metrics.tradeCount > 0 ||
      token.metrics.buyerCount > 0 ||
      token.metrics.feeValue > 0
    )
    : false;

  const formatActivityMetric = (value: number) => {
    return hasLiveActivity ? formatCompactNumber(value) : "N/A";
  };

  const metricValueClass = hasLiveActivity ? "text-white" : "text-white/30";
  const metricCardClass = hasLiveActivity
    ? "border-white/[0.05]"
    : "border-rose-400/35 bg-rose-400/[0.06]";

  async function copyAddress(value: string, target: "mint" | "creator") {
    try {
      if (!value) return;

      if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const didCopy = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!didCopy) {
          throw new Error("Clipboard write failed");
        }
      }

      setCopied(target);
      setTimeout(() => setCopied((current) => (current === target ? null : current)), 1200);
    } catch (error) {
      console.error("Copy failed", error);
      alert("Copy failed. You can copy manually from the value shown.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {!token ? null : (
          <div className="h-full overflow-y-auto pr-1">
            <div className="mb-5 border-b border-white/[0.06] pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                {token.logoUri ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/[0.10] bg-white/[0.04]">
                    <Image
                      src={token.logoUri}
                      alt={token.symbol}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-sm font-bold uppercase text-white/40">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg font-bold tracking-tight text-white sm:text-2xl">{token.name}</SheetTitle>
                  <p className="mt-0.5 text-xs text-white/45 sm:mt-1 sm:text-sm">{token.symbol} · {Math.round(token.ageMinutes)}m old</p>
                </div>
              </div>
              <div className="mt-2">
                <MomentumBadge label={token.momentumLabel} />
              </div>
            </div>

            <section className="mb-6 rounded-xl border border-white/[0.06] bg-[#12121A] p-3 sm:p-4">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/35 sm:text-[10px]">Babel Score</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <ScoreBadge score={token.babelScore} />
                <div className="text-right text-[11px] text-white/50 sm:text-xs">
                  <div>Rank #{token.rank}</div>
                  <div>Prev #{token.previousRank ?? token.rank}</div>
                  <div>Floors moved {token.rankDelta > 0 ? `+${token.rankDelta}` : token.rankDelta}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/55 sm:text-sm">{token.whyRanked}</p>
                <div className="mt-4 w-full overflow-hidden rounded-lg border border-white/[0.06] bg-[#0F0F16] p-2">
                  <div className="flex justify-center">
                <SparklineChart points={token.trend} width={sparklineWidth} height={80} />
                  </div>
              </div>
            </section>

            <section className="mb-6 rounded-xl border border-white/[0.06] bg-[#12121A] p-3 sm:p-4">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/35 sm:text-[10px]">Score Breakdown</p>
              <div className="mt-3 space-y-2.5">
                {breakdownLabels.map((item) => {
                  const value = token.scoreBreakdown[item.key];
                  return (
                    <div key={item.key}>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-white/55 sm:text-xs">
                        <span>{item.label}</span>
                        <span>{value.toFixed(1)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.05]">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${Math.max(8, value)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-white/[0.06] bg-[#12121A] p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[9px] uppercase tracking-[0.14em] text-white/35 sm:text-[10px]">Activity</p>
                <span className={cn(
                  "rounded-full px-2 py-1 text-[10px] font-semibold sm:text-[11px]",
                  hasLiveActivity ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/12 text-rose-300",
                )}>
                  {hasLiveActivity ? "Live activity" : "No live activity yet"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:text-sm">
                <div className={cn("rounded-lg border p-2 text-white/70", metricCardClass)}>
                  Vol: <span className={metricValueClass}>{formatActivityMetric(token.metrics.volume)}</span>
                </div>
                <div className={cn("rounded-lg border p-2 text-white/70", metricCardClass)}>
                  Trades: <span className={metricValueClass}>{formatActivityMetric(token.metrics.tradeCount)}</span>
                </div>
                <div className={cn("rounded-lg border p-2 text-white/70", metricCardClass)}>
                  Buyers: <span className={metricValueClass}>{formatActivityMetric(token.metrics.buyerCount)}</span>
                </div>
                <div className={cn("rounded-lg border p-2 text-white/70", metricCardClass)}>
                  Fees: <span className={metricValueClass}>{formatActivityMetric(token.metrics.feeValue)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-[10px] text-white/55 sm:text-xs">
                <a
                  href={bagsTokenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 w-full items-center justify-between gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.06] px-2 py-2 text-left text-[10px] font-semibold text-cyan-200 transition hover:bg-cyan-400/[0.12] sm:px-3 sm:text-xs"
                >
                  <span className="truncate">View on Bags.fm</span>
                  <ExternalLink className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                </a>
                <button
                  className="flex min-w-0 w-full items-center justify-between gap-2 rounded-lg border border-white/[0.05] px-2 py-2 text-left font-mono text-[10px] sm:px-3 sm:text-xs"
                  onClick={() => copyAddress(token.mint, "mint")}
                  type="button"
                >
                  <span className="truncate">Mint: {shortAddress(token.mint)}</span>
                  {copied === "mint" ? (
                    <span className="text-[9px] font-semibold text-emerald-300 sm:text-[10px]">Copied</span>
                  ) : (
                    <Copy className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                  )}
                </button>
                <button
                  className="flex min-w-0 w-full items-center justify-between gap-2 rounded-lg border border-white/[0.05] px-2 py-2 text-left font-mono text-[10px] sm:px-3 sm:text-xs"
                  onClick={() => copyAddress(token.creator, "creator")}
                  type="button"
                >
                  <span className="truncate">Creator: {shortAddress(token.creator)}</span>
                  {copied === "creator" ? (
                    <span className="text-[9px] font-semibold text-emerald-300 sm:text-[10px]">Copied</span>
                  ) : (
                    <Copy className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                  )}
                </button>
              </div>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
