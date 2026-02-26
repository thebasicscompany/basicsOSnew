import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  bigint,
  jsonb,
} from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { sales } from "./sales";

export const contactNotes = pgTable("contact_notes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  contactId: bigint("contact_id", { mode: "number" })
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  text: text("text"),
  date: timestamp("date", { withTimezone: true }).defaultNow(),
  salesId: bigint("sales_id", { mode: "number" }).references(() => sales.id, {
    onDelete: "cascade",
  }),
  status: varchar("status", { length: 64 }),
  attachments: jsonb("attachments").$type<Array<{ url: string; name?: string; type?: string }>>(),
});
