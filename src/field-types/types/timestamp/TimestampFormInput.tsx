import { CalendarIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { FormInputProps } from "../../types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function TimestampFormInput({
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
  const validDate =
    parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(validDate);
  const [timeValue, setTimeValue] = useState<string>(
    validDate
      ? `${String(validDate.getHours()).padStart(2, "0")}:${String(validDate.getMinutes()).padStart(2, "0")}`
      : "12:00",
  );

  const handleSave = () => {
    if (!selectedDate) {
      onChange(null);
    } else {
      const [hours, minutes] = timeValue.split(":").map(Number);
      const combined = new Date(selectedDate);
      combined.setHours(hours || 0, minutes || 0, 0, 0);
      onChange(combined.toISOString());
    }
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <Popover
        open={open}
        onOpenChange={(o) => {
          if (!o) handleSave();
          setOpen(o);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "border-input bg-background flex h-9 w-full items-center justify-between rounded-md border px-3 py-1 text-sm shadow-xs",
              error && "border-destructive",
            )}
          >
            {validDate ? (
              <span>{dateTimeFormatter.format(validDate)}</span>
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
            selected={selectedDate}
            onSelect={setSelectedDate}
            defaultMonth={selectedDate}
          />
          <div className="border-t px-3 py-2">
            <label className="text-muted-foreground mb-1 block text-xs">
              Time
            </label>
            <Input
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </PopoverContent>
      </Popover>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
