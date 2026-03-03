import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPicker } from "./IconPicker";

import type { Attribute, AttributeOverride } from "@/types/objects";
import { getFieldType, fieldTypeRegistry } from "@/field-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AttributeEditDialogProps {
  attribute: Attribute;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: AttributeOverride) => void;
  isSaving?: boolean;
}

// ---------------------------------------------------------------------------
// Group the field types for the selector
// ---------------------------------------------------------------------------

const FIELD_TYPE_GROUPS = (() => {
  const groups: Record<string, { key: string; label: string }[]> = {};
  for (const ft of Object.values(fieldTypeRegistry)) {
    const g = ft.group || "other";
    if (!groups[g]) groups[g] = [];
    groups[g].push({ key: ft.key, label: ft.label });
  }
  return groups;
})();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AttributeEditDialog({
  attribute,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: AttributeEditDialogProps) {
  const [displayName, setDisplayName] = useState(attribute.name);
  const [uiType, setUiType] = useState(attribute.uiType);
  const [iconName, setIconName] = useState(attribute.icon ?? "");
  const [isHidden, setIsHidden] = useState(attribute.isHiddenByDefault);
  const [typeConfig, setTypeConfig] = useState<Record<string, unknown>>(
    attribute.config ?? {},
  );

  // Reset state when the attribute changes (e.g. opening for a different attr)
  useEffect(() => {
    setDisplayName(attribute.name);
    setUiType(attribute.uiType);
    setIconName(attribute.icon ?? "");
    setIsHidden(attribute.isHiddenByDefault);
    setTypeConfig(attribute.config ?? {});
  }, [attribute]);

  const fieldType = getFieldType(uiType);
  const TypeConfig = fieldType.TypeConfigComponent;

  const handleSave = useCallback(() => {
    const updates: AttributeOverride = {
      attributeId: attribute.id,
      displayName,
      uiType,
      icon: iconName || undefined,
      isHiddenByDefault: isHidden,
      config: typeConfig,
    };
    onSave(updates);
  }, [
    attribute.id,
    displayName,
    uiType,
    iconName,
    isHidden,
    typeConfig,
    onSave,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Attribute</DialogTitle>
          <DialogDescription>
            Modify display settings for{" "}
            <span className="font-medium text-foreground">
              {attribute.columnName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="attr-display-name">Display Name</Label>
            <Input
              id="attr-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={attribute.columnName}
            />
          </div>

          {/* UI Type */}
          <div className="space-y-2">
            <Label>Field Type</Label>
            <Select
              value={uiType}
              onValueChange={(val) => {
                setUiType(val);
                // Reset type config when switching types
                setTypeConfig({});
              }}
              disabled={attribute.isSystem}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a field type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_GROUPS).map(([group, types]) => (
                  <div key={group}>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground capitalize">
                      {group}
                    </div>
                    {types.map((ft) => {
                      const Icon = getFieldType(ft.key).icon;
                      return (
                        <SelectItem key={ft.key} value={ft.key}>
                          <span className="flex items-center gap-2">
                            <Icon />
                            {ft.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {attribute.isSystem && (
              <p className="text-xs text-muted-foreground">
                System attributes cannot change their field type.
              </p>
            )}
          </div>

          {/* Icon */}
          <IconPicker
            value={iconName}
            onChange={setIconName}
            label="Custom Icon"
          />

          <Separator />

          {/* Hidden by default */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="attr-hidden">Hidden by default</Label>
              <p className="text-xs text-muted-foreground">
                Hide this attribute from default list and detail views.
              </p>
            </div>
            <Switch
              id="attr-hidden"
              checked={isHidden}
              onCheckedChange={setIsHidden}
            />
          </div>

          {/* Type Config Section */}
          {TypeConfig && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Type Configuration</Label>
                <TypeConfig value={typeConfig} onChange={setTypeConfig} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
