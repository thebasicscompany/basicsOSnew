import { CheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { CellEditorProps, StatusOption } from "../../types";
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
import { STATUS_DOT_COLORS } from "../../colors";
import { cn } from "@/lib/utils";
export function StatusCellEditor({
  value,
  config,
  onSave,
  onCancel,
}: CellEditorProps) {
  const [open, setOpen] = useState(true);
  const options: StatusOption[] = config.options ?? [];

  const handleSelect = (optionValue: string) => {
    if (optionValue === value) {
      onSave(null);
    } else {
      onSave(optionValue);
    }
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
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
          <CommandInput placeholder="Search statuses..." />
          <CommandList>
            <CommandEmpty>No statuses found.</CommandEmpty>
            {options.map((option) => {
              const dotColor = STATUS_DOT_COLORS[option.label] ?? "bg-gray-400";
              return (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => handleSelect(option.id ?? option.label)}
                >
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span
                      className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)}
                    />
                    {option.label}
                  </span>
                  {(value === option.id || value === option.label) && (
                    <CheckIcon className="text-primary ml-auto h-4 w-4" />
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
