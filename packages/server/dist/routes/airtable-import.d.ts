import { Hono } from "hono";
import type { Db } from "../db/client.js";
import type { Env } from "../env.js";
import type { createAuth } from "../auth.js";
type BetterAuthInstance = ReturnType<typeof createAuth>;
/**
 * Hono proxy for NocoDB's Airtable import API.
 *
 * Validates the Better Auth session, then forwards requests to NocoDB's
 * sync endpoints. This keeps the NocoDB API token and Airtable credentials
 * on the server side.
 *
 * Flow:
 *   1. POST /api/airtable-import/sync     — Create sync source
 *   2. POST /api/airtable-import/trigger   — Trigger import job
 *   3. GET  /api/airtable-import/status/:id — Check job status
 *   4. POST /api/airtable-import/abort/:id  — Abort import
 */
export declare function createAirtableImportRoutes(db: Db, auth: BetterAuthInstance, env: Env): Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
export {};
//# sourceMappingURL=airtable-import.d.ts.map