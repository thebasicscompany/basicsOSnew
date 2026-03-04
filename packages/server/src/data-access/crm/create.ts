import type { Db } from "../../db/client.js";
import {
  TABLE_MAP,
  hasCrmUserId,
  hasOrganizationId,
  type Resource,
} from "../../routes/crm/constants.js";

export interface CreateParams {
  resource: Resource;
  body: Record<string, unknown>;
  crmUserId: number;
  orgId: string;
}

export async function insertRecord(
  db: Db,
  params: CreateParams,
): Promise<Record<string, unknown> | null> {
  const { resource, body, crmUserId, orgId } = params;

  const table =
    TABLE_MAP[
      resource as Exclude<Resource, "companies_summary" | "contacts_summary">
    ];
  if (!table) throw new Error("Unknown resource");

  const values = { ...body };
  if (hasCrmUserId(resource)) values.crmUserId = crmUserId;
  if (hasOrganizationId(resource)) values.organizationId = orgId;

  const [inserted] = await db.insert(table).values(values).returning();
  return (inserted as Record<string, unknown>) ?? null;
}
