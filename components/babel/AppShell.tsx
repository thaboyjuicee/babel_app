"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/babel/Navbar";
import { Footer } from "@/components/babel/Footer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--babel-bg)] text-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
