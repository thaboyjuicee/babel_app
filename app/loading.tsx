import { LoadingSkeleton } from "@/components/babel/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto mt-28 max-w-5xl px-4">
      <LoadingSkeleton />
    </div>
  );
}
