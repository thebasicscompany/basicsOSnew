import { CheckIcon, CaretDownIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { FormInputProps, SelectOption } from "../../types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
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
export function MultiSelectFormInput({
  value,
  config,
  onChange,
  error,
  attribute,
}: FormInputProps) {
  const [open, setOpen] = useState(false);
  const options: SelectOption[] = config.options ?? [];
  const selected: string[] = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const toggleOption = (optionId: string) => {
    const next = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    onChange(next.length === 0 ? null : next);
  };

  const removeOption = (optionId: string) => {
    const next = selected.filter((id) => id !== optionId);
    onChange(next.length === 0 ? null : next);
  };

  return (
    <div className="flex flex-col gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "border-input bg-background flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border px-3 py-1 text-sm shadow-xs",
              error && "border-destructive",
            )}
          >
            {selected.length > 0 ? (
              selected.map((id) => {
                const option = options.find(
                  (o) => o.id === id || o.label === id,
                );
                const label = option?.label ?? id;
                const colorName = option?.color ?? getColorByHash(label).name;
                const colors = getColorClasses(colorName);
                return (
                  <span
                    key={id}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                      colors.bg,
                      colors.text,
                      colors.border,
                    )}
                  >
                    {label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(id);
                      }}
                      className="hover:text-foreground"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                );
              })
            ) : (
              <span className="text-muted-foreground">
                Select {attribute.name.toLowerCase()}...
              </span>
            )}
            <CaretDownIcon className="text-muted-foreground ml-auto h-4 w-4 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-0">
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              {options.map((option) => {
                const optionId = option.id ?? option.label;
                const isSelected = selected.includes(optionId);
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
                      <CheckIcon className="text-primary ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
