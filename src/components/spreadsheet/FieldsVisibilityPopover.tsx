import { useState, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings2, GripVertical } from "lucide-react";
import type { VisibilityState } from "@tanstack/react-table";
import { getTypeIcon } from "./type-icons";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ColumnMeta {
  id: string;
  label: string;
  uidt?: string;
  isPrimary?: boolean;
}

interface FieldsVisibilityPopoverProps {
  columns: ColumnMeta[];
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
}

function SortableField({
  col,
  visible,
  onToggle,
}: {
  col: ColumnMeta;
  visible: boolean;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = getTypeIcon(col.uidt);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
    >
      <button
        className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <Switch
        checked={visible}
        onCheckedChange={onToggle}
        disabled={col.isPrimary}
        className="h-4 w-7 [&>span]:size-3"
      />
      {Icon && <Icon className="size-3.5 text-muted-foreground" />}
      <span className="truncate">{col.label}</span>
      {col.isPrimary && (
        <span className="ml-auto text-[10px] text-muted-foreground">
          Primary
        </span>
      )}
    </div>
  );
}

export function FieldsVisibilityPopover({
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
}: FieldsVisibilityPopoverProps) {
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // Use columnOrder if provided, otherwise use columns as-is
  const orderedColumns = columnOrder
    ? columnOrder
        .map((id) => columns.find((c) => c.id === id))
        .filter((c): c is ColumnMeta => !!c)
        .concat(columns.filter((c) => !columnOrder.includes(c.id)))
    : columns;

  const filtered = orderedColumns.filter((col) =>
    col.label.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleColumn = useCallback(
    (id: string) => {
      const current = columnVisibility[id] !== false;
      onColumnVisibilityChange({ ...columnVisibility, [id]: !current });
    },
    [columnVisibility, onColumnVisibilityChange],
  );

  const showAll = useCallback(() => {
    const next: VisibilityState = {};
    columns.forEach((col) => {
      next[col.id] = true;
    });
    onColumnVisibilityChange(next);
  }, [columns, onColumnVisibilityChange]);

  const hideAll = useCallback(() => {
    const next: VisibilityState = {};
    columns.forEach((col) => {
      next[col.id] = col.isPrimary ? true : false;
    });
    onColumnVisibilityChange(next);
  }, [columns, onColumnVisibilityChange]);

  const visibleCount = columns.filter(
    (col) => columnVisibility[col.id] !== false,
  ).length;
  const allVisible = visibleCount === columns.length;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onColumnOrderChange) return;

      const ids = orderedColumns.map((c) => c.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      onColumnOrderChange(arrayMove(ids, oldIndex, newIndex));
    },
    [orderedColumns, onColumnOrderChange],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
          <Settings2 className="size-3.5" />
          <span className="hidden sm:inline">Fields</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b p-2">
          <Input
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="flex items-center justify-between border-b px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            {visibleCount} / {columns.length} visible
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={allVisible ? hideAll : showAll}
          >
            {allVisible ? "Hide all" : "Show all"}
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filtered.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {filtered.map((col) => {
                const visible = columnVisibility[col.id] !== false;
                return (
                  <SortableField
                    key={col.id}
                    col={col}
                    visible={visible}
                    onToggle={() => toggleColumn(col.id)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
          {filtered.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              No matching fields
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
