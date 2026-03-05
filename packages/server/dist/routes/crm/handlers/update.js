import { PERMISSIONS, requirePermission } from "../../../lib/rbac.js";
import { updateRecordService } from "../../../services/crm/update-record.js";
import { snakeToCamel } from "../../../routes/crm/utils.js";
import { CRM_RESOURCES, TABLE_MAP, } from "../../../routes/crm/constants.js";
export function createUpdateHandler(db, env) {
    return async (c) => {
        const resource = c.req.param("resource");
        const idRaw = c.req.param("id");
        const id = resource === "configuration" ? 1 : parseInt(idRaw, 10);
        if ((resource !== "configuration" && isNaN(id)) ||
            !CRM_RESOURCES.includes(resource) ||
            resource.endsWith("_summary")) {
            return c.json({ error: "Invalid request" }, 400);
        }
        const authz = await requirePermission(c, db, PERMISSIONS.recordsWrite);
        if (!authz.ok)
            return authz.response;
        const { crmUser } = authz;
        if (resource === "crm_users" && !authz.permissions.has("*")) {
            return c.json({ error: "Forbidden" }, 403);
        }
        const crmUserId = crmUser.id;
        const orgId = crmUser.organizationId;
        if (!crmUserId || !orgId) {
            return c.json({ error: "Organization not found" }, 404);
        }
        if (!TABLE_MAP[resource]) {
            return c.json({ error: "Unknown resource" }, 404);
        }
        let rawBody;
        try {
            rawBody = (await c.req.json());
        }
        catch {
            return c.json({ error: "Invalid JSON body" }, 400);
        }
        delete rawBody.id;
        const body = snakeToCamel(rawBody);
        const result = await updateRecordService(db, env, {
            resource,
            id: id,
            body,
            orgId,
            crmUserId,
            crmUserRow: crmUser,
        });
        if (!result.success) {
            const status = result.error === "Not found" ? 404 : 400;
            return c.json({ error: result.error }, status);
        }
        return c.json(result.record);
    };
}
