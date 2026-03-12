import { cn } from "@/lib/utils/cn";

export function ScoreBadge({ score, compact = false }: { score: number; compact?: boolean }) {
  const tone = score >= 80 ? "text-cyan-300" : score >= 65 ? "text-white" : "text-white/70";

  return (
    <div className={cn("font-bold tracking-tight", tone, compact ? "text-sm" : "text-3xl")}>
      {score.toFixed(1)}
    </div>
  );
}
