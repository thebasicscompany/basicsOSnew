import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  bigint,
  index,
} from "drizzle-orm/pg-core";
import { contacts } from "./contacts";
import { crmUsers } from "./crm_users";

export const tasks = pgTable(
  "tasks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    contactId: bigint("contact_id", { mode: "number" })
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    crmUserId: bigint("sales_id", { mode: "number" }).references(() => crmUsers.id),
    type: varchar("type", { length: 64 }),
    text: text("text"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    doneDate: timestamp("done_date", { withTimezone: true }),
  },
  (t) => [
    index("tasks_contact_id_idx").on(t.contactId),
    index("tasks_sales_id_idx").on(t.crmUserId),
  ]
);
