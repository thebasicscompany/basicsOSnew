import type { CellDisplayProps, StatusOption } from "@/field-types/types";
import { STATUS_DOT_COLORS } from "@/field-types/colors";
import { cn } from "@/lib/utils";

export function StatusCellDisplay({ value, config }: CellDisplayProps) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground text-sm" />;
  }

  const options: StatusOption[] = config.options ?? [];
  const option = options.find((o) => o.id === value || o.label === value);
  const label = option?.label ?? String(value);
  const dotColor = STATUS_DOT_COLORS[label] ?? "bg-gray-400";

  return (
    <span className="inline-flex items-center gap-1.5 truncate text-sm">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)} />
      {label}
    </span>
  );
}
