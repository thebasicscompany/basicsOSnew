import { CheckIcon, CaretDownIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { FormInputProps, StatusOption } from "../../types";
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
import { STATUS_DOT_COLORS } from "../../colors";
import { cn } from "@/lib/utils";
export function StatusFormInput({
  value,
  config,
  onChange,
  error,
  attribute,
}: FormInputProps) {
  const [open, setOpen] = useState(false);
  const options: StatusOption[] = config.options ?? [];
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
              <span className="inline-flex items-center gap-1.5 text-sm">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    STATUS_DOT_COLORS[selected.label] ?? "bg-gray-400",
                  )}
                />
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
            <CommandInput placeholder="Search statuses..." />
            <CommandList>
              <CommandEmpty>No statuses found.</CommandEmpty>
              {options.map((option) => {
                const dotColor =
                  STATUS_DOT_COLORS[option.label] ?? "bg-gray-400";
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
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          dotColor,
                        )}
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
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
