import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import * as React from "react";
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
import { getFieldType } from "@/field-types";
import type { Attribute } from "@/field-types/types";
import type { ViewFilter } from "@/types/views";
export interface FilterPopoverProps {
  attributes: Attribute[];
  filters: ViewFilter[];
  onAdd: (filter: Omit<ViewFilter, "id">) => void;
  onRemove: (filterId: string) => void;
  onUpdate?: (filterId: string, updates: Partial<ViewFilter>) => void;
  children: React.ReactNode;
}

export function FilterPopover({
  attributes,
  filters,
  onAdd,
  onRemove,
  onUpdate,
  children,
}: FilterPopoverProps) {
  const [open, setOpen] = React.useState(false);

  const filterableAttributes = React.useMemo(
    () => attributes.filter((a) => !a.isSystem),
    [attributes],
  );

  const attrMap = React.useMemo(
    () => new Map(attributes.map((a) => [a.id, a])),
    [attributes],
  );

  const handleAddFilter = React.useCallback(
    (fieldId: string) => {
      const attr = attrMap.get(fieldId);
      const fieldType = getFieldType(attr?.uiType ?? "text");
      const defaultOp = fieldType.filterOperators[0]?.value ?? "eq";

      onAdd({
        fieldId,
        operator: defaultOp,
        value: "",
        logicalOp: filters.length === 0 ? "and" : "and",
        order: filters.length,
      });
    },
    [onAdd, filters.length, attrMap],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-[420px] p-3">
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-medium text-muted-foreground">
            Filter records where
          </h4>

          {/* Active filters */}
          {filters.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No filters applied. Add a filter to narrow down your records.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filters.map((filter, idx) => {
                const attr = attrMap.get(filter.fieldId);
                const fieldType = getFieldType(attr?.uiType ?? "text");
                const operators = fieldType.filterOperators;
                const isValueless =
                  filter.operator === "isEmpty" ||
                  filter.operator === "isNotEmpty";

                return (
                  <div key={filter.id} className="flex items-center gap-1.5">
                    {/* AND/OR toggle for rows after the first */}
                    {idx === 0 ? (
                      <span className="w-10 text-xs text-muted-foreground text-right shrink-0">
                        Where
                      </span>
                    ) : (
                      <button
                        className="w-10 text-xs text-muted-foreground hover:text-foreground text-right shrink-0"
                        onClick={() =>
                          onUpdate?.(filter.id, {
                            logicalOp:
                              filter.logicalOp === "and" ? "or" : "and",
                          })
                        }
                      >
                        {filter.logicalOp === "and" ? "And" : "Or"}
                      </button>
                    )}

                    {/* Field selector */}
                    <Select
                      value={filter.fieldId}
                      onValueChange={(val) => {
                        const newAttr = attrMap.get(val);
                        const newFieldType = getFieldType(
                          newAttr?.uiType ?? "text",
                        );
                        const newOp =
                          newFieldType.filterOperators[0]?.value ?? "eq";
                        onUpdate?.(filter.id, {
                          fieldId: val,
                          operator: newOp,
                          value: "",
                        });
                      }}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs shrink-0">
                        <SelectValue>
                          {attr?.name ?? filter.fieldId}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {filterableAttributes.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Operator selector */}
                    <Select
                      value={filter.operator}
                      onValueChange={(val) =>
                        onUpdate?.(filter.id, { operator: val })
                      }
                    >
                      <SelectTrigger className="h-7 w-32 text-xs shrink-0">
                        <SelectValue>
                          {operators.find((o) => o.value === filter.operator)
                            ?.label ?? filter.operator}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Value input */}
                    {!isValueless && (
                      <FilterValueInput
                        attribute={attr ?? null}
                        value={filter.value}
                        onChange={(val) =>
                          onUpdate?.(filter.id, { value: val })
                        }
                      />
                    )}

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(filter.id)}
                    >
                      <TrashIcon className="size-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add filter */}
          {filterableAttributes.length > 0 && (
            <>
              <div className="border-t" />
              <Select onValueChange={handleAddFilter}>
                <SelectTrigger className="h-7 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <PlusIcon className="size-3" />
                    <span>Add filter</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {filterableAttributes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterValueInput({
  attribute,
  value,
  onChange,
}: {
  attribute: Attribute | null;
  value: any;
  onChange: (value: any) => void;
}) {
  if (!attribute) {
    return (
      <Input
        className="h-7 flex-1 text-xs"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Value..."
      />
    );
  }

  const fieldType = getFieldType(attribute.uiType);

  // custom FilterComponent when available
  if (fieldType.FilterComponent) {
    const FilterComp = fieldType.FilterComponent;
    return (
      <div className="flex-1">
        <FilterComp value={value} onChange={onChange} operator="" />
      </div>
    );
  }

  // fallback text input
  return (
    <Input
      className="h-7 flex-1 text-xs"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value..."
      type={
        attribute.uiType === "Number" || attribute.uiType === "Decimal"
          ? "number"
          : attribute.uiType === "Date" || attribute.uiType === "DateTime"
            ? "date"
            : "text"
      }
    />
  );
}
