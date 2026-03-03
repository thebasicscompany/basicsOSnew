import { useState } from "react";
import type { CellEditorProps, SelectOption } from "../../types";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { getColorClasses, getColorByHash } from "../../colors";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function MultiSelectCellEditor({
  value,
  config,
  onSave,
  onCancel,
}: CellEditorProps) {
  const [open, setOpen] = useState(true);
  const options: SelectOption[] = config.options ?? [];

  const selected: string[] = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const [draft, setDraft] = useState<string[]>(selected);

  const toggleOption = (optionId: string) => {
    setDraft((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      return [...prev, optionId];
    });
  };

  const handleClose = () => {
    onSave(draft.length === 0 ? null : draft);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
        setOpen(o);
      }}
    >
      <PopoverAnchor className="h-full w-full" />
      <PopoverContent
        align="start"
        side="bottom"
        className="w-56 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Search options..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            {options.map((option) => {
              const optionId = option.id ?? option.label;
              const isSelected = draft.includes(optionId);
              const colorName =
                option.color ?? getColorByHash(option.label).name;
              const colors = getColorClasses(colorName);
              return (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => toggleOption(optionId)}
                >
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      colors.bg,
                      colors.text,
                      colors.border,
                    )}
                  >
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check className="text-primary ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
