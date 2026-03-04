import { DotsThreeVerticalIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { TypeConfigProps, StatusOption } from "@/field-types/types";
import { Input } from "@/components/ui/input";
import { STATUS_DOT_COLORS } from "@/field-types/colors";
import { cn } from "@/lib/utils";
export function StatusTypeConfig({ config, onChange }: TypeConfigProps) {
  const [newLabel, setNewLabel] = useState("");
  const options: StatusOption[] = config.options ?? [];

  const addOption = () => {
    if (newLabel.trim() === "") return;
    const newOption: StatusOption = {
      id: `status_${Date.now()}`,
      label: newLabel.trim(),
      color: "gray",
      order: options.length,
    };
    onChange({ ...config, options: [...options, newOption] });
    setNewLabel("");
  };

  const removeOption = (id: string) => {
    onChange({
      ...config,
      options: options
        .filter((o) => o.id !== id)
        .map((o, i) => ({ ...o, order: i })),
    });
  };

  const toggleTerminal = (id: string) => {
    onChange({
      ...config,
      options: options.map((o) =>
        o.id === id ? { ...o, isTerminal: !o.isTerminal } : o,
      ),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {options.map((option) => {
          const dotColor =
            STATUS_DOT_COLORS[option.label] ?? `bg-${option.color}-500`;
          return (
            <div key={option.id} className="flex items-center gap-2">
              <DotsThreeVerticalIcon className="text-muted-foreground h-4 w-4 shrink-0 cursor-grab" />
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dotColor)}
              />
              <span className="flex-1 text-sm">{option.label}</span>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={!!option.isTerminal}
                  onChange={() => toggleTerminal(option.id)}
                  className="h-3 w-3"
                />
                Terminal
              </label>
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                className="text-muted-foreground hover:text-destructive"
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
          placeholder="Add status..."
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
