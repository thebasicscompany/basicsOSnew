import type { Context } from "hono";
import type { Db } from "../../../db/client.js";
import * as schema from "../../../db/schema/index.js";
import {
  eq,
  and,
  or,
  ilike,
  sql,
  desc,
  asc,
  type SQL,
} from "drizzle-orm";
import {
  CRM_RESOURCES,
  TABLE_MAP,
  hasOrganizationId,
  type Resource,
} from "../constants.js";
import {
  snakeToCamelField,
  buildGenericFilterCondition,
  type GenericFilter,
} from "../utils.js";
import { PERMISSIONS, getPermissionSetForUser } from "../../../lib/rbac.js";

export function createListHandler(db: Db) {
  return async (c: Context) => {
    const resource = c.req.param("resource") as Resource;
    if (!CRM_RESOURCES.includes(resource)) {
      return c.json({ error: "Unknown resource" }, 404);
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
    if (!crmUserId || !crmUser) return c.json({ error: "User not found in CRM" }, 404);
    if (!orgId) return c.json({ error: "Organization not found" }, 404);
    const permissions = await getPermissionSetForUser(db, crmUser);
    if (!permissions.has("*") && !permissions.has(PERMISSIONS.recordsRead)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const range = c.req.query("range");
    const sortParam = c.req.query("sort");
    const orderParam = c.req.query("order");
    const filterParam = c.req.query("filter");
    const filtersParam = c.req.query("filters");

    let [start, end] = [0, 24];
    if (range) {
      try {
        const parsed = JSON.parse(range) as [number, number];
        if (Array.isArray(parsed) && parsed.length >= 2) {
          [start, end] = parsed;
        }
      } catch {
        /* use defaults */
      }
    }
    const limit = Math.max(0, end - start + 1);
    const offset = start;

    let filter: Record<string, unknown> = {};
    if (filterParam) {
      try {
        filter = JSON.parse(filterParam) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
    }
    const q = typeof filter.q === "string" ? filter.q.trim() : null;

    let genericFilters: GenericFilter[] = [];
    if (filtersParam) {
      try {
        const parsed = JSON.parse(filtersParam) as unknown;
        if (Array.isArray(parsed)) {
          genericFilters = parsed.filter(
            (x): x is GenericFilter =>
              x != null &&
              typeof x === "object" &&
              typeof (x as GenericFilter).field === "string" &&
              typeof (x as GenericFilter).op === "string" &&
              typeof (x as GenericFilter).value === "string"
          );
        }
      } catch {
        /* ignore */
      }
    }

    if (resource === "companies_summary") {
      const companyConds: SQL[] = [eq(schema.companies.organizationId, orgId)];
      if (q) {
        companyConds.push(
          or(
            ilike(schema.companies.name, `%${q}%`),
            ilike(schema.companies.city, `%${q}%`),
            ilike(schema.companies.sector, `%${q}%`),
          ) as SQL,
        );
      }
      if (filter.sector) companyConds.push(eq(schema.companies.sector, filter.sector as string));

      // Drizzle select() types struggle with spread table + agg; runtime is correct
      const rows = await db
        // @ts-expect-error - SelectedFields typing with spread + SQL aliased
        .select({
          ...schema.companies,
          nbDeals: sql<number>`count(distinct ${schema.deals.id})::int`.as("nb_deals"),
          nbContacts: sql<number>`count(distinct ${schema.contacts.id})::int`.as("nb_contacts"),
        })
        .from(schema.companies)
        .leftJoin(schema.deals, eq(schema.companies.id, schema.deals.companyId))
        .leftJoin(schema.contacts, eq(schema.companies.id, schema.contacts.companyId))
        .where(and(...companyConds))
        .groupBy(schema.companies.id)
        .limit(limit)
        .offset(offset);

      const [{ count: total }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.companies)
        .where(and(...companyConds));

      c.header("Content-Range", `companies_summary ${start}-${start + rows.length - 1}/${total}`);
      return c.json(rows);
    }

    if (resource === "contacts_summary") {
      const contactConds: SQL[] = [eq(schema.contacts.organizationId, orgId)];
      if (q) {
        contactConds.push(
          or(
            ilike(schema.contacts.firstName, `%${q}%`),
            ilike(schema.contacts.lastName, `%${q}%`),
            ilike(schema.contacts.email, `%${q}%`),
            ilike(schema.companies.name, `%${q}%`),
          ) as SQL,
        );
      }
      if (filter.status) contactConds.push(eq(schema.contacts.status, filter.status as string));
      if (filter.company_id) {
        contactConds.push(eq(schema.contacts.companyId, Number(filter.company_id)));
      }

      // Drizzle select() types struggle with spread + joined columns; runtime is correct
      const rows = await db
        // @ts-expect-error - SelectedFields typing doesn't accept spread table + joined cols
        .select({
          ...schema.contacts,
          companyName: schema.companies.name,
          nbTasks: sql<number>`count(distinct ${schema.tasks.id})::int`.as("nb_tasks"),
        })
        .from(schema.contacts)
        .leftJoin(schema.tasks, eq(schema.contacts.id, schema.tasks.contactId))
        .leftJoin(schema.companies, eq(schema.contacts.companyId, schema.companies.id))
        .where(and(...contactConds))
        .groupBy(schema.contacts.id, schema.companies.name)
        .limit(limit)
        .offset(offset);

      const countRows = await db
        .select({ count: sql<number>`count(distinct ${schema.contacts.id})::int` })
        .from(schema.contacts)
        .leftJoin(schema.companies, eq(schema.contacts.companyId, schema.companies.id))
        .where(and(...contactConds));
      const total = countRows[0]?.count ?? 0;

      c.header("Content-Range", `contacts_summary ${start}-${start + rows.length - 1}/${total}`);
      return c.json(rows);
    }

    const table = TABLE_MAP[resource as Exclude<Resource, "companies_summary" | "contacts_summary">];
    if (!table) return c.json({ error: "Unknown resource" }, 404);

    const conditions: SQL[] = [];
    if (resource === "crm_users") {
      conditions.push(eq(schema.crmUsers.organizationId, orgId));
    } else if (hasOrganizationId(resource)) {
      conditions.push(eq((table as typeof schema.companies).organizationId, orgId));
    }

    if (resource === "deals") {
      const includeArchived = filter.include_archived === true;
      if (!includeArchived) conditions.push(sql`${schema.deals.archivedAt} is null`);
      if (q) conditions.push(ilike(schema.deals.name, `%${q}%`));
      if (filter.stage) conditions.push(eq(schema.deals.stage, filter.stage as string));
      if (filter.category) conditions.push(eq(schema.deals.category, filter.category as string));
      if (filter.company_id) conditions.push(eq(schema.deals.companyId, Number(filter.company_id)));
    }
    if (resource === "tasks" && filter.contact_id != null) {
      conditions.push(eq(schema.tasks.contactId, Number(filter.contact_id)));
    }
    if (resource === "contact_notes" && filter.contact_id != null) {
      conditions.push(eq(schema.contactNotes.contactId, Number(filter.contact_id)));
    }
    if (resource === "deal_notes" && filter.deal_id != null) {
      conditions.push(eq(schema.dealNotes.dealId, Number(filter.deal_id)));
    }

    for (const gf of genericFilters) {
      const cond = buildGenericFilterCondition(table, gf);
      if (cond) conditions.push(cond);
    }

    const sortParamCamel = sortParam ? snakeToCamelField(sortParam) : null;
    const orderByCol = sortParamCamel
      ? (table as Record<string, unknown>)[sortParamCamel]
      : null;
    const orderDir = orderParam === "DESC" ? desc : asc;

    const countResult = await (conditions.length > 0
      ? db.select({ count: sql<number>`count(*)::int` }).from(table).where(and(...conditions))
      : db.select({ count: sql<number>`count(*)::int` }).from(table));
    const total = countResult[0]?.count ?? 0;

    const baseQuery =
      conditions.length > 0
        ? db.select().from(table).where(and(...conditions))
        : db.select().from(table);
    const finalQuery = orderByCol
      ? baseQuery.orderBy(orderDir(orderByCol as SQL))
      : baseQuery;
    const rows = await finalQuery.limit(limit).offset(offset);

    c.header("Content-Range", `${resource} ${start}-${Math.min(start + rows.length, total)}/${total}`);
    return c.json(rows);
  };
}
