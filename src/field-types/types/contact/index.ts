import { UserIcon } from "@phosphor-icons/react";
import type { FieldTypeDefinition } from "@/field-types/types";
import { ContactCellDisplay } from "./ContactCellDisplay";
import { ContactCellEditor } from "./ContactCellEditor";
import { ContactFormInput } from "./ContactFormInput";

export const ContactFieldType: FieldTypeDefinition = {
  key: "contact",
  label: "Contact",
  icon: UserIcon,
  group: "relational",

  hasTypeConfig: false,
  TypeConfigComponent: null,
  defaultTypeConfig: {},

  CellDisplay: ContactCellDisplay,
  KanbanDisplay: ContactCellDisplay,
  DetailDisplay: ContactCellDisplay,

  CellEditor: ContactCellEditor,
  KanbanEditor: ContactCellEditor,
  FormInput: ContactFormInput,
  DetailEditor: ContactCellEditor,

  editorStyle: "popover",

  validate: (value: unknown) => {
    if (value == null || value === "") return { valid: true };
    const n = Number(value);
    if (Number.isInteger(n) && n > 0) return { valid: true };
    return { valid: false, message: "Select a contact" };
  },

  parseValue: (raw: unknown) => {
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
  },
  serializeValue: (value: unknown) => value,
  getEmptyValue: () => null,
  isEmpty: (value: unknown) =>
    value == null ||
    value === "" ||
    (typeof value === "number" && !Number.isInteger(value)),
  formatDisplayValue: (value: unknown) => {
    if (value == null || value === "") return "";
    if (typeof value === "object" && value !== null) {
      const v = value as Record<string, unknown>;
      const full = [v.firstName, v.lastName].filter(Boolean).join(" ");
      return full || String(v.email ?? v.id ?? "");
    }
    return String(value);
  },

  comparator: (a: unknown, b: unknown) => {
    const na = a == null ? -Infinity : Number(a);
    const nb = b == null ? -Infinity : Number(b);
    return na - nb;
  },

  FilterComponent: null,
  filterOperators: [
    { key: "eq", label: "is", requiresValue: true },
    { key: "is_empty", label: "is empty", requiresValue: false },
    { key: "is_not_empty", label: "is not empty", requiresValue: false },
  ],

  availableCalculations: [],
  calculate: () => null,

  placeholder: "Search contacts...",
  searchPlaceholder: "Search by name, email...",
};

export default ContactFieldType;
