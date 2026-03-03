import { useState, useCallback } from "react";

export interface ActiveCell {
  rowIndex: number;
  colId: string;
}

interface UseKeyboardNavigationOptions {
  /** Ordered list of visible column IDs (excluding hidden) */
  visibleColumnIds: string[];
  /** Total number of data rows */
  rowCount: number;
  /** Callback when active cell changes */
  onActiveCellChange?: (cell: ActiveCell | null) => void;
}

export function useKeyboardNavigation({
  visibleColumnIds,
  rowCount,
  onActiveCellChange,
}: UseKeyboardNavigationOptions) {
  const [activeCell, setActiveCellState] = useState<ActiveCell | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const setActiveCell = useCallback(
    (cell: ActiveCell | null) => {
      setActiveCellState(cell);
      onActiveCellChange?.(cell);
    },
    [onActiveCellChange],
  );

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!activeCell) return;
      if (isEditing) {
        // While editing, only Escape and Enter are handled
        if (e.key === "Escape") {
          e.preventDefault();
          setIsEditing(false);
        }
        // Enter to commit is handled by the cell editor itself
        return;
      }

      const colIndex = visibleColumnIds.indexOf(activeCell.colId);

      switch (e.key) {
        case "ArrowUp": {
          e.preventDefault();
          if (activeCell.rowIndex > 0) {
            setActiveCell({
              rowIndex: activeCell.rowIndex - 1,
              colId: activeCell.colId,
            });
          }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          if (activeCell.rowIndex < rowCount - 1) {
            setActiveCell({
              rowIndex: activeCell.rowIndex + 1,
              colId: activeCell.colId,
            });
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (colIndex > 0) {
            setActiveCell({
              rowIndex: activeCell.rowIndex,
              colId: visibleColumnIds[colIndex - 1],
            });
          }
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (colIndex < visibleColumnIds.length - 1) {
            setActiveCell({
              rowIndex: activeCell.rowIndex,
              colId: visibleColumnIds[colIndex + 1],
            });
          }
          break;
        }
        case "Tab": {
          e.preventDefault();
          if (e.shiftKey) {
            // Move left
            if (colIndex > 0) {
              setActiveCell({
                rowIndex: activeCell.rowIndex,
                colId: visibleColumnIds[colIndex - 1],
              });
            }
          } else {
            // Move right, wrap to next row
            if (colIndex < visibleColumnIds.length - 1) {
              setActiveCell({
                rowIndex: activeCell.rowIndex,
                colId: visibleColumnIds[colIndex + 1],
              });
            } else if (activeCell.rowIndex < rowCount - 1) {
              setActiveCell({
                rowIndex: activeCell.rowIndex + 1,
                colId: visibleColumnIds[0],
              });
            }
          }
          break;
        }
        case "Enter":
        case "F2": {
          e.preventDefault();
          setIsEditing(true);
          break;
        }
        case "Escape": {
          e.preventDefault();
          setActiveCell(null);
          break;
        }
      }
    },
    [activeCell, isEditing, visibleColumnIds, rowCount, setActiveCell],
  );

  return {
    activeCell,
    setActiveCell,
    isEditing,
    startEditing,
    stopEditing,
    handleKeyDown,
  };
}
