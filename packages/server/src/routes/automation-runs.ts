import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import type { Db } from "../db/client.js";
import type { Env } from "../env.js";
import type { createAuth } from "../auth.js";
import * as schema from "../db/schema/index.js";
import { eq, and, desc } from "drizzle-orm";
import { triggerRuleNow } from "../lib/automation-engine.js";

type BetterAuthInstance = ReturnType<typeof createAuth>;

export function createAutomationRunsRoutes(db: Db, auth: BetterAuthInstance, _env: Env) {
  const app = new Hono();

  app.use("*", authMiddleware(auth));

  // GET /api/automation-runs?ruleId=X
  app.get("/", async (c) => {
    const ruleIdParam = c.req.query("ruleId");
    if (!ruleIdParam) return c.json({ error: "ruleId query param required" }, 400);

    const ruleId = parseInt(ruleIdParam, 10);
    if (isNaN(ruleId)) return c.json({ error: "Invalid ruleId" }, 400);

    const session = c.get("session") as { user?: { id: string } };
    const [salesRow] = await db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.userId, session.user!.id))
      .limit(1);
    if (!salesRow) return c.json({ error: "User not found in CRM" }, 404);

    // Verify rule belongs to this user
    const [rule] = await db
      .select()
      .from(schema.automationRules)
      .where(and(eq(schema.automationRules.id, ruleId), eq(schema.automationRules.salesId, salesRow.id)))
      .limit(1);
    if (!rule) return c.json({ error: "Rule not found" }, 404);

    const limitParam = c.req.query("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20;

    const runs = await db
      .select()
      .from(schema.automationRuns)
      .where(eq(schema.automationRuns.ruleId, ruleId))
      .orderBy(desc(schema.automationRuns.startedAt))
      .limit(limit);

    return c.json(runs);
  });

  // POST /api/automation-runs/trigger  — manually fire a rule now
  app.post("/trigger", async (c) => {
    const body = await c.req.json<{ ruleId: number }>();
    const ruleId = Number(body?.ruleId);
    if (!ruleId || isNaN(ruleId)) return c.json({ error: "ruleId required" }, 400);

    const session = c.get("session") as { user?: { id: string } };
    const [salesRow] = await db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.userId, session.user!.id))
      .limit(1);
    if (!salesRow) return c.json({ error: "User not found in CRM" }, 404);

    try {
      await triggerRuleNow(ruleId, salesRow.id);
      return c.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return c.json({ error: message }, 400);
    }
  });

  return app;
}
