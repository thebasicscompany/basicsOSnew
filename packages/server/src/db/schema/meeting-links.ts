import {
  pgTable,
  bigserial,
  bigint,
  uuid,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { meetings } from "@/db/schema/meetings.js";
import { contacts } from "@/db/schema/contacts.js";
import { companies } from "@/db/schema/companies.js";
import { deals } from "@/db/schema/deals.js";
import { organizations } from "@/db/schema/organizations.js";

export const meetingLinks = pgTable(
  "meeting_links",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    meetingId: bigint("meeting_id", { mode: "number" })
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    contactId: bigint("contact_id", { mode: "number" }).references(
      () => contacts.id,
      { onDelete: "cascade" },
    ),
    companyId: bigint("company_id", { mode: "number" }).references(
      () => companies.id,
      { onDelete: "cascade" },
    ),
    dealId: bigint("deal_id", { mode: "number" }).references(() => deals.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("meeting_links_meeting_idx").on(t.meetingId),
    index("meeting_links_contact_idx").on(t.contactId),
    index("meeting_links_company_idx").on(t.companyId),
    index("meeting_links_deal_idx").on(t.dealId),
    uniqueIndex("meeting_links_meeting_contact_idx").on(
      t.meetingId,
      t.contactId,
    ),
    uniqueIndex("meeting_links_meeting_company_idx").on(
      t.meetingId,
      t.companyId,
    ),
    uniqueIndex("meeting_links_meeting_deal_idx").on(t.meetingId, t.dealId),
  ],
);
