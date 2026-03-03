import { useState } from "react";
import { Expand } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface RowNumberCellProps {
  index: number;
  onExpand: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  hasSelection?: boolean;
}

export function RowNumberCell({
  index,
  onExpand,
  isSelected,
  onSelect,
  hasSelection,
}: RowNumberCellProps) {
  const [hovered, setHovered] = useState(false);

  // When any rows are selected, show checkboxes always
  if (hasSelection) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect?.()}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select row ${index}`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center text-xs text-muted-foreground",
        hovered && "cursor-pointer",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        if (hovered) {
          e.stopPropagation();
          onExpand();
        }
      }}
    >
      {hovered ? (
        <Expand className="size-3.5 text-muted-foreground hover:text-foreground" />
      ) : (
        <span className="tabular-nums">{index}</span>
      )}
    </div>
  );
}
