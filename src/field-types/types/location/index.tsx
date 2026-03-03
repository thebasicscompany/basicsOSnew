import { MapPinIcon } from "@phosphor-icons/react"
import type { FieldTypeDefinition, CalculationType } from "../../types";
import { LocationCellDisplay } from "./LocationCellDisplay";
import { LocationCellEditor } from "./LocationCellEditor";
import { LocationTypeConfig } from "./LocationTypeConfig";

interface LocationValue {
  city?: string;
  state?: string;
  country?: string;
}

function parseLocationValue(value: any): LocationValue | null {
  if (value == null || value === "") return null;
  if (typeof value === "object" && !Array.isArray(value))
    return value as LocationValue;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as LocationValue;
    } catch {
      const parts = value.split(",").map((s: string) => s.trim());
      return {
        city: parts[0] || undefined,
        state: parts[1] || undefined,
        country: parts[2] || undefined,
      };
    }
  }
  return null;
}

function formatLocation(loc: LocationValue): string {
  return [loc.city, loc.state, loc.country].filter(Boolean).join(", ");
}

function isLocationEmpty(value: any): boolean {
  const loc = parseLocationValue(value);
  if (!loc) return true;
  return formatLocation(loc) === "";
}

function countCalc(values: any[], type: CalculationType): any {
  const nonEmpty = values.filter((v) => !isLocationEmpty(v));
  switch (type) {
    case "count":
      return values.length;
    case "count_empty":
      return values.length - nonEmpty.length;
    case "count_not_empty":
      return nonEmpty.length;
    case "percent_empty":
      return values.length === 0
        ? 0
        : ((values.length - nonEmpty.length) / values.length) * 100;
    case "percent_not_empty":
      return values.length === 0 ? 0 : (nonEmpty.length / values.length) * 100;
    default:
      return null;
  }
}

// Form input using the popover editor pattern
function LocationFormInput({
  value,
  onChange,
}: {
  value: any;
  onChange: (v: any) => void;
}) {
  const parsed = parseLocationValue(value);
  const city = parsed?.city ?? "";
  const state = parsed?.state ?? "";
  const country = parsed?.country ?? "";

  const update = (field: string, val: string) => {
    const next = {
      city: field === "city" ? val : city,
      state: field === "state" ? val : state,
      country: field === "country" ? val : country,
    };
    const isEmpty = !next.city && !next.state && !next.country;
    onChange(isEmpty ? null : next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-muted-foreground mb-1 block text-xs">City</label>
        <input
          value={city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="City"
          className="border-input bg-background h-8 w-full rounded-md border px-3 text-sm shadow-xs outline-none"
        />
      </div>
      <div>
        <label className="text-muted-foreground mb-1 block text-xs">
          State / Region
        </label>
        <input
          value={state}
          onChange={(e) => update("state", e.target.value)}
          placeholder="State"
          className="border-input bg-background h-8 w-full rounded-md border px-3 text-sm shadow-xs outline-none"
        />
      </div>
      <div>
        <label className="text-muted-foreground mb-1 block text-xs">
          Country
        </label>
        <input
          value={country}
          onChange={(e) => update("country", e.target.value)}
          placeholder="Country"
          className="border-input bg-background h-8 w-full rounded-md border px-3 text-sm shadow-xs outline-none"
        />
      </div>
    </div>
  );
}

export const LocationFieldType: FieldTypeDefinition = {
  key: "location",
  label: "Location",
  icon: MapPinIcon,
  group: "standard",

  hasTypeConfig: true,
  TypeConfigComponent: LocationTypeConfig,
  defaultTypeConfig: { showCity: true, showState: true, showCountry: true },

  CellDisplay: LocationCellDisplay,
  KanbanDisplay: LocationCellDisplay,
  DetailDisplay: LocationCellDisplay,

  CellEditor: LocationCellEditor,
  KanbanEditor: LocationCellEditor,
  FormInput: LocationFormInput as any,
  DetailEditor: LocationCellEditor,

  editorStyle: "popover",

  validate: () => ({ valid: true }),

  parseValue: (raw: any) => {
    const loc = parseLocationValue(raw);
    return loc && formatLocation(loc) !== "" ? loc : null;
  },
  serializeValue: (value: any) => {
    if (value == null) return null;
    if (typeof value === "object") return value;
    return null;
  },
  getEmptyValue: () => null,
  isEmpty: isLocationEmpty,
  formatDisplayValue: (value: any) => {
    const loc = parseLocationValue(value);
    if (!loc) return "";
    return formatLocation(loc);
  },

  comparator: (a: any, b: any) => {
    const la = parseLocationValue(a);
    const lb = parseLocationValue(b);
    const sa = la ? formatLocation(la) : "";
    const sb = lb ? formatLocation(lb) : "";
    return sa.localeCompare(sb);
  },

  FilterComponent: null,
  filterOperators: [
    { key: "like", label: "contains", requiresValue: true },
    { key: "is_empty", label: "is empty", requiresValue: false },
    { key: "is_not_empty", label: "is not empty", requiresValue: false },
  ],

  availableCalculations: [
    "count",
    "count_empty",
    "count_not_empty",
    "percent_empty",
    "percent_not_empty",
  ],
  calculate: countCalc,

  placeholder: "Set location...",
};

export default LocationFieldType;
