import * as schema from "../../../db/schema/index.js";
import { eq, and, sql } from "drizzle-orm";
import { CRM_RESOURCES, TABLE_MAP, hasSalesId, } from "../constants.js";
export function createGetOneHandler(db) {
    return async (c) => {
        const resource = c.req.param("resource");
        const idRaw = c.req.param("id");
        const id = resource === "configuration" ? 1 : parseInt(idRaw, 10);
        if ((resource !== "configuration" && isNaN(id)) || !CRM_RESOURCES.includes(resource)) {
            return c.json({ error: "Invalid request" }, 400);
        }
        const session = c.get("session");
        const salesRow = await db
            .select()
            .from(schema.sales)
            .where(eq(schema.sales.userId, session.user.id))
            .limit(1);
        const salesId = salesRow[0]?.id;
        const orgId = salesRow[0]?.organizationId;
        if (!salesId)
            return c.json({ error: "User not found in CRM" }, 404);
        if (resource === "companies_summary") {
            const [row] = await db
                // @ts-expect-error - Drizzle SelectedFields typing with spread table + agg
                .select({
                ...schema.companies,
                nbDeals: sql `count(distinct ${schema.deals.id})::int`.as("nb_deals"),
                nbContacts: sql `count(distinct ${schema.contacts.id})::int`.as("nb_contacts"),
            })
                .from(schema.companies)
                .leftJoin(schema.deals, eq(schema.companies.id, schema.deals.companyId))
                .leftJoin(schema.contacts, eq(schema.companies.id, schema.contacts.companyId))
                .where(and(eq(schema.companies.id, id), eq(schema.companies.salesId, salesId)))
                .groupBy(schema.companies.id)
                .limit(1);
            if (!row)
                return c.json({ error: "Not found" }, 404);
            return c.json(row);
        }
        if (resource === "contacts_summary") {
            const [row] = await db
                // @ts-expect-error - Drizzle SelectedFields typing with spread table + joined cols
                .select({
                ...schema.contacts,
                companyName: schema.companies.name,
                nbTasks: sql `count(distinct ${schema.tasks.id})::int`.as("nb_tasks"),
            })
                .from(schema.contacts)
                .leftJoin(schema.tasks, eq(schema.contacts.id, schema.tasks.contactId))
                .leftJoin(schema.companies, eq(schema.contacts.companyId, schema.companies.id))
                .where(and(eq(schema.contacts.id, id), eq(schema.contacts.salesId, salesId)))
                .groupBy(schema.contacts.id, schema.companies.name)
                .limit(1);
            if (!row)
                return c.json({ error: "Not found" }, 404);
            return c.json(row);
        }
        const table = TABLE_MAP[resource];
        if (!table)
            return c.json({ error: "Unknown resource" }, 404);
        const idCol = table.id;
        const conditions = [eq(idCol, id)];
        if (resource === "sales") {
            if (orgId)
                conditions.push(eq(schema.sales.organizationId, orgId));
        }
        else if (hasSalesId(resource)) {
            conditions.push(eq(table.salesId, salesId));
        }
        const [row] = await db.select().from(table).where(and(...conditions)).limit(1);
        if (!row)
            return c.json({ error: "Not found" }, 404);
        return c.json(row);
    };
}
