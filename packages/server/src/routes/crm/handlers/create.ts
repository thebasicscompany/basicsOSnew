import type { Context } from "hono";
import type { Db } from "../../../db/client.js";
import type { Env } from "../../../env.js";
import * as schema from "../../../db/schema/index.js";
import { eq } from "drizzle-orm";
import {
  buildEntityText,
  getEntityType,
  upsertEntityEmbedding,
} from "../../../lib/embeddings.js";
import { fireEvent, reloadRule } from "../../../lib/automation-engine.js";
import { CRM_RESOURCES, TABLE_MAP, hasCrmUserId, type Resource } from "../constants.js";
import { snakeToCamel } from "../utils.js";

export function createCreateHandler(db: Db, env: Env) {
  return async (c: Context) => {
    const resource = c.req.param("resource") as Resource;
    if (!CRM_RESOURCES.includes(resource) || resource.endsWith("_summary")) {
      return c.json({ error: "Cannot create on this resource" }, 400);
    }

    const session = c.get("session") as { user?: { id: string } };
    const crmUserRows = await db
      .select()
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, session.user!.id))
      .limit(1);
    const crmUserId = crmUserRows[0]?.id;
    if (!crmUserId) return c.json({ error: "User not found in CRM" }, 404);

    const rawBody = (await c.req.json()) as Record<string, unknown>;
    const table = TABLE_MAP[resource as Exclude<Resource, "companies_summary" | "contacts_summary">];
    if (!table) return c.json({ error: "Unknown resource" }, 404);

    const body = snakeToCamel(rawBody) as Record<string, unknown>;
    if (hasCrmUserId(resource)) {
      body.crmUserId = crmUserId;
    }

    const [inserted] = await db.insert(table).values(body).returning();
    if (!inserted) return c.json({ error: "Insert failed" }, 500);

    const entityType = getEntityType(resource);
    const apiKey = crmUserRows[0]?.basicsApiKey;
    if (entityType && apiKey && inserted && typeof (inserted as { id?: unknown }).id === "number") {
      const chunkText = buildEntityText(entityType, inserted as Record<string, unknown>);
      upsertEntityEmbedding(db, env.BASICOS_API_URL, apiKey, crmUserId, entityType, (inserted as { id: number }).id, chunkText).catch(() => {});
    }

    const eventResource = ["deals", "contacts", "tasks"].includes(resource) ? resource : null;
    if (eventResource) {
      fireEvent(`${eventResource.replace(/s$/, "")}.created`, inserted as Record<string, unknown>, crmUserId).catch(() => {});
    }

    if (resource === "automation_rules" && typeof (inserted as { id?: number }).id === "number") {
      reloadRule((inserted as { id: number }).id).catch(() => {});
    }

    return c.json(inserted, 201);
  };
}
