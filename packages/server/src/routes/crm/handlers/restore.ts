import type { Context } from "hono";
import type { Db } from "@/db/client.js";
import { PERMISSIONS, requirePermission } from "@/lib/rbac.js";
import { restoreDealService } from "@/services/crm/restore-deal.js";

export function createRestoreHandler(db: Db) {
  return async (c: Context) => {
    const resource = c.req.param("resource");
    if (resource !== "deals") {
      return c.json({ error: "Restore is only supported for deals" }, 400);
    }

    const id = parseInt(c.req.param("id"), 10);
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid request" }, 400);
    }

    const authz = await requirePermission(c, db, PERMISSIONS.recordsRestore);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;
    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const result = await restoreDealService(db, {
      id,
      orgId: crmUser.organizationId,
      crmUserId: crmUser.id,
    });

    if (!result.success) {
      return c.json({ error: result.error }, 404);
    }
    return c.json(result.record);
  };
}
