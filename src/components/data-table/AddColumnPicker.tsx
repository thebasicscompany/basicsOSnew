import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Attribute } from "@/field-types/types";
import { getFieldType } from "@/field-types";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AddColumnPickerProps {
  availableAttributes: Attribute[];
  visibleAttributeIds: string[];
  onToggleAttribute: (attributeId: string) => void;
  onCreateAttribute: () => void;
  children?: React.ReactNode;
}

export function AddColumnPicker({
  availableAttributes,
  visibleAttributeIds,
  onToggleAttribute,
  onCreateAttribute,
  children,
}: AddColumnPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus the search input when the popover opens
  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setSearch("");
    }
  }, [open]);

  // Sort: primary first, then by order
  const sortedAttributes = React.useMemo(() => {
    const filtered = search
      ? availableAttributes.filter((a) =>
          a.name.toLowerCase().includes(search.toLowerCase()),
        )
      : availableAttributes;

    return [...filtered].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.order - b.order;
    });
  }, [availableAttributes, search]);

  const visibleSet = React.useMemo(
    () => new Set(visibleAttributeIds),
    [visibleAttributeIds],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        {/* Search */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields..."
            className="h-6 border-0 p-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>

        {/* Attribute list */}
        <ScrollArea className="max-h-64">
          <div className="flex flex-col py-1">
            {sortedAttributes.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                No fields found
              </p>
            ) : (
              sortedAttributes.map((attr) => {
                const fieldType = getFieldType(attr.uiType);
                const isVisible = visibleSet.has(attr.id);
                const isPrimary = attr.isPrimary;

                return (
                  <button
                    key={attr.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left",
                      isPrimary && "opacity-70 cursor-not-allowed",
                    )}
                    onClick={() => {
                      if (!isPrimary) {
                        onToggleAttribute(attr.id);
                      }
                    }}
                    disabled={isPrimary}
                  >
                    <Checkbox
                      checked={isVisible}
                      disabled={isPrimary}
                      className="size-3.5"
                      onCheckedChange={() => {
                        if (!isPrimary) {
                          onToggleAttribute(attr.id);
                        }
                      }}
                    />
                    <span className="text-muted-foreground">
                      {attr.icon ?? (fieldType.icon ? <fieldType.icon className="size-3.5" /> : null)}
                    </span>
                    <span className="truncate flex-1">{attr.name}</span>
                    {isPrimary && (
                      <span className="text-[10px] text-muted-foreground">
                        Primary
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Create new attribute */}
        <Separator />
        <button
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => {
            onCreateAttribute();
            setOpen(false);
          }}
        >
          <Plus className="size-3.5" />
          Create new field
        </button>
      </PopoverContent>
    </Popover>
  );
}
