"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.04] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500" />
          <span className="text-sm font-semibold tracking-tight text-white/80">Babel</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a className="text-white/40 transition hover:text-white/70" href="#tower">Tower</a>
          <a className="text-white/40 transition hover:text-white/70" href="#how-it-works">How it works</a>
          <Link className="text-white/40 transition hover:text-white/70" href="/about">About</Link>
        </nav>

        <Button variant="outline" size="sm" onClick={() => document.getElementById("tower")?.scrollIntoView({ behavior: "smooth" })}>
          Explore Tower
        </Button>
      </div>
    </header>
  );
}
