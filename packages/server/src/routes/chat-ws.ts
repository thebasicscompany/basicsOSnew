import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.js";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import type { createAuth } from "@/auth.js";
import {
  getActiveRun,
  subscribeToRun,
} from "@/lib/active-runs.js";
import type { AgentEvent } from "@/lib/active-runs.js";

type BetterAuthInstance = ReturnType<typeof createAuth>;

export function createChatWsRoutes(
  _db: Db,
  auth: BetterAuthInstance,
  _env: Env,
) {
  const app = new Hono();

  app.use("*", authMiddleware(auth, _db));

  // GET /api/chat-ws/stream?sessionId=X&afterSeq=0 — SSE endpoint
  app.get("/stream", async (c) => {
    const sessionId = c.req.query("sessionId");
    if (!sessionId) return c.json({ error: "sessionId required" }, 400);

    const afterSeq = parseInt(c.req.query("afterSeq") ?? "0");
    const run = getActiveRun(sessionId);
    if (!run) return c.json({ error: "No active run" }, 404);

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        start(controller) {
          const unsub = subscribeToRun(
            sessionId,
            (event: AgentEvent | null) => {
              if (event === null) {
                controller.close();
                return;
              }
              if (event.globalSeq && event.globalSeq <= afterSeq) return;

              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
                );
              } catch {
                // Stream closed
              }
            },
            { replay: afterSeq === 0 },
          );

          // Keepalive
          const keepalive = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(`: keepalive\n\n`));
            } catch {
              clearInterval(keepalive);
            }
          }, 15000);

          // Cleanup on abort
          c.req.raw.signal.addEventListener("abort", () => {
            unsub();
            clearInterval(keepalive);
          });
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      },
    );
  });

  // GET /api/chat-ws/status?sessionId=X — check run status
  app.get("/status", (c) => {
    const sessionId = c.req.query("sessionId");
    if (!sessionId) return c.json({ error: "sessionId required" }, 400);

    const run = getActiveRun(sessionId);
    if (!run) return c.json({ status: "not_found" });

    return c.json({
      status: run.status,
      lastGlobalSeq: run.lastGlobalSeq,
      toolSteps: run.accumulated.toolSteps.length,
      startedAt: run.startedAt,
    });
  });

  return app;
}
