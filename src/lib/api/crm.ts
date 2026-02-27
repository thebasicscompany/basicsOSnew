import { fetchApi, fetchApiList } from "@/lib/api";

export interface ListParams {
  pagination?: { page: number; perPage: number };
  sort?: { field: string; order: "ASC" | "DESC" };
  filter?: Record<string, unknown>;
}

function buildQuery(params: ListParams): string {
  const qs = new URLSearchParams();
  const { pagination = { page: 1, perPage: 25 }, sort, filter } = params;
  const start = (pagination.page - 1) * pagination.perPage;
  const end = start + pagination.perPage - 1;
  qs.set("range", JSON.stringify([start, end]));
  if (sort) {
    qs.set("sort", sort.field);
    qs.set("order", sort.order);
  }
  if (filter && Object.keys(filter).length > 0) {
    qs.set("filter", JSON.stringify(filter));
  }
  return qs.toString();
}

export function getList<T>(resource: string, params: ListParams = {}) {
  const query = buildQuery(params);
  return fetchApiList<T>(`/api/${resource}?${query}`);
}

export function getOne<T>(resource: string, id: number | string) {
  return fetchApi<T>(`/api/${resource}/${id}`);
}

export function create<T>(resource: string, data: unknown) {
  return fetchApi<T>(`/api/${resource}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function update<T>(resource: string, id: number | string, data: unknown) {
  return fetchApi<T>(`/api/${resource}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function remove<T>(resource: string, id: number | string) {
  return fetchApi<T>(`/api/${resource}/${id}`, { method: "DELETE" });
}
