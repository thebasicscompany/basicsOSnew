/**
 * Universal Cell component.
 *
 * Delegates ALL rendering to the field type registry. It is the single
 * entry-point for displaying or editing a value in a spreadsheet grid cell.
 *
 * Behaviour summary:
 *  - Protected records  -> gray "Protected record" text
 *  - isEditing          -> fieldType.CellEditor
 *  - empty value        -> placeholder text (gray, italic)
 *  - otherwise          -> fieldType.CellDisplay
 *  - Checkbox type      -> toggle directly, never enters "edit mode"
 */

import React, { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { getFieldType } from "@/field-types";
import type { Attribute } from "@/field-types/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CellProps {
  attribute: Attribute;
  value: any;
  isEditing: boolean;
  isSelected: boolean;
  isProtected?: boolean;
  onStartEditing: () => void;
  onSave: (value: any) => void;
  onCancel: () => void;
  cellRect?: DOMRect;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Cell({
  attribute,
  value,
  isEditing,
  isSelected,
  isProtected = false,
  onStartEditing,
  onSave,
  onCancel,
  cellRect: _cellRect,
  className,
}: CellProps) {
  const fieldType = getFieldType(attribute.uiType);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isCheckbox = attribute.uiType === "checkbox";

  // ---- interaction handlers ------------------------------------------------

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Checkbox: toggle immediately
      if (isCheckbox) {
        e.stopPropagation();
        onSave(!value);
        return;
      }

      // If already selected, enter editing; otherwise the parent grid handles
      // selection on its own.
      if (isSelected && !isEditing) {
        onStartEditing();
      }
    },
    [isCheckbox, isSelected, isEditing, onStartEditing, onSave, value],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isCheckbox) return; // checkbox already toggled on single click
      e.stopPropagation();
      onStartEditing();
    },
    [isCheckbox, onStartEditing],
  );

  // ---- render: protected ---------------------------------------------------

  if (isProtected) {
    return (
      <div
        ref={wrapperRef}
        className={cn("flex min-h-[32px] items-center px-2", className)}
      >
        <span className="text-xs italic text-muted-foreground">
          Protected record
        </span>
      </div>
    );
  }

  // ---- render: editing (skip for checkbox) ---------------------------------

  if (isEditing && !isCheckbox) {
    const CellEditor = fieldType.CellEditor;
    return (
      <div
        ref={wrapperRef}
        className={cn(
          "flex min-h-[32px] items-center ring-2 ring-blue-500 rounded-sm",
          className,
        )}
      >
        <CellEditor
          value={value}
          config={attribute.config}
          attribute={attribute}
          onSave={onSave}
          onCancel={onCancel}
        />
      </div>
    );
  }

  // ---- render: display -----------------------------------------------------

  const empty = fieldType.isEmpty(value);
  const CellDisplay = fieldType.CellDisplay;

  return (
    <div
      ref={wrapperRef}
      role="gridcell"
      tabIndex={isSelected ? 0 : -1}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "flex min-h-[32px] items-center overflow-hidden px-2 cursor-default select-none",
        isSelected && "ring-2 ring-blue-500 rounded-sm",
        className,
      )}
    >
      {empty ? (
        <span className="truncate text-xs italic text-muted-foreground">
          {fieldType.placeholder}
        </span>
      ) : (
        <CellDisplay
          value={value}
          config={attribute.config}
          attribute={attribute}
        />
      )}
    </div>
  );
}
