/**
 * KanbanField — a compact field component for kanban cards.
 *
 * Renders a field value (optionally editable) inside a kanban card.
 * When editable, clicking enters edit mode with the fieldType's KanbanEditor.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getFieldType } from "@/field-types";
import type { Attribute } from "@/field-types/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface KanbanFieldProps {
  attribute: Attribute;
  value: any;
  onSave?: (value: any) => void;
  isEditable?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KanbanField({
  attribute,
  value,
  onSave,
  isEditable = false,
}: KanbanFieldProps) {
  const fieldType = getFieldType(attribute.uiType);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isCheckbox = attribute.uiType === "checkbox";

  // ---- handlers -----------------------------------------------------------

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditable || !onSave) return;

      // Checkbox: toggle directly
      if (isCheckbox) {
        e.stopPropagation();
        onSave(!value);
        return;
      }

      e.stopPropagation();
      setIsEditing(true);
    },
    [isEditable, isCheckbox, onSave, value],
  );

  const handleSave = useCallback(
    (newValue: any) => {
      setIsEditing(false);
      onSave?.(newValue);
    },
    [onSave],
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Close editor on outside click
  useEffect(() => {
    if (!isEditing) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleCancel();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, handleCancel]);

  // ---- render -------------------------------------------------------------

  const empty = fieldType.isEmpty(value);

  if (isEditing && onSave) {
    return (
      <div
        ref={containerRef}
        className="min-h-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <fieldType.KanbanEditor
          value={value}
          config={attribute.config}
          attribute={attribute}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        "min-h-[24px] flex items-center",
        isEditable && "cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1",
      )}
    >
      {empty ? (
        <span className="text-xs italic text-muted-foreground">
          {fieldType.placeholder}
        </span>
      ) : (
        <fieldType.KanbanDisplay
          value={value}
          config={attribute.config}
          attribute={attribute}
        />
      )}
    </div>
  );
}
