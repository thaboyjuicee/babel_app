export function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl border border-white/[0.05] bg-white/[0.03]" />
      ))}
    </div>
  );
}
