import type { CellDisplayProps } from "../../types";

export function LongTextCellDisplay({ value }: CellDisplayProps) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground truncate text-sm" />;
  }

  return (
    <span className="truncate text-sm" title={String(value)}>
      {String(value)}
    </span>
  );
}
