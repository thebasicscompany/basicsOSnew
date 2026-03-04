import type { TypeConfigProps } from "@/field-types/types";

export function LocationTypeConfig({ config, onChange }: TypeConfigProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={config.showCity !== false}
          onChange={(e) => onChange({ ...config, showCity: e.target.checked })}
          className="h-4 w-4"
        />
        Show City
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={config.showState !== false}
          onChange={(e) => onChange({ ...config, showState: e.target.checked })}
          className="h-4 w-4"
        />
        Show State / Region
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={config.showCountry !== false}
          onChange={(e) =>
            onChange({ ...config, showCountry: e.target.checked })
          }
          className="h-4 w-4"
        />
        Show Country
      </label>
    </div>
  );
}
