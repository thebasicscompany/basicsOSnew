import { useRef, useEffect, useState } from "react";
import type { CellEditorProps } from "../../types";

export function DomainCellEditor({ value, onSave, onCancel }: CellEditorProps) {
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
      type="url"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(draft || null)}
      placeholder="example.com"
      className="h-full w-full border-none bg-transparent px-2 text-sm outline-none"
    />
  );
}
