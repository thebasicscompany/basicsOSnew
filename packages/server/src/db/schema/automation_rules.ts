import {
  pgTable,
  bigserial,
  varchar,
  boolean,
  jsonb,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";
import { sales } from "./sales";

export const automationRules = pgTable("automation_rules", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  salesId: bigint("sales_id", { mode: "number" })
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  triggerType: varchar("trigger_type", { length: 64 }).notNull(),
  triggerConfig: jsonb("trigger_config").notNull().default({}),
  actionType: varchar("action_type", { length: 64 }).notNull(),
  actionConfig: jsonb("action_config").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
