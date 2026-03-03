import type { CellDisplayProps, SelectOption } from "../../types";
import { getColorClasses, getColorByHash } from "../../colors";
import { cn } from "@/lib/utils";

export function SelectCellDisplay({ value, config }: CellDisplayProps) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground text-sm" />;
  }

  const options: SelectOption[] = config.options ?? [];
  const option = options.find((o) => o.id === value || o.label === value);
  const colorName = option?.color ?? getColorByHash(String(value)).name;
  const colors = getColorClasses(colorName);
  const label = option?.label ?? String(value);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-xs font-medium",
        colors.bg,
        colors.text,
        colors.border,
      )}
    >
      {label}
    </span>
  );
}
