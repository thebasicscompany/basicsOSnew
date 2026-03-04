import type { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import * as schema from "../../db/schema/index.js";
import { PERMISSIONS, requirePermission } from "../../lib/rbac.js";
import { viewRowToNocoRaw } from "./mappers.js";
import { getCrmUserId, getViewAndCheckOwnership } from "./shared.js";

export function registerViewItemRoutes(app: Hono, db: Db): void {
  app.patch("/view/:viewId", async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.recordsWrite);
    if (!authz.ok) return authz.response;

    const viewId = c.req.param("viewId");
    const session = c.get("session") as { user?: { id: string } };
    const crmUser = await getCrmUserId(db, session);
    if (crmUser == null) return c.json({ error: "User not found in CRM" }, 404);
    const { crmUserId, organizationId } = crmUser;

    const view = await getViewAndCheckOwnership(
      db,
      viewId,
      crmUserId,
      organizationId,
    );
    if (!view) return c.json({ error: "View not found" }, 404);

    const body = await c.req.json<{ title?: string }>();
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return c.json({ error: "title is required" }, 400);
    }

    const [updated] = await db
      .update(schema.views)
      .set({ title: body.title.trim() })
      .where(eq(schema.views.id, viewId))
      .returning();

    if (!updated) return c.json({ error: "Update failed" }, 500);
    return c.json(viewRowToNocoRaw(updated));
  });

  app.delete("/view/:viewId", async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.recordsWrite);
    if (!authz.ok) return authz.response;

    const viewId = c.req.param("viewId");
    const session = c.get("session") as { user?: { id: string } };
    const crmUser = await getCrmUserId(db, session);
    if (crmUser == null) return c.json({ error: "User not found in CRM" }, 404);
    const { crmUserId, organizationId } = crmUser;

    const view = await getViewAndCheckOwnership(
      db,
      viewId,
      crmUserId,
      organizationId,
    );
    if (!view) return c.json({ error: "View not found" }, 404);

    await db.delete(schema.views).where(eq(schema.views.id, viewId));
    return c.json({});
  });
}
