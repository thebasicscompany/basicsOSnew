import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAssistantRoutes } from "./routes/assistant.js";
import { createSupabaseAdapter } from "./adapters/supabase.js";
import { getEnv } from "./env.js";

export function createApp() {
  const env = getEnv();
  const db = createSupabaseAdapter(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const app = new Hono();

  app.use(
    "/*",
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.route("/assistant", createAssistantRoutes(db, env));

  return app;
}
