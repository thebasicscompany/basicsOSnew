import type {
  DataProvider,
  GetListParams,
  GetManyParams,
  GetManyReferenceParams,
  GetOneParams,
  CreateParams,
  UpdateParams,
  UpdateManyParams,
  DeleteParams,
  DeleteManyParams,
  Identifier,
} from "ra-core";
import type { ConfigurationContextValue } from "../../root/ConfigurationContext";
import type { SignUpData, SalesFormData, Sale, Deal } from "../../types";
import { getActivityLog } from "../commons/activity";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const base = (path: string) => `${API_URL}${path}`;

async function fetchApi(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(base(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res;
}

function buildQuery(params: GetListParams): string {
  const { pagination, sort, filter } = params;
  const page = pagination?.page ?? 1;
  const perPage = pagination?.perPage ?? 10;
  const start = (page - 1) * perPage;
  const end = start + perPage - 1;
  const parts = [
    `range=[${start},${end}]`,
    sort?.field ? `sort=${sort.field}` : "",
    sort?.order ? `order=${sort.order}` : "",
    filter && Object.keys(filter).length > 0
      ? `filter=${encodeURIComponent(JSON.stringify(filter))}`
      : "",
  ].filter(Boolean);
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

export const restDataProvider: DataProvider = {
  getList: async (resource, params) => {
    const query = buildQuery(params);
    const res = await fetchApi(`/api/${resource}${query}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const total = parseInt(res.headers.get("Content-Range")?.split("/")[1] ?? "0", 10);
    return { data, total };
  },
  getOne: async (resource, { id }) => {
    const res = await fetchApi(`/api/${resource}/${id}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data };
  },
  getMany: async (resource, { ids }) => {
    const results = await Promise.all(
      ids.map((id) => fetchApi(`/api/${resource}/${id}`).then((r) => r.json()))
    );
    return { data: results };
  },
  getManyReference: async (resource, params) => {
    const { target, id, pagination, sort, filter } = params;
    const query = buildQuery({
      pagination: pagination ?? { page: 1, perPage: 10 },
      sort: sort ?? { field: "id", order: "ASC" },
      filter: { ...filter, [target]: id },
    });
    const res = await fetchApi(`/api/${resource}${query}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const total = parseInt(res.headers.get("Content-Range")?.split("/")[1] ?? "0", 10);
    return { data, total };
  },
  create: async (resource, { data }) => {
    const res = await fetchApi(`/api/${resource}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    const created = await res.json();
    return { data: created };
  },
  update: async (resource, { id, data, previousData }) => {
    const res = await fetchApi(`/api/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    const updated = await res.json();
    return { data: updated };
  },
  updateMany: async (resource, { ids, data }) => {
    await Promise.all(
      ids.map((id) =>
        fetchApi(`/api/${resource}/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        })
      )
    );
    return { data: ids };
  },
  delete: async (resource, { id, previousData }) => {
    const res = await fetchApi(`/api/${resource}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return { data: previousData ?? { id } };
  },
  deleteMany: async (resource, { ids }) => {
    await Promise.all(
      ids.map((id) => fetchApi(`/api/${resource}/${id}`, { method: "DELETE" }))
    );
    return { data: ids };
  },
};

const dataProviderWithCustomMethods = {
  ...restDataProvider,
  async getList(resource: string, params: GetListParams) {
    if (resource === "companies") {
      return restDataProvider.getList("companies_summary", params);
    }
    if (resource === "contacts") {
      return restDataProvider.getList("contacts_summary", params);
    }
    return restDataProvider.getList(resource, params);
  },
  async getOne(resource: string, params: GetOneParams) {
    if (resource === "companies") {
      return restDataProvider.getOne("companies_summary", params);
    }
    if (resource === "contacts") {
      return restDataProvider.getOne("contacts_summary", params);
    }
    return restDataProvider.getOne(resource, params);
  },
  async signUp({ email, password, first_name, last_name }: SignUpData) {
    const res = await fetchApi("/api/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, first_name, last_name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? "Signup failed");
    }
    return { id: "", email, password };
  },
  async isInitialized() {
    const res = await fetchApi("/api/init");
    if (!res.ok) return false;
    const { initialized } = await res.json();
    return !!initialized;
  },
  async mergeContacts(sourceId: Identifier, targetId: Identifier) {
    const res = await fetchApi("/api/merge_contacts", {
      method: "POST",
      body: JSON.stringify({ loserId: sourceId, winnerId: targetId }),
    });
    if (!res.ok) throw new Error("Failed to merge contacts");
    return await res.json();
  },
  async getConfiguration(): Promise<ConfigurationContextValue> {
    const { data } = await restDataProvider.getOne("configuration", { id: 1 });
    return (data?.config as ConfigurationContextValue) ?? {};
  },
  async updateConfiguration(config: ConfigurationContextValue) {
    const { data } = await restDataProvider.update("configuration", {
      id: 1,
      data: { config },
      previousData: { id: 1, config: {} },
    });
    return data?.config ?? config;
  },
  async salesCreate(body: SalesFormData): Promise<Sale> {
    const { data } = await restDataProvider.create("sales", { data: body });
    return data as Sale;
  },
  async salesUpdate(
    id: Identifier,
    data: Partial<Omit<SalesFormData, "password">>
  ): Promise<Sale> {
    const { data: updated } = await restDataProvider.update("sales", {
      id,
      data,
      previousData: {},
    });
    return updated as Sale;
  },
  async updatePassword(id: Identifier) {
    throw new Error("Password reset not implemented - use Better Auth");
  },
  async unarchiveDeal(deal: Deal) {
    const { data: deals } = await restDataProvider.getList<Deal>("deals", {
      filter: { stage: deal.stage },
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "index", order: "ASC" },
    });
    const updatedDeals = deals.map((d, index) => ({
      ...d,
      index: d.id === deal.id ? 0 : index + 1,
      archived_at: d.id === deal.id ? null : (d as { archived_at?: string }).archived_at,
    }));
    await Promise.all(
      updatedDeals.map((d) =>
        restDataProvider.update("deals", {
          id: d.id,
          data: d,
          previousData: deals.find((x) => x.id === d.id),
        })
      )
    );
  },
  async getActivityLog(companyId?: Identifier) {
    return getActivityLog(restDataProvider, companyId);
  },
};

export const dataProvider = dataProviderWithCustomMethods;
export type CrmDataProvider = typeof dataProviderWithCustomMethods;
