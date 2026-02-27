import { useState, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
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
import { DataTablePagination } from "@/components/tablecn/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/tablecn/data-table/data-table-view-options";
import { cn } from "@/lib/utils";

interface DataTableProps<TData extends { id?: unknown }> {
  columns: ColumnDef<TData>[];
  data: TData[];
  /** Rendered in the toolbar, to the left of the Columns dropdown. */
  toolbar?: React.ReactNode;
  /** Called when a row is clicked. */
  onRowClick?: (row: TData) => void;
  className?: string;
}

/**
 * Self-contained DataTable with sorting, pagination, and column visibility.
 * Takes `columns` + `data` — no external table instance required.
 */
export function DataTable<TData extends { id?: unknown }>({
  columns,
  data,
  toolbar,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize: 25 } },
  });

  const handleRowClick = useCallback(
    (row: TData) => {
      if (onRowClick) onRowClick(row);
    },
    [onRowClick],
  );

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">{toolbar}</div>
        <DataTableViewOptions table={table} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={onRowClick ? () => handleRowClick(row.original) : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
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
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
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
