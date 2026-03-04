import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { TypeConfigProps, SelectOption } from "@/field-types/types";
import { Input } from "@/components/ui/input";
import {
  getColorClasses,
  getNextAvailableColor,
  TAG_COLOR_PALETTE,
} from "@/field-types/colors";
import { cn } from "@/lib/utils";
export function SelectTypeConfig({ config, onChange }: TypeConfigProps) {
  const [newLabel, setNewLabel] = useState("");
  const options: SelectOption[] = config.options ?? [];

  const addOption = () => {
    if (newLabel.trim() === "") return;
    const existingColors = options.map((o) => o.color);
    const color = getNextAvailableColor(existingColors);
    const newOption: SelectOption = {
      id: `opt_${Date.now()}`,
      label: newLabel.trim(),
      color,
    };
    onChange({ ...config, options: [...options, newOption] });
    setNewLabel("");
  };

  const removeOption = (id: string) => {
    onChange({ ...config, options: options.filter((o) => o.id !== id) });
  };

  const updateOptionColor = (id: string, color: string) => {
    onChange({
      ...config,
      options: options.map((o) => (o.id === id ? { ...o, color } : o)),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        {options.map((option) => {
          const colors = getColorClasses(option.color);
          return (
            <div key={option.id} className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1">
                {TAG_COLOR_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => updateOptionColor(option.id, c.name)}
                    className={cn(
                      "h-4 w-4 rounded-full border",
                      c.bg,
                      c.border,
                      option.color === c.name &&
                        "ring-primary ring-2 ring-offset-1",
                    )}
                  />
                ))}
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  colors.bg,
                  colors.text,
                  colors.border,
                )}
              >
                {option.label}
              </span>
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                className="text-muted-foreground hover:text-destructive ml-auto"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption();
            }
          }}
          placeholder="Add option..."
          className="h-8 text-sm"
        />
        <button
          type="button"
          onClick={addOption}
          className="text-muted-foreground hover:text-foreground"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
