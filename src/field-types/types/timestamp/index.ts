import { ClockIcon } from "@phosphor-icons/react";
import type { FieldTypeDefinition, CalculationType } from "@/field-types/types";
import { TimestampCellDisplay } from "./TimestampCellDisplay";
import { TimestampCellEditor } from "./TimestampCellEditor";
import { TimestampFormInput } from "./TimestampFormInput";

function toDate(v: any): Date | null {
  if (v == null || v === "") return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function timeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffWeeks < 5)
    return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

function timestampCalc(values: any[], type: CalculationType): any {
  const dates = values.map(toDate).filter((d): d is Date => d !== null);
  const allCount = values.length;
  const nonEmpty = dates.length;

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
    case "earliest":
      return nonEmpty === 0
        ? null
        : new Date(Math.min(...dates.map((d) => d.getTime())));
    case "latest":
      return nonEmpty === 0
        ? null
        : new Date(Math.max(...dates.map((d) => d.getTime())));
    case "date_range": {
      if (nonEmpty < 2) return null;
      const min = Math.min(...dates.map((d) => d.getTime()));
      const max = Math.max(...dates.map((d) => d.getTime()));
      const diffDays = Math.round((max - min) / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    }
    default:
      return null;
  }
}

export const TimestampFieldType: FieldTypeDefinition = {
  key: "timestamp",
  label: "Timestamp",
  icon: ClockIcon,
  group: "standard",

  hasTypeConfig: false,
  TypeConfigComponent: null,
  defaultTypeConfig: {},

  CellDisplay: TimestampCellDisplay,
  KanbanDisplay: TimestampCellDisplay,
  DetailDisplay: TimestampCellDisplay,

  CellEditor: TimestampCellEditor,
  KanbanEditor: TimestampCellEditor,
  FormInput: TimestampFormInput,
  DetailEditor: TimestampCellEditor,

  editorStyle: "popover",

  validate: (value: any) => {
    if (value == null || value === "") return { valid: true };
    const d = new Date(value);
    if (isNaN(d.getTime()))
      return { valid: false, message: "Invalid timestamp" };
    return { valid: true };
  },

  parseValue: (raw: any) => {
    if (raw == null || raw === "") return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d.toISOString();
  },
  serializeValue: (value: any) => value,
  getEmptyValue: () => null,
  isEmpty: (value: any) => value == null || value === "",
  formatDisplayValue: (value: any) => {
    if (value == null || value === "") return "";
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? "" : timeAgo(d);
  },

  comparator: (a: any, b: any) => {
    const da = toDate(a);
    const db = toDate(b);
    if (da === null && db === null) return 0;
    if (da === null) return -1;
    if (db === null) return 1;
    return da.getTime() - db.getTime();
  },

  FilterComponent: null,
  filterOperators: [
    { key: "eq", label: "is", requiresValue: true },
    { key: "gt", label: "is after", requiresValue: true },
    { key: "lt", label: "is before", requiresValue: true },
    { key: "is_empty", label: "is empty", requiresValue: false },
    { key: "is_not_empty", label: "is not empty", requiresValue: false },
  ],

  availableCalculations: [
    "count",
    "count_empty",
    "count_not_empty",
    "percent_empty",
    "percent_not_empty",
    "earliest",
    "latest",
    "date_range",
  ],
  calculate: timestampCalc,

  placeholder: "Select date and time...",
};

export default TimestampFieldType;
