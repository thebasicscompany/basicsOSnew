import { Hono } from "hono";
import type { Db } from "../db/client.js";
import type { Env } from "../env.js";
export declare function createAuthRoutes(db: Db, auth: ReturnType<typeof import("../auth.js").createAuth>, env: Env): Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
//# sourceMappingURL=auth.d.ts.map