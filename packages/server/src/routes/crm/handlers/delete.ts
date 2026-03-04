import type { Context } from "hono";
import type { Db } from "../../../db/client.js";
import * as schema from "../../../db/schema/index.js";
import { eq, and } from "drizzle-orm";
import { getEntityType, deleteEntityEmbedding } from "../../../lib/embeddings.js";
import { fireEvent } from "../../../lib/automation-engine.js";
import { CRM_RESOURCES, TABLE_MAP, hasCrmUserId, type Resource } from "../constants.js";

export function createDeleteHandler(db: Db) {
  return async (c: Context) => {
    const resource = c.req.param("resource") as Resource;
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id) || !CRM_RESOURCES.includes(resource) || resource.endsWith("_summary")) {
      return c.json({ error: "Invalid request" }, 400);
    }

    const session = c.get("session") as { user?: { id: string } };
    const crmUserRows = await db
      .select()
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, session.user!.id))
      .limit(1);
    const crmUserId = crmUserRows[0]?.id;
    const orgId = crmUserRows[0]?.organizationId;
    if (!crmUserId) return c.json({ error: "User not found in CRM" }, 404);

    const table = TABLE_MAP[resource as Exclude<Resource, "companies_summary" | "contacts_summary">];
    if (!table) return c.json({ error: "Unknown resource" }, 404);

    const idCol = (table as unknown as { id: typeof schema.contacts.id }).id;
    const conditions = [eq(idCol, id)];
    if (resource === "crm_users") {
      if (orgId) conditions.push(eq(schema.crmUsers.organizationId, orgId));
    } else if (hasCrmUserId(resource)) {
      conditions.push(eq((table as typeof schema.companies).crmUserId, crmUserId));
    }

    const [deleted] = await db.delete(table).where(and(...conditions)).returning();
    if (!deleted) return c.json({ error: "Not found" }, 404);

    const entityTypeDel = getEntityType(resource);
    if (entityTypeDel) {
      deleteEntityEmbedding(db, crmUserId, entityTypeDel, id).catch(() => {});
    }

    const eventResourceDel = ["deals", "contacts", "tasks"].includes(resource) ? resource : null;
    if (eventResourceDel) {
      fireEvent(`${eventResourceDel.replace(/s$/, "")}.deleted`, deleted as Record<string, unknown>, crmUserId).catch(() => {});
    }

    return c.json(deleted);
  };
}
