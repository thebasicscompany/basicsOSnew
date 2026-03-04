import type * as schema from "../../db/schema/index.js";

const VIEW_TYPE_TO_NUMBER: Record<string, number> = {
  grid: 3,
  kanban: 2,
  gallery: 4,
  form: 5,
};

export const NUMBER_TO_VIEW_TYPE: Record<number, string> = {
  3: "grid",
  2: "kanban",
  4: "gallery",
  5: "form",
};

export function viewRowToNocoRaw(row: typeof schema.views.$inferSelect): {
  id: string;
  title: string;
  type: number;
  order: number;
  is_default: boolean;
  lock_type?: string;
} {
  return {
    id: row.id,
    title: row.title,
    type: VIEW_TYPE_TO_NUMBER[row.type] ?? 3,
    order: row.displayOrder,
    is_default: row.isDefault,
    lock_type: row.lockType ?? undefined,
  };
}

export function columnRowToNocoRaw(row: typeof schema.viewColumns.$inferSelect): {
  id: string;
  fk_column_id: string;
  title: string | null;
  show: boolean;
  order: number;
  width: string | null;
} {
  return {
    id: row.id,
    fk_column_id: row.fieldId,
    title: row.title,
    show: row.show,
    order: row.displayOrder,
    width: row.width,
  };
}

export function sortRowToNocoRaw(row: typeof schema.viewSorts.$inferSelect): {
  id: string;
  fk_column_id: string;
  direction: "asc" | "desc";
  order: number;
} {
  return {
    id: row.id,
    fk_column_id: row.fieldId,
    direction: row.direction as "asc" | "desc",
    order: row.displayOrder,
  };
}

export function filterRowToNocoRaw(row: typeof schema.viewFilters.$inferSelect): {
  id: string;
  fk_column_id: string;
  comparison_op: string;
  value: unknown;
  logical_op: string;
} {
  return {
    id: row.id,
    fk_column_id: row.fieldId,
    comparison_op: row.comparisonOp,
    value: row.value,
    logical_op: row.logicalOp,
  };
}
