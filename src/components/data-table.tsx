import { useState, useCallback, useRef, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTablePagination } from "@/components/tablecn/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/tablecn/data-table/data-table-view-options";
import { cn } from "@/lib/utils";

interface DataTableProps<TData extends { id?: unknown }> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  /** Rendered in the toolbar, to the right of the search bar. */
  toolbar?: React.ReactNode;
  /** Called when a row is clicked. */
  onRowClick?: (row: TData) => void;
  /** When provided, enables row selection and shows bulk delete bar. */
  onBulkDelete?: (ids: number[]) => void | Promise<void>;
  className?: string;
}

/**
 * Self-contained DataTable with search, sorting, pagination, and column visibility.
 * Takes `columns` + `data` — no external table instance required.
 */
const selectColumn = <TData extends { id?: unknown }>(): ColumnDef<TData> => ({
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected()
          ? true
          : table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : false
      }
      onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
      onClick={(e) => e.stopPropagation()}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(v) => row.toggleSelected(!!v)}
      onClick={(e) => e.stopPropagation()}
      aria-label="Select row"
    />
  ),
  enableSorting: false,
  enableHiding: false,
});

export function DataTable<TData extends { id?: unknown }>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = "Search...",
  toolbar,
  onRowClick,
  onBulkDelete,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const tableColumns: ColumnDef<TData>[] = onBulkDelete
    ? [selectColumn<TData>(), ...columns]
    : columns;

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, globalFilter, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize: 25 } },
    enableRowSelection: !!onBulkDelete,
    getRowId: (row) => String((row as { id?: unknown }).id ?? Math.random()),
  });

  const rows = table.getRowModel().rows;
  const rowCount = rows.length;

  useEffect(() => {
    setFocusedRowIndex((i) => (rowCount ? Math.min(i, rowCount - 1) : 0));
  }, [rowCount]);

  const handleRowClick = useCallback(
    (row: TData) => {
      if (onRowClick) onRowClick(row);
    },
    [onRowClick],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!onRowClick || rowCount === 0) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRowIndex((i) => (i < rowCount - 1 ? i + 1 : i));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRowIndex((i) => (i > 0 ? i - 1 : i));
      } else if (e.key === "Enter" && rows[focusedRowIndex]) {
        e.preventDefault();
        handleRowClick(rows[focusedRowIndex].original);
      }
    },
    [onRowClick, rowCount, rows, focusedRowIndex, handleRowClick],
  );

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedIds = selectedRows
    .map((r) => (r.original as { id?: number }).id)
    .filter((id): id is number => id != null && typeof id === "number");

  const handleBulkDelete = useCallback(async () => {
    if (!onBulkDelete || selectedIds.length === 0) return;
    await onBulkDelete(selectedIds);
    setRowSelection({});
  }, [onBulkDelete, selectedIds]);

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-8 max-w-sm"
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-1.5">
              Type to filter
              <span className="text-muted-foreground/60">·</span>
              <kbd className="rounded bg-foreground/10 px-1 font-sans text-[10px] tracking-widest">
                ⌘K
              </kbd>
              for global search
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="ml-auto flex items-center gap-2">
          {toolbar}
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Bulk delete bar */}
      {onBulkDelete && selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {selectedIds.length} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            Delete selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div
        ref={wrapperRef}
        tabIndex={0}
        className="overflow-hidden rounded-md border outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onKeyDown={handleKeyDown}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  {tableColumns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={onRowClick ? () => handleRowClick(row.original) : undefined}
                  className={cn(
                    onRowClick && "cursor-pointer transition-colors hover:bg-muted/50",
                    index === focusedRowIndex && "bg-accent/50 ring-1 ring-primary/30"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  );
}
