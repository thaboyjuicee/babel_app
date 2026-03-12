"use client";

import type { RankedToken } from "@/types/babel";
import { TowerBlock } from "@/components/babel/TowerBlock";
import { EmptyState } from "@/components/babel/EmptyState";

type TowerViewProps = {
  tokens: RankedToken[];
  selectedId?: string;
  onSelect: (token: RankedToken) => void;
};

export function TowerView({ tokens, selectedId, onSelect }: TowerViewProps) {
  if (!tokens.length) {
    return <EmptyState message="No tokens in this age bucket yet. Check back as new Bags mints arrive." />;
  }

  const towerHeight = tokens.slice(0, 12).length;

  return (
    <div className="space-y-0.5 rounded-2xl border border-white/[0.05] bg-[#12121A] px-2 py-2.5 sm:p-4">
      <div className="mb-2 flex items-center justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
          Apex
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        </span>
      </div>

      {tokens.slice(0, 12).map((token, index) => (
        <TowerBlock
          key={token.id}
          token={token}
          index={index}
          total={Math.min(tokens.length, 12)}
          selected={selectedId === token.id}
          onClick={() => onSelect(token)}
        />
      ))}

      <div className="mt-2 flex items-center justify-center">
        <span className={`inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${towerHeight >= 12 ? "text-amber-300/85" : "text-white/70"}`}>
          Foundation
          <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
        </span>
      </div>
    </div>
  );
}
