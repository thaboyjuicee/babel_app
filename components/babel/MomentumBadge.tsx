import { Badge } from "@/components/ui/badge";
import { MOMENTUM_COLORS, type MomentumLabel } from "@/types/babel";
import { cn } from "@/lib/utils/cn";

export function MomentumBadge({ label }: { label: MomentumLabel }) {
  const palette = MOMENTUM_COLORS[label];
  return <Badge className={cn(palette.text, palette.bg, "border-transparent")}>{label}</Badge>;
}
