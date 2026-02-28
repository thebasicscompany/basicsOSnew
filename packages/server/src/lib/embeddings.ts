import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import * as schema from "../db/schema/index.js";

export const EMBEDDABLE_RESOURCES = new Set([
  "contacts",
  "companies",
  "deals",
  "contact_notes",
  "deal_notes",
]);

// Maps CRM resource name → entity_type stored in context_embeddings
const ENTITY_TYPE_MAP: Record<string, string> = {
  contacts: "contact",
  companies: "company",
  deals: "deal",
  contact_notes: "contact_note",
  deal_notes: "deal_note",
};

export function getEntityType(resource: string): string | null {
  return ENTITY_TYPE_MAP[resource] ?? null;
}

/**
 * Builds a human-readable text chunk from a CRM record for embedding.
 * The record uses camelCase field names (Drizzle ORM output).
 */
export function buildEntityText(
  entityType: string,
  record: Record<string, unknown>
): string {
  switch (entityType) {
    case "contact": {
      const parts = [
        [record.firstName, record.lastName].filter(Boolean).join(" "),
        record.email ? `Email: ${record.email}` : null,
        record.title ? `Title: ${record.title}` : null,
        record.background ? `Background: ${record.background}` : null,
      ].filter(Boolean);
      return parts.join(". ");
    }
    case "company": {
      const parts = [
        record.name,
        record.sector ? `Sector: ${record.sector}` : null,
        record.city ? `City: ${record.city}` : null,
        record.description ? `Description: ${record.description}` : null,
      ].filter(Boolean);
      return parts.join(". ");
    }
    case "deal": {
      const parts = [
        record.name,
        record.stage ? `Stage: ${record.stage}` : null,
        record.amount ? `Value: $${record.amount}` : null,
        record.category ? `Category: ${record.category}` : null,
        record.description ? `Description: ${record.description}` : null,
      ].filter(Boolean);
      return parts.join(". ");
    }
    case "contact_note":
    case "deal_note":
      return String(record.text ?? "").trim();
    default:
      return "";
  }
}

async function generateEmbedding(
  gatewayUrl: string,
  apiKey: string,
  text: string
): Promise<number[] | null> {
  try {
    const res = await fetch(`${gatewayUrl}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "basics-embed", input: text }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

/**
 * Generates an embedding for a CRM entity and upserts it into context_embeddings.
 * Safe to call fire-and-forget — all errors are swallowed.
 */
export async function upsertEntityEmbedding(
  db: Db,
  gatewayUrl: string,
  apiKey: string,
  salesId: number,
  entityType: string,
  entityId: number,
  chunkText: string
): Promise<void> {
  if (!chunkText.trim()) return;

  const embedding = await generateEmbedding(gatewayUrl, apiKey, chunkText);
  if (!embedding) return;

  // embeddingStr is a JSON array of numbers — safe to inline as raw SQL
  const embeddingStr = `[${embedding.join(",")}]`;
  // Escape single quotes in user-provided text for raw SQL
  const safeText = chunkText.replace(/'/g, "''");
  const safeType = entityType.replace(/'/g, "''");

  await db.execute(
    sql.raw(`
      INSERT INTO context_embeddings (sales_id, entity_type, entity_id, chunk_text, embedding, updated_at)
      VALUES (${salesId}, '${safeType}', ${entityId}, '${safeText}', '${embeddingStr}'::vector, now())
      ON CONFLICT (sales_id, entity_type, entity_id)
      DO UPDATE SET chunk_text = EXCLUDED.chunk_text, embedding = EXCLUDED.embedding, updated_at = now()
    `)
  );
}

/**
 * Removes context_embeddings row for a deleted entity.
 */
export async function deleteEntityEmbedding(
  db: Db,
  salesId: number,
  entityType: string,
  entityId: number
): Promise<void> {
  await db
    .delete(schema.contextEmbeddings)
    .where(
      and(
        eq(schema.contextEmbeddings.salesId, salesId),
        eq(schema.contextEmbeddings.entityType, entityType),
        eq(schema.contextEmbeddings.entityId, entityId)
      )
    );
}
