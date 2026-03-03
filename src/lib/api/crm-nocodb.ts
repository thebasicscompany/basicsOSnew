/**
 * NocoDB implementation of the CRM API (drop-in replacement for crm.ts).
 *
 * NocoDB API v2 endpoints:
 *   List:   GET  /api/v2/tables/{tableId}/records
 *   Get:    GET  /api/v2/tables/{tableId}/records/{rowId}
 *   Create: POST /api/v2/tables/{tableId}/records
 *   Update: PATCH /api/v2/tables/{tableId}/records
 *   Delete: DELETE /api/v2/tables/{tableId}/records
 *   Count:  GET  /api/v2/tables/{tableId}/records/count
 */

import { nocoFetch } from "@/lib/nocodb/client";
import { buildWhereClause, buildSortParam } from "@/lib/nocodb/filters";
import { getTableId } from "@/lib/nocodb/table-map";
import type { ListParams } from "./crm";

/** NocoDB list response shape */
interface NocoListResponse {
  list: Record<string, unknown>[];
  pageInfo: { totalRows: number; page: number; pageSize: number };
}

/** Get the current salesId from the NocoDB provider context (set at init) */
let _salesId: number | undefined;

export function setNocoSalesId(salesId: number) {
  _salesId = salesId;
}

/** Resources that require salesId scoping */
const SALES_SCOPED = new Set([
  "companies",
  "deals",
  "contact_notes",
  "deal_notes",
  "tasks",
  "sales",
  "automation_rules",
  "companies_summary",
  "contacts_summary",
]);

function getSalesIdForResource(resource: string): number | undefined {
  return SALES_SCOPED.has(resource) ? _salesId : undefined;
}

export async function getList<T>(
  resource: string,
  params: ListParams = {},
): Promise<{ data: T[]; total: number }> {
  const tableId = getTableId(resource);
  const {
    pagination = { page: 1, perPage: 25 },
    sort,
    filter = {},
    extraWhere,
  } = params;

  const offset = (pagination.page - 1) * pagination.perPage;
  const limit = pagination.perPage;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));

  let where = buildWhereClause(
    filter,
    resource,
    getSalesIdForResource(resource),
  );
  // Append view-level where clause if provided
  if (extraWhere) {
    where = where ? `${where}~and${extraWhere}` : extraWhere;
  }
  if (where) qs.set("where", where);

  const sortParam = buildSortParam(sort?.field, sort?.order);
  if (sortParam) qs.set("sort", sortParam);

  const response = await nocoFetch<NocoListResponse>(
    `/api/v2/tables/${tableId}/records?${qs.toString()}`,
  );

  const data = response.list as T[];
  const total = response.pageInfo.totalRows;

  return { data, total };
}

export async function getOne<T>(
  resource: string,
  id: number | string,
): Promise<T> {
  const tableId = getTableId(resource);
  const record = await nocoFetch<Record<string, unknown>>(
    `/api/v2/tables/${tableId}/records/${id}`,
  );
  return record as T;
}

export async function create<T>(
  resource: string,
  data: unknown,
): Promise<T> {
  const tableId = getTableId(resource);
  const body = data as Record<string, unknown>;

  const record = await nocoFetch<Record<string, unknown>>(
    `/api/v2/tables/${tableId}/records`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  return record as T;
}

export async function update<T>(
  resource: string,
  id: number | string,
  data: unknown,
): Promise<T> {
  const tableId = getTableId(resource);
  const body = data as Record<string, unknown>;
  // NocoDB PATCH expects an array with id field
  body.Id = Number(id);

  const response = await nocoFetch<Record<string, unknown>>(
    `/api/v2/tables/${tableId}/records`,
    {
      method: "PATCH",
      body: JSON.stringify([body]),
    },
  );

  // NocoDB PATCH returns the updated record (or array of records)
  const record = Array.isArray(response) ? response[0] : response;
  return record as T;
}

export async function remove<T>(
  resource: string,
  id: number | string,
): Promise<T> {
  const tableId = getTableId(resource);

  // Fetch the record before deletion so we can return it
  const existing = await getOne<T>(resource, id);

  await nocoFetch(
    `/api/v2/tables/${tableId}/records`,
    {
      method: "DELETE",
      body: JSON.stringify([{ id: Number(id) }]),
    },
  );

  return existing;
}
