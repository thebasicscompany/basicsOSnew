import { useEffect } from "react";
import type { CellEditorProps } from "../../types";

export function CheckboxCellEditor({ value, onSave }: CellEditorProps) {
  const checked = value === true || value === 1 || value === "true";

  // Toggle immediately on mount
  useEffect(() => {
    onSave(!checked);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
