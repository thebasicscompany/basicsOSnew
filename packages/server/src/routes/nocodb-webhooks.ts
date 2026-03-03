import { Hono } from "hono";
import type { Db } from "../db/client.js";
import type { Env } from "../env.js";
import * as schema from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import {
  buildEntityText,
  getEntityType,
  upsertEntityEmbedding,
  deleteEntityEmbedding,
} from "../lib/embeddings.js";
import { fireEvent } from "../lib/automation-engine.js";

/**
 * NocoDB webhook event types
 */
type WebhookEventType =
  | "records.after.insert"
  | "records.after.update"
  | "records.after.delete"
  | "records.after.bulkInsert"
  | "records.after.bulkUpdate"
  | "records.after.bulkDelete";

interface WebhookPayload {
  type: WebhookEventType;
  id: string;
  data: {
    table_id: string;
    table_name: string;
    view_id?: string;
    view_name?: string;
    records: Record<string, unknown>[];
    previous_records?: Record<string, unknown>[];
  };
}

/** Map NocoDB table names to CRM event resource names */
const TABLE_TO_RESOURCE: Record<string, string> = {
  contacts: "contact",
  companies: "company",
  deals: "deal",
  tasks: "task",
  contact_notes: "contact_note",
  deal_notes: "deal_note",
};

/** Map NocoDB event type suffix to CRM event action */
function eventAction(type: WebhookEventType): string {
  if (type.includes("insert")) return "created";
  if (type.includes("update")) return "updated";
  if (type.includes("delete")) return "deleted";
  return "unknown";
}

/** Resources that fire automation events */
const AUTOMATABLE = new Set(["contacts", "deals", "tasks"]);

export function createNocoDBWebhookRoutes(db: Db, env: Env) {
  const app = new Hono();

  app.post("/", async (c) => {
    // Validate webhook secret
    const secret = c.req.header("x-nocodb-webhook-secret");
    if (!env.NOCODB_WEBHOOK_SECRET || secret !== env.NOCODB_WEBHOOK_SECRET) {
      return c.json({ error: "Invalid webhook secret" }, 401);
    }

    const payload = (await c.req.json()) as WebhookPayload;
    const { type, data } = payload;
    const tableName = data.table_name;
    const records = data.records ?? [];

    if (records.length === 0) {
      return c.json({ ok: true, processed: 0 });
    }

    const action = eventAction(type);
    const resourceSingular = TABLE_TO_RESOURCE[tableName];
    const entityType = getEntityType(tableName);

    let processed = 0;

    for (const record of records) {
      const salesId =
        typeof record.sales_id === "number"
          ? record.sales_id
          : Number(record.sales_id);

      if (!salesId || isNaN(salesId)) continue;

      // Fire automation events
      if (resourceSingular && AUTOMATABLE.has(tableName)) {
        fireEvent(`${resourceSingular}.${action}`, record, salesId).catch(
          () => {},
        );
      }

      // Handle embeddings
      if (entityType) {
        const recordId =
          typeof record.Id === "number"
            ? record.Id
            : typeof record.id === "number"
              ? record.id
              : Number(record.Id ?? record.id);

        if (!recordId || isNaN(recordId)) continue;

        if (action === "deleted") {
          deleteEntityEmbedding(db, salesId, entityType, recordId).catch(
            () => {},
          );
        } else {
          // For insert/update, look up API key and generate embedding
          const salesRows = await db
            .select()
            .from(schema.sales)
            .where(eq(schema.sales.id, salesId))
            .limit(1);
          const apiKey = salesRows[0]?.basicsApiKey;

          if (apiKey) {
            // Convert snake_case record to camelCase for buildEntityText
            const camelRecord: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(record)) {
              const camel = k.replace(/_([a-z])/g, (_, ch: string) =>
                ch.toUpperCase(),
              );
              camelRecord[camel] = v;
            }
            const chunkText = buildEntityText(entityType, camelRecord);
            if (chunkText) {
              upsertEntityEmbedding(
                db,
                env.BASICOS_API_URL,
                apiKey,
                salesId,
                entityType,
                recordId,
                chunkText,
              ).catch(() => {});
            }
          }
        }
      }

      processed++;
    }

    return c.json({ ok: true, processed });
  });

  return app;
}
