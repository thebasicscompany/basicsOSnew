import type { Context } from "hono";
import type { Db } from "../../../db/client.js";
import { PERMISSIONS, getCrmUserFromSession, getPermissionSetForUser, hasPermission } from "../../../lib/rbac.js";
import { deleteRecord } from "../../../services/crm/delete-record.js";
import {
  CRM_RESOURCES,
  TABLE_MAP,
  type Resource,
} from "../constants.js";

export function createDeleteHandler(db: Db) {
  return async (c: Context) => {
    const resource = c.req.param("resource") as Resource;
    const id = parseInt(c.req.param("id"), 10);
    if (
      isNaN(id) ||
      !CRM_RESOURCES.includes(resource) ||
      resource.endsWith("_summary")
    ) {
      return c.json({ error: "Invalid request" }, 400);
    }

    const crmUser = await getCrmUserFromSession(c, db);
    if (!crmUser) return c.json({ error: "User not found in CRM" }, 404);
    const orgId = crmUser.organizationId;
    if (!orgId) return c.json({ error: "Organization not found" }, 404);

    const permissions = await getPermissionSetForUser(db, crmUser);
    const canHardDelete =
      hasPermission(permissions, "*") ||
      hasPermission(permissions, PERMISSIONS.recordsDeleteHard);
    const canArchive =
      hasPermission(permissions, "*") ||
      hasPermission(permissions, PERMISSIONS.recordsArchive);

    if (!TABLE_MAP[resource as Exclude<Resource, "companies_summary" | "contacts_summary">]) {
      return c.json({ error: "Unknown resource" }, 404);
    }

    const result = await deleteRecord(db, {
      resource,
      id,
      orgId,
      crmUserId: crmUser.id,
      canHardDelete,
      canArchive,
    });

    if (!result.success) {
      const status = result.error === "Not found" ? 404 : 403;
      return c.json({ error: result.error }, status);
    }
    if (result.archived) {
      return c.json({ archived: true, record: result.record });
    }
    return c.json(result.record);
  };
}
