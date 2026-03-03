import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AddColumnDialog } from "./AddColumnDialog";
import { FieldsVisibilityPopover } from "./FieldsVisibilityPopover";
import { SortPopover, type SortDef } from "./SortPopover";
import { FilterPopover, type FilterDef } from "./FilterPopover";
import { RowHeightDropdown } from "./RowHeightDropdown";
import type { VisibilityState } from "@tanstack/react-table";
import type { RowHeight } from "@/hooks/use-grid-preferences";

interface SpreadsheetToolbarProps {
  resource: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  extra?: React.ReactNode;
  columns?: { id: string; label: string; uidt?: string; isPrimary?: boolean }[];
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  sorting?: SortDef[];
  onSortChange?: (sorting: SortDef[]) => void;
  filters?: FilterDef[];
  onFilterChange?: (filters: FilterDef[]) => void;
  rowHeight?: RowHeight;
  onRowHeightChange?: (height: RowHeight) => void;
}

export function SpreadsheetToolbar({
  resource,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  extra,
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  sorting,
  onSortChange,
  filters,
  onFilterChange,
  rowHeight,
  onRowHeightChange,
}: SpreadsheetToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 border-b px-3 py-1.5">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-7 pl-8 text-xs"
        />
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {columns && columnVisibility !== undefined && onColumnVisibilityChange && (
        <FieldsVisibilityPopover
          columns={columns}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={onColumnVisibilityChange}
          columnOrder={columnOrder}
          onColumnOrderChange={onColumnOrderChange}
        />
      )}

      {columns && filters !== undefined && onFilterChange && (
        <FilterPopover
          columns={columns}
          filters={filters}
          onFilterChange={onFilterChange}
        />
      )}

      {columns && sorting !== undefined && onSortChange && (
        <SortPopover
          columns={columns}
          sorting={sorting}
          onSortChange={onSortChange}
        />
      )}

      {rowHeight !== undefined && onRowHeightChange && (
        <RowHeightDropdown value={rowHeight} onChange={onRowHeightChange} />
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {extra}
        <Separator orientation="vertical" className="mx-1 h-5" />
        <AddColumnDialog resource={resource} />
      </div>
    </div>
  );
}
