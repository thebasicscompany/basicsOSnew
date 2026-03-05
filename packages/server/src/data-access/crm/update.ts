import type { Db } from "@/db/client.js";
import * as schema from "@/db/schema/index.js";
import { eq, and } from "drizzle-orm";
import {
  TABLE_MAP,
  hasOrganizationId,
  type Resource,
} from "@/routes/crm/constants.js";

export interface UpdateParams {
  resource: Resource;
  id: number;
  body: Record<string, unknown>;
  orgId: string;
}

export async function updateRecord(
  db: Db,
  params: UpdateParams,
): Promise<Record<string, unknown> | null> {
  const { resource, id, body, orgId } = params;

  const table =
    TABLE_MAP[
      resource as Exclude<Resource, "companies_summary" | "contacts_summary">
    ];
  if (!table) throw new Error("Unknown resource");

  const idCol = (table as unknown as { id: typeof schema.contacts.id }).id;
  const conditions = [eq(idCol, id)];
  if (resource === "crm_users") {
    conditions.push(eq(schema.crmUsers.organizationId, orgId));
  } else if (hasOrganizationId(resource)) {
    conditions.push(
      eq((table as typeof schema.companies).organizationId, orgId),
    );
  }

  const [updated] = await db
    .update(table)
    .set(body)
    .where(and(...conditions))
    .returning();
  return (updated as Record<string, unknown>) ?? null;
}
