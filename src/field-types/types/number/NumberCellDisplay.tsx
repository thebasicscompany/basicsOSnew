import type { CellDisplayProps } from "@/field-types/types";

export function NumberCellDisplay({ value }: CellDisplayProps) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground text-sm" />;
  }

  return (
    <span className="block w-full truncate text-right text-sm tabular-nums">
      {String(value)}
    </span>
  );
}
