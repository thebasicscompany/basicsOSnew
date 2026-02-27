import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./auth.js";
import type { Db } from "./db/client.js";
import type { Env } from "./env.js";
import { createAssistantRoutes } from "./routes/assistant.js";
import { createAuthRoutes } from "./routes/auth.js";
import { createCrmRoutes } from "./routes/crm.js";

export function createApp(db: Db, env: Env) {
  const auth = createAuth(db, env.BETTER_AUTH_URL, env.BETTER_AUTH_SECRET);

  const app = new Hono();

  app.use(
    "/*",
    cors({
      origin: (origin) => {
        // Allow localhost on any port (web dev, Electron dev server)
        if (!origin) return null;
        try {
          const url = new URL(origin);
          const allowed =
            (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
            (url.protocol === "http:" || url.protocol === "https:");
          return allowed ? origin : null;
        } catch {
          return null;
        }
      },
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  app.get("/health", (c) => c.json({ status: "ok" }));

  // Better Auth
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  // Auth routes (signup, me)
  app.route("/api", createAuthRoutes(db, auth, env));

  // CRM REST API
  app.route("/api", createCrmRoutes(db, auth, env));

  // Assistant
  app.route("/assistant", createAssistantRoutes(db, auth, env));

  return app;
}
