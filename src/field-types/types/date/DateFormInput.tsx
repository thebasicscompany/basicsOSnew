import { CalendarIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { FormInputProps } from "../../types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function DateFormInput({
  value,
  onChange,
  error,
  attribute,
}: FormInputProps) {
  const [open, setOpen] = useState(false);

  const parsedDate =
    value != null && value !== ""
      ? value instanceof Date
        ? value
        : new Date(value)
      : undefined;

  const selected =
    parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined;

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
              <span>{dateFormatter.format(selected)}</span>
            ) : (
              <span className="text-muted-foreground">
                Select {attribute.name.toLowerCase()}...
              </span>
            )}
            <CalendarIcon className="text-muted-foreground h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(day) => {
              if (day) {
                onChange(day.toISOString().split("T")[0]);
              } else {
                onChange(null);
              }
              setOpen(false);
            }}
            defaultMonth={selected}
          />
        </PopoverContent>
      </Popover>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
