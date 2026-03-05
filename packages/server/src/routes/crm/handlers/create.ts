import type { Context } from "hono";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import { PERMISSIONS, requirePermission } from "@/lib/rbac.js";
import { jsonError } from "@/lib/api-error.js";
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
      return jsonError(c, "Cannot create on this resource", 400, "INVALID_RESOURCE");
    }

    const authz = await requirePermission(c, db, PERMISSIONS.recordsWrite);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;
    if (resource === "crm_users" && !authz.permissions.has("*")) {
      return jsonError(c, "Forbidden", 403, "FORBIDDEN");
    }
    const crmUserId = crmUser.id;
    const orgId = crmUser.organizationId;
    if (!crmUserId || !orgId) {
      return jsonError(c, "Organization not found", 404, "NOT_FOUND");
    }

    if (!TABLE_MAP[resource as Exclude<Resource, "companies_summary" | "contacts_summary">]) {
      return jsonError(c, "Unknown resource", 404, "NOT_FOUND");
    }

    let rawBody: Record<string, unknown>;
    try {
      rawBody = (await c.req.json()) as Record<string, unknown>;
    } catch {
      return jsonError(c, "Invalid JSON body", 400, "VALIDATION_FAILED");
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
      const code =
        result.error === "Insert failed"
          ? "INSERT_FAILED"
          : result.error === "Not found"
            ? "NOT_FOUND"
            : "VALIDATION_FAILED";
      return jsonError(c, result.error, status, code);
    }
    return c.json(result.record, 201);
  };
}
