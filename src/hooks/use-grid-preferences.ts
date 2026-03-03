import { useState, useCallback, useEffect } from "react";
import type { SortingState, VisibilityState } from "@tanstack/react-table";

export type RowHeight = "short" | "medium" | "tall" | "extra";

export interface GridPreferences {
  rowHeight: RowHeight;
  columnVisibility: VisibilityState;
  columnOrder: string[];
  columnSizing: Record<string, number>;
  sorting: SortingState;
}

const DEFAULTS: GridPreferences = {
  rowHeight: "short",
  columnVisibility: {},
  columnOrder: [],
  columnSizing: {},
  sorting: [],
};

function getKey(resource: string) {
  return `grid-prefs-${resource}`;
}

function load(resource: string): GridPreferences {
  try {
    const raw = localStorage.getItem(getKey(resource));
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(resource: string, prefs: GridPreferences) {
  try {
    localStorage.setItem(getKey(resource), JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
}

export function useGridPreferences(resource: string) {
  const [prefs, setPrefs] = useState<GridPreferences>(() => load(resource));

  // Re-load when resource changes
  useEffect(() => {
    setPrefs(load(resource));
  }, [resource]);

  const update = useCallback(
    (patch: Partial<GridPreferences>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch };
        save(resource, next);
        return next;
      });
    },
    [resource],
  );

  const setRowHeight = useCallback(
    (rowHeight: RowHeight) => update({ rowHeight }),
    [update],
  );

  const setColumnVisibility = useCallback(
    (columnVisibility: VisibilityState) => update({ columnVisibility }),
    [update],
  );

  const setColumnOrder = useCallback(
    (columnOrder: string[]) => update({ columnOrder }),
    [update],
  );

  const setColumnSizing = useCallback(
    (columnSizing: Record<string, number>) => update({ columnSizing }),
    [update],
  );

  const setSorting = useCallback(
    (sorting: SortingState) => update({ sorting }),
    [update],
  );

  return {
    ...prefs,
    setRowHeight,
    setColumnVisibility,
    setColumnOrder,
    setColumnSizing,
    setSorting,
  };
}
