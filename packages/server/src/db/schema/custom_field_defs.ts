import {
  pgTable,
  bigserial,
  varchar,
  smallint,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const customFieldDefs = pgTable("custom_field_defs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  resource: varchar("resource", { length: 64 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  fieldType: varchar("field_type", { length: 32 }).notNull(),
  options: jsonb("options").$type<string[]>(),
  position: smallint("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
