import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const DATA_TABLE_SELECT_COL_WIDTH = 44;

export const DATA_TABLE_ROW_SELECT_COLUMN_ID = "_select";

export function DataTableSelectAllHeader({
  pageRecordIds,
  selectedCountOnPage,
  onSelectAllOnPage,
  onClearSelection,
}: {
  pageRecordIds: number[];
  selectedCountOnPage: number;
  onSelectAllOnPage: () => void;
  onClearSelection: () => void;
}) {
  const totalOnPage = pageRecordIds.length;
  const allSelected =
    totalOnPage > 0 && selectedCountOnPage === totalOnPage;
  const someSelected =
    selectedCountOnPage > 0 && selectedCountOnPage < totalOnPage;

  return (
    <div className="flex items-center justify-center px-0.5">
      <Checkbox
        aria-label={
          allSelected ? "Deselect all on this page" : "Select all on this page"
        }
        checked={allSelected ? true : someSelected ? "indeterminate" : false}
        onCheckedChange={(v) => {
          if (v === true) onSelectAllOnPage();
          else onClearSelection();
        }}
      />
    </div>
  );
}

export function DataTableRowSelectCell({
  rowIndex,
  isSelected,
  onShiftClick,
  onCtrlToggle,
  beginDragSelect,
  dragSelectToRow,
  endDragSelect,
  dragMovedRef,
}: {
  rowIndex: number;
  isSelected: boolean;
  onShiftClick: () => void;
  onCtrlToggle: () => void;
  beginDragSelect: (rowIndex: number) => void;
  dragSelectToRow: (rowIndex: number) => void;
  endDragSelect: () => void;
  dragMovedRef: React.MutableRefObject<boolean>;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-9 items-center justify-center px-0.5",
        "touch-none select-none",
        !isSelected && "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (dragMovedRef.current) {
          dragMovedRef.current = false;
          return;
        }
        if (e.shiftKey) {
          onShiftClick();
          return;
        }
        if (e.ctrlKey || e.metaKey) {
          onCtrlToggle();
          return;
        }
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        if (e.shiftKey || e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        beginDragSelect(rowIndex);
        dragMovedRef.current = false;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
          return;
        }
        dragMovedRef.current = true;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const rowEl = el?.closest("[data-row-index]");
        if (!rowEl) return;
        const idx = Number(rowEl.getAttribute("data-row-index"));
        if (!Number.isFinite(idx)) return;
        dragSelectToRow(idx);
      }}
      onPointerUp={(e) => {
        if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
        endDragSelect();
      }}
      onPointerCancel={(e) => {
        if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
        endDragSelect();
      }}
    >
      <Checkbox
        tabIndex={-1}
        aria-label={`Select row ${rowIndex + 1}`}
        checked={isSelected}
        className="pointer-events-none"
      />
    </div>
  );
}
