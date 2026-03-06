import {
  CaretDownIcon,
  CaretUpIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import * as React from "react";
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
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Attribute } from "@/field-types/types";
import type { ViewSort } from "@/types/views";
export interface SortPopoverProps {
  attributes: Attribute[];
  sorts: ViewSort[];
  onAdd: (sort: Omit<ViewSort, "id">) => void;
  onRemove: (sortId: string) => void;
  onUpdate?: (sortId: string, updates: Partial<ViewSort>) => void;
  children: React.ReactNode;
}

export function SortPopover({
  attributes,
  sorts,
  onAdd,
  onRemove,
  onUpdate,
  children,
}: SortPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [isAddingSort, setIsAddingSort] = React.useState(false);

  // Attributes that are not already used in a sort
  const availableAttributes = React.useMemo(() => {
    const usedIds = new Set(sorts.map((s) => s.fieldId));
    return attributes.filter((a) => !a.isSystem && !usedIds.has(a.id));
  }, [attributes, sorts]);

  const attrMap = React.useMemo(
    () => new Map(attributes.map((a) => [a.id, a])),
    [attributes],
  );

  const handleAddSort = React.useCallback(
    (fieldId: string) => {
      onAdd({
        fieldId,
        direction: "asc",
        order: sorts.length,
      });
      setIsAddingSort(false);
    },
    [onAdd, sorts.length],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setIsAddingSort(false);
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-medium text-muted-foreground">Sort by</h4>

          {/* Active sorts */}
          {sorts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No sorts applied. Add a sort to order your records.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sorts.map((sort) => {
                const attr = attrMap.get(sort.fieldId);
                return (
                  <div key={sort.id} className="flex items-center gap-2">
                    {/* Field selector */}
                    <Select
                      value={sort.fieldId}
                      onValueChange={(val) =>
                        onUpdate?.(sort.id, { fieldId: val })
                      }
                    >
                      <SelectTrigger className="h-7 flex-1 text-xs">
                        <SelectValue>{attr?.name ?? sort.fieldId}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show current field plus available ones */}
                        {attr && (
                          <SelectItem value={attr.id}>{attr.name}</SelectItem>
                        )}
                        {availableAttributes.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Direction toggle */}
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-7 gap-1 text-xs shrink-0"
                      onClick={() =>
                        onUpdate?.(sort.id, {
                          direction: sort.direction === "asc" ? "desc" : "asc",
                        })
                      }
                    >
                      {sort.direction === "asc" ? (
                        <>
                          <CaretUpIcon className="size-3" />
                          Ascending
                        </>
                      ) : (
                        <>
                          <CaretDownIcon className="size-3" />
                          Descending
                        </>
                      )}
                    </Button>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(sort.id)}
                    >
                      <TrashIcon className="size-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add sort */}
          {availableAttributes.length > 0 && (
            <>
              <div className="border-t" />
              {isAddingSort ? (
                <div className="rounded-md border">
                  <div className="flex items-center gap-1.5 border-b px-3 py-2 text-xs text-muted-foreground">
                    <PlusIcon className="size-3" />
                    <span>Add sort</span>
                  </div>
                  <Command>
                    <CommandInput placeholder="Search fields..." />
                    <CommandList className="max-h-48">
                      <CommandEmpty>No fields found.</CommandEmpty>
                      {availableAttributes.map((a) => (
                        <CommandItem
                          key={a.id}
                          value={a.name}
                          onSelect={() => handleAddSort(a.id)}
                        >
                          {a.name}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-fit gap-1.5 text-xs"
                  onClick={() => setIsAddingSort(true)}
                >
                  <PlusIcon className="size-3.5" />
                  Add sort
                </Button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
