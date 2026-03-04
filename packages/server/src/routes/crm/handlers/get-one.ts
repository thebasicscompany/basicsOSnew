import type { Context } from "hono";
import type { Db } from "../../../db/client.js";
import * as schema from "../../../db/schema/index.js";
import { eq, and, sql, type SQL } from "drizzle-orm";
import {
  CRM_RESOURCES,
  TABLE_MAP,
  hasOrganizationId,
  type Resource,
} from "../constants.js";
import { PERMISSIONS, getPermissionSetForUser } from "../../../lib/rbac.js";

export function createGetOneHandler(db: Db) {
  return async (c: Context) => {
    const resource = c.req.param("resource") as Resource;
    const idRaw = c.req.param("id");
    const id = resource === "configuration" ? 1 : parseInt(idRaw, 10);
    if (
      (resource !== "configuration" && isNaN(id as number)) ||
      !CRM_RESOURCES.includes(resource)
    ) {
      return c.json({ error: "Invalid request" }, 400);
    }

    const session = c.get("session") as { user?: { id: string } };
    const crmUserRows = await db
      .select()
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, session.user!.id))
      .limit(1);
    const crmUser = crmUserRows[0];
    const crmUserId = crmUser?.id;
    const orgId = crmUser?.organizationId;
    if (!crmUserId || !crmUser)
      return c.json({ error: "User not found in CRM" }, 404);
    if (!orgId) return c.json({ error: "Organization not found" }, 404);
    const permissions = await getPermissionSetForUser(db, crmUser);
    if (!permissions.has("*") && !permissions.has(PERMISSIONS.recordsRead)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    if (resource === "companies_summary") {
      const [row] = await db
        // @ts-expect-error - Drizzle SelectedFields typing with spread table + agg
        .select({
          ...schema.companies,
          nbDeals: sql<number>`count(distinct ${schema.deals.id})::int`.as(
            "nb_deals",
          ),
          nbContacts:
            sql<number>`count(distinct ${schema.contacts.id})::int`.as(
              "nb_contacts",
            ),
        })
        .from(schema.companies)
        .leftJoin(schema.deals, eq(schema.companies.id, schema.deals.companyId))
        .leftJoin(
          schema.contacts,
          eq(schema.companies.id, schema.contacts.companyId),
        )
        .where(
          and(
            eq(schema.companies.id, id as number),
            eq(schema.companies.organizationId, orgId),
          ),
        )
        .groupBy(schema.companies.id)
        .limit(1);
      if (!row) return c.json({ error: "Not found" }, 404);
      return c.json(row);
    }

    if (resource === "contacts_summary") {
      const [row] = await db
        // @ts-expect-error - Drizzle SelectedFields typing with spread table + joined cols
        .select({
          ...schema.contacts,
          companyName: schema.companies.name,
          nbTasks: sql<number>`count(distinct ${schema.tasks.id})::int`.as(
            "nb_tasks",
          ),
        })
        .from(schema.contacts)
        .leftJoin(schema.tasks, eq(schema.contacts.id, schema.tasks.contactId))
        .leftJoin(
          schema.companies,
          eq(schema.contacts.companyId, schema.companies.id),
        )
        .where(
          and(
            eq(schema.contacts.id, id as number),
            eq(schema.contacts.organizationId, orgId),
          ),
        )
        .groupBy(schema.contacts.id, schema.companies.name)
        .limit(1);
      if (!row) return c.json({ error: "Not found" }, 404);
      return c.json(row);
    }

    const table =
      TABLE_MAP[
        resource as Exclude<Resource, "companies_summary" | "contacts_summary">
      ];
    if (!table) return c.json({ error: "Unknown resource" }, 404);

    const idCol = (table as unknown as { id: typeof schema.contacts.id }).id;
    const conditions: SQL[] = [eq(idCol, id)];
    if (resource === "crm_users") {
      conditions.push(eq(schema.crmUsers.organizationId, orgId));
    } else if (hasOrganizationId(resource)) {
      conditions.push(
        eq((table as typeof schema.companies).organizationId, orgId),
      );
    }
    if (resource === "deals") {
      conditions.push(sql`${schema.deals.archivedAt} is null`);
    }

    const [row] = await db
      .select()
      .from(table)
      .where(and(...conditions))
      .limit(1);
    if (!row) return c.json({ error: "Not found" }, 404);
    return c.json(row);
  };
}
