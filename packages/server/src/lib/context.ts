import { and, count, desc, eq, isNull, lt, or, sql, sum } from "drizzle-orm";
import type { Db } from "@/db/client.js";
import * as schema from "@/db/schema/index.js";
import { writeUsageLogSafe } from "@/lib/usage-log.js";

const MAX_CONTEXT_CHARS_PER_CHUNK = 1_200;
const MAX_TOTAL_CONTEXT_CHARS = 4_000;

const CRM_ENTITY_TYPES = [
  "contact",
  "company",
  "deal",
  "task",
  "contact_note",
  "deal_note",
];
const MEETING_ENTITY_TYPES = ["meeting_chunk", "meeting_summary"];

function truncateContextText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  if (maxChars <= 3) return text.slice(0, maxChars);
  return `${text.slice(0, maxChars - 3).trimEnd()}...`;
}

/**
 * Builds a brief CRM state summary injected into every AI request.
 * Uses aggregate queries — never loads full records.
 */
export async function buildCrmSummary(
  db: Db,
  organizationId: string
): Promise<string> {
  const [dealStats, overdueStats, recentContacts] = await Promise.all([
    db
      .select({ count: count(), total: sum(schema.deals.amount) })
      .from(schema.deals)
      .where(and(eq(schema.deals.organizationId, organizationId), isNull(schema.deals.archivedAt))),
    db
      .select({ count: count() })
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.organizationId, organizationId),
          isNull(schema.tasks.doneDate),
          lt(schema.tasks.dueDate, new Date())
        )
      ),
    db
      .select({ firstName: schema.contacts.firstName, lastName: schema.contacts.lastName })
      .from(schema.contacts)
      .where(eq(schema.contacts.organizationId, organizationId))
      .orderBy(desc(schema.contacts.id))
      .limit(5),
  ]);

  const dealCount = dealStats[0]?.count ?? 0;
  const dealTotal = Number(dealStats[0]?.total ?? 0);
  const overdueCount = overdueStats[0]?.count ?? 0;
  const contactNames = recentContacts
    .map((c) => [c.firstName, c.lastName].filter(Boolean).join(" "))
    .filter(Boolean);

  const lines = [
    `- Open deals: ${dealCount}${dealTotal > 0 ? ` (total value: $${dealTotal.toLocaleString()})` : ""}`,
    `- Overdue tasks: ${overdueCount}`,
  ];
  if (contactNames.length > 0) {
    lines.push(`- Recent contacts: ${contactNames.join(", ")}`);
  }
  return lines.join("\n");
}

export interface RetrievalStrategy {
  crmLimit: number;
  meetingLimit: number;
}

const MEETING_FOCUSED_PATTERNS = [
  /\bmeeting\b/i,
  /\bdiscussed\b/i,
  /\btranscript\b/i,
  /\bcall with\b/i,
  /\bwho said\b/i,
  /\baction items? from\b/i,
  /\bmeeting notes?\b/i,
  /\bin the call\b/i,
  /\bduring the meeting\b/i,
];

const IMPLICIT_MEETING_PATTERNS = [
  /\bdecided\b/i,
  /\bagreed\b/i,
  /\bfollow up\b/i,
  /\bmentioned\b/i,
  /\btold me\b/i,
  /\bpromised\b/i,
  /\bwe talked about\b/i,
  /\bthey said\b/i,
  /\bbrought up\b/i,
  /\bwhat did we decide\b/i,
  /\bwhat we decided\b/i,
  /\bdecide about\b/i,
  /\bsaid we'd\b/i,
];

/**
 * Keyword-based heuristic to determine how many retrieval slots
 * to allocate to CRM records vs meeting transcripts.
 */
export function classifyQueryIntent(query: string): RetrievalStrategy {
  if (MEETING_FOCUSED_PATTERNS.some((p) => p.test(query))) {
    return { crmLimit: 2, meetingLimit: 5 };
  }
  if (IMPLICIT_MEETING_PATTERNS.some((p) => p.test(query))) {
    return { crmLimit: 3, meetingLimit: 4 };
  }
  // Default: mostly CRM, but always include 2 meeting slots
  // so cosine similarity can surface relevant meetings organically
  return { crmLimit: 5, meetingLimit: 2 };
}

/**
 * Embeds the query via the gateway and returns the vector + usage info.
 * Returns null embedding on failure.
 */
export async function embedQuery(
  gatewayUrl: string,
  gatewayHeaders: Record<string, string>,
  query: string,
): Promise<{
  embedding: number[] | null;
  inputTokens: number;
}> {
  try {
    const embRes = await fetch(`${gatewayUrl}/v1/embeddings`, {
      method: "POST",
      headers: gatewayHeaders,
      body: JSON.stringify({ model: "basics-embed", input: query }),
    });

    if (!embRes.ok) {
      await embRes.text().catch(() => {});
      return { embedding: null, inputTokens: 0 };
    }

    const embJson = (await embRes.json()) as {
      data?: Array<{ embedding?: number[] }>;
      usage?: { prompt_tokens?: number; total_tokens?: number };
    };
    const embedding = embJson.data?.[0]?.embedding ?? null;
    const fromApi =
      embJson.usage?.prompt_tokens ?? embJson.usage?.total_tokens ?? 0;
    const inputTokens =
      fromApi > 0 ? fromApi : Math.max(1, Math.ceil(query.length / 4));
    return { embedding, inputTokens };
  } catch {
    return { embedding: null, inputTokens: 0 };
  }
}

/**
 * Runs a pgvector similarity search with a pre-computed embedding vector.
 * Optionally filters by entity_type.
 */
export async function searchEmbeddings(
  db: Db,
  organizationId: string,
  embeddingVec: number[],
  limit: number,
  entityTypeFilter?: string[],
): Promise<string | null> {
  if (limit <= 0) return null;

  const embeddingStr = `[${embeddingVec.join(",")}]`;

  // Build a safe SQL array literal from the filter values (all are internal constants)
  const entityTypeArrayLiteral = entityTypeFilter?.length
    ? `{${entityTypeFilter.map((t) => `"${t}"`).join(",")}}`
    : null;

  const rows = entityTypeArrayLiteral
    ? await db.execute(sql`
        SELECT entity_type, chunk_text
        FROM context_embeddings
        WHERE organization_id = ${organizationId}
          AND entity_type = ANY(${entityTypeArrayLiteral}::text[])
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `)
    : await db.execute(sql`
        SELECT entity_type, chunk_text
        FROM context_embeddings
        WHERE organization_id = ${organizationId}
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `);

  const results = (
    Array.isArray(rows) ? rows : ((rows as { rows?: unknown[] }).rows ?? [])
  ) as { entity_type: string; chunk_text: string }[];

  if (results.length === 0) return null;

  const lines: string[] = [];
  let remainingChars = MAX_TOTAL_CONTEXT_CHARS;
  for (const result of results) {
    const prefix = `[${result.entity_type}] `;
    const availableChars = Math.min(
      MAX_CONTEXT_CHARS_PER_CHUNK,
      Math.max(0, remainingChars - prefix.length),
    );
    if (availableChars <= 0) break;
    const chunkText = truncateContextText(result.chunk_text, availableChars);
    if (!chunkText) continue;
    const line = `${prefix}${chunkText}`;
    lines.push(line);
    remainingChars -= line.length + 1;
    if (remainingChars <= 0) break;
  }

  return lines.length > 0 ? lines.join("\n") : null;
}

/**
 * Embeds the query and runs a pgvector similarity search against context_embeddings.
 * Returns formatted top-K results, or null if unavailable/empty.
 * Backward-compatible — existing callers work without changes.
 */
export async function retrieveRelevantContext(
  db: Db,
  gatewayUrl: string,
  gatewayHeaders: Record<string, string>,
  organizationId: string,
  query: string,
  limit = 5,
  crmUserId?: number,
): Promise<string | null> {
  if (!query.trim()) return null;

  try {
    const { embedding, inputTokens } = await embedQuery(
      gatewayUrl,
      gatewayHeaders,
      query,
    );
    if (!embedding?.length) return null;

    if (crmUserId != null) {
      writeUsageLogSafe(db, {
        organizationId,
        crmUserId,
        feature: "embedding_rag",
        model: "basics-embed",
        inputTokens,
      });
    }

    return searchEmbeddings(db, organizationId, embedding, limit);
  } catch {
    return null;
  }
}

/**
 * Dual retrieval: embeds query once, then searches CRM and meeting embeddings
 * separately with limits determined by query intent classification.
 * Returns { crmContext, meetingContext } — each may be null.
 */
export async function retrieveDualContext(
  db: Db,
  gatewayUrl: string,
  gatewayHeaders: Record<string, string>,
  organizationId: string,
  query: string,
  crmUserId?: number,
): Promise<{ crmContext: string | null; meetingContext: string | null }> {
  const empty = { crmContext: null, meetingContext: null };
  if (!query.trim()) return empty;

  try {
    const { embedding, inputTokens } = await embedQuery(
      gatewayUrl,
      gatewayHeaders,
      query,
    );
    if (!embedding?.length) return empty;

    if (crmUserId != null) {
      writeUsageLogSafe(db, {
        organizationId,
        crmUserId,
        feature: "embedding_rag",
        model: "basics-embed",
        inputTokens,
      });
    }

    const strategy = classifyQueryIntent(query);
    console.warn(`[rag] query="${query.slice(0, 80)}" strategy=${JSON.stringify(strategy)} embeddingLen=${embedding.length}`);

    const [crmContext, meetingContext] = await Promise.all([
      searchEmbeddings(
        db,
        organizationId,
        embedding,
        strategy.crmLimit,
        CRM_ENTITY_TYPES,
      ),
      searchEmbeddings(
        db,
        organizationId,
        embedding,
        strategy.meetingLimit,
        MEETING_ENTITY_TYPES,
      ),
    ]);

    console.warn(`[rag] crmContext=${crmContext ? crmContext.length + ' chars' : 'null'}, meetingContext=${meetingContext ? meetingContext.length + ' chars' : 'null'}`);
    return { crmContext, meetingContext };
  } catch (err) {
    console.error(`[rag] retrieveDualContext error:`, err);
    return empty;
  }
}

type FieldDef = {
  resource: string;
  name: string;
  label: string;
  fieldType: string;
  options: unknown;
};

const BUILT_IN_FIELDS: Record<string, Array<{ name: string; label: string; fieldType: string }>> = {
  contacts: [
    { name: "first_name", label: "First Name", fieldType: "text" },
    { name: "last_name", label: "Last Name", fieldType: "text" },
    { name: "email", label: "Email", fieldType: "email" },
    { name: "linkedin_url", label: "LinkedIn", fieldType: "url" },
    { name: "company", label: "Company", fieldType: "relation" },
  ],
  companies: [
    { name: "name", label: "Name", fieldType: "text" },
    { name: "domain", label: "Domain", fieldType: "url" },
    { name: "category", label: "Category", fieldType: "text" },
    { name: "description", label: "Description", fieldType: "text" },
  ],
  deals: [
    { name: "name", label: "Name", fieldType: "text" },
    { name: "status", label: "Stage/Status", fieldType: "text" },
    { name: "amount", label: "Amount", fieldType: "number" },
    { name: "company", label: "Company", fieldType: "relation" },
  ],
};

/**
 * Loads custom_field_defs for the organization and formats them alongside
 * built-in fields into a system prompt section that tells the AI exactly
 * which fields exist for each object type.
 */
export async function buildFieldSchemaContext(
  db: Db,
  organizationId: string,
): Promise<string> {
  const customDefs = await db
    .select({
      resource: schema.customFieldDefs.resource,
      name: schema.customFieldDefs.name,
      label: schema.customFieldDefs.label,
      fieldType: schema.customFieldDefs.fieldType,
      options: schema.customFieldDefs.options,
    })
    .from(schema.customFieldDefs)
    .where(
      or(
        eq(schema.customFieldDefs.organizationId, organizationId),
        isNull(schema.customFieldDefs.organizationId),
      ),
    )
    .orderBy(schema.customFieldDefs.position);

  const defsByResource = new Map<string, FieldDef[]>();
  for (const def of customDefs) {
    const existing = defsByResource.get(def.resource) ?? [];
    existing.push(def);
    defsByResource.set(def.resource, existing);
  }

  const sections: string[] = [];
  for (const [resource, builtIns] of Object.entries(BUILT_IN_FIELDS)) {
    const lines: string[] = [];
    lines.push(`### ${resource}`);
    lines.push("Built-in fields (use tool parameters directly):");
    for (const f of builtIns) {
      lines.push(`  - ${f.name} (${f.label}, ${f.fieldType})`);
    }

    const customs = defsByResource.get(resource);
    if (customs && customs.length > 0) {
      lines.push("Custom fields (use custom_fields parameter with these keys):");
      for (const cf of customs) {
        const optionsSuffix =
          cf.fieldType === "select" && Array.isArray(cf.options) && cf.options.length > 0
            ? ` — options: ${cf.options
                .slice(0, 10)
                .map((o) => (typeof o === "string" ? o : (o as { label?: string }).label ?? ""))
                .filter(Boolean)
                .join(", ")}`
            : "";
        lines.push(`  - ${cf.name} (${cf.label}, ${cf.fieldType}${optionsSuffix})`);
      }
    }
    sections.push(lines.join("\n"));
  }

  // Include any custom fields for resources not in BUILT_IN_FIELDS (custom objects)
  for (const [resource, customs] of defsByResource.entries()) {
    if (BUILT_IN_FIELDS[resource]) continue;
    const lines: string[] = [];
    lines.push(`### ${resource}`);
    lines.push("Custom fields (use custom_fields parameter with these keys):");
    for (const cf of customs) {
      lines.push(`  - ${cf.name} (${cf.label}, ${cf.fieldType})`);
    }
    sections.push(lines.join("\n"));
  }

  if (sections.length === 0) return "";
  return `## Available Fields\nWhen creating or updating records, map each piece of data to the correct field below. NEVER combine multiple data points into a single field.\n\n${sections.join("\n\n")}`;
}
