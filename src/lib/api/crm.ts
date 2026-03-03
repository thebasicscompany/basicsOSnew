import * as nocoApi from "./crm-nocodb";

export interface ListParams {
  pagination?: { page: number; perPage: number };
  sort?: { field: string; order: "ASC" | "DESC" };
  filter?: Record<string, unknown>;
  /** Pre-built NocoDB where clause to append (for view-level filters) */
  extraWhere?: string;
}

export const getList = nocoApi.getList;
export const getOne = nocoApi.getOne;
export const create = nocoApi.create;
export const update = nocoApi.update;
export const remove = nocoApi.remove;
