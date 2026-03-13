"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Navbar() {
  function navigateToSection(sectionId: "tower" | "how-it-works") {
    if (typeof window === "undefined") return;

    if (window.location.pathname === "/") {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    window.location.href = `/#${sectionId}`;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.04] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/babel.svg" alt="Babel logo" width={120} height={120} className="h-10 w-10 rounded-md sm:h-14 sm:w-14" />
          <span className="text-lg font-bold tracking-tight text-white/90 sm:text-2xl">Babel</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <button
            type="button"
            className="text-white/40 transition hover:text-white/70"
            onClick={() => navigateToSection("tower")}
          >
            Tower
          </button>
          <button
            type="button"
            className="text-white/40 transition hover:text-white/70"
            onClick={() => navigateToSection("how-it-works")}
          >
            How it works
          </button>
          <Link className="text-white/40 transition hover:text-white/70" href="/about">About</Link>
        </nav>

        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" onClick={() => navigateToSection("tower")}>
          <span className="hidden sm:inline">Explore Tower</span>
          <span className="sm:hidden">Tower</span>
        </Button>
      </div>
    </header>
  );
}
