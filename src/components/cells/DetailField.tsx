/**
 * DetailField — a field component for the record detail page sidebar.
 *
 * Renders a label + value pair. Clicking the value enters inline edit mode.
 * Blur/Escape cancels; Enter or an explicit save commits.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getFieldType } from "@/field-types";
import type { Attribute } from "@/field-types/types";

export interface DetailFieldProps {
  attribute: Attribute;
  value: any;
  onSave: (value: any) => void;
  isReadOnly?: boolean;
}

export function DetailField({
  attribute,
  value,
  onSave,
  isReadOnly = false,
}: DetailFieldProps) {
  const fieldType = getFieldType(attribute.uiType);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isCheckbox = attribute.uiType === "checkbox";

  const IconComponent = fieldType.icon;

  const handleStartEditing = useCallback(() => {
    if (isReadOnly) return;
    if (isCheckbox) return; // checkbox toggles directly
    setIsEditing(true);
  }, [isReadOnly, isCheckbox]);

  const handleSave = useCallback(
    (newValue: any) => {
      setIsEditing(false);
      onSave(newValue);
    },
    [onSave],
  );

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleCheckboxToggle = useCallback(() => {
    if (isReadOnly) return;
    onSave(!value);
  }, [isReadOnly, value, onSave]);

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

  const empty = fieldType.isEmpty(value);

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-[120px_1fr] gap-2 items-start py-1.5"
    >
      {/* Label */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-h-[28px]">
        {IconComponent && <IconComponent />}
        <span className="truncate">{attribute.name}</span>
      </div>

      {/* Value / Editor */}
      <div className="min-h-[28px] flex items-center">
        {isEditing ? (
          <fieldType.DetailEditor
            value={value}
            config={attribute.config}
            attribute={attribute}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : isCheckbox ? (
          <button
            type="button"
            onClick={handleCheckboxToggle}
            disabled={isReadOnly}
            className={cn(
              "cursor-pointer",
              isReadOnly && "opacity-50 cursor-not-allowed",
            )}
          >
            <fieldType.DetailDisplay
              value={value}
              config={attribute.config}
              attribute={attribute}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartEditing}
            disabled={isReadOnly}
            className={cn(
              "w-full text-left rounded px-1 -mx-1 py-0.5 transition-colors",
              !isReadOnly && "hover:bg-muted cursor-pointer",
              isReadOnly && "cursor-default",
            )}
          >
            {empty ? (
              <span className="text-xs italic text-muted-foreground">
                {fieldType.placeholder}
              </span>
            ) : (
              <fieldType.DetailDisplay
                value={value}
                config={attribute.config}
                attribute={attribute}
              />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
