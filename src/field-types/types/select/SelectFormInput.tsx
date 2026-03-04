import { CheckIcon, CaretDownIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { FormInputProps, SelectOption } from "@/field-types/types";
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
import { getColorClasses, getColorByHash } from "@/field-types/colors";
import { cn } from "@/lib/utils";
export function SelectFormInput({
  value,
  config,
  onChange,
  error,
  attribute,
}: FormInputProps) {
  const [open, setOpen] = useState(false);
  const options: SelectOption[] = config.options ?? [];
  const selected = options.find((o) => o.id === value || o.label === value);

  return (
    <div className="flex flex-col gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "border-input bg-background flex h-9 w-full items-center justify-between rounded-md border px-3 py-1 text-sm shadow-xs",
              error && "border-destructive",
            )}
          >
            {selected ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  getColorClasses(
                    selected.color ?? getColorByHash(selected.label).name,
                  ).bg,
                  getColorClasses(
                    selected.color ?? getColorByHash(selected.label).name,
                  ).text,
                  getColorClasses(
                    selected.color ?? getColorByHash(selected.label).name,
                  ).border,
                )}
              >
                {selected.label}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Select {attribute.name.toLowerCase()}...
              </span>
            )}
            <CaretDownIcon className="text-muted-foreground h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-0">
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
                    onSelect={() => {
                      onChange(
                        option.id === value
                          ? null
                          : (option.id ?? option.label),
                      );
                      setOpen(false);
                    }}
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
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
