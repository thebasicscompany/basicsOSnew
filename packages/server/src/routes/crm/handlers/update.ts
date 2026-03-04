import type { Context } from "hono";
import type { Db } from "../../../db/client.js";
import type { Env } from "../../../env.js";
import { PERMISSIONS, requirePermission } from "../../../lib/rbac.js";
import { updateRecordService } from "../../../services/crm/update-record.js";
import { snakeToCamel } from "../utils.js";
import {
  CRM_RESOURCES,
  TABLE_MAP,
  type Resource,
} from "../constants.js";

export function createUpdateHandler(db: Db, env: Env) {
  return async (c: Context) => {
    const resource = c.req.param("resource") as Resource;
    const idRaw = c.req.param("id");
    const id = resource === "configuration" ? 1 : parseInt(idRaw, 10);
    if (
      (resource !== "configuration" && isNaN(id as number)) ||
      !CRM_RESOURCES.includes(resource) ||
      resource.endsWith("_summary")
    ) {
      return c.json({ error: "Invalid request" }, 400);
    }

    const authz = await requirePermission(c, db, PERMISSIONS.recordsWrite);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;
    if (resource === "crm_users" && !authz.permissions.has("*")) {
      return c.json({ error: "Forbidden" }, 403);
    }
    const crmUserId = crmUser.id;
    const orgId = crmUser.organizationId;
    if (!crmUserId || !orgId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    if (!TABLE_MAP[resource as Exclude<Resource, "companies_summary" | "contacts_summary">]) {
      return c.json({ error: "Unknown resource" }, 404);
    }

    const rawBody = (await c.req.json()) as Record<string, unknown>;
    delete rawBody.id;
    const body = snakeToCamel(rawBody) as Record<string, unknown>;

    const result = await updateRecordService(db, env, {
      resource,
      id: id as number,
      body,
      orgId,
      crmUserId,
      crmUserRow: crmUser as Record<string, unknown>,
    });

    if (!result.success) {
      const status = result.error === "Not found" ? 404 : 400;
      return c.json({ error: result.error }, status);
    }
    return c.json(result.record);
  };
}
