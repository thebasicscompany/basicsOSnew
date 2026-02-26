import { HugeiconsIcon } from "@hugeicons/react";
import { ArrangeByLettersZAIcon } from "@hugeicons/core-free-icons";
import type { Identifier, RaRecord } from "ra-core";
import { useCallback, useEffect, useRef } from "react";
import {
  RecordContextProvider,
  useEvent,
  useGetPathForRecordCallback,
  useListContext,
  useNavigate,
  useResourceContext,
} from "ra-core";
import { difference, union } from "lodash";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { BulkActionsToolbar } from "@/components/admin/bulk-actions-toolbar";
import { BulkActionsToolbarChildren } from "@/components/admin/bulk-actions-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CRMListTableToolbar } from "./CRMListTableToolbar";
import type { CRMListTableProps } from "./table/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isPromise = (value: any): value is Promise<any> =>
  value && typeof value.then === "function";

/**
 * Unified Twenty-style list table for CRM entities.
 *
 * Uses TanStack Table for columns, resizing, and layout. Integrates with ra-core
 * for data, filters, sort, and selection. Use the columns prop for column definitions.
 *
 * @example
 * <CRMListTable columns={companyColumns} />
 */
export function CRMListTable<RecordType extends RaRecord = RaRecord>({
  columns,
  sortFields,
  toolbarActions,
  rowClick = "show",
  bulkActionButtons = <BulkActionsToolbarChildren />,
  className,
}: CRMListTableProps<RecordType>) {
  const {
    data,
    isPending,
    selectedIds,
    onSelect,
    onToggleItem,
    setSort,
    sort,
  } = useListContext<RecordType>();
  const resource = useResourceContext();

  const lastSelected = useRef<Identifier | null>(null);

  useEffect(() => {
    if (!selectedIds || selectedIds.length === 0) {
      lastSelected.current = null;
    }
  }, [selectedIds]);

  const handleToggleItem = useEvent(
    (id: Identifier, event: React.MouseEvent<HTMLInputElement>) => {
      if (!data) return;
      const ids = data.map((record) => record.id);
      const lastSelectedIndex = lastSelected.current
        ? ids.indexOf(lastSelected.current)
        : -1;

      if (event.shiftKey && lastSelectedIndex !== -1) {
        const index = ids.indexOf(id);
        const idsBetweenSelections = ids.slice(
          Math.min(lastSelectedIndex, index),
          Math.max(lastSelectedIndex, index) + 1
        );

        const isClickedItemSelected = selectedIds?.includes(id);
        const newSelectedIds = isClickedItemSelected
          ? difference(selectedIds ?? [], idsBetweenSelections)
          : union(selectedIds ?? [], idsBetweenSelections);

        onSelect?.(newSelectedIds);
      } else {
        onToggleItem?.(id);
      }

      lastSelected.current = id;
    }
  );

  const hasBulkActions = bulkActionButtons !== false;

  const selectionColumn: ColumnDef<RecordType, unknown> = {
    id: "select",
    header: () =>
      hasBulkActions ? (
        <Checkbox
          onCheckedChange={(checked: boolean | "indeterminate") => {
            if (!onSelect || !data || !selectedIds) return;
            const selectableIds = data.map((r) => r.id);
            onSelect(
              checked
                ? union(
                    selectedIds,
                    selectableIds.filter((id) => !selectedIds.includes(id))
                  )
                : selectedIds.filter((id) => !data.some((r) => r.id === id))
            );
          }}
          checked={
            selectedIds &&
            selectedIds.length > 0 &&
            data?.length &&
            data.every((r) => selectedIds.includes(r.id))
          }
          className="mb-2"
        />
      ) : null,
    cell: ({ row }) =>
      hasBulkActions ? (
        <Checkbox
          checked={selectedIds?.includes(row.original.id)}
          onClick={(e: React.MouseEvent<HTMLInputElement>) => {
            e.stopPropagation();
            handleToggleItem(row.original.id, e);
          }}
        />
      ) : null,
    size: 32,
    enableResizing: false,
  };

  const sortableIds = new Set(sortFields ?? []);
  const allColumns: ColumnDef<RecordType, unknown>[] = hasBulkActions
    ? [selectionColumn, ...columns]
    : columns;

  const table = useReactTable({
    data: data ?? [],
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onEnd",
    state: {},
  });

  if (isPending) return null;
  if (!data?.length) {
    return (
      <div className={cn("flex flex-col w-full gap-4", className)}>
        <Alert>
          <AlertDescription>No results found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full gap-4", className)}>
      <div className="overflow-hidden rounded-lg border border-[var(--twenty-border-light)] bg-background">
        {((sortFields && sortFields.length > 0) || toolbarActions) && (
          <CRMListTableToolbar sortFields={sortFields ?? []} toolbarActions={toolbarActions} />
        )}
        <div className="overflow-x-auto">
          <Table
            style={{ tableLayout: "fixed", width: table.getCenterTotalSize() }}
          >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width: header.getSize(),
                      minWidth: header.getSize(),
                      maxWidth: header.getSize(),
                    }}
                    className="relative"
                  >
                    {header.column.getCanResize() ? (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none",
                          "hover:bg-primary/50",
                          header.column.getIsResizing() && "bg-primary"
                        )}
                        style={{ touchAction: "none" }}
                      />
                    ) : null}
                    {(() => {
                      const sortKey =
                        (header.column.columnDef.meta as { sortKey?: string })
                          ?.sortKey ?? header.column.id;
                      const isSortable =
                        sortableIds.has(sortKey) && setSort;
                      if (!isSortable)
                        return flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        );
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            setSort({
                              field: sortKey,
                              order:
                                sort?.field === sortKey
                                  ? sort.order === "ASC"
                                    ? "DESC"
                                    : "ASC"
                                  : "ASC",
                            })
                          }
                          className="flex items-center gap-1 w-full text-left hover:opacity-80 transition-opacity"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {sort?.field === sortKey && (
                            <span className="text-muted-foreground">
                              {sort.order === "ASC" ? (
                                <HugeiconsIcon icon={ArrangeByLettersZAIcon} className="h-3.5 w-3.5" />
                              ) : (
                                <HugeiconsIcon icon={ArrangeByLettersZAIcon} className="h-3.5 w-3.5" />
                              )}
                            </span>
                          )}
                        </button>
                      );
                    })()}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <CRMListTableRow
                key={String(row.original.id)}
                row={row}
                rowClick={rowClick}
                resource={resource ?? ""}
              />
            ))}
          </TableBody>
          </Table>
        </div>
      </div>
      {bulkActionButtons !== false && (
        <BulkActionsToolbar>{bulkActionButtons}</BulkActionsToolbar>
      )}
    </div>
  );
}

function CRMListTableRow<RecordType extends RaRecord>({
  row,
  rowClick,
  resource,
}: {
  row: Row<RecordType>;
  rowClick: CRMListTableProps<RecordType>["rowClick"];
  resource: string;
}) {
  const navigate = useNavigate();
  const getPathForRecord = useGetPathForRecordCallback();
  const { selectedIds } = useListContext<RecordType>();
  const record = row.original;
  const isSelected = selectedIds?.includes(record.id);

  const handleClick = useCallback(async () => {
    const temporaryLink =
      typeof rowClick === "function"
        ? rowClick(String(record.id), resource, record)
        : rowClick;

    const link = isPromise(temporaryLink) ? await temporaryLink : temporaryLink;

    const path = await getPathForRecord({
      record,
      resource,
      link,
    });
    if (path === false || path == null) return;
    navigate(path, { state: { _scrollToTop: true } });
  }, [record, resource, rowClick, navigate, getPathForRecord]);

  return (
    <RecordContextProvider value={record}>
      <TableRow
        onClick={handleClick}
        data-state={isSelected ? "selected" : undefined}
        className={cn(rowClick !== false && "cursor-pointer")}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            style={{
              width: cell.column.getSize(),
              minWidth: cell.column.getSize(),
              maxWidth: cell.column.getSize(),
            }}
            className="py-1 overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </RecordContextProvider>
  );
}
