import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Search,
  Plus,
  GripVertical,
  MoreHorizontal,
  Star,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";

import { getFieldType } from "@/field-types";
import type { Attribute, AttributeOverride } from "@/types/objects";
import {
  useReorderAttributes,
  useDeleteAttribute,
  useUpsertAttributeOverride,
} from "@/hooks/use-object-registry";
import { CreateAttributeModal } from "@/components/create-attribute/CreateAttributeModal";
import { AttributeEditDialog } from "./AttributeEditDialog";

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

type FilterMode = "all" | "standard" | "system" | "hidden";

const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "standard", label: "Standard" },
  { value: "system", label: "System" },
  { value: "hidden", label: "Hidden" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AttributesTabProps {
  objectSlug: string;
  attributes: Attribute[];
}

// ---------------------------------------------------------------------------
// Single attribute row (used both in the list and in the overlay)
// ---------------------------------------------------------------------------

interface AttributeRowProps {
  attribute: Attribute;
  onEdit: (attr: Attribute) => void;
  onSetPrimary: (attr: Attribute) => void;
  onToggleHidden: (attr: Attribute) => void;
  onDelete: (attr: Attribute) => void;
  isOverlay?: boolean;
}

function AttributeRow({
  attribute,
  onEdit,
  onSetPrimary,
  onToggleHidden,
  onDelete,
  isOverlay = false,
}: AttributeRowProps) {
  const fieldType = getFieldType(attribute.uiType);
  const FieldIcon = fieldType.icon;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md border bg-background px-3 py-2.5 transition-colors",
        isOverlay && "shadow-lg ring-2 ring-primary/20",
        !isOverlay && "hover:bg-accent/50 cursor-pointer",
      )}
      onClick={
        !isOverlay
          ? (e) => {
              // Don't trigger row click when clicking dropdown or drag handle
              const target = e.target as HTMLElement;
              if (target.closest("[data-slot='sortable-item-handle']")) return;
              if (target.closest("[data-slot='dropdown-menu']")) return;
              if (target.closest("[data-slot='dropdown-menu-trigger']")) return;
              if (target.closest("button")) return;
              onEdit(attribute);
            }
          : undefined
      }
    >
      {/* Drag handle */}
      <SortableItemHandle className="shrink-0 text-muted-foreground hover:text-foreground">
        <GripVertical className="size-4" />
      </SortableItemHandle>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {attribute.name || attribute.columnName}
          </span>
          {attribute.isPrimary && (
            <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate block">
          {attribute.columnName}
        </span>
      </div>

      {/* Type */}
      <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
        <FieldIcon />
        <span className="text-xs">{fieldType.label}</span>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        {attribute.isSystem && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            System
          </Badge>
        )}
        {attribute.isHiddenByDefault && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <EyeOff className="size-3 mr-0.5" />
            Hidden
          </Badge>
        )}
      </div>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(attribute)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          {!attribute.isPrimary && (
            <DropdownMenuItem onClick={() => onSetPrimary(attribute)}>
              <Star className="size-4" />
              Set as primary
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onToggleHidden(attribute)}>
            {attribute.isHiddenByDefault ? (
              <>
                <Eye className="size-4" />
                Show by default
              </>
            ) : (
              <>
                <EyeOff className="size-4" />
                Hide by default
              </>
            )}
          </DropdownMenuItem>
          {!attribute.isSystem && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(attribute)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AttributesTab({ objectSlug, attributes }: AttributesTabProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);

  // Local ordering state (for optimistic reorder)
  const [orderedAttrs, setOrderedAttrs] = useState<Attribute[]>(attributes);

  // Keep in sync with prop changes
  useEffect(() => {
    setOrderedAttrs([...attributes].sort((a, b) => a.order - b.order));
  }, [attributes]);

  const reorderMutation = useReorderAttributes(objectSlug);
  const deleteMutation = useDeleteAttribute(objectSlug);
  const overrideMutation = useUpsertAttributeOverride(objectSlug);

  // ------- Filtering -------
  const filteredAttrs = useMemo(() => {
    let result = orderedAttrs;

    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.columnName.toLowerCase().includes(q),
      );
    }

    // Category filter
    switch (filter) {
      case "standard":
        result = result.filter((a) => !a.isSystem);
        break;
      case "system":
        result = result.filter((a) => a.isSystem);
        break;
      case "hidden":
        result = result.filter((a) => a.isHiddenByDefault);
        break;
    }

    return result;
  }, [orderedAttrs, search, filter]);

  // ------- Handlers -------
  const handleReorder = useCallback(
    (reordered: Attribute[]) => {
      setOrderedAttrs(reordered);
      const ids = reordered.map((a) => a.id);
      reorderMutation.mutate(ids, {
        onError: () => {
          // Revert on failure
          setOrderedAttrs([...attributes].sort((a, b) => a.order - b.order));
          toast.error("Failed to reorder attributes");
        },
      });
    },
    [attributes, reorderMutation],
  );

  const handleEdit = useCallback((attr: Attribute) => {
    setEditingAttr(attr);
  }, []);

  const handleSetPrimary = useCallback(
    (attr: Attribute) => {
      overrideMutation.mutate(
        { attributeId: attr.id, displayName: attr.name, uiType: attr.uiType },
        {
          onSuccess: () => toast.success(`"${attr.name}" set as primary`),
          onError: () => toast.error("Failed to update primary attribute"),
        },
      );
    },
    [overrideMutation],
  );

  const handleToggleHidden = useCallback(
    (attr: Attribute) => {
      overrideMutation.mutate(
        {
          attributeId: attr.id,
          isHiddenByDefault: !attr.isHiddenByDefault,
        },
        {
          onSuccess: () =>
            toast.success(
              attr.isHiddenByDefault
                ? `"${attr.name}" is now visible`
                : `"${attr.name}" is now hidden`,
            ),
          onError: () => toast.error("Failed to update attribute visibility"),
        },
      );
    },
    [overrideMutation],
  );

  const handleDelete = useCallback(
    (attr: Attribute) => {
      if (attr.isSystem) return;
      deleteMutation.mutate(attr.id, {
        onSuccess: () => toast.success(`"${attr.name}" deleted`),
        onError: () => toast.error("Failed to delete attribute"),
      });
    },
    [deleteMutation],
  );

  const handleSaveEdit = useCallback(
    (updates: AttributeOverride) => {
      overrideMutation.mutate(updates, {
        onSuccess: () => {
          toast.success("Attribute updated");
          setEditingAttr(null);
        },
        onError: () => toast.error("Failed to update attribute"),
      });
    },
    [overrideMutation],
  );

  // ------- Counts for filter pills -------
  const counts = useMemo(() => {
    const all = orderedAttrs.length;
    const system = orderedAttrs.filter((a) => a.isSystem).length;
    const standard = orderedAttrs.filter((a) => !a.isSystem).length;
    const hidden = orderedAttrs.filter((a) => a.isHiddenByDefault).length;
    return { all, system, standard, hidden };
  }, [orderedAttrs]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search attributes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New Attribute
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5">
        {FILTER_OPTIONS.map((opt) => {
          const count = counts[opt.value];
          return (
            <button
              key={opt.value}
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  filter === opt.value
                    ? "bg-primary-foreground/20"
                    : "bg-background",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Attribute list with drag-and-drop */}
      {filteredAttrs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? "No attributes match your search."
              : "No attributes found."}
          </p>
        </div>
      ) : (
        <Sortable
          value={filteredAttrs}
          getItemValue={(attr) => attr.id}
          onValueChange={handleReorder}
          orientation="vertical"
          flatCursor
        >
          <SortableContent className="space-y-1">
            {filteredAttrs.map((attr) => (
              <SortableItem key={attr.id} value={attr.id} asChild>
                <div>
                  <AttributeRow
                    attribute={attr}
                    onEdit={handleEdit}
                    onSetPrimary={handleSetPrimary}
                    onToggleHidden={handleToggleHidden}
                    onDelete={handleDelete}
                  />
                </div>
              </SortableItem>
            ))}
          </SortableContent>
          <SortableOverlay>
            {({ value }) => {
              const attr = orderedAttrs.find((a) => a.id === value);
              if (!attr) return null;
              return (
                <AttributeRow
                  attribute={attr}
                  onEdit={() => {}}
                  onSetPrimary={() => {}}
                  onToggleHidden={() => {}}
                  onDelete={() => {}}
                  isOverlay
                />
              );
            }}
          </SortableOverlay>
        </Sortable>
      )}

      {/* Create Attribute Modal */}
      <CreateAttributeModal
        objectSlug={objectSlug}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Edit Attribute Dialog */}
      {editingAttr && (
        <AttributeEditDialog
          attribute={editingAttr}
          open={!!editingAttr}
          onOpenChange={(open) => {
            if (!open) setEditingAttr(null);
          }}
          onSave={handleSaveEdit}
          isSaving={overrideMutation.isPending}
        />
      )}
    </div>
  );
}
