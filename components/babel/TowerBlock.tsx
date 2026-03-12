"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { MomentumBadge } from "@/components/babel/MomentumBadge";
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
  const positionRatio = total <= 1 ? 0 : index / (total - 1);
  const width = 52 + (100 - 52) * positionRatio;
  const height = 64 - (64 - 48) * positionRatio;
  const opacity = 1 - positionRatio * 0.45;

  const showSymbol = width > 70;
  const showAge = width > 80;
  const showSparkline = width > 75;
  const showDelta = width > 72;

  const rankBadgeSize = token.rank === 1 ? "h-8 w-8" : token.rank <= 3 ? "h-7 w-7" : "h-6 w-6";
  const rankBadgeTone = token.rank === 1 ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white" : "bg-white/[0.05] text-white/70";

  const isTop = token.rank <= 3;
  const glowStyle = isTop || selected ? { boxShadow: `0 0 26px ${MOMENTUM_COLORS[token.momentumLabel].glow}` } : undefined;

  return (
    <div className="w-full">
      <motion.button
        type="button"
        initial={{ opacity: 0, scaleX: 0.4, y: -8 }}
        animate={{ opacity, scaleX: 1, y: 0 }}
        transition={{ delay: index * 0.045, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scaleY: 1.04 }}
        style={{ width: `${width}%`, height, ...glowStyle }}
        onClick={onClick}
        className={cn(
          "group relative mx-auto flex origin-center items-center gap-2 rounded-lg border px-2 transition",
          token.rank <= 3 ? "bg-[#16161F]" : "bg-[#111119]",
          selected ? "babel-glow-strong border-cyan-400/50" : "border-white/[0.06] hover:border-white/[0.16]",
          token.rank === 1 && "border-cyan-400/25",
        )}
      >
        {token.rank === 1 ? (
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
        ) : null}

        <div className={cn("grid place-items-center rounded-md text-xs font-semibold", rankBadgeSize, rankBadgeTone)}>#{token.rank}</div>

        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-semibold tracking-tight text-white/90">
            {token.name}
            {showSymbol ? <span className="ml-1 text-white/40">{token.symbol}</span> : null}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <MomentumBadge label={token.momentumLabel} />
            {showAge ? <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">{formatAge(token.ageMinutes)}</span> : null}
          </div>
        </div>

        {showSparkline ? (
          <div className="hidden sm:block">
            <SparklineChart points={token.trend} width={88} height={24} />
          </div>
        ) : null}

        <div className="text-right">
          <div className="text-base font-bold tracking-tight text-white">{token.babelScore.toFixed(1)}</div>
          <div className={cn("mt-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]", getDirectionStyles(token.direction))}>
            {token.direction === "up" ? <ArrowUp className="h-3 w-3" /> : token.direction === "down" ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {showDelta ? <span>{token.rankDelta > 0 ? `+${token.rankDelta}` : token.rankDelta}</span> : null}
          </div>
        </div>
      </motion.button>

      {index < total - 1 ? (
        <div
          style={{ width: `${Math.max(48, width - 4)}%` }}
          className="mx-auto my-1 h-[3px] rounded-full bg-gradient-to-b from-white/[0.08] to-white/[0.03]"
        />
      ) : null}
    </div>
  );
}
