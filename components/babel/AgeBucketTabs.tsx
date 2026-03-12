"use client";

import { motion } from "framer-motion";
import { AGE_BUCKETS, type AgeBucket } from "@/types/babel";
import { cn } from "@/lib/utils/cn";

type AgeBucketTabsProps = {
  selected: AgeBucket;
  onChange: (bucket: AgeBucket) => void;
};

export function AgeBucketTabs({ selected, onChange }: AgeBucketTabsProps) {
  return (
    <div className="no-scrollbar grid w-full grid-cols-2 gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2 sm:flex sm:flex-wrap sm:justify-center sm:overflow-x-auto">
      {AGE_BUCKETS.map((bucket) => {
        const active = selected === bucket.key;
        return (
          <button
            key={bucket.key}
            onClick={() => onChange(bucket.key)}
            className={cn(
              "relative min-h-14 w-full rounded-lg px-2 py-2 text-left transition sm:min-w-[132px] sm:px-3",
              active ? "text-white" : "text-white/30 hover:text-white/50",
            )}
          >
            {active ? <motion.span layoutId="bubble" className="absolute inset-0 rounded-lg border border-cyan-400/20 bg-cyan-500/15" /> : null}
            <span className="relative block text-sm font-semibold tracking-tight">{bucket.label}</span>
            <span className="relative mt-0.5 hidden text-[9px] uppercase tracking-[0.12em] text-white/40 sm:block sm:text-[10px]">{bucket.description}</span>
          </button>
        );
      })}
    </div>
  );
}
