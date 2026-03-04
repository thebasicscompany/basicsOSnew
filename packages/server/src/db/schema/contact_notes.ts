import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  bigint,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { crmUsers } from "./crm_users";

export const contactNotes = pgTable(
  "contact_notes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    contactId: bigint("contact_id", { mode: "number" })
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    text: text("text"),
    date: timestamp("date", { withTimezone: true }).defaultNow(),
    crmUserId: bigint("sales_id", { mode: "number" }).references(() => crmUsers.id, {
      onDelete: "cascade",
    }),
    status: varchar("status", { length: 64 }),
    attachments: jsonb("attachments").$type<Array<{ url: string; name?: string; type?: string }>>(),
  },
  (t) => [
    index("contact_notes_contact_id_idx").on(t.contactId),
    index("contact_notes_sales_id_idx").on(t.crmUserId),
  ]
);
