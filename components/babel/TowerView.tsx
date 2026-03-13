"use client";

import { AnimatePresence, motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-0.5 rounded-2xl border border-white/[0.05] bg-[#12121A] p-4 overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="mb-2 flex items-center justify-center min-w-[220px]">
        <motion.span
          initial={{ scale: 0.94, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200"
        >
          Apex
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        </motion.span>
      </div>

      <div className="flex flex-col min-w-[220px] w-full">
        <AnimatePresence mode="popLayout">
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
        </AnimatePresence>
      </div>

      <div className="mt-2 flex items-center justify-center min-w-[220px]">
        <motion.span
          initial={{ scale: 0.94, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${towerHeight >= 12 ? "text-amber-300/85" : "text-white/70"}`}
        >
          Foundation
          <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
        </motion.span>
      </div>
    </motion.div>
  );
}
