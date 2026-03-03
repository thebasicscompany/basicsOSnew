import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import type { Db } from "../db/client.js";
import type { Env } from "../env.js";
import type { createAuth } from "../auth.js";
import * as schema from "../db/schema/index.js";
import { eq } from "drizzle-orm";

type BetterAuthInstance = ReturnType<typeof createAuth>;

/** NocoDB meta API table list response */
interface NocoTableMeta {
  list: { id: string; title: string }[];
}

/** CRM resource names we care about */
const CRM_TABLES = new Set([
  "contacts",
  "companies",
  "deals",
  "tasks",
  "contact_notes",
  "deal_notes",
  "tags",
  "sales",
  "contacts_summary",
  "companies_summary",
]);

/** Cached table map: resource name → NocoDB table ID */
let _cachedTableMap: Record<string, string> | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Token broker: validates the Better Auth session, then returns the NocoDB
 * configuration needed by the frontend adapter.
 *
 * The NocoDB API token is stored server-side and never exposed directly
 * to the browser — the frontend only gets it via this authenticated endpoint.
 */
export function createNocoDBConfigRoutes(
  db: Db,
  auth: BetterAuthInstance,
  env: Env,
) {
  const app = new Hono();
  app.use("*", authMiddleware(auth));

  app.get("/", async (c) => {
    if (!env.NOCODB_API_TOKEN) {
      return c.json({ error: "NocoDB not configured" }, 503);
    }

    const session = c.get("session") as { user?: { id: string } };
    const salesRow = await db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.userId, session.user!.id))
      .limit(1);
    const salesId = salesRow[0]?.id;
    if (!salesId) return c.json({ error: "User not found in CRM" }, 404);

    const tableMap = await getTableMap(env);

    return c.json({
      baseUrl: env.NOCODB_BASE_URL,
      token: env.NOCODB_API_TOKEN,
      tableMap,
      salesId: Number(salesId),
    });
  });

  return app;
}

/**
 * Auto-discover NocoDB table IDs from the meta API.
 *
 * Calls GET /api/v2/meta/bases/{baseId}/tables and maps table titles
 * to their NocoDB IDs. Results are cached for CACHE_TTL_MS.
 *
 * Falls back to an empty map if NOCODB_BASE_ID is not set.
 */
async function getTableMap(env: Env): Promise<Record<string, string>> {
  const now = Date.now();
  if (_cachedTableMap && now - _cacheTime < CACHE_TTL_MS) {
    return _cachedTableMap;
  }

  if (!env.NOCODB_BASE_ID) {
    console.warn("[NocoDB] NOCODB_BASE_ID not set — table map will be empty");
    return {};
  }

  try {
    const url = `${env.NOCODB_BASE_URL}/api/v2/meta/bases/${env.NOCODB_BASE_ID}/tables`;
    const res = await fetch(url, {
      headers: {
        "xc-token": env.NOCODB_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`[NocoDB] Failed to fetch tables: ${res.status}`);
      return _cachedTableMap ?? {};
    }

    const data = (await res.json()) as NocoTableMeta;
    const tableMap: Record<string, string> = {};

    for (const table of data.list) {
      // Match NocoDB table title to CRM resource name
      const normalized = table.title.toLowerCase().replace(/ /g, "_");
      if (CRM_TABLES.has(normalized)) {
        tableMap[normalized] = table.id;
      }
    }

    _cachedTableMap = tableMap;
    _cacheTime = now;
    return tableMap;
  } catch (err) {
    console.error("[NocoDB] Failed to discover tables:", err);
    return _cachedTableMap ?? {};
  }
}
