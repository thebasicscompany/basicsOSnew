import { useCallback, useEffect, useState } from "react";
import { ColorPickerDot } from "@/field-types/components/ColorPickerDot";
import {
  PencilSimple,
  TrashSimple,
  DotsSixVertical,
  Plus,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { TAG_COLOR_PALETTE, getColorClasses } from "@/field-types/colors";

export interface StageOption {
  id: string;
  label: string;
  color?: string;
  order?: number;
  isTerminal?: boolean;
}

interface EditPipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: StageOption[];
  onSave: (stages: StageOption[]) => void;
  isSaving: boolean;
}

export function EditPipelineDialog({
  open,
  onOpenChange,
  stages,
  onSave,
  isSaving,
}: EditPipelineDialogProps) {
  const [localStages, setLocalStages] = useState<StageOption[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  useEffect(() => {
    if (open) {
      setLocalStages(stages.map((s, i) => ({ ...s, order: i })));
      setEditingId(null);
    }
  }, [open, stages]);

  const handleReorder = useCallback((reordered: StageOption[]) => {
    setLocalStages(reordered.map((s, i) => ({ ...s, order: i })));
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (localStages.length <= 1) return;
      setLocalStages((prev) =>
        prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })),
      );
    },
    [localStages.length],
  );

  const handleStartEdit = useCallback((stage: StageOption) => {
    setEditingId(stage.id);
    setEditingLabel(stage.label);
  }, []);

  const handleFinishEdit = useCallback(() => {
    if (!editingId || !editingLabel.trim()) {
      setEditingId(null);
      return;
    }
    setLocalStages((prev) =>
      prev.map((s) =>
        s.id === editingId ? { ...s, label: editingLabel.trim() } : s,
      ),
    );
    setEditingId(null);
  }, [editingId, editingLabel]);

  const handleColorChange = useCallback((id: string, color: string) => {
    setLocalStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color } : s)),
    );
  }, []);

  const handleAdd = useCallback(() => {
    const id = `stage-${Date.now()}`;
    const usedColors = new Set(localStages.map((s) => s.color));
    const color =
      TAG_COLOR_PALETTE.find((c) => !usedColors.has(c.name))?.name ?? "gray";
    setLocalStages((prev) => [
      ...prev,
      { id, label: "New Stage", color, order: prev.length },
    ]);
    setEditingId(id);
    setEditingLabel("New Stage");
  }, [localStages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Pipeline</DialogTitle>
          <DialogDescription>
            Reorder, rename, or remove deal stages.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto py-2">
          <Sortable
            value={localStages}
            onValueChange={handleReorder}
            getItemValue={(s) => s.id}
            orientation="vertical"
          >
            <SortableContent className="space-y-1">
              {localStages.map((stage) => (
                <SortableItem
                  key={stage.id}
                  value={stage.id}
                  className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5"
                >
                  <SortableItemHandle className="shrink-0 text-muted-foreground hover:text-foreground">
                    <DotsSixVertical className="size-4" />
                  </SortableItemHandle>

                  <ColorPickerDot
                    currentColor={stage.color ?? "gray"}
                    dotClass={getColorClasses(stage.color ?? "gray").bg}
                    onSelect={(c) => handleColorChange(stage.id, c)}
                  />

                  {editingId === stage.id ? (
                    <Input
                      autoFocus
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onBlur={handleFinishEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFinishEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-7 flex-1 text-sm"
                    />
                  ) : (
                    <span className="flex-1 truncate text-sm">
                      {stage.label}
                    </span>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => handleStartEdit(stage)}
                  >
                    <PencilSimple className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-destructive hover:text-destructive"
                    disabled={localStages.length <= 1}
                    onClick={() => handleDelete(stage.id)}
                  >
                    <TrashSimple className="size-3.5" />
                  </Button>
                </SortableItem>
              ))}
            </SortableContent>
            <SortableOverlay />
          </Sortable>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleAdd}
        >
          <Plus className="mr-1.5 size-3.5" />
          Add stage
        </Button>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isSaving}
            onClick={() => onSave(localStages)}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
