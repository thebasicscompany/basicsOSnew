import { useRef, useState } from "react";
import { Braces } from "lucide-react";
import { Button } from "basics-os/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "basics-os/src/components/ui/popover";

export interface Variable {
  value: string;
  label: string;
  group?: string;
}

interface VariablePickerProps {
  variables: Variable[];
  /** Called with the full `{{variable}}` string to insert */
  onInsert: (text: string) => void;
}

export function VariablePicker({ variables, onInsert }: VariablePickerProps) {
  const [open, setOpen] = useState(false);

  // Group variables
  const groups: Record<string, Variable[]> = {};
  for (const v of variables) {
    const g = v.group ?? "Other";
    if (!groups[g]) groups[g] = [];
    groups[g].push(v);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          title="Insert variable"
        >
          <Braces className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Insert variable</p>
        <div className="space-y-2">
          {Object.entries(groups).map(([group, vars]) => (
            <div key={group}>
              <p className="px-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group}
              </p>
              <div className="space-y-0.5">
                {vars.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      onInsert(`{{${v.value}}}`);
                      setOpen(false);
                    }}
                  >
                    <code className="font-mono text-primary shrink-0">{`{{${v.value}}}`}</code>
                    {v.label !== v.value && (
                      <span className="truncate text-muted-foreground">{v.label}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Hook that returns a ref and an insert-at-cursor function for controlled inputs.
 * Pass the ref to an <input> or <textarea>, and call insert() with text to insert
 * at the current cursor position (or append if the element isn't focused).
 */
export function useInsertAtCursor(
  value: string,
  onChange: (val: string) => void,
) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  function insert(text: string) {
    const el = ref.current;
    if (el && document.activeElement === el) {
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const newVal = value.slice(0, start) + text + value.slice(end);
      onChange(newVal);
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + text.length;
      });
    } else {
      onChange(value + text);
    }
  }

  return { ref, insert };
}
