import * as schema from "../../../db/schema/index.js";
import { eq } from "drizzle-orm";
import { buildEntityText, getEntityType, upsertEntityEmbedding, } from "../../../lib/embeddings.js";
import { fireEvent, reloadRule } from "../../../lib/automation-engine.js";
import { CRM_RESOURCES, TABLE_MAP, hasSalesId } from "../constants.js";
import { snakeToCamel } from "../utils.js";
export function createCreateHandler(db, env) {
    return async (c) => {
        const resource = c.req.param("resource");
        if (!CRM_RESOURCES.includes(resource) || resource.endsWith("_summary")) {
            return c.json({ error: "Cannot create on this resource" }, 400);
        }
        const session = c.get("session");
        const salesRow = await db
            .select()
            .from(schema.sales)
            .where(eq(schema.sales.userId, session.user.id))
            .limit(1);
        const salesId = salesRow[0]?.id;
        if (!salesId)
            return c.json({ error: "User not found in CRM" }, 404);
        const rawBody = (await c.req.json());
        const table = TABLE_MAP[resource];
        if (!table)
            return c.json({ error: "Unknown resource" }, 404);
        const body = snakeToCamel(rawBody);
        if (hasSalesId(resource)) {
            body.salesId = salesId;
        }
        const [inserted] = await db.insert(table).values(body).returning();
        if (!inserted)
            return c.json({ error: "Insert failed" }, 500);
        const entityType = getEntityType(resource);
        const apiKey = salesRow[0]?.basicsApiKey;
        if (entityType && apiKey && inserted && typeof inserted.id === "number") {
            const chunkText = buildEntityText(entityType, inserted);
            upsertEntityEmbedding(db, env.BASICOS_API_URL, apiKey, salesId, entityType, inserted.id, chunkText).catch(() => { });
        }
        const eventResource = ["deals", "contacts", "tasks"].includes(resource) ? resource : null;
        if (eventResource) {
            fireEvent(`${eventResource.replace(/s$/, "")}.created`, inserted, salesId).catch(() => { });
        }
        if (resource === "automation_rules" && typeof inserted.id === "number") {
            reloadRule(inserted.id).catch(() => { });
        }
        return c.json(inserted, 201);
    };
}
