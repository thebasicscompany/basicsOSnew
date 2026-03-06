import {
  SortAscendingIcon,
  FunnelIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SortPopover,
  FilterPopover,
  ColumnsPopover,
} from "@/components/data-table";
import type { ViewSort, ViewFilter } from "@/types/views";
import type { ColumnItem } from "@/components/data-table";
import type { Attribute } from "@/field-types/types";

export interface ObjectListHeaderActionsProps {
  singularName: string;
  attributes: Attribute[];
  columnItems: ColumnItem[];
  viewState: {
    sorts: ViewSort[];
    filters: ViewFilter[];
    isDirty: boolean;
    addSort: (fieldId: string, direction: "asc" | "desc") => void;
    updateSort: (sortId: string, updates: Partial<ViewSort>) => void;
    removeSort: (sortId: string) => void;
    addFilter: (
      fieldId: string,
      operator: string,
      value: unknown,
      logicalOp?: "and" | "or",
    ) => void;
    updateFilter: (filterId: string, updates: Partial<ViewFilter>) => void;
    removeFilter: (filterId: string) => void;
    updateColumn: (
      columnId: string,
      updates: Partial<{ show?: boolean; order?: number; width?: string }>,
    ) => void;
    discard: () => void;
    save: () => Promise<void>;
  };
  onAddSort: (sort: Omit<ViewSort, "id">) => void;
  onAddFilter: (filter: Omit<ViewFilter, "id">) => void;
  onCreateRecord: () => void;
  onAddColumn?: () => void;
  showTableActions?: boolean;
}

export function ObjectListHeaderActions({
  singularName,
  attributes,
  columnItems,
  viewState,
  onAddSort,
  onAddFilter,
  onCreateRecord,
  onAddColumn,
  showTableActions = true,
}: ObjectListHeaderActionsProps) {
  const hasActiveSorts = viewState.sorts.length > 0;
  const hasActiveFilters = viewState.filters.length > 0;
  const columnVisibleCount = columnItems.filter((c) => c.vc.show).length;

  return (
    <>
      {showTableActions && attributes.length > 0 && (
        <div className="flex items-center gap-2">
          <SortPopover
            attributes={attributes}
            sorts={viewState.sorts}
            onAdd={onAddSort}
            onRemove={viewState.removeSort}
            onUpdate={viewState.updateSort}
          >
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <SortAscendingIcon className="size-3.5" />
              Sort
              {hasActiveSorts && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-4 min-w-4 px-1 text-[10px]"
                >
                  {viewState.sorts.length}
                </Badge>
              )}
            </Button>
          </SortPopover>
          <FilterPopover
            attributes={attributes}
            filters={viewState.filters}
            onAdd={onAddFilter}
            onRemove={viewState.removeFilter}
            onUpdate={viewState.updateFilter}
          >
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <FunnelIcon className="size-3.5" />
              Filter
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-4 min-w-4 px-1 text-[10px]"
                >
                  {viewState.filters.length}
                </Badge>
              )}
            </Button>
          </FilterPopover>
          <ColumnsPopover
            items={columnItems}
            visibleCount={columnVisibleCount}
            totalCount={columnItems.length}
            onToggle={(columnId, show) => viewState.updateColumn(columnId, { show })}
            onReorder={(columnId, newOrder) =>
              viewState.updateColumn(columnId, { order: newOrder })
            }
            onAddColumn={onAddColumn}
          />
          {viewState.isDirty && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={viewState.discard}
              >
                Discard changes
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={viewState.save}>
                Save for everyone
              </Button>
            </div>
          )}
        </div>
      )}
      <Button size="sm" onClick={onCreateRecord} className="h-8 gap-1">
        <PlusIcon className="h-4 w-4" />
        New {singularName}
      </Button>
    </>
  );
}
