import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { IconPicker } from "./IconPicker";
import type { ObjectConfig } from "@/types/objects";
import { useUpdateObjectConfig } from "@/hooks/use-object-registry";

// ---------------------------------------------------------------------------
// Color presets
// ---------------------------------------------------------------------------

const COLOR_PRESETS = [
  { name: "blue", value: "#3b82f6" },
  { name: "orange", value: "#f97316" },
  { name: "green", value: "#22c55e" },
  { name: "red", value: "#ef4444" },
  { name: "purple", value: "#a855f7" },
  { name: "pink", value: "#ec4899" },
  { name: "cyan", value: "#06b6d4" },
  { name: "teal", value: "#14b8a6" },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ObjectConfigTabProps {
  objectConfig: ObjectConfig;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ObjectConfigTab({ objectConfig }: ObjectConfigTabProps) {
  const [singularName, setSingularName] = useState(objectConfig.singularName);
  const [pluralName, setPluralName] = useState(objectConfig.pluralName);
  const [icon, setIcon] = useState(objectConfig.icon);
  const [iconColor, setIconColor] = useState(objectConfig.iconColor);
  const [isActive, setIsActive] = useState(objectConfig.isActive);

  const mutation = useUpdateObjectConfig(objectConfig.slug);

  // Sync local state when the object config changes externally
  useEffect(() => {
    setSingularName(objectConfig.singularName);
    setPluralName(objectConfig.pluralName);
    setIcon(objectConfig.icon);
    setIconColor(objectConfig.iconColor);
    setIsActive(objectConfig.isActive);
  }, [objectConfig]);

  const isDirty =
    singularName !== objectConfig.singularName ||
    pluralName !== objectConfig.pluralName ||
    icon !== objectConfig.icon ||
    iconColor !== objectConfig.iconColor ||
    isActive !== objectConfig.isActive;

  const handleSave = useCallback(async () => {
    try {
      await mutation.mutateAsync({
        singularName,
        pluralName,
        icon,
        iconColor,
        isActive,
      });
      toast.success("Configuration saved");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save configuration",
      );
    }
  }, [mutation, singularName, pluralName, icon, iconColor, isActive]);

  return (
    <div className="max-w-lg space-y-6">
      {/* Singular Name */}
      <div className="space-y-2">
        <Label htmlFor="singular-name">Singular Name</Label>
        <Input
          id="singular-name"
          value={singularName}
          onChange={(e) => setSingularName(e.target.value)}
          placeholder="e.g. Contact"
        />
        <p className="text-xs text-muted-foreground">
          Used when referring to a single record.
        </p>
      </div>

      {/* Plural Name */}
      <div className="space-y-2">
        <Label htmlFor="plural-name">Plural Name</Label>
        <Input
          id="plural-name"
          value={pluralName}
          onChange={(e) => setPluralName(e.target.value)}
          placeholder="e.g. Contacts"
        />
        <p className="text-xs text-muted-foreground">
          Used for list views and navigation.
        </p>
      </div>

      <Separator />

      {/* Icon */}
      <IconPicker value={icon} onChange={setIcon} label="Icon" />

      {/* Icon Color */}
      <div className="space-y-2">
        <Label>Icon Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              className={cn(
                "size-8 rounded-full border-2 transition-all",
                iconColor === preset.value
                  ? "border-foreground scale-110 ring-2 ring-ring/50"
                  : "border-transparent hover:border-muted-foreground/40",
              )}
              style={{ backgroundColor: preset.value }}
              onClick={() => setIconColor(preset.value)}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Active Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="is-active">Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive objects are hidden from navigation.
          </p>
        </div>
        <Switch
          id="is-active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <Separator />

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isDirty || mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
