import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.js";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import type { createAuth } from "@/auth.js";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema/index.js";

type Auth = ReturnType<typeof createAuth>;

export type NotificationPayload = {
  title: string;
  body: string;
  actions?: Array<{ id: string; label: string; url?: string }>;
  context?: string;
};

type SseConnection = {
  controller: ReadableStreamDefaultController;
  userId: string;
  organizationId: string;
};

const connections = new Map<string, Set<SseConnection>>();

function connectionKey(orgId: string, userId: string): string {
  return `${orgId}:${userId}`;
}

/**
 * Send a notification to all connected overlay clients for the given org/user.
 * Used by: automation executor (action_notify_user), task reminder scheduler,
 * meeting completion handler.
 */
export function sendNotification(
  organizationId: string,
  userId: string,
  payload: NotificationPayload,
): void {
  const key = connectionKey(organizationId, userId);
  const set = connections.get(key);
  if (!set || set.size === 0) return;

  const data = JSON.stringify(payload);
  for (const conn of set) {
    try {
      conn.controller.enqueue(`data: ${data}\n\n`);
    } catch {
      set.delete(conn);
    }
  }
  if (set.size === 0) connections.delete(key);
}

export function createNotificationsRoutes(db: Db, auth: Auth, _env: Env) {
  const app = new Hono();

  app.get("/stream", authMiddleware(auth, db), async (c) => {
    const session = c.get("session") as { user?: { id?: string } } | undefined;
    const userId = session?.user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [crmUser] = await db
      .select({ organizationId: schema.crmUsers.organizationId })
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, userId))
      .limit(1);

    const organizationId = crmUser?.organizationId ?? "";
    if (!organizationId) return c.json({ error: "No organization" }, 400);

    const stream = new ReadableStream({
      start(controller) {
        const conn: SseConnection = {
          controller,
          userId,
          organizationId,
        };
        const key = connectionKey(organizationId, userId);
        let set = connections.get(key);
        if (!set) {
          set = new Set();
          connections.set(key, set);
        }
        set.add(conn);

        // Send initial comment to establish SSE
        controller.enqueue(`: connected\n\n`);

        // Heartbeat every 25s to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`: heartbeat\n\n`);
          } catch {
            clearInterval(heartbeat);
            set.delete(conn);
            if (set.size === 0) connections.delete(key);
          }
        }, 25_000);

        // Cleanup on close
        c.req.raw.signal?.addEventListener?.("abort", () => {
          clearInterval(heartbeat);
          set.delete(conn);
          if (set.size === 0) connections.delete(key);
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  return app;
}
