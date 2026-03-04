import { TableIcon, ColumnsIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface DealsLayoutToggleProps {
  layout: "table" | "kanban";
  onLayoutChange: (layout: "table" | "kanban") => void;
}

export function DealsLayoutToggle({
  layout,
  onLayoutChange,
}: DealsLayoutToggleProps) {
  return (
    <div className="flex shrink-0 gap-0.5 rounded-md border p-0.5">
      <button
        type="button"
        onClick={() => onLayoutChange("table")}
        className={cn(
          "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors",
          layout === "table"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <TableIcon className="size-3.5" />
        Table
      </button>
      <button
        type="button"
        onClick={() => onLayoutChange("kanban")}
        className={cn(
          "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors",
          layout === "kanban"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <ColumnsIcon className="size-3.5" />
        Pipeline
      </button>
    </div>
  );
}
