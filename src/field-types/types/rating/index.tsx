import { StarIcon } from "@phosphor-icons/react"
import type { FieldTypeDefinition, CalculationType } from "../../types";
import { RatingCellDisplay } from "./RatingCellDisplay";
import { RatingCellEditor } from "./RatingCellEditor";

function ratingCalc(values: any[], type: CalculationType): any {
  const nums = values.filter((v) => typeof v === "number" && v > 0);
  const allCount = values.length;
  const nonEmpty = nums.length;

  switch (type) {
    case "count":
      return allCount;
    case "count_empty":
      return allCount - nonEmpty;
    case "count_not_empty":
      return nonEmpty;
    case "percent_empty":
      return allCount === 0 ? 0 : ((allCount - nonEmpty) / allCount) * 100;
    case "percent_not_empty":
      return allCount === 0 ? 0 : (nonEmpty / allCount) * 100;
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "average":
      return nonEmpty === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nonEmpty;
    case "min":
      return nonEmpty === 0 ? null : Math.min(...nums);
    case "max":
      return nonEmpty === 0 ? null : Math.max(...nums);
    case "median": {
      if (nonEmpty === 0) return null;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    default:
      return null;
  }
}

// Simple form input wrapping the rating editor
function RatingFormInput({
  value,
  config,
  onChange,
}: {
  value: any;
  config: Record<string, any>;
  onChange: (v: any) => void;
}) {
  const maxRating = config.maxRating ?? 5;
  const currentRating =
    typeof value === "number"
      ? Math.min(Math.max(0, Math.round(value)), maxRating)
      : 0;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1 === currentRating ? null : i + 1)}
          className="p-0"
        >
          <StarIcon
            className={`h-5 w-5 transition-colors ${
              i < currentRating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30 fill-none hover:text-yellow-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export const RatingFieldType: FieldTypeDefinition = {
  key: "rating",
  label: "Rating",
  icon: StarIcon,
  group: "standard",

  hasTypeConfig: false,
  TypeConfigComponent: null,
  defaultTypeConfig: { maxRating: 5 },

  CellDisplay: RatingCellDisplay,
  KanbanDisplay: RatingCellDisplay,
  DetailDisplay: RatingCellDisplay,

  CellEditor: RatingCellEditor,
  KanbanEditor: RatingCellEditor,
  FormInput: RatingFormInput as any,
  DetailEditor: RatingCellEditor,

  editorStyle: "inline",

  validate: (value: any, config: Record<string, any>) => {
    if (value == null) return { valid: true };
    const max = config.maxRating ?? 5;
    if (typeof value !== "number" || value < 0 || value > max) {
      return { valid: false, message: `Rating must be between 0 and ${max}` };
    }
    return { valid: true };
  },

  parseValue: (raw: any) => {
    if (raw == null || raw === "" || raw === 0) return null;
    const n = Number(raw);
    return isNaN(n) ? null : Math.round(n);
  },
  serializeValue: (value: any) => (value === 0 ? null : value),
  getEmptyValue: () => null,
  isEmpty: (value: any) => value == null || value === 0,
  formatDisplayValue: (value: any, config: Record<string, any>) => {
    if (value == null || value === 0) return "";
    const max = config.maxRating ?? 5;
    const filled = "★".repeat(Math.min(value, max));
    const empty = "☆".repeat(max - Math.min(value, max));
    return filled + empty;
  },

  comparator: (a: any, b: any) => {
    const na = typeof a === "number" ? a : 0;
    const nb = typeof b === "number" ? b : 0;
    return na - nb;
  },

  FilterComponent: null,
  filterOperators: [
    { key: "eq", label: "=", requiresValue: true },
    { key: "gt", label: ">", requiresValue: true },
    { key: "gte", label: ">=", requiresValue: true },
    { key: "lt", label: "<", requiresValue: true },
    { key: "lte", label: "<=", requiresValue: true },
    { key: "is_empty", label: "is empty", requiresValue: false },
    { key: "is_not_empty", label: "is not empty", requiresValue: false },
  ],

  availableCalculations: [
    "count",
    "count_empty",
    "count_not_empty",
    "percent_empty",
    "percent_not_empty",
    "sum",
    "average",
    "min",
    "max",
    "median",
  ],
  calculate: ratingCalc,

  placeholder: "",
};

export default RatingFieldType;
