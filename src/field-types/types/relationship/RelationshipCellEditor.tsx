import { ArrowSquareUpRightIcon, CheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { CellEditorProps } from "@/field-types/types";
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
interface LinkedRecord {
  id: string;
  title?: string;
  tableName?: string;
}

function parseRelationshipValue(value: any): LinkedRecord[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value.map((v) => {
      if (typeof v === "object" && v.id) return v as LinkedRecord;
      return { id: String(v), title: String(v) };
    });
  }
  if (typeof value === "object" && value.id) return [value as LinkedRecord];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.id) return [parsed as LinkedRecord];
    } catch {
      return [{ id: value, title: value }];
    }
  }
  return [];
}

export function RelationshipCellEditor({
  value,
  config,
  onSave,
  onCancel,
}: CellEditorProps) {
  const [open, setOpen] = useState(true);
  const allowMultiple = config.allowMultiple !== false;
  const availableRecords: LinkedRecord[] = config.records ?? [];
  const currentRecords = parseRelationshipValue(value);
  const [draft, setDraft] = useState<LinkedRecord[]>(currentRecords);

  const selectedIds = new Set(draft.map((r) => r.id));

  const toggleRecord = (record: LinkedRecord) => {
    if (selectedIds.has(record.id)) {
      setDraft(draft.filter((r) => r.id !== record.id));
    } else {
      if (allowMultiple) {
        setDraft([...draft, record]);
      } else {
        // Single select mode
        onSave(record);
        setOpen(false);
        return;
      }
    }
  };

  const handleClose = () => {
    if (allowMultiple) {
      onSave(draft.length === 0 ? null : draft);
    } else {
      onCancel();
    }
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
        className="w-64 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Search records..." />
          <CommandList>
            <CommandEmpty>No records found.</CommandEmpty>
            {availableRecords.map((record) => {
              const isSelected = selectedIds.has(record.id);
              return (
                <CommandItem
                  key={record.id}
                  value={record.title || record.id}
                  onSelect={() => toggleRecord(record)}
                >
                  <span className="inline-flex items-center gap-1 text-sm">
                    <ArrowSquareUpRightIcon className="h-3 w-3 opacity-50" />
                    {record.title || record.id}
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
  );
}
