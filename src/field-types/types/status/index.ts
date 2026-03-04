import { CircleIcon } from "@phosphor-icons/react";
import type {
  FieldTypeDefinition,
  CalculationType,
  StatusOption,
} from "../../types";
import { StatusCellDisplay } from "./StatusCellDisplay";
import { StatusCellEditor } from "./StatusCellEditor";
import { StatusFormInput } from "./StatusFormInput";
import { StatusTypeConfig } from "./StatusTypeConfig";

function statusCalc(values: any[], type: CalculationType): any {
  const nonNull = values.filter((v) => v != null && v !== "");
  switch (type) {
    case "count":
      return values.length;
    case "count_empty":
      return values.length - nonNull.length;
    case "count_not_empty":
      return nonNull.length;
    case "percent_empty":
      return values.length === 0
        ? 0
        : ((values.length - nonNull.length) / values.length) * 100;
    case "percent_not_empty":
      return values.length === 0 ? 0 : (nonNull.length / values.length) * 100;
    case "count_values": {
      const counts: Record<string, number> = {};
      for (const v of nonNull) {
        const key = String(v);
        counts[key] = (counts[key] ?? 0) + 1;
      }
      return counts;
    }
    case "percent_values": {
      const counts: Record<string, number> = {};
      for (const v of nonNull) {
        const key = String(v);
        counts[key] = (counts[key] ?? 0) + 1;
      }
      const total = values.length;
      const percents: Record<string, number> = {};
      for (const [key, count] of Object.entries(counts)) {
        percents[key] = total === 0 ? 0 : (count / total) * 100;
      }
      return percents;
    }
    default:
      return null;
  }
}

export const StatusFieldType: FieldTypeDefinition = {
  key: "status",
  label: "Status",
  icon: CircleIcon,
  group: "standard",

  hasTypeConfig: true,
  TypeConfigComponent: StatusTypeConfig,
  defaultTypeConfig: { options: [] as StatusOption[] },

  CellDisplay: StatusCellDisplay,
  KanbanDisplay: StatusCellDisplay,
  DetailDisplay: StatusCellDisplay,

  CellEditor: StatusCellEditor,
  KanbanEditor: StatusCellEditor,
  FormInput: StatusFormInput,
  DetailEditor: StatusCellEditor,

  editorStyle: "popover",

  validate: (value: any, config: Record<string, any>) => {
    if (value == null || value === "") return { valid: true };
    const options: StatusOption[] = config.options ?? [];
    const found = options.some((o) => o.id === value || o.label === value);
    if (!found) return { valid: false, message: "Invalid status" };
    return { valid: true };
  },

  parseValue: (raw: any) => (raw == null || raw === "" ? null : String(raw)),
  serializeValue: (value: any) =>
    value == null || value === "" ? null : value,
  getEmptyValue: () => null,
  isEmpty: (value: any) => value == null || value === "",
  formatDisplayValue: (value: any, config: Record<string, any>) => {
    if (value == null || value === "") return "";
    const options: StatusOption[] = config.options ?? [];
    const option = options.find((o) => o.id === value || o.label === value);
    return option?.label ?? String(value);
  },

  comparator: (a: any, b: any, config?: Record<string, any>) => {
    const options: StatusOption[] = config?.options ?? [];
    const orderA =
      options.find((o) => o.id === a || o.label === a)?.order ?? 999;
    const orderB =
      options.find((o) => o.id === b || o.label === b)?.order ?? 999;
    return orderA - orderB;
  },

  FilterComponent: null,
  filterOperators: [
    { key: "eq", label: "is", requiresValue: true },
    { key: "neq", label: "is not", requiresValue: true },
    { key: "is_empty", label: "is empty", requiresValue: false },
    { key: "is_not_empty", label: "is not empty", requiresValue: false },
  ],

  availableCalculations: [
    "count",
    "count_empty",
    "count_not_empty",
    "percent_empty",
    "percent_not_empty",
    "count_values",
    "percent_values",
  ],
  calculate: statusCalc,

  placeholder: "Select status...",
  searchPlaceholder: "Search statuses...",
};

export default StatusFieldType;
