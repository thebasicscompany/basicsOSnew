import { CurrencyDollarIcon } from "@phosphor-icons/react";
import type { FieldTypeDefinition, CalculationType } from "../../types";
import { CurrencyCellDisplay } from "./CurrencyCellDisplay";
import { CurrencyCellEditor } from "./CurrencyCellEditor";
import { CurrencyFormInput } from "./CurrencyFormInput";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function numericCalc(values: any[], type: CalculationType): any {
  const nums = values
    .filter((v) => v != null && v !== "" && !isNaN(Number(v)))
    .map(Number);
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

export const CurrencyFieldType: FieldTypeDefinition = {
  key: "currency",
  label: "Currency",
  icon: CurrencyDollarIcon,
  group: "standard",

  hasTypeConfig: false,
  TypeConfigComponent: null,
  defaultTypeConfig: {},

  CellDisplay: CurrencyCellDisplay,
  KanbanDisplay: CurrencyCellDisplay,
  DetailDisplay: CurrencyCellDisplay,

  CellEditor: CurrencyCellEditor,
  KanbanEditor: CurrencyCellEditor,
  FormInput: CurrencyFormInput,
  DetailEditor: CurrencyCellEditor,

  editorStyle: "inline",

  validate: (value: any) => {
    if (value == null || value === "") return { valid: true };
    if (isNaN(Number(value)))
      return { valid: false, message: "Value must be a number" };
    return { valid: true };
  },

  parseValue: (raw: any) => {
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return isNaN(n) ? null : n;
  },
  serializeValue: (value: any) => value,
  getEmptyValue: () => null,
  isEmpty: (value: any) => value == null || value === "",
  formatDisplayValue: (value: any) => {
    if (value == null || value === "") return "";
    const num = Number(value);
    if (isNaN(num)) return "";
    return currencyFormatter.format(num);
  },

  comparator: (a: any, b: any) => {
    const na = a == null ? -Infinity : Number(a);
    const nb = b == null ? -Infinity : Number(b);
    return na - nb;
  },

  FilterComponent: null,
  filterOperators: [
    { key: "eq", label: "=", requiresValue: true },
    { key: "neq", label: "!=", requiresValue: true },
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
  calculate: numericCalc,

  placeholder: "$0.00",
};

export default CurrencyFieldType;
