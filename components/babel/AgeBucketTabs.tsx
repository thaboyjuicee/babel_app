"use client";

import { motion } from "framer-motion";
import { AGE_BUCKETS, type AgeBucket } from "@/types/babel";
import { cn } from "@/lib/utils/cn";

type AgeBucketTabsProps = {
  selected: AgeBucket;
  onChange: (bucket: AgeBucket) => void;
};

export function AgeBucketTabs({ selected, onChange }: AgeBucketTabsProps) {
  const foundIndex = AGE_BUCKETS.findIndex((bucket) => bucket.key === selected);
  const selectedIndex = foundIndex >= 0 ? foundIndex : 0;

  return (
    <div className="w-full" role="tablist" aria-label="Age filter">
      <div
        className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-black/25 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        style={{ gridTemplateColumns: `repeat(${AGE_BUCKETS.length}, minmax(0, 1fr))` }}
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-y-1 rounded-xl border border-cyan-300/35 bg-gradient-to-b from-cyan-300/25 to-cyan-500/10 shadow-[0_0_26px_rgba(56,189,248,0.28)]"
          initial={false}
          animate={{
            left: `${selectedIndex * (100 / AGE_BUCKETS.length)}%`,
          }}
          style={{
            width: `${100 / AGE_BUCKETS.length}%`,
            top: "0.25rem",
            bottom: "0.25rem",
            filter: "saturate(1.25)",
          }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        />
        <span className="pointer-events-none absolute inset-y-1.5 left-2 right-2 -z-0 rounded-lg bg-gradient-to-r from-white/[0.02] via-transparent to-white/[0.02]" />

        <div className="relative z-10 grid w-full" style={{ gridTemplateColumns: `repeat(${AGE_BUCKETS.length}, minmax(0, 1fr))` }}>
          {AGE_BUCKETS.map((bucket) => {
            const active = selected === bucket.key;
            return (
              <button
                key={bucket.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(bucket.key)}
                className={cn(
                  "relative min-h-12 flex flex-col items-center justify-center px-1.5 py-1 text-center transition sm:min-h-14 sm:px-3 sm:py-1.5",
                  active ? "text-white drop-shadow-[0_0_8px_rgba(56,189,248,0.2)]" : "text-white/35 hover:text-white/65",
                )}
              >
                <span className="relative block text-[11px] font-semibold tracking-tight sm:text-sm">{bucket.label}</span>
                <span className="relative mt-0.5 hidden text-[8px] uppercase tracking-[0.12em] text-white/45 sm:block sm:text-[9px]">
                  {bucket.description}
                </span>
                {active ? <span className="absolute inset-x-2 -bottom-1 h-px bg-cyan-300/70" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
