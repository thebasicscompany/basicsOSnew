import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createDb } from "./db/client.js";
import { getEnv } from "./env.js";
import {
  startAutomationEngine,
  stopAutomationEngine,
} from "./lib/automation-engine.js";
import { logger } from "./lib/logger.js";

const log = logger.child({ component: "server" });
const env = getEnv();
const db = createDb(env.DATABASE_URL);

async function main() {
  const app = createApp(db, env);

  const server = serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      log.info(
        { port: info.port, authUrl: `${env.BETTER_AUTH_URL}/api/auth/*` },
        "HTTP server listening",
      );
    },
  );

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info({ signal }, "Shutdown requested");
    await new Promise<void>((resolve) => {
      server.close(() => {
        log.info("HTTP server closed");
        resolve();
      });
    });
    await stopAutomationEngine();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  startAutomationEngine(db, env).catch((err) => {
    log.error({ err }, "Automation engine failed to start");
  });
}

main();
