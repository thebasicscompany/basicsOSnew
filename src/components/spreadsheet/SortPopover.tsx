import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTypeIcon } from "./type-icons";

export interface SortDef {
  id: string;
  desc: boolean;
}

interface SortPopoverProps {
  columns: { id: string; label: string; uidt?: string }[];
  sorting: SortDef[];
  onSortChange: (sorting: SortDef[]) => void;
}

export function SortPopover({
  columns,
  sorting,
  onSortChange,
}: SortPopoverProps) {
  const [open, setOpen] = useState(false);

  const addSort = (fieldId: string) => {
    onSortChange([...sorting, { id: fieldId, desc: false }]);
  };

  const removeSort = (index: number) => {
    onSortChange(sorting.filter((_, i) => i !== index));
  };

  const toggleDirection = (index: number) => {
    onSortChange(
      sorting.map((s, i) => (i === index ? { ...s, desc: !s.desc } : s)),
    );
  };

  const updateField = (index: number, fieldId: string) => {
    onSortChange(
      sorting.map((s, i) => (i === index ? { ...s, id: fieldId } : s)),
    );
  };

  const availableColumns = columns.filter(
    (col) => !sorting.some((s) => s.id === col.id),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
        >
          <ArrowUpDown className="size-3.5" />
          <span className="hidden sm:inline">Sort</span>
          {sorting.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 h-4 min-w-4 px-1 text-[10px]"
            >
              {sorting.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b px-3 py-2 text-sm font-medium">
          Sort by
        </div>
        <div className="space-y-1 p-2">
          {sorting.map((sort, index) => {
            const col = columns.find((c) => c.id === sort.id);
            const Icon = getTypeIcon(col?.uidt);
            return (
              <div key={index} className="flex items-center gap-1.5">
                <Select
                  value={sort.id}
                  onValueChange={(v) => updateField(index, v)}
                >
                  <SelectTrigger className="h-7 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4} className="max-h-60">
                    {columns.map((c) => {
                      const CIcon = getTypeIcon(c.uidt);
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-1.5">
                            {CIcon && (
                              <CIcon className="size-3 text-muted-foreground" />
                            )}
                            {c.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => toggleDirection(index)}
                >
                  {sort.desc ? (
                    <>
                      <ArrowDown className="size-3" /> DESC
                    </>
                  ) : (
                    <>
                      <ArrowUp className="size-3" /> ASC
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => removeSort(index)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            );
          })}
          {sorting.length === 0 && (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              No sorts applied
            </p>
          )}
        </div>
        {availableColumns.length > 0 && (
          <div className="border-t p-2">
            <Select onValueChange={(v) => addSort(v)}>
              <SelectTrigger className="h-7 text-xs">
                <div className="flex items-center gap-1.5">
                  <Plus className="size-3" />
                  <span>Add sort</span>
                </div>
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="max-h-60">
                {availableColumns.map((col) => {
                  const CIcon = getTypeIcon(col.uidt);
                  return (
                    <SelectItem key={col.id} value={col.id}>
                      <span className="flex items-center gap-1.5">
                        {CIcon && (
                          <CIcon className="size-3 text-muted-foreground" />
                        )}
                        {col.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
