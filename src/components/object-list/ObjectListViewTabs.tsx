import { ViewSelector } from "@/components/data-table";
import type { ViewConfig } from "@/types/views";

export interface ObjectListViewTabsProps {
  views: ViewConfig[];
  activeViewId: string;
  defaultViewId: string;
  onSelectView: (viewId: string) => void;
  onCreateView: () => void | Promise<void>;
  onRenameView: (viewId: string, title: string) => void | Promise<void>;
  onDeleteView: (viewId: string) => void | Promise<void>;
}

export function ObjectListViewTabs({
  views,
  activeViewId,
  defaultViewId,
  onSelectView,
  onCreateView,
  onRenameView,
  onDeleteView,
}: ObjectListViewTabsProps) {
  if (views.length === 0) return null;

  return (
    <div className="shrink-0">
      <ViewSelector
        views={views}
        activeViewId={activeViewId}
        onSelectView={onSelectView}
        onCreateView={onCreateView}
        onRenameView={onRenameView}
        onDeleteView={onDeleteView}
        defaultViewId={defaultViewId}
      />
    </div>
  );
}
