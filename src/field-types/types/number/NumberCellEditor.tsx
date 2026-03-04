import { useRef, useEffect, useState } from "react";
import type { CellEditorProps } from "@/field-types/types";

export function NumberCellEditor({ value, onSave, onCancel }: CellEditorProps) {
  const [draft, setDraft] = useState<string>(
    value != null ? String(value) : "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const save = () => {
    if (draft === "") {
      onSave(null);
    } else {
      const num = Number(draft);
      onSave(isNaN(num) ? null : num);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={save}
      className="h-full w-full border-none bg-transparent px-2 text-right text-sm tabular-nums outline-none"
    />
  );
}
