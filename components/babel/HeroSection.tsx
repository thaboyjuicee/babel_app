"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-3 pb-12 pt-20 sm:px-6 sm:pb-14 sm:pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-20 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.06),transparent_60%)] blur-2xl" />
        <div className="absolute right-[15%] top-8 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.04),transparent_60%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        {/* Large Babel logo and title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }}>
          <div className="flex flex-col items-center justify-center mb-7">
            <img src="/babel.svg" alt="Babel logo" className="h-24 w-24 sm:h-32 sm:w-32 mb-2" />
            <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-lg">Babel</span>
          </div>
          <div className="mx-auto mb-5 inline-flex items-center rounded-full border border-cyan-400/15 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-cyan-400">
            Bags Token Discovery
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl"
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
          className="mt-8 flex justify-center"
        >
          <Button
            size="lg"
            className="w-full max-w-[240px] sm:max-w-none sm:w-auto"
            onClick={() => document.getElementById("tower")?.scrollIntoView({ behavior: "smooth" })}
          >
            Explore Momentum Tower
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
