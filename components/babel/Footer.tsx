export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] px-3 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center text-[11px] text-white/40 sm:flex-row sm:justify-between sm:text-left sm:text-xs">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded bg-gradient-to-br from-cyan-400 to-blue-500" />
          <span>Babel</span>
        </div>
        <p>Informational only. Not financial advice. Rankings are algorithmic and may not reflect full market conditions.</p>
        <p>© {new Date().getFullYear()} Babel</p>
      </div>
    </footer>
  );
}
