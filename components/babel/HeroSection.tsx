"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-24 sm:px-6 sm:pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-20 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.06),transparent_60%)] blur-2xl" />
        <div className="absolute right-[15%] top-8 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.04),transparent_60%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }}>
          <div className="mx-auto mb-5 inline-flex items-center rounded-full border border-cyan-400/15 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-cyan-400">
            Bags Token Discovery
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl"
        >
          Catch the climb
          <span className="block text-white/75">before the crowd.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease }}
          className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/45 sm:text-base"
        >
          Babel is a visual momentum tracker for Bags that highlights which newly created tokens are climbing fastest inside age-based momentum towers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease }}
          className="mt-8"
        >
          <Button size="lg" onClick={() => document.getElementById("tower")?.scrollIntoView({ behavior: "smooth" })}>
            Explore Momentum Tower
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
