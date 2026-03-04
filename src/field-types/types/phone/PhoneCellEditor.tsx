import { useRef, useEffect, useState } from "react";
import type { CellEditorProps } from "@/field-types/types";

export function PhoneCellEditor({ value, onSave, onCancel }: CellEditorProps) {
  const [draft, setDraft] = useState<string>(value ?? "");
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
      onSave(draft || null);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="tel"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(draft || null)}
      placeholder="(555) 123-4567"
      className="h-full w-full border-none bg-transparent px-2 text-sm outline-none"
    />
  );
}
