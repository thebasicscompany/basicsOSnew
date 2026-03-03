import type { CellDisplayProps } from "../../types";

export function EmailCellDisplay({ value }: CellDisplayProps) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground text-sm" />;
  }

  return (
    <a
      href={`mailto:${String(value)}`}
      className="truncate text-sm text-blue-600 hover:underline dark:text-blue-400"
      onClick={(e) => e.stopPropagation()}
      title={String(value)}
    >
      {String(value)}
    </a>
  );
}
