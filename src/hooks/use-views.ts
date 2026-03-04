import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useSearchParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import {
  useViewList,
  useViewColumns,
  useViewSorts,
  useViewFilters,
  useUpdateViewColumn,
  useCreateViewColumn,
  useCreateViewSort,
  useDeleteViewSort,
  useCreateViewFilter,
  useDeleteViewFilter,
} from "@/hooks/use-view-queries";
import type {
  ViewConfig,
  ViewColumn,
  ViewSort,
  ViewFilter,
  ViewState,
} from "@/types/views";

interface CreateViewApiResponse {
  id: string;
  title: string;
  type: number;
  order: number;
  is_default: boolean;
}

interface UseViewsReturn {
  views: ViewConfig[];
  activeView: ViewConfig | undefined;
  setActiveView: (viewId: string) => void;
  createView: ReturnType<
    typeof useMutation<
      ViewConfig,
      Error,
      { title: string; type?: ViewConfig["type"] }
    >
  >;
  isLoading: boolean;
  error: Error | null;
}

const VIEW_TYPE_MAP: Record<number, ViewConfig["type"]> = {
  3: "grid",
  2: "kanban",
  4: "gallery",
  5: "form",
};

const VIEW_TYPE_TO_NOCO: Record<string, number> = {
  grid: 3,
  kanban: 2,
  gallery: 4,
  form: 5,
};

export function useViews(objectSlug: string): UseViewsReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: views = [], isLoading, error } = useViewList(objectSlug);

  const activeViewId = searchParams.get("view");

  const activeView = useMemo(() => {
    if (!views.length) return undefined;
    if (activeViewId) {
      const found = views.find((v) => v.id === activeViewId);
      if (found) return found;
    }
    return views.find((v) => v.isDefault) ?? views[0];
  }, [views, activeViewId]);

  const setActiveView = useCallback(
    (viewId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", viewId);
        return next;
      });
    },
    [setSearchParams],
  );

  const qc = useQueryClient();

  const createViewMutation = useMutation<
    ViewConfig,
    Error,
    { title: string; type?: ViewConfig["type"] }
  >({
    mutationFn: async ({ title, type = "grid" }) => {
      const raw = await fetchApi<CreateViewApiResponse>(
        `/api/views/${objectSlug}`,
        {
          method: "POST",
          body: JSON.stringify({
            title,
            type: VIEW_TYPE_TO_NOCO[type] ?? 3,
          }),
        },
      );
      return {
        id: raw.id,
        title: raw.title,
        type: VIEW_TYPE_MAP[raw.type] ?? "grid",
        order: raw.order,
        isDefault: raw.is_default,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["views", objectSlug] });
    },
  });

  return {
    views,
    activeView,
    setActiveView,
    createView: createViewMutation,
    isLoading,
    error: error as Error | null,
  };
}

type ViewStateAction =
  | { type: "SET_COLUMNS"; columns: ViewColumn[] }
  | { type: "SET_SORTS"; sorts: ViewSort[] }
  | { type: "SET_FILTERS"; filters: ViewFilter[] }
  | { type: "UPDATE_COLUMN"; columnId: string; updates: Partial<ViewColumn> }
  | { type: "ADD_SORT"; sort: ViewSort }
  | { type: "REMOVE_SORT"; sortId: string }
  | { type: "ADD_FILTER"; filter: ViewFilter }
  | { type: "REMOVE_FILTER"; filterId: string }
  | { type: "MARK_CLEAN" }
  | { type: "DISCARD"; snapshot: ViewState };

function viewStateReducer(
  state: ViewState,
  action: ViewStateAction,
): ViewState {
  switch (action.type) {
    case "SET_COLUMNS":
      return { ...state, columns: action.columns };
    case "SET_SORTS":
      return { ...state, sorts: action.sorts };
    case "SET_FILTERS":
      return { ...state, filters: action.filters };
    case "UPDATE_COLUMN":
      return {
        ...state,
        isDirty: true,
        columns: state.columns.map((c) =>
          c.id === action.columnId ? { ...c, ...action.updates } : c,
        ),
      };
    case "ADD_SORT":
      return {
        ...state,
        isDirty: true,
        sorts: [...state.sorts, action.sort],
      };
    case "REMOVE_SORT":
      return {
        ...state,
        isDirty: true,
        sorts: state.sorts.filter((s) => s.id !== action.sortId),
      };
    case "ADD_FILTER":
      return {
        ...state,
        isDirty: true,
        filters: [...state.filters, action.filter],
      };
    case "REMOVE_FILTER":
      return {
        ...state,
        isDirty: true,
        filters: state.filters.filter((f) => f.id !== action.filterId),
      };
    case "MARK_CLEAN":
      return { ...state, isDirty: false };
    case "DISCARD":
      return { ...action.snapshot, isDirty: false };
    default:
      return state;
  }
}

interface UseViewStateReturn {
  columns: ViewColumn[];
  sorts: ViewSort[];
  filters: ViewFilter[];
  isDirty: boolean;
  isLoading: boolean;
  save: () => Promise<void>;
  discard: () => void;
  updateColumn: (
    columnId: string,
    updates: Partial<Pick<ViewColumn, "show" | "order" | "width">>,
  ) => void;
  addSort: (fieldId: string, direction: "asc" | "desc") => void;
  removeSort: (sortId: string) => void;
  addFilter: (
    fieldId: string,
    operator: string,
    value: unknown,
    logicalOp?: "and" | "or",
  ) => void;
  removeFilter: (filterId: string) => void;
}

// shared refs to avoid effect churn
const EMPTY_COLUMNS: ViewColumn[] = [];
const EMPTY_SORTS: ViewSort[] = [];
const EMPTY_FILTERS: ViewFilter[] = [];

export function useViewState(viewId: string): UseViewStateReturn {
  const { data: serverColumns = EMPTY_COLUMNS, isLoading: columnsLoading } =
    useViewColumns(viewId);
  const { data: serverSorts = EMPTY_SORTS, isLoading: sortsLoading } =
    useViewSorts(viewId);
  const { data: serverFilters = EMPTY_FILTERS, isLoading: filtersLoading } =
    useViewFilters(viewId);

  const isLoading = columnsLoading || sortsLoading || filtersLoading;

  const [localState, dispatch] = useReducer(viewStateReducer, {
    columns: [],
    sorts: [],
    filters: [],
    isDirty: false,
  });

  const isDirtyRef = useRef(localState.isDirty);
  isDirtyRef.current = localState.isDirty;

  useEffect(() => {
    isDirtyRef.current = false;
    dispatch({ type: "MARK_CLEAN" });
  }, [viewId]);

  useEffect(() => {
    if (!isDirtyRef.current && serverColumns.length > 0) {
      dispatch({ type: "SET_COLUMNS", columns: serverColumns });
    }
  }, [serverColumns]);

  useEffect(() => {
    if (!isDirtyRef.current) {
      dispatch({ type: "SET_SORTS", sorts: serverSorts });
    }
  }, [serverSorts]);

  useEffect(() => {
    if (!isDirtyRef.current) {
      dispatch({ type: "SET_FILTERS", filters: serverFilters });
    }
  }, [serverFilters]);

  const updateColumnMutation = useUpdateViewColumn(viewId);
  const createColumnMutation = useCreateViewColumn(viewId);
  const createSortMutation = useCreateViewSort(viewId);
  const deleteSortMutation = useDeleteViewSort(viewId);
  const createFilterMutation = useCreateViewFilter(viewId);
  const deleteFilterMutation = useDeleteViewFilter(viewId);

  const updateColumn = useCallback(
    (
      columnId: string,
      updates: Partial<Pick<ViewColumn, "show" | "order" | "width">>,
    ) => {
      if (columnId.startsWith("virtual-") && updates.show === true) {
        const fieldId = columnId.replace(/^virtual-/, "");
        void createColumnMutation.mutateAsync({
          fk_column_id: fieldId,
          show: true,
        });
        return;
      }
      dispatch({ type: "UPDATE_COLUMN", columnId, updates });
    },
    [createColumnMutation],
  );

  const addSort = useCallback(
    (fieldId: string, direction: "asc" | "desc") => {
      // Optimistic: add a temporary sort with a placeholder ID
      const tempSort: ViewSort = {
        id: `temp-${Date.now()}`,
        fieldId,
        direction,
        order: localState.sorts.length,
      };
      dispatch({ type: "ADD_SORT", sort: tempSort });
    },
    [localState.sorts.length],
  );

  const removeSort = useCallback((sortId: string) => {
    dispatch({ type: "REMOVE_SORT", sortId });
  }, []);

  const addFilter = useCallback(
    (
      fieldId: string,
      operator: string,
      value: unknown,
      logicalOp: "and" | "or" = "and",
    ) => {
      const tempFilter: ViewFilter = {
        id: `temp-${Date.now()}`,
        fieldId,
        operator,
        value,
        logicalOp,
      };
      dispatch({ type: "ADD_FILTER", filter: tempFilter });
    },
    [],
  );

  const removeFilter = useCallback((filterId: string) => {
    dispatch({ type: "REMOVE_FILTER", filterId });
  }, []);

  const save = useCallback(async () => {
    const columnPromises = localState.columns.map((col) => {
      const serverCol = serverColumns.find((s) => s.id === col.id);
      if (!serverCol) return Promise.resolve();
      const hasChanges =
        serverCol.show !== col.show ||
        serverCol.order !== col.order ||
        serverCol.width !== col.width;
      if (!hasChanges) return Promise.resolve();

      return updateColumnMutation.mutateAsync({
        columnId: col.id,
        show: col.show,
        order: col.order,
        width: col.width,
      });
    });

    const sortPromises: Promise<unknown>[] = [];
    const serverSortIds = new Set(serverSorts.map((s) => s.id));
    const localSortIds = new Set(localState.sorts.map((s) => s.id));

    // Create sorts that don't exist on server
    for (const sort of localState.sorts) {
      if (sort.id.startsWith("temp-") || !serverSortIds.has(sort.id)) {
        sortPromises.push(
          createSortMutation.mutateAsync({
            fk_column_id: sort.fieldId,
            direction: sort.direction,
          }),
        );
      }
    }

    for (const serverSort of serverSorts) {
      if (!localSortIds.has(serverSort.id)) {
        sortPromises.push(deleteSortMutation.mutateAsync(serverSort.id));
      }
    }

    // Persist new filters and delete removed filters
    const filterPromises: Promise<unknown>[] = [];
    const serverFilterIds = new Set(serverFilters.map((f) => f.id));
    const localFilterIds = new Set(localState.filters.map((f) => f.id));

    for (const filter of localState.filters) {
      if (filter.id.startsWith("temp-") || !serverFilterIds.has(filter.id)) {
        filterPromises.push(
          createFilterMutation.mutateAsync({
            fk_column_id: filter.fieldId,
            comparison_op: filter.operator,
            value: filter.value,
            logical_op: filter.logicalOp,
          }),
        );
      }
    }

    for (const serverFilter of serverFilters) {
      if (!localFilterIds.has(serverFilter.id)) {
        filterPromises.push(deleteFilterMutation.mutateAsync(serverFilter.id));
      }
    }

    await Promise.all([...columnPromises, ...sortPromises, ...filterPromises]);
    dispatch({ type: "MARK_CLEAN" });
  }, [
    localState,
    serverColumns,
    serverSorts,
    serverFilters,
    updateColumnMutation,
    createSortMutation,
    deleteSortMutation,
    createFilterMutation,
    deleteFilterMutation,
  ]);

  // Discard — revert to server state
  const discard = useCallback(() => {
    dispatch({
      type: "DISCARD",
      snapshot: {
        columns: serverColumns,
        sorts: serverSorts,
        filters: serverFilters,
        isDirty: false,
      },
    });
  }, [serverColumns, serverSorts, serverFilters]);

  return {
    columns: localState.columns,
    sorts: localState.sorts,
    filters: localState.filters,
    isDirty: localState.isDirty,
    isLoading,
    save,
    discard,
    updateColumn,
    addSort,
    removeSort,
    addFilter,
    removeFilter,
  };
}
