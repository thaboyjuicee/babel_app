export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.14] bg-white/[0.01] px-4 py-8 text-center text-sm text-white/40">
      {message}
    </div>
  );
}
