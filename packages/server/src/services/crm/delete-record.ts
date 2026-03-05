import type { Db } from "@/db/client.js";
import { getEntityType, deleteEntityEmbedding } from "@/lib/embeddings.js";
import { fireEvent } from "@/lib/automation-engine.js";
import { writeAuditLogSafe } from "@/lib/audit-log.js";
import { archiveDeal, hardDeleteRecord } from "@/data-access/crm/delete.js";
import type { Resource } from "@/routes/crm/constants.js";

export interface DeleteRecordInput {
  resource: Resource;
  id: number;
  orgId: string;
  crmUserId: number;
  canHardDelete: boolean;
  canArchive: boolean;
}

export type DeleteRecordResult =
  | { success: true; archived?: true; record: Record<string, unknown> }
  | { success: false; error: string };

export async function deleteRecord(
  db: Db,
  input: DeleteRecordInput,
): Promise<DeleteRecordResult> {
  const { resource, id, orgId, crmUserId, canHardDelete, canArchive } = input;

  if (!canHardDelete) {
    if (resource !== "deals" || !canArchive) {
      return { success: false, error: "Forbidden" };
    }
    const archived = await archiveDeal(db, { id, orgId });
    if (!archived) return { success: false, error: "Not found" };
    await writeAuditLogSafe(db, {
      crmUserId,
      organizationId: orgId,
      action: "crm.record.archived",
      entityType: resource,
      entityId: id,
    });
    return { success: true, archived: true, record: archived };
  }

  const deleted = await hardDeleteRecord(db, { resource, id, orgId });
  if (!deleted) return { success: false, error: "Not found" };

  const entityType = getEntityType(resource);
  if (entityType) {
    deleteEntityEmbedding(db, crmUserId, entityType, id).catch(() => {});
  }

  const eventResource = ["deals", "contacts", "tasks"].includes(resource)
    ? resource
    : null;
  if (eventResource) {
    fireEvent(
      `${eventResource.replace(/s$/, "")}.deleted`,
      deleted,
      crmUserId,
    ).catch(() => {});
  }

  await writeAuditLogSafe(db, {
    crmUserId,
    organizationId: orgId,
    action: "crm.record.hard_deleted",
    entityType: resource,
    entityId: id,
  });

  return { success: true, record: deleted };
}
