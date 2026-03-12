import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] font-semibold",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.04] text-white/60",
        cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-400",
        emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
        rose: "border-rose-400/20 bg-rose-400/10 text-rose-400",
        amber: "border-amber-400/20 bg-amber-400/10 text-amber-400",
        blue: "border-blue-400/20 bg-blue-400/10 text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
