import * as schema from "../../../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { buildEntityText, getEntityType, upsertEntityEmbedding, } from "../../../lib/embeddings.js";
import { fireEvent, reloadRule } from "../../../lib/automation-engine.js";
import { CRM_RESOURCES, TABLE_MAP, hasSalesId, } from "../constants.js";
import { snakeToCamel } from "../utils.js";
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
        const session = c.get("session");
        const salesRow = await db
            .select()
            .from(schema.sales)
            .where(eq(schema.sales.userId, session.user.id))
            .limit(1);
        const salesId = salesRow[0]?.id;
        const orgId = salesRow[0]?.organizationId;
        if (!salesId)
            return c.json({ error: "User not found in CRM" }, 404);
        const rawBody = (await c.req.json());
        delete rawBody.id;
        const body = snakeToCamel(rawBody);
        const table = TABLE_MAP[resource];
        if (!table)
            return c.json({ error: "Unknown resource" }, 404);
        const idCol = table.id;
        const conditions = [eq(idCol, id)];
        if (resource === "sales") {
            if (orgId)
                conditions.push(eq(schema.sales.organizationId, orgId));
        }
        else if (hasSalesId(resource)) {
            conditions.push(eq(table.salesId, salesId));
        }
        const [updated] = await db.update(table).set(body).where(and(...conditions)).returning();
        if (!updated)
            return c.json({ error: "Not found" }, 404);
        const entityTypeU = getEntityType(resource);
        const apiKeyU = salesRow[0]?.basicsApiKey;
        if (entityTypeU && apiKeyU && typeof id === "number") {
            const chunkText = buildEntityText(entityTypeU, updated);
            upsertEntityEmbedding(db, env.BASICOS_API_URL, apiKeyU, salesId, entityTypeU, id, chunkText).catch(() => { });
        }
        const eventResourceU = ["deals", "contacts", "tasks"].includes(resource) ? resource : null;
        if (eventResourceU) {
            fireEvent(`${eventResourceU.replace(/s$/, "")}.updated`, updated, salesId).catch(() => { });
        }
        if (resource === "automation_rules" && typeof id === "number") {
            reloadRule(id).catch(() => { });
        }
        return c.json(updated);
    };
}
