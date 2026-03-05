import type { Context } from "hono";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import { PERMISSIONS, requirePermission } from "@/lib/rbac.js";
import { createRecord } from "@/services/crm/create-record.js";
import { snakeToCamel } from "@/routes/crm/utils.js";
import {
  CRM_RESOURCES,
  TABLE_MAP,
  type Resource,
} from "@/routes/crm/constants.js";

export function createCreateHandler(db: Db, env: Env) {
  return async (c: Context) => {
    const resource = c.req.param("resource") as Resource;
    if (!CRM_RESOURCES.includes(resource) || resource.endsWith("_summary")) {
      return c.json({ error: "Cannot create on this resource" }, 400);
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

    let rawBody: Record<string, unknown>;
    try {
      rawBody = (await c.req.json()) as Record<string, unknown>;
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const body = snakeToCamel(rawBody) as Record<string, unknown>;

    const result = await createRecord(db, env, {
      resource,
      body,
      crmUserId,
      orgId,
      crmUserRow: crmUser as Record<string, unknown>,
    });

    if (!result.success) {
      const status =
        result.error === "Insert failed"
          ? 500
          : result.error === "Not found"
            ? 404
            : 400;
      return c.json({ error: result.error }, status);
    }
    return c.json(result.record, 201);
  };
}
