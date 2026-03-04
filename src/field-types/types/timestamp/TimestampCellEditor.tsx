import { useState } from "react";
import type { CellEditorProps } from "@/field-types/types";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";

export function TimestampCellEditor({
  value,
  onSave,
  onCancel,
}: CellEditorProps) {
  const [open, setOpen] = useState(true);

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
      onSave(null);
    } else {
      const [hours, minutes] = timeValue.split(":").map(Number);
      const combined = new Date(selectedDate);
      combined.setHours(hours || 0, minutes || 0, 0, 0);
      onSave(combined.toISOString());
    }
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o) handleSave();
        setOpen(o);
      }}
    >
      <PopoverAnchor className="h-full w-full" />
      <PopoverContent
        align="start"
        side="bottom"
        className="w-auto p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
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
        <div className="flex justify-end gap-1 border-t px-3 py-2">
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
