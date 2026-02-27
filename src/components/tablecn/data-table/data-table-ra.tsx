"use client";

import { useCallback } from "react";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type * as React from "react";
import type { RaRecord } from "ra-core";
import { RecordContextProvider, useResourceContext } from "ra-core";
import { useNavigate } from "react-router";
import { useGetPathForRecordCallback } from "ra-core";

import { DataTablePagination } from "./data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getColumnPinningStyle } from "@/lib/tablecn/data-table";
import { cn } from "@/lib/utils";

interface DataTableRAProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  rowClick?: "show" | "edit" | false;
}

/**
 * DataTable with react-admin RecordContextProvider for each row.
 * Use with useDataTableRA for full react-admin integration.
 */
export function DataTableRA<TData extends { id?: unknown }>({
  table,
  actionBar,
  rowClick = "show",
  children,
  className,
  ...props
}: DataTableRAProps<TData>) {
  const navigate = useNavigate();
  const resource = useResourceContext();
  const getPathForRecord = useGetPathForRecordCallback();

  const handleRowClick = useCallback(
    async (record: TData) => {
      if (rowClick === false || !record?.id) return;
      const path = await getPathForRecord({
        record: record as RaRecord,
        resource: resource ?? "",
        link: rowClick,
      });
      if (path) {
        navigate(path, { state: { _scrollToTop: true } });
      }
    },
    [rowClick, resource, getPathForRecord, navigate]
  );

  return (
    <div
      className={cn("flex w-full flex-col gap-2.5 overflow-auto", className)}
      {...props}
    >
      {children}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      ...getColumnPinningStyle({ column: header.column }),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <RecordContextProvider
                  key={row.id}
                  value={row.original as { id?: unknown }}
                >
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    onClick={
                      rowClick
                        ? () => handleRowClick(row.original)
                        : undefined
                    }
                    className={rowClick ? "cursor-pointer" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          ...getColumnPinningStyle({ column: cell.column }),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </RecordContextProvider>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} />
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}
