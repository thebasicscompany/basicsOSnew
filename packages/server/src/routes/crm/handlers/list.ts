import type { Context } from "hono";
import type { Db } from "../../../db/client.js";
import { PERMISSIONS, requirePermission } from "../../../lib/rbac.js";
import { listRecords, isListableResource, type GenericFilter } from "../../../data-access/crm/list.js";

export function createListHandler(db: Db) {
  return async (c: Context) => {
    const resource = c.req.param("resource");
    if (!isListableResource(resource)) {
      return c.json({ error: "Unknown resource" }, 404);
    }

    const authz = await requirePermission(c, db, PERMISSIONS.recordsRead);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;
    const orgId = crmUser.organizationId;
    if (!orgId) return c.json({ error: "Organization not found" }, 404);

    const range = c.req.query("range");
    const sortParam = c.req.query("sort");
    const orderParam = c.req.query("order");
    const filterParam = c.req.query("filter");
    const filtersParam = c.req.query("filters");

    let [start, end] = [0, 24];
    if (range) {
      try {
        const parsed = JSON.parse(range) as [number, number];
        if (Array.isArray(parsed) && parsed.length >= 2) {
          [start, end] = parsed;
        }
      } catch {
        /* use defaults */
      }
    }

    let filter: Record<string, unknown> = {};
    if (filterParam) {
      try {
        filter = JSON.parse(filterParam) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
    }

    let genericFilters: GenericFilter[] = [];
    if (filtersParam) {
      try {
        const parsed = JSON.parse(filtersParam) as unknown;
        if (Array.isArray(parsed)) {
          genericFilters = parsed.filter(
            (x): x is GenericFilter =>
              x != null &&
              typeof x === "object" &&
              typeof (x as GenericFilter).field === "string" &&
              typeof (x as GenericFilter).op === "string" &&
              typeof (x as GenericFilter).value === "string",
          );
        }
      } catch {
        /* ignore */
      }
    }

    const { rows, total } = await listRecords(db, {
      resource,
      orgId,
      start,
      end,
      sort: sortParam ?? null,
      order: orderParam ?? null,
      filter,
      genericFilters,
    });

    c.header(
      "Content-Range",
      `${resource} ${start}-${Math.min(start + rows.length, total)}/${total}`,
    );
    return c.json(rows);
  };
}
