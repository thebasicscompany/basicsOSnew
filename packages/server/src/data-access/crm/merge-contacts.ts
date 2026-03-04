import type { Db } from "../../db/client.js";
import * as schema from "../../db/schema/index.js";
import { eq, and } from "drizzle-orm";

export interface MergeContactsParams {
  loserId: number;
  winnerId: number;
  orgId: string;
}

export async function mergeContacts(
  db: Db,
  params: MergeContactsParams,
): Promise<void> {
  const { loserId, winnerId, orgId } = params;

  const [loser] = await db
    .select()
    .from(schema.contacts)
    .where(
      and(
        eq(schema.contacts.id, loserId),
        eq(schema.contacts.organizationId, orgId),
      ),
    )
    .limit(1);
  const [winner] = await db
    .select()
    .from(schema.contacts)
    .where(
      and(
        eq(schema.contacts.id, winnerId),
        eq(schema.contacts.organizationId, orgId),
      ),
    )
    .limit(1);

  if (!loser || !winner) throw new Error("Contact not found");

  await db
    .update(schema.tasks)
    .set({ contactId: winnerId })
    .where(eq(schema.tasks.contactId, loserId));
  await db
    .update(schema.contactNotes)
    .set({ contactId: winnerId })
    .where(eq(schema.contactNotes.contactId, loserId));

  const allDeals = await db
    .select()
    .from(schema.deals)
    .where(eq(schema.deals.organizationId, orgId));
  for (const deal of allDeals) {
    const ids = (deal.contactIds as number[]) ?? [];
    if (ids.includes(loserId)) {
      const next = ids.filter((x) => x !== loserId);
      if (!next.includes(winnerId)) next.push(winnerId);
      await db
        .update(schema.deals)
        .set({ contactIds: next })
        .where(eq(schema.deals.id, deal.id));
    }
  }

  await db
    .delete(schema.contacts)
    .where(
      and(
        eq(schema.contacts.id, loserId),
        eq(schema.contacts.organizationId, orgId),
      ),
    );
}
