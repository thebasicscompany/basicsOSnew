import type { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import * as schema from "../../db/schema/index.js";
import { PERMISSIONS, requirePermission } from "../../lib/rbac.js";
import { filterRowToNocoRaw } from "./mappers.js";
import { getCrmUserId, getViewAndCheckOwnership } from "./shared.js";

export function registerFilterRoutes(app: Hono, db: Db): void {
  app.get("/view/:viewId/filters", async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.recordsRead);
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

    const list = await db
      .select()
      .from(schema.viewFilters)
      .where(eq(schema.viewFilters.viewId, viewId));

    return c.json({ list: list.map(filterRowToNocoRaw) });
  });

  app.post("/view/:viewId/filters", async (c) => {
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

    const body = await c.req.json<{
      fk_column_id: string;
      comparison_op: string;
      value: unknown;
      logical_op?: "and" | "or";
    }>();

    const [inserted] = await db
      .insert(schema.viewFilters)
      .values({
        viewId,
        fieldId: body.fk_column_id,
        comparisonOp: body.comparison_op,
        value: body.value != null ? String(body.value) : null,
        logicalOp: body.logical_op ?? "and",
      })
      .returning();

    if (!inserted) return c.json({ error: "Insert failed" }, 500);
    return c.json(filterRowToNocoRaw(inserted));
  });

  app.delete("/view/:viewId/filters/:filterId", async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.recordsWrite);
    if (!authz.ok) return authz.response;

    const viewId = c.req.param("viewId");
    const filterId = c.req.param("filterId");
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

    await db
      .delete(schema.viewFilters)
      .where(
        and(
          eq(schema.viewFilters.viewId, viewId),
          eq(schema.viewFilters.id, filterId),
        ),
      );
    return c.json({});
  });
}
