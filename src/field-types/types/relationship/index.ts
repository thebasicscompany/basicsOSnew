import { Link2 } from "lucide-react";
import type { FieldTypeDefinition, CalculationType } from "../../types";
import { RelationshipCellDisplay } from "./RelationshipCellDisplay";
import { RelationshipCellEditor } from "./RelationshipCellEditor";
import { RelationshipTypeConfig } from "./RelationshipTypeConfig";

interface LinkedRecord {
  id: string;
  title?: string;
  tableName?: string;
}

function parseRelationshipValue(value: any): LinkedRecord[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value.map((v) => {
      if (typeof v === "object" && v.id) return v as LinkedRecord;
      return { id: String(v), title: String(v) };
    });
  }
  if (typeof value === "object" && value.id) return [value as LinkedRecord];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.id) return [parsed as LinkedRecord];
    } catch {
      return [{ id: value, title: value }];
    }
  }
  return [];
}

function relationshipCalc(values: any[], type: CalculationType): any {
  const parsed = values.map(parseRelationshipValue);
  const nonEmpty = parsed.filter((r) => r.length > 0);

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

export const RelationshipFieldType: FieldTypeDefinition = {
  key: "relationship",
  label: "Link to Record",
  icon: Link2,
  group: "relational",

  hasTypeConfig: true,
  TypeConfigComponent: RelationshipTypeConfig,
  defaultTypeConfig: {
    relatedTable: "",
    allowMultiple: true,
    displayField: "title",
    records: [],
  },

  CellDisplay: RelationshipCellDisplay,
  KanbanDisplay: RelationshipCellDisplay,
  DetailDisplay: RelationshipCellDisplay,

  CellEditor: RelationshipCellEditor,
  KanbanEditor: RelationshipCellEditor,
  FormInput: RelationshipCellEditor as any,
  DetailEditor: RelationshipCellEditor,

  editorStyle: "popover",

  validate: () => ({ valid: true }),

  parseValue: (raw: any) => {
    const records = parseRelationshipValue(raw);
    return records.length === 0 ? null : records;
  },
  serializeValue: (value: any) => {
    if (value == null) return null;
    if (Array.isArray(value) && value.length === 0) return null;
    return value;
  },
  getEmptyValue: () => null,
  isEmpty: (value: any) => parseRelationshipValue(value).length === 0,
  formatDisplayValue: (value: any) => {
    const records = parseRelationshipValue(value);
    return records.map((r) => r.title || r.id).join(", ");
  },

  comparator: (a: any, b: any) => {
    const ra = parseRelationshipValue(a);
    const rb = parseRelationshipValue(b);
    return ra.length - rb.length;
  },

  FilterComponent: null,
  filterOperators: [
    { key: "contains", label: "contains", requiresValue: true },
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
  calculate: relationshipCalc,

  placeholder: "Link record...",
  searchPlaceholder: "Search records...",
};

export default RelationshipFieldType;
