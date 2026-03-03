import { cn } from "@/lib/utils";
import { Grid3X3, List, Plus } from "lucide-react";

export interface ViewSelectorProps {
  views: Array<{ id: string; title: string; type: string }>;
  activeViewId: string;
  onSelectView: (viewId: string) => void;
  onCreateView?: () => void;
}

function getViewIcon(type: string) {
  switch (type) {
    case "grid":
      return Grid3X3;
    case "kanban":
      return List;
    default:
      return Grid3X3;
  }
}

export function ViewSelector({
  views,
  activeViewId,
  onSelectView,
  onCreateView,
}: ViewSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 border-b">
      {views.map((view) => {
        const Icon = getViewIcon(view.type);
        const isActive = view.id === activeViewId;

        return (
          <button
            key={view.id}
            onClick={() => onSelectView(view.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            <Icon className="size-3.5" />
            <span>{view.title}</span>
          </button>
        );
      })}

      {onCreateView && (
        <button
          onClick={onCreateView}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground border-b-2 border-transparent transition-colors"
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  );
}
