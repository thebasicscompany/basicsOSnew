"use client";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import type { RaRecord } from "ra-core";
import {
  useListContext,
  useResourceContext,
} from "ra-core";

/**
 * useDataTableRA - React-admin adapter for tablecn DataTable.
 * Uses useListContext for data, pagination, sort, and filters instead of nuqs URL state.
 */
export function useDataTableRA<TData extends RaRecord>(
  props: Omit<
    TableOptions<TData>,
    | "state"
    | "pageCount"
    | "getCoreRowModel"
    | "manualFiltering"
    | "manualPagination"
    | "manualSorting"
  > & {
    pageCount?: number;
    initialState?: Partial<{
      sorting: SortingState;
      columnVisibility: VisibilityState;
      rowSelection: RowSelectionState;
    }>;
  }
) {
  const {
    columns,
    data: dataProp,
    pageCount: pageCountProp,
    initialState,
    getRowId,
    ...tableProps
  } = props;

  const listContext = useListContext<TData>();
  const resource = useResourceContext();

  const data = dataProp ?? listContext.data ?? [];
  const total = listContext.total ?? 0;
  const page = (listContext.page ?? 1) - 1; // 1-based -> 0-based
  const perPage = listContext.perPage ?? 25;
  const setPage = listContext.setPage ?? (() => {});
  const setPerPage = listContext.setPerPage ?? (() => {});
  const sort = listContext.sort ?? { field: "id", order: "ASC" as const };
  const setSort = listContext.setSort ?? (() => {});
  const filterValues = listContext.filterValues ?? {};
  const setFilters = listContext.setFilters ?? (() => {});
  const selectedIds = listContext.selectedIds ?? [];
  const onSelect = listContext.onSelect ?? (() => {});

  const pageCount = pageCountProp ?? (Math.ceil(total / perPage) || -1);

  const getRowIdFn = getRowId ?? ((row) => String((row as RaRecord).id));

  const rowSelection = React.useMemo<RowSelectionState>(() => {
    const state: RowSelectionState = {};
    const selectedSet = new Set(selectedIds.map(String));
    data.forEach((row) => {
      const id = getRowIdFn(row, -1) as string;
      if (selectedSet.has(id)) {
        state[id] = true;
      }
    });
    return state;
  }, [data, selectedIds, getRowIdFn]);

  const onRowSelectionChange = React.useCallback(
    (updaterOrValue: Updater<RowSelectionState>) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(rowSelection)
          : updaterOrValue;
      const ids = Object.entries(next)
        .filter(([, selected]) => selected)
        .map(([id]) => id);
      onSelect(ids);
    },
    [rowSelection, onSelect]
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  const pagination: PaginationState = React.useMemo(
    () => ({
      pageIndex: page,
      pageSize: perPage,
    }),
    [page, perPage]
  );

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      const newPagination =
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue;
      setPage(newPagination.pageIndex + 1);
      setPerPage(newPagination.pageSize);
    },
    [pagination, setPage, setPerPage]
  );

  const sorting: SortingState = React.useMemo(
    () => [{ id: sort.field, desc: sort.order === "DESC" }],
    [sort.field, sort.order]
  );

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      if (newSorting.length > 0) {
        setSort({
          field: newSorting[0].id,
          order: newSorting[0].desc ? "DESC" : "ASC",
        });
      }
    },
    [sorting, setSort]
  );

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      setColumnFilters((prev) => {
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prev)
            : updaterOrValue;
        const newFilterValues = { ...filterValues };
        for (const f of next) {
          if (f.value !== undefined && f.value !== "") {
            newFilterValues[f.id] = Array.isArray(f.value)
              ? f.value
              : f.value;
          } else {
            delete newFilterValues[f.id];
          }
        }
        for (const key of Object.keys(newFilterValues)) {
          if (!next.some((f) => f.id === key)) {
            delete newFilterValues[key];
          }
        }
        setFilters(newFilterValues, []);
        return next;
      });
    },
    [filterValues, setFilters]
  );

  const table = useReactTable({
    ...tableProps,
    columns,
    data,
    getRowId,
    pageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    onPaginationChange,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return { table, resource };
}
