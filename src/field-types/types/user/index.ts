import { UserIcon } from "@phosphor-icons/react";
import type { FieldTypeDefinition, CalculationType } from "@/field-types/types";
import { UserCellDisplay } from "./UserCellDisplay";
import { UserCellEditor } from "./UserCellEditor";

interface UserValue {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

function parseUserValue(value: any): UserValue | null {
  if (value == null || value === "") return null;
  if (typeof value === "object" && value.id) return value as UserValue;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed.id) return parsed as UserValue;
    } catch {
      return { id: value, name: value };
    }
  }
  return null;
}

function countCalc(values: any[], type: CalculationType): any {
  const nonNull = values.filter((v) => parseUserValue(v) !== null);
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
      for (const v of values) {
        const user = parseUserValue(v);
        if (user) {
          const key = user.name || user.id;
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
      return counts;
    }
    default:
      return null;
  }
}

export const UserFieldType: FieldTypeDefinition = {
  key: "user",
  label: "User",
  icon: UserIcon,
  group: "standard",

  hasTypeConfig: false,
  TypeConfigComponent: null,
  defaultTypeConfig: { users: [] },

  CellDisplay: UserCellDisplay,
  KanbanDisplay: UserCellDisplay,
  DetailDisplay: UserCellDisplay,

  CellEditor: UserCellEditor,
  KanbanEditor: UserCellEditor,
  FormInput: UserCellEditor as any,
  DetailEditor: UserCellEditor,

  editorStyle: "popover",

  validate: () => ({ valid: true }),

  parseValue: (raw: any) => parseUserValue(raw),
  serializeValue: (value: any) => {
    if (value == null) return null;
    if (typeof value === "object" && value.id) return value;
    return null;
  },
  getEmptyValue: () => null,
  isEmpty: (value: any) => parseUserValue(value) === null,
  formatDisplayValue: (value: any) => {
    const user = parseUserValue(value);
    if (!user) return "";
    return user.name || user.email || user.id;
  },

  comparator: (a: any, b: any) => {
    const ua = parseUserValue(a);
    const ub = parseUserValue(b);
    const sa = ua ? (ua.name || ua.email || ua.id).toLowerCase() : "";
    const sb = ub ? (ub.name || ub.email || ub.id).toLowerCase() : "";
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
  ],
  calculate: countCalc,

  placeholder: "Select user...",
  searchPlaceholder: "Search users...",
};

export default UserFieldType;
