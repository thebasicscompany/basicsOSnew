import type { CellDisplayProps, SelectOption } from "../../types";
import { getColorClasses, getColorByHash } from "../../colors";
import { cn } from "@/lib/utils";

export function MultiSelectCellDisplay({ value, config }: CellDisplayProps) {
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return <span className="text-muted-foreground text-sm" />;
  }

  const items: string[] = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const options: SelectOption[] = config.options ?? [];

  if (items.length === 0) {
    return <span className="text-muted-foreground text-sm" />;
  }

  return (
    <div className="flex items-center gap-1 overflow-hidden">
      {items.map((item, i) => {
        const option = options.find((o) => o.id === item || o.label === item);
        const colorName = option?.color ?? getColorByHash(String(item)).name;
        const colors = getColorClasses(colorName);
        const label = option?.label ?? String(item);

        return (
          <span
            key={`${item}-${i}`}
            className={cn(
              "inline-flex shrink-0 items-center truncate rounded-full border px-2 py-0.5 text-xs font-medium",
              colors.bg,
              colors.text,
              colors.border,
            )}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
