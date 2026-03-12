"use client";

import { motion } from "framer-motion";
import { Layers3, Gauge, Building2, Radar } from "lucide-react";

const STEPS = [
  { title: "Age Grouping", text: "New Bags tokens are grouped into age cohorts so early momentum is compared fairly.", icon: Layers3 },
  { title: "Momentum Measurement", text: "Babel tracks buyer growth, trades, volume, acceleration, and stability over snapshots.", icon: Gauge },
  { title: "Tower Ranking", text: "Each age bucket forms a tapering tower where top floors surface fast climbers before they are obvious.", icon: Building2 },
  { title: "Spot the Climbers", text: "Use rank deltas, labels, and trend lines to identify breakouts and fading moves quickly.", icon: Radar },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto mt-16 max-w-7xl px-4 pb-16 sm:px-6">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">How Babel works</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="group relative overflow-hidden rounded-xl border border-white/[0.04] bg-[#12121A] p-4 transition-transform hover:-translate-y-1"
            >
              <span className="absolute left-3 top-0 text-5xl font-bold tracking-tight text-white/10">{index + 1}</span>
              <Icon className="relative mb-4 h-5 w-5 text-cyan-400" />
              <h3 className="relative text-sm font-semibold text-white/90">{step.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/45">{step.text}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
