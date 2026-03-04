import type { CellDisplayProps } from "@/field-types/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function DateCellDisplay({ value }: CellDisplayProps) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground text-sm" />;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return <span className="text-muted-foreground text-sm" />;
  }

  return <span className="truncate text-sm">{dateFormatter.format(date)}</span>;
}
