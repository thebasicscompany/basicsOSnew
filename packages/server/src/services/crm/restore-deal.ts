import type { Db } from "../../db/client.js";
import { writeAuditLogSafe } from "../../lib/audit-log.js";
import { restoreDeal } from "../../data-access/crm/restore.js";

export interface RestoreDealInput {
  id: number;
  orgId: string;
  crmUserId: number;
}

export type RestoreDealResult =
  | { success: true; record: Record<string, unknown> }
  | { success: false; error: string };

export async function restoreDealService(
  db: Db,
  input: RestoreDealInput,
): Promise<RestoreDealResult> {
  const { id, orgId, crmUserId } = input;

  const restored = await restoreDeal(db, { id, orgId });
  if (!restored) return { success: false, error: "Not found" };

  await writeAuditLogSafe(db, {
    crmUserId,
    organizationId: orgId,
    action: "crm.record.restored",
    entityType: "deals",
    entityId: id,
  });

  return { success: true, record: restored };
}
