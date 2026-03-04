import { CheckIcon } from "@phosphor-icons/react";
import type { CellDisplayProps } from "@/field-types/types";
import { cn } from "@/lib/utils";

export function CheckboxCellDisplay({ value }: CellDisplayProps) {
  const checked = value === true || value === 1 || value === "true";

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border",
          checked
            ? "bg-primary border-primary text-primary-foreground"
            : "border-input bg-background",
        )}
      >
        {checked && <CheckIcon className="h-3 w-3" />}
      </div>
    </div>
  );
}
