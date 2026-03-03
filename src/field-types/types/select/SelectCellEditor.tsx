import { CheckIcon } from "@phosphor-icons/react"
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
export function SelectCellEditor({
  value,
  config,
  onSave,
  onCancel,
}: CellEditorProps) {
  const [open, setOpen] = useState(true);
  const options: SelectOption[] = config.options ?? [];

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
        if (!o) {
          onCancel();
        }
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
              const colorName =
                option.color ?? getColorByHash(option.label).name;
              const colors = getColorClasses(colorName);
              return (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => handleSelect(option.id ?? option.label)}
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
