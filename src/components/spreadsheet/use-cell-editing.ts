import { useState, useCallback, useRef, useEffect } from "react";

export interface CellEditingState {
  rowId: number | string;
  columnId: string;
}

/**
 * State machine for spreadsheet cell editing.
 * - Click a cell to select it
 * - Double-click or Enter to start editing
 * - Escape to cancel editing
 * - Tab to commit + move right
 * - Enter (while editing) to commit + move down
 */
export function useCellEditing() {
  const [editing, setEditing] = useState<CellEditingState | null>(null);
  const [selected, setSelected] = useState<CellEditingState | null>(null);
  const pendingValue = useRef<unknown>(undefined);

  const startEditing = useCallback(
    (rowId: number | string, columnId: string) => {
      setEditing({ rowId, columnId });
      setSelected({ rowId, columnId });
      pendingValue.current = undefined;
    },
    [],
  );

  const select = useCallback((rowId: number | string, columnId: string) => {
    setSelected({ rowId, columnId });
    setEditing(null);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditing(null);
    pendingValue.current = undefined;
  }, []);

  const commitEditing = useCallback(() => {
    const value = pendingValue.current;
    const cell = editing;
    setEditing(null);
    pendingValue.current = undefined;
    return cell ? { ...cell, value } : null;
  }, [editing]);

  const setPendingValue = useCallback((value: unknown) => {
    pendingValue.current = value;
  }, []);

  const isEditing = useCallback(
    (rowId: number | string, columnId: string) =>
      editing?.rowId === rowId && editing?.columnId === columnId,
    [editing],
  );

  const isSelected = useCallback(
    (rowId: number | string, columnId: string) =>
      selected?.rowId === rowId && selected?.columnId === columnId,
    [selected],
  );

  return {
    editing,
    selected,
    startEditing,
    select,
    cancelEditing,
    commitEditing,
    setPendingValue,
    isEditing,
    isSelected,
  };
}

/**
 * Hook for an individual editable cell input.
 * Auto-focuses on mount, commits on blur/Enter, cancels on Escape.
 */
export function useCellInput(
  initialValue: string,
  onCommit: (value: string) => void,
  onCancel: () => void,
) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onCommit(value);
      } else if (e.key === "Tab") {
        e.preventDefault();
        onCommit(value);
      }
    },
    [value, onCommit, onCancel],
  );

  const handleBlur = useCallback(() => {
    onCommit(value);
  }, [value, onCommit]);

  return { value, setValue, inputRef, handleKeyDown, handleBlur };
}
