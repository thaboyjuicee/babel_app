import Link from "next/link";
import { AppShell } from "@/components/babel/AppShell";

export default function AboutPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-28 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">About Babel</h1>

        <div className="mt-6 space-y-4 rounded-2xl border border-white/[0.06] bg-[#12121A] p-6 text-sm leading-relaxed text-white/60">
          <p>
            Babel is a Bags-native discovery app focused on one question: which newly created tokens are climbing fastest right now, before they become obvious.
          </p>
          <p>
            Age-based ranking means tokens are compared against peers of similar age, so a 12-minute token is not unfairly measured against a 20-hour token.
          </p>
          <p>
            The Babel Score combines buyer growth, trade and volume momentum, acceleration, age-relative strength, and stability-quality into a single momentum signal.
          </p>
          <p>
            Babel is informational only. Not financial advice. Rankings are algorithmic and may not reflect full market conditions.
          </p>
          <p>
            <Link href="/" className="text-cyan-400 hover:text-cyan-300">
              Back to tower
            </Link>
          </p>
        </div>
      </section>
    </AppShell>
  );
}
