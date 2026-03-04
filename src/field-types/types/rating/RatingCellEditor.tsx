import { StarIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { CellEditorProps } from "@/field-types/types";
import { cn } from "@/lib/utils";

export function RatingCellEditor({ value, config, onSave }: CellEditorProps) {
  const maxRating = config.maxRating ?? 5;
  const currentRating =
    typeof value === "number"
      ? Math.min(Math.max(0, Math.round(value)), maxRating)
      : 0;
  const [hovered, setHovered] = useState<number | null>(null);

  const handleClick = (starIndex: number) => {
    const newRating = starIndex + 1;
    // Click on already selected rating clears it
    onSave(newRating === currentRating ? null : newRating);
  };

  const displayRating = hovered !== null ? hovered + 1 : currentRating;

  return (
    <div
      className="flex h-full items-center gap-0.5 px-1"
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: maxRating }, (_, i) => (
        <button
          key={i}
          type="button"
          className="p-0"
          onMouseEnter={() => setHovered(i)}
          onClick={() => handleClick(i)}
        >
          <StarIcon
            className={cn(
              "h-4 w-4 transition-colors",
              i < displayRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30 fill-none hover:text-yellow-300",
            )}
          />
        </button>
      ))}
    </div>
  );
}
