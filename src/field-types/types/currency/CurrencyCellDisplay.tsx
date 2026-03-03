import type { CellDisplayProps } from "../../types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function CurrencyCellDisplay({ value }: CellDisplayProps) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground text-sm" />;
  }

  const num = Number(value);
  if (isNaN(num)) {
    return <span className="text-muted-foreground text-sm" />;
  }

  return (
    <span className="block w-full truncate text-right text-sm tabular-nums">
      {currencyFormatter.format(num)}
    </span>
  );
}
