import { CaretDownIcon } from "@phosphor-icons/react";
import type {
  FieldTypeDefinition,
  CalculationType,
  SelectOption,
} from "@/field-types/types";
import { SelectCellDisplay } from "./SelectCellDisplay";
import { SelectCellEditor } from "./SelectCellEditor";
import { SelectFormInput } from "./SelectFormInput";
import { SelectTypeConfig } from "./SelectTypeConfig";

function selectCalc(values: any[], type: CalculationType): any {
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

export const SelectFieldType: FieldTypeDefinition = {
  key: "select",
  label: "Select",
  icon: CaretDownIcon,
  group: "standard",

  hasTypeConfig: true,
  TypeConfigComponent: SelectTypeConfig,
  defaultTypeConfig: { options: [] as SelectOption[] },

  CellDisplay: SelectCellDisplay,
  KanbanDisplay: SelectCellDisplay,
  DetailDisplay: SelectCellDisplay,

  CellEditor: SelectCellEditor,
  KanbanEditor: SelectCellEditor,
  FormInput: SelectFormInput,
  DetailEditor: SelectCellEditor,

  editorStyle: "popover",

  validate: (value: any, config: Record<string, any>) => {
    if (value == null || value === "") return { valid: true };
    const options: SelectOption[] = config.options ?? [];
    const found = options.some((o) => o.id === value || o.label === value);
    if (!found) return { valid: false, message: "Invalid option" };
    return { valid: true };
  },

  parseValue: (raw: any) => (raw == null || raw === "" ? null : String(raw)),
  serializeValue: (value: any) =>
    value == null || value === "" ? null : value,
  getEmptyValue: () => null,
  isEmpty: (value: any) => value == null || value === "",
  formatDisplayValue: (value: any, config: Record<string, any>) => {
    if (value == null || value === "") return "";
    const options: SelectOption[] = config.options ?? [];
    const option = options.find((o) => o.id === value || o.label === value);
    return option?.label ?? String(value);
  },

  comparator: (a: any, b: any) => {
    const sa = a == null ? "" : String(a).toLowerCase();
    const sb = b == null ? "" : String(b).toLowerCase();
    return sa.localeCompare(sb);
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
  calculate: selectCalc,

  placeholder: "Select an option...",
  searchPlaceholder: "Search options...",
};

export default SelectFieldType;
