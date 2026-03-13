"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { MomentumBadge } from "@/components/babel/MomentumBadge";
import { DataSourceBadge } from "@/components/babel/DataSourceBadge";
import { SparklineChart } from "@/components/babel/SparklineChart";
import { cn } from "@/lib/utils/cn";
import { formatAge } from "@/lib/utils/format";
import { MOMENTUM_COLORS, type RankedToken } from "@/types/babel";

type TowerBlockProps = {
  token: RankedToken;
  index: number;
  total: number;
  selected: boolean;
  onClick: () => void;
};

function getDirectionStyles(direction: RankedToken["direction"]) {
  if (direction === "up") return "text-emerald-400 bg-emerald-400/10";
  if (direction === "down") return "text-rose-400 bg-rose-400/10";
  return "text-white/20 bg-white/[0.03]";
}

export function TowerBlock({ token, index, total, selected, onClick }: TowerBlockProps) {
  // Responsive width/height for mobile
  const width = typeof window !== 'undefined' && window.innerWidth < 500 ? 100 : 100;
  const height = typeof window !== 'undefined' && window.innerWidth < 500 ? 54 : 46;
  const opacity = 1;

  const compact = false;
  const showSymbol = true;
  const showAge = true;
  const showSparkline = true;
  const showDelta = true;

  const rankBadgeSize = token.rank === 1 ? "h-7 w-7" : token.rank <= 3 ? "h-6 w-6" : "h-5 w-5";
  const rankBadgeTone = token.rank === 1 ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white" : "bg-white/[0.05] text-white/70";

  const isTop = token.rank <= 3;
  const glowStyle = isTop || selected ? `0 0 26px ${MOMENTUM_COLORS[token.momentumLabel].glow}` : "none";
  const selectedGlow = selected ? `0 0 32px ${MOMENTUM_COLORS[token.momentumLabel].glow}, 0 0 56px ${MOMENTUM_COLORS[token.momentumLabel].glow}` : undefined;
  const baseGlowStyle = selected ? selectedGlow ?? glowStyle : glowStyle;
  const delay = Math.min(index, 11) * 0.055;

  return (
    <div className="w-full min-w-0">
      <motion.button
        type="button"
        layout
        initial={{ opacity: 0, y: -12, scale: 0.985 }}
        animate={{
          opacity,
          y: selected ? -1 : 0,
          scale: selected ? 1.015 : 1,
          boxShadow: baseGlowStyle,
        }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{
          delay,
          duration: 0.48,
          ease: [0.16, 1, 0.3, 1],
          layout: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
        }}
        whileHover={{
          scale: 1.025,
          y: -3,
          boxShadow: selectedGlow ?? "0 0 24px rgba(56,189,248,0.22)",
        }}
        whileTap={{ scale: 0.99, y: 0 }}
        style={{ width: `${width}%`, height, boxShadow: baseGlowStyle }}
        onClick={onClick}
        className={cn(
          "group relative mx-auto flex w-full min-w-0 origin-center items-center gap-2 rounded-md border px-3 py-3 transition sm:gap-2.5 sm:px-4 sm:py-3.5",
          token.rank <= 3 ? "bg-[#16161F]" : "bg-[#111119]",
          selected ? "border-cyan-300/70 shadow-[0_0_20px_rgba(56,189,248,0.28)]" : "border-white/[0.06] hover:border-white/[0.16]",
          selected ? "ring-2 ring-cyan-300/55" : null,
          token.rank === 1 && "border-cyan-400/25",
          selected ? "z-10" : null,
        )}
      >
        {token.rank === 1 ? (
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
        ) : null}

          <div className={cn("grid min-w-0 shrink-0 place-items-center rounded-md text-[10px] font-semibold sm:text-[11px]", rankBadgeSize, rankBadgeTone)}>#{token.rank}</div>

            {token.logoUri ? (
              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.04]">
                <Image
                  src={token.logoUri}
                  alt={token.symbol}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[9px] font-bold uppercase text-white/40">
                {token.symbol.slice(0, 2)}
              </div>
            )}

            <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-[12px] font-semibold tracking-tight text-white/90 sm:text-sm">
              {token.name}
              {showSymbol ? <span className="ml-1 text-white/40">{token.symbol}</span> : null}
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <span className="whitespace-nowrap flex-shrink-0">
                <MomentumBadge label={token.momentumLabel} />
              </span>
              <div className="flex items-center gap-1.5">
                <DataSourceBadge dataSource={token.dataSource} />
                {showAge ? <span className="text-[9px] uppercase tracking-[0.12em] text-white/35 sm:text-[10px]">{formatAge(token.ageMinutes)}</span> : null}
              </div>
            </div>
          </div>

        {showSparkline ? (
          <div className="hidden sm:block">
            <SparklineChart points={token.trend} width={compact ? 58 : 74} height={compact ? 18 : 22} />
          </div>
        ) : null}

        <div className="ml-1 min-w-0 text-right">
          <div className="text-[13px] font-bold tracking-tight text-white sm:text-sm">{token.babelScore.toFixed(1)}</div>
          <div className={cn("mt-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px]", getDirectionStyles(token.direction))}>
            {token.direction === "up" ? <ArrowUp className="h-3 w-3" /> : token.direction === "down" ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {showDelta ? <span>{token.rankDelta > 0 ? `+${token.rankDelta}` : token.rankDelta}</span> : null}
          </div>
        </div>
      </motion.button>

      {index < total - 1 ? (
        <div
          style={{ width: `${width}%` }}
          className="mx-auto my-1 h-[3px] rounded-full bg-gradient-to-b from-white/[0.08] to-white/[0.03]"
        />
      ) : null}
    </div>
  );
}
