import { DATA_SOURCE_INFO, type TokenDataSource } from "@/types/babel";
import { cn } from "@/lib/utils/cn";

export function DataSourceBadge({
  dataSource,
  showDescription = false,
}: {
  dataSource: TokenDataSource;
  showDescription?: boolean;
}) {
  const info = DATA_SOURCE_INFO[dataSource];
  return (
    <span
      title={info.description}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-[11px]",
        info.text,
        info.bg,
      )}
    >
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", info.dot)} />
      {info.label}
      {showDescription ? (
        <span className="ml-1 font-normal text-white/40">— {info.description}</span>
      ) : null}
    </span>
  );
}
