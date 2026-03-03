import { useState } from "react";
import type { CellEditorProps } from "../../types";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function DateCellEditor({ value, onSave, onCancel }: CellEditorProps) {
  const [open, setOpen] = useState(true);

  const parsedDate =
    value != null && value !== ""
      ? value instanceof Date
        ? value
        : new Date(value)
      : undefined;

  const selected =
    parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined;

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      onSave(day.toISOString().split("T")[0]);
    } else {
      onSave(null);
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
        className="w-auto p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
