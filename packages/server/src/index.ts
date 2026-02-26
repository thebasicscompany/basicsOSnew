import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createDb } from "./db/client.js";
import { getEnv } from "./env.js";

const env = getEnv();
const db = createDb(env.DATABASE_URL);

async function main() {
  const app = createApp(db, env);

  serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      console.log(`[server] listening on http://localhost:${info.port}`);
      console.log(`[server] auth: ${env.BETTER_AUTH_URL}/api/auth/*`);
      console.log(`[server] api: http://localhost:${info.port}/api/*`);
    }
  );
}

main();
