import { SortAscendingIcon, FunnelIcon, XIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ViewSort, ViewFilter } from "@/types/views";
import type { Attribute } from "@/field-types/types";

export interface ObjectListSortFilterPillsProps {
  sorts: ViewSort[];
  filters: ViewFilter[];
  attrMap: Map<string, Attribute>;
  onRemoveSort: (sortId: string) => void;
  onRemoveFilter: (filterId: string) => void;
}

export function ObjectListSortFilterPills({
  sorts,
  filters,
  attrMap,
  onRemoveSort,
  onRemoveFilter,
}: ObjectListSortFilterPillsProps) {
  const hasActiveSorts = sorts.length > 0;
  const hasActiveFilters = filters.length > 0;

  if (!hasActiveSorts && !hasActiveFilters) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      {sorts.map((sort) => {
        const attr = attrMap.get(sort.fieldId);
        return (
          <Badge
            key={sort.id}
            variant="outline"
            className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal"
          >
            <SortAscendingIcon className="size-3 text-muted-foreground" />
            <span>{attr?.name ?? sort.fieldId}</span>
            <span className="text-muted-foreground">
              {sort.direction === "asc" ? "A-Z" : "Z-A"}
            </span>
            <button
              type="button"
              className="ml-0.5 rounded-sm p-0.5 hover:bg-muted"
              onClick={() => onRemoveSort(sort.id)}
              aria-label="Remove sort"
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        );
      })}
      {hasActiveSorts && hasActiveFilters && (
        <Separator orientation="vertical" className="h-4" />
      )}
      {filters.map((filter, idx) => {
        const attr = attrMap.get(filter.fieldId);
        return (
          <Badge
            key={filter.id}
            variant="outline"
            className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal"
          >
            {idx > 0 && (
              <span className="mr-0.5 text-muted-foreground">{filter.logicalOp}</span>
            )}
            <FunnelIcon className="size-3 text-muted-foreground" />
            <span>{attr?.name ?? filter.fieldId}</span>
            <span className="text-muted-foreground">{filter.operator}</span>
            {filter.value !== undefined &&
              filter.value !== null &&
              String(filter.value) !== "" && (
                <span className="font-medium">{String(filter.value)}</span>
              )}
            <button
              type="button"
              className="ml-0.5 rounded-sm p-0.5 hover:bg-muted"
              onClick={() => onRemoveFilter(filter.id)}
              aria-label="Remove filter"
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
}
