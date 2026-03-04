import type { CellDisplayProps } from "@/field-types/types";
import { cn } from "@/lib/utils";

export function TextCellDisplay({
  value,
  attribute,
  isSelected,
}: CellDisplayProps) {
  if (value == null || value === "") {
    return (
      <span className="text-muted-foreground truncate text-sm">
        {isSelected ? "" : ""}
      </span>
    );
  }

  const display =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  return (
    <span
      className={cn("truncate text-sm", attribute.isPrimary && "font-medium")}
      title={display}
    >
      {display}
    </span>
  );
}
