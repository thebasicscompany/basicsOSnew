import {
  eq,
  ne,
  not,
  ilike,
  gt,
  lt,
  gte,
  lte,
  isNull,
  isNotNull,
  type SQL,
} from "drizzle-orm";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;

export function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camel] = typeof v === "string" && ISO_DATE_RE.test(v) ? new Date(v) : v;
  }
  return result;
}

export function snakeToCamelField(field: string): string {
  return field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export interface GenericFilter {
  field: string;
  op: string;
  value: string;
}

export function buildGenericFilterCondition(
  table: PgTableWithColumns<any>,
  f: GenericFilter
): SQL | null {
  const col = (table as Record<string, unknown>)[snakeToCamelField(f.field)];
  if (!col || typeof (col as { getSQL: unknown }).getSQL !== "function") return null;
  const c = col as SQL;
  switch (f.op) {
    case "eq":
      return eq(c, f.value);
    case "neq":
      return ne(c, f.value);
    case "like":
      return ilike(c, `%${f.value}%`);
    case "nlike":
      return not(ilike(c, `%${f.value}%`));
    case "gt":
      return gt(c, f.value);
    case "lt":
      return lt(c, f.value);
    case "gte":
      return gte(c, f.value);
    case "lte":
      return lte(c, f.value);
    case "blank":
      return isNull(c);
    case "notblank":
      return isNotNull(c);
    default:
      return null;
  }
}
