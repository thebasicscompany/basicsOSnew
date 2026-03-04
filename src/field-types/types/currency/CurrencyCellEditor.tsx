import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { useRef, useEffect, useState } from "react";
import type { CellEditorProps } from "../../types";
export function CurrencyCellEditor({
  value,
  onSave,
  onCancel,
}: CellEditorProps) {
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
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      step(-1);
    }
  };

  const step = (direction: number) => {
    const current = draft === "" ? 0 : Number(draft);
    if (isNaN(current)) return;
    const next = Math.round((current + direction) * 100) / 100;
    setDraft(String(next));
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
    <div className="flex h-full w-full items-center">
      <span className="text-muted-foreground pl-2 text-sm">$</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={save}
        className="h-full flex-1 border-none bg-transparent px-1 text-right text-sm tabular-nums outline-none"
      />
      <div className="flex flex-col pr-1">
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            step(1);
          }}
          className="text-muted-foreground hover:text-foreground flex h-3 items-center justify-center"
        >
          <CaretUpIcon className="h-3 w-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            step(-1);
          }}
          className="text-muted-foreground hover:text-foreground flex h-3 items-center justify-center"
        >
          <CaretDownIcon className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
