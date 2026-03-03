import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTypeIcon } from "./type-icons";

export interface FilterDef {
  field: string;
  op: string;
  value: string;
}

interface FilterPopoverProps {
  columns: { id: string; label: string; uidt?: string }[];
  filters: FilterDef[];
  onFilterChange: (filters: FilterDef[]) => void;
}

const TEXT_OPS = [
  { value: "eq", label: "is" },
  { value: "neq", label: "is not" },
  { value: "like", label: "contains" },
  { value: "nlike", label: "does not contain" },
  { value: "blank", label: "is empty" },
  { value: "notblank", label: "is not empty" },
];

const NUMBER_OPS = [
  { value: "eq", label: "=" },
  { value: "neq", label: "!=" },
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
  { value: "blank", label: "is empty" },
  { value: "notblank", label: "is not empty" },
];

const DATE_OPS = [
  { value: "eq", label: "is" },
  { value: "gt", label: "is after" },
  { value: "lt", label: "is before" },
  { value: "blank", label: "is empty" },
  { value: "notblank", label: "is not empty" },
];

function getOpsForType(uidt?: string) {
  switch (uidt) {
    case "Number":
    case "Decimal":
    case "Currency":
    case "Percent":
    case "Duration":
    case "Rating":
      return NUMBER_OPS;
    case "Date":
    case "DateTime":
    case "CreatedTime":
    case "LastModifiedTime":
      return DATE_OPS;
    default:
      return TEXT_OPS;
  }
}

const NO_VALUE_OPS = new Set(["blank", "notblank"]);

export function FilterPopover({
  columns,
  filters,
  onFilterChange,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);

  const addFilter = () => {
    if (columns.length === 0) return;
    onFilterChange([
      ...filters,
      { field: columns[0].id, op: "eq", value: "" },
    ]);
  };

  const removeFilter = (index: number) => {
    onFilterChange(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, patch: Partial<FilterDef>) => {
    onFilterChange(
      filters.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
        >
          <Filter className="size-3.5" />
          <span className="hidden sm:inline">Filter</span>
          {filters.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 h-4 min-w-4 px-1 text-[10px]"
            >
              {filters.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <div className="border-b px-3 py-2 text-sm font-medium">
          Filter by
        </div>
        <div className="space-y-1.5 p-2">
          {filters.map((filter, index) => {
            const col = columns.find((c) => c.id === filter.field);
            const ops = getOpsForType(col?.uidt);
            const needsValue = !NO_VALUE_OPS.has(filter.op);

            return (
              <div key={index} className="flex items-center gap-1.5">
                <Select
                  value={filter.field}
                  onValueChange={(v) => updateFilter(index, { field: v })}
                >
                  <SelectTrigger className="h-7 w-[130px] shrink-0 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="max-h-60">
                    {columns.map((c) => {
                      const Icon = getTypeIcon(c.uidt);
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-1.5">
                            {Icon && (
                              <Icon className="size-3 text-muted-foreground" />
                            )}
                            {c.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Select
                  value={filter.op}
                  onValueChange={(v) => updateFilter(index, { op: v })}
                >
                  <SelectTrigger className="h-7 w-[110px] shrink-0 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="max-h-60">
                    {ops.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {needsValue && (
                  <Input
                    value={filter.value}
                    onChange={(e) =>
                      updateFilter(index, { value: e.target.value })
                    }
                    className="h-7 flex-1 text-xs"
                    placeholder="Value..."
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => removeFilter(index)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            );
          })}
          {filters.length === 0 && (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              No filters applied
            </p>
          )}
        </div>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={addFilter}
          >
            <Plus className="size-3" />
            Add filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
