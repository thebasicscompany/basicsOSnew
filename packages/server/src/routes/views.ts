import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import type { Db } from "../db/client.js";
import type { createAuth } from "../auth.js";
import { registerColumnRoutes } from "./views/column-routes.js";
import { registerFilterRoutes } from "./views/filter-routes.js";
import { registerObjectViewRoutes } from "./views/object-routes.js";
import { registerSortRoutes } from "./views/sort-routes.js";
import { registerViewItemRoutes } from "./views/view-item-routes.js";

type BetterAuthInstance = ReturnType<typeof createAuth>;

export function createViewRoutes(db: Db, auth: BetterAuthInstance) {
  const app = new Hono();
  app.use("*", authMiddleware(auth, db));

  registerObjectViewRoutes(app, db);
  registerColumnRoutes(app, db);
  registerSortRoutes(app, db);
  registerFilterRoutes(app, db);
  registerViewItemRoutes(app, db);

  return app;
}
