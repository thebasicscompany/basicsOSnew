import {
  pgTable,
  bigserial,
  varchar,
  text,
  bigint,
  smallint,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { sales } from "./sales";

export const deals = pgTable("deals", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  companyId: bigint("company_id", { mode: "number" }).references(() => companies.id),
  contactIds: jsonb("contact_ids").$type<number[]>(),
  category: varchar("category", { length: 128 }),
  stage: varchar("stage", { length: 128 }).notNull(),
  description: text("description"),
  amount: bigint("amount", { mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  expectedClosingDate: timestamp("expected_closing_date", { withTimezone: true }),
  salesId: bigint("sales_id", { mode: "number" }).references(() => sales.id),
  index: smallint("index"),
  customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}).notNull(),
});
