import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { sales } from "./sales";

export const tasks = pgTable("tasks", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  contactId: bigint("contact_id", { mode: "number" })
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  salesId: bigint("sales_id", { mode: "number" }).references(() => sales.id),
  type: varchar("type", { length: 64 }),
  text: text("text"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  doneDate: timestamp("done_date", { withTimezone: true }),
});
