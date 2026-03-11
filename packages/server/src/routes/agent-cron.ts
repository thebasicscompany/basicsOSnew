import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware } from "@/middleware/auth.js";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import type { createAuth } from "@/auth.js";
import * as schema from "@/db/schema/index.js";

type BetterAuthInstance = ReturnType<typeof createAuth>;

export function createAgentCronRoutes(
  db: Db,
  auth: BetterAuthInstance,
  env: Env,
) {
  const app = new Hono();

  // Helper to get crmUser for the current session (same pattern as enrichment.ts)
  const getCrmUser = async (c: { get: (k: string) => unknown }) => {
    const session = c.get("session") as
      | { user?: { id?: string } }
      | undefined;
    const userId = session?.user?.id;
    if (!userId) return null;

    const [crmUser] = await db
      .select()
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, userId))
      .limit(1);
    return crmUser ?? null;
  };

  // GET /api/agent-cron — list jobs for org
  app.get("/", authMiddleware(auth, db), async (c) => {
    const crmUser = await getCrmUser(c);
    if (!crmUser?.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    try {
      const jobs = await db
        .select()
        .from(schema.agentCronJobs)
        .where(
          eq(schema.agentCronJobs.organizationId, crmUser.organizationId),
        )
        .orderBy(desc(schema.agentCronJobs.createdAt));
      return c.json(jobs);
    } catch (err) {
      console.error("[agent-cron] list error:", err);
      return c.json({ error: "Failed to list jobs" }, 500);
    }
  });

  // POST /api/agent-cron — create job
  app.post("/", authMiddleware(auth, db), async (c) => {
    const crmUser = await getCrmUser(c);
    if (!crmUser?.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const body = await c.req.json<{
      name: string;
      schedule: string;
      prompt: string;
    }>();

    if (!body.name || !body.schedule || !body.prompt) {
      return c.json({ error: "name, schedule, and prompt are required" }, 400);
    }

    try {
      const [job] = await db
        .insert(schema.agentCronJobs)
        .values({
          organizationId: crmUser.organizationId,
          crmUserId: crmUser.id,
          name: body.name,
          schedule: body.schedule,
          prompt: body.prompt,
        })
        .returning();
      return c.json(job, 201);
    } catch (err) {
      console.error("[agent-cron] create error:", err);
      return c.json({ error: "Failed to create job" }, 500);
    }
  });

  // PUT /api/agent-cron/:id — update job
  app.put("/:id", authMiddleware(auth, db), async (c) => {
    const crmUser = await getCrmUser(c);
    if (!crmUser?.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid job id" }, 400);
    }

    const body = await c.req.json<{
      name?: string;
      schedule?: string;
      prompt?: string;
      enabled?: boolean;
    }>();

    try {
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.schedule !== undefined) updates.schedule = body.schedule;
      if (body.prompt !== undefined) updates.prompt = body.prompt;
      if (body.enabled !== undefined) updates.enabled = body.enabled;

      if (Object.keys(updates).length === 0) {
        return c.json({ error: "No fields to update" }, 400);
      }

      const [updated] = await db
        .update(schema.agentCronJobs)
        .set(updates)
        .where(
          and(
            eq(schema.agentCronJobs.id, id),
            eq(
              schema.agentCronJobs.organizationId,
              crmUser.organizationId,
            ),
          ),
        )
        .returning();

      if (!updated) {
        return c.json({ error: "Job not found" }, 404);
      }

      return c.json(updated);
    } catch (err) {
      console.error("[agent-cron] update error:", err);
      return c.json({ error: "Failed to update job" }, 500);
    }
  });

  // DELETE /api/agent-cron/:id — delete job
  app.delete("/:id", authMiddleware(auth, db), async (c) => {
    const crmUser = await getCrmUser(c);
    if (!crmUser?.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid job id" }, 400);
    }

    try {
      const [deleted] = await db
        .delete(schema.agentCronJobs)
        .where(
          and(
            eq(schema.agentCronJobs.id, id),
            eq(
              schema.agentCronJobs.organizationId,
              crmUser.organizationId,
            ),
          ),
        )
        .returning();

      if (!deleted) {
        return c.json({ error: "Job not found" }, 404);
      }

      return c.json({ success: true });
    } catch (err) {
      console.error("[agent-cron] delete error:", err);
      return c.json({ error: "Failed to delete job" }, 500);
    }
  });

  // POST /api/agent-cron/:id/run — trigger manual run (placeholder)
  app.post("/:id/run", authMiddleware(auth, db), async (c) => {
    const crmUser = await getCrmUser(c);
    if (!crmUser?.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid job id" }, 400);
    }

    try {
      const [updated] = await db
        .update(schema.agentCronJobs)
        .set({
          lastRunAt: new Date(),
          lastRunStatus: "pending",
          lastRunResult: null,
        })
        .where(
          and(
            eq(schema.agentCronJobs.id, id),
            eq(
              schema.agentCronJobs.organizationId,
              crmUser.organizationId,
            ),
          ),
        )
        .returning();

      if (!updated) {
        return c.json({ error: "Job not found" }, 404);
      }

      // TODO: Wire actual agent execution here
      return c.json({
        message: "Run triggered",
        job: updated,
      });
    } catch (err) {
      console.error("[agent-cron] run error:", err);
      return c.json({ error: "Failed to trigger run" }, 500);
    }
  });

  return app;
}
