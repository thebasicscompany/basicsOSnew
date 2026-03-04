import type { TypeConfigProps } from "@/field-types/types";
import { Input } from "@/components/ui/input";

export function RelationshipTypeConfig({ config, onChange }: TypeConfigProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-muted-foreground mb-1 block text-xs">
          Related Table
        </label>
        <Input
          value={config.relatedTable ?? ""}
          onChange={(e) =>
            onChange({ ...config, relatedTable: e.target.value })
          }
          placeholder="Table name"
          className="h-8 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={config.allowMultiple !== false}
          onChange={(e) =>
            onChange({ ...config, allowMultiple: e.target.checked })
          }
          className="h-4 w-4"
        />
        Allow multiple links
      </label>
      <div>
        <label className="text-muted-foreground mb-1 block text-xs">
          Display Field
        </label>
        <Input
          value={config.displayField ?? "title"}
          onChange={(e) =>
            onChange({ ...config, displayField: e.target.value })
          }
          placeholder="title"
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
