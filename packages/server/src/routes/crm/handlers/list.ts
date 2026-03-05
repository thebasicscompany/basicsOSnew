import type { Context } from "hono";
import type { Db } from "@/db/client.js";
import { PERMISSIONS, requirePermission } from "@/lib/rbac.js";
import { listRecords, isListableResource } from "@/data-access/crm/list.js";
import {
  parseRange,
  parseFilter,
  parseGenericFilters,
} from "@/schemas/crm/list-params.js";

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

    const [start, end] = parseRange(c.req.query("range"));
    const filter = parseFilter(c.req.query("filter"));
    const genericFilters = parseGenericFilters(c.req.query("filters"));
    const sortParam = c.req.query("sort");
    const orderParam = c.req.query("order");

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
