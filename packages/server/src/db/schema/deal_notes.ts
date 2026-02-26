import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  bigint,
  jsonb,
} from "drizzle-orm/pg-core";
import { deals } from "./deals";
import { sales } from "./sales";

export const dealNotes = pgTable("deal_notes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  dealId: bigint("deal_id", { mode: "number" })
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 64 }),
  text: text("text"),
  date: timestamp("date", { withTimezone: true }).defaultNow(),
  salesId: bigint("sales_id", { mode: "number" }).references(() => sales.id),
  attachments: jsonb("attachments").$type<Array<{ url: string; name?: string; type?: string }>>(),
});
