"use client";

import type { RaRecord } from "ra-core";
import type { ColumnDef } from "@tanstack/react-table";
import { useDataTableRA } from "@/hooks/tablecn/use-data-table-ra";
import {
  DataTableRA,
} from "@/components/tablecn/data-table/data-table-ra";
import {
  DataTableToolbar,
  DataTableViewOptions,
  DataTableSortList,
} from "@/components/tablecn";
import { BulkActionsToolbar, BulkActionsToolbarChildren } from "@/components/admin/bulk-actions-toolbar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface TablecnListTableProps<RecordType extends RaRecord = RaRecord> {
  columns: ColumnDef<RecordType, unknown>[];
  sortFields?: string[];
  toolbarActions?: React.ReactNode;
  bulkActionButtons?: React.ReactNode;
  rowClick?: "show" | "edit" | false;
  className?: string;
}

/**
 * Tablecn-style list table (Attio/Linear-like).
 * Uses tablecn components with react-admin data.
 */
export function TablecnListTable<RecordType extends RaRecord = RaRecord>({
  columns,
  sortFields = [],
  toolbarActions,
  bulkActionButtons = <BulkActionsToolbarChildren />,
  rowClick = "show",
  className,
}: TablecnListTableProps<RecordType>) {
  const hasBulkActions = bulkActionButtons !== false;

  const selectionColumn: ColumnDef<RecordType, unknown> = {
    id: "select",
    header: ({ table }) =>
      hasBulkActions ? (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ) : null,
    cell: ({ row }) =>
      hasBulkActions ? (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ) : null,
    enableSorting: false,
    enableHiding: false,
  };

  const allColumns = hasBulkActions
    ? [selectionColumn, ...columns]
    : columns;

  const { table } = useDataTableRA<RecordType>({
    columns: allColumns,
    pageCount: -1,
    getRowId: (row) => String((row as RaRecord).id),
    initialState: {
      sorting: sortFields.length
        ? [{ id: sortFields[0], desc: false }]
        : undefined,
    },
  });

  return (
    <div className={cn("flex flex-col w-full gap-4", className)}>
      <DataTableRA
        table={table}
        rowClick={rowClick}
        actionBar={
          hasBulkActions ? (
            <BulkActionsToolbar>{bulkActionButtons}</BulkActionsToolbar>
          ) : undefined
        }
      >
        <DataTableToolbar table={table}>
          {sortFields.length > 0 && (
            <DataTableSortList table={table} align="end" />
          )}
          <DataTableViewOptions table={table} />
          {toolbarActions}
        </DataTableToolbar>
      </DataTableRA>
    </div>
  );
}
