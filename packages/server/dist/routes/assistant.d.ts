import { Hono } from "hono";
import type { Db } from "../db/client.js";
import type { Env } from "../env.js";
import type { createAuth } from "../auth.js";
type BetterAuthInstance = ReturnType<typeof createAuth>;
export declare function createAssistantRoutes(db: Db, auth: BetterAuthInstance, env: Env): Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
export {};
//# sourceMappingURL=assistant.d.ts.map