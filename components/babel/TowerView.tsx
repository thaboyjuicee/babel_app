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

  return (
    <div className="space-y-0.5 rounded-2xl border border-white/[0.05] bg-[#12121A] p-4">
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
    </div>
  );
}
