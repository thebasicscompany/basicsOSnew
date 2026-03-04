import { StarIcon } from "@phosphor-icons/react";
import type { CellDisplayProps } from "@/field-types/types";
import { cn } from "@/lib/utils";

export function RatingCellDisplay({ value, config }: CellDisplayProps) {
  const maxRating = config.maxRating ?? 5;
  const rating =
    typeof value === "number"
      ? Math.min(Math.max(0, Math.round(value)), maxRating)
      : 0;

  if (rating === 0) {
    return <span className="text-muted-foreground text-sm" />;
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => (
        <StarIcon
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30 fill-none",
          )}
        />
      ))}
    </div>
  );
}
