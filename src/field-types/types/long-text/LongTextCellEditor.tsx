import { useRef, useEffect, useState } from "react";
import type { CellEditorProps } from "../../types";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

export function LongTextCellEditor({
  value,
  onSave,
  onCancel,
}: CellEditorProps) {
  const [draft, setDraft] = useState<string>(value ?? "");
  const [open, setOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Small delay so popover content is rendered
    const timer = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    setOpen(false);
    onSave(draft);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      onCancel();
    }
    // Shift+Enter for newline, Enter alone does not save (multiline text)
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o) handleSave();
      }}
    >
      <PopoverAnchor className="h-full w-full" />
      <PopoverContent
        align="start"
        side="bottom"
        className="w-80 p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          className="min-h-24 resize-y text-sm"
          placeholder="Enter text..."
        />
        <div className="mt-2 flex justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCancel();
            }}
            className="text-muted-foreground hover:text-foreground rounded px-2 py-1 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs"
          >
            Save
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
